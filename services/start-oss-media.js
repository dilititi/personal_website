import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createOssMediaService } from './oss-media.js'

function logError(error) {
  const code = error?.code || error?.name
  console.error(
    'OSS media request failed:',
    /^[A-Za-z0-9_]{1,80}$/.test(code) ? code : 'Unknown',
    Number(error?.status) || '',
  )
}

const service = createOssMediaService(process.env, { onError: logError })
const server = createServer(async (req, res) => {
  const controller = new AbortController()
  res.on('close', () => {
    if (!res.writableEnded) controller.abort()
  })
  try {
    const path = req.url?.startsWith('/') ? req.url : '/'
    const request = new Request(`http://localhost${path}`, {
      method: req.method,
      headers: req.headers,
      signal: controller.signal,
      ...(req.method === 'POST' && { body: Readable.toWeb(req), duplex: 'half' }),
    })
    const response = await service(request)
    res.writeHead(response.status, Object.fromEntries(response.headers))
    if (response.body)
      await pipeline(Readable.fromWeb(response.body), res, { signal: controller.signal })
    else res.end()
  } catch (error) {
    if (controller.signal.aborted) return
    logError(error)
    if (!res.headersSent) res.writeHead(500).end()
    else res.destroy()
  }
})
server.listen(Number(process.env.PORT || 8787), '0.0.0.0')
