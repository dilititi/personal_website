import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// uploadPlugin: dev-only endpoint that writes uploaded files into public/.
//   POST /api/upload  body: { subfolder, filename, dataUrl }
//   → writes to public/{subfolder}/{filename}, returns { ok, path, size }
//
// Only active during `vite dev` — production builds are static, this endpoint
// doesn't exist there. Used by the in-site ContentEditor so users can manage
// images & audio without leaving the browser.
// ─────────────────────────────────────────────────────────────────────────────
function uploadPlugin() {
  return {
    name: 'content-upload',
    configureServer(server) {
      server.middlewares.use('/api/upload', (req, res, next) => {
        if (req.method !== 'POST') return next()
        const chunks = []
        req.on('data', c => chunks.push(c))
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const { subfolder, filename, dataUrl } = body

            // Whitelisted subfolders — prevents writing outside public/.
            const allowed = [
              'picture',
              'works',
              'books',
              'films',
              'audio',
              'photos',
              'covers',
              'journey',
              'docs',
            ]
            if (!allowed.includes(subfolder)) {
              res.statusCode = 400
              return res.end(
                JSON.stringify({ error: `subfolder must be one of: ${allowed.join(', ')}` }),
              )
            }

            // Filename: no slashes, no dots-only, no traversal.
            if (
              !filename ||
              filename.includes('/') ||
              filename.includes('\\') ||
              filename.includes('..') ||
              filename.length > 200
            ) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Invalid filename' }))
            }

            // Decode data URL
            const m = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl || '')
            if (!m) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Body must include valid base64 dataUrl' }))
            }
            const buf = Buffer.from(m[2], 'base64')

            // Size limit (50MB) — generous but prevents accidental huge uploads.
            if (buf.length > 50 * 1024 * 1024) {
              res.statusCode = 413
              return res.end(JSON.stringify({ error: 'File too large (>50MB)' }))
            }

            const dirPath = resolve(process.cwd(), 'public', subfolder)
            const filePath = resolve(dirPath, filename)

            // Defense-in-depth: ensure resolved path is inside dir.
            if (!filePath.startsWith(dirPath)) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Path traversal blocked' }))
            }

            mkdirSync(dirPath, { recursive: true })
            writeFileSync(filePath, buf)

            const publicPath = `/${subfolder}/${filename}`
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true, path: publicPath, size: buf.length }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(e?.message || e) }))
          }
        })
        req.on('error', e => {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), uploadPlugin()],
})
