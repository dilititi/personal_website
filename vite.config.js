import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { SITE } from './src/data.js'
import { buildSeo, SEO_DEFAULT_LANG, SEO_THEME_COLOR } from './src/lib/seo.js'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, '&apos;')
}

export function renderSeoHead(site = SITE, lang = SEO_DEFAULT_LANG) {
  const seo = buildSeo(site, lang)
  const tags = [
    `<meta name="description" content="${escapeHtml(seo.description)}">`,
    '<meta name="robots" content="index, follow">',
    `<meta name="theme-color" content="${escapeHtml(SEO_THEME_COLOR)}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="${escapeHtml(seo.title)}">`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}">`,
    `<meta property="og:site_name" content="${escapeHtml(seo.siteName)}">`,
    `<meta property="og:locale" content="${escapeHtml(seo.locale)}">`,
    `<meta property="og:locale:alternate" content="${escapeHtml(seo.localeAlternate)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}">`,
  ]

  if (seo.googleSiteVerification) {
    tags.push(
      `<meta name="google-site-verification" content="${escapeHtml(seo.googleSiteVerification)}">`,
    )
  }
  if (seo.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}">`)
    tags.push(`<meta property="og:url" content="${escapeHtml(seo.canonical)}">`)
  }
  if (seo.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(seo.image)}">`)
    tags.push(`<meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}">`)
    if (seo.imageWidth && seo.imageHeight) {
      tags.push(`<meta property="og:image:width" content="${escapeHtml(seo.imageWidth)}">`)
      tags.push(`<meta property="og:image:height" content="${escapeHtml(seo.imageHeight)}">`)
    }
    tags.push(`<meta name="twitter:image" content="${escapeHtml(seo.image)}">`)
    tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}">`)
  }

  return {
    title: `<title>${escapeHtml(seo.title)}</title>`,
    tags: tags.join('\n    '),
  }
}

export function buildDiscoveryFiles(site = SITE) {
  const siteRoot = String(site?.url || '')
    .trim()
    .replace(/\/+$/, '')
  const sitemapUrl = siteRoot ? `${siteRoot}/sitemap.xml` : ''
  const robots = ['User-agent: *', 'Allow: /', sitemapUrl ? `Sitemap: ${sitemapUrl}` : '']
    .filter(Boolean)
    .join('\n')
  const sitemapEntries = siteRoot
    ? ['/', '/en/', '/zh/']
        .map(pathname => `  <url><loc>${escapeXml(`${siteRoot}${pathname}`)}</loc></url>`)
        .join('\n')
    : ''
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    sitemapEntries +
    '\n</urlset>\n'

  return { robots: `${robots}\n`, sitemap }
}

export function seoHtmlPlugin({ prerender = false } = {}) {
  let command = 'serve'

  return {
    name: 'site-seo',
    configResolved(config) {
      command = config.command
    },
    buildStart() {
      if (command === 'build' && !String(SITE.url || '').trim()) {
        this.warn(
          'SITE.url is empty. Fill the production domain to emit canonical, og:url, and a populated sitemap.',
        )
      }
    },
    transformIndexHtml(html) {
      if (command === 'build' && prerender) {
        return html
          .replace(/\s*<meta\s+name=["']description["'][^>]*>/i, '')
          .replace(/\s*<meta\s+name=["']theme-color["'][^>]*>/i, '')
          .replace('<!-- seo-head -->', '')
      }

      const head = renderSeoHead()
      return html
        .replace(/<title>[\s\S]*?<\/title>/i, head.title)
        .replace(/\s*<meta\s+name=["']description["'][^>]*>/i, '')
        .replace(/\s*<meta\s+name=["']theme-color["'][^>]*>/i, '')
        .replace('<!-- seo-head -->', head.tags)
    },
    writeBundle(options) {
      const outputDir = resolve(process.cwd(), options.dir || 'dist')
      const { robots, sitemap } = buildDiscoveryFiles()

      mkdirSync(outputDir, { recursive: true })
      writeFileSync(resolve(outputDir, 'robots.txt'), robots, 'utf8')
      writeFileSync(resolve(outputDir, 'sitemap.xml'), sitemap, 'utf8')
    },
  }
}

export function prerenderArtifactCleanupPlugin(prerenderScript) {
  const normalizedEntry = resolve(prerenderScript).replaceAll('\\', '/')

  return {
    name: 'prerender-artifact-cleanup',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const chunks = Object.fromEntries(
        Object.entries(bundle).filter(([, item]) => item.type === 'chunk'),
      )
      const entryFiles = Object.entries(chunks)
        .filter(([, chunk]) => chunk.facadeModuleId?.replaceAll('\\', '/') === normalizedEntry)
        .map(([fileName]) => fileName)

      const candidates = new Set(entryFiles)
      const queue = [...entryFiles]
      while (queue.length) {
        const fileName = queue.shift()
        const chunk = chunks[fileName]
        if (!chunk) continue
        ;[...chunk.imports, ...chunk.dynamicImports].forEach(dependency => {
          if (chunks[dependency] && !candidates.has(dependency)) {
            candidates.add(dependency)
            queue.push(dependency)
          }
        })
      }

      const retained = new Set()
      const retainedQueue = []
      Object.entries(chunks).forEach(([fileName]) => {
        if (!candidates.has(fileName)) {
          retained.add(fileName)
          retainedQueue.push(fileName)
        }
      })
      while (retainedQueue.length) {
        const fileName = retainedQueue.shift()
        const chunk = chunks[fileName]
        if (!chunk) continue
        ;[...chunk.imports, ...chunk.dynamicImports].forEach(dependency => {
          if (chunks[dependency] && !retained.has(dependency)) {
            retained.add(dependency)
            retainedQueue.push(dependency)
          }
        })
      }

      candidates.forEach(fileName => {
        if (!retained.has(fileName)) delete bundle[fileName]
      })
    },
  }
}

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

const prerenderScript = resolve(process.cwd(), 'src/prerender.jsx')

export default defineConfig({
  plugins: [
    react(),
    uploadPlugin(),
    seoHtmlPlugin({ prerender: true }),
    ...vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript,
      additionalPrerenderRoutes: ['/en', '/zh'],
    }),
    prerenderArtifactCleanupPlugin(prerenderScript),
  ],
})
