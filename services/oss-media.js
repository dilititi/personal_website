import OSS from 'ali-oss'
import {
  createMediaUploadHandler,
  mediaPublicBase,
  PART_URL_LIFETIME_SECONDS,
} from '../workers/media-upload-control.js'

const uploadedPath = /^\/works\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.mp4$/
const aliasName = /^[a-z0-9][a-z0-9-]{0,100}\.mp4$/
const playbackHeaders = [
  'content-length',
  'content-range',
  'accept-ranges',
  'etag',
  'last-modified',
]

function readAliases(value) {
  const entries = JSON.parse(value || '{}')
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
    throw new Error('OSS_PLAYBACK_ALIASES must be a JSON object.')
  }
  return new Map(
    Object.entries(entries).map(([alias, key]) => {
      if (
        !aliasName.test(alias) ||
        typeof key !== 'string' ||
        !/\.mp4$/i.test(key) ||
        /[\p{Cc}\\]/u.test(key) ||
        key.split('/').some(part => !part || part === '.' || part === '..')
      ) {
        throw new Error('Invalid OSS playback alias.')
      }
      return [`/videos/${alias}`, key]
    }),
  )
}

function ossStorage(client, signer, sessionSecret) {
  async function head(key) {
    try {
      const result = await client.head(key)
      return { size: Number(result.res.headers['content-length']) }
    } catch (error) {
      if (error.status === 404) return null
      throw error
    }
  }
  return {
    sessionSecret,
    async start(key) {
      const result = await client.initMultipartUpload(key, {
        mime: 'video/mp4',
        headers: { 'Content-Disposition': 'inline' },
      })
      return result.uploadId
    },
    signPart(session, partNumber, length) {
      return signer.signatureUrlV4(
        'PUT',
        PART_URL_LIFETIME_SECONDS,
        {
          headers: { 'content-length': String(length), 'content-type': 'application/octet-stream' },
          queries: { partNumber, uploadId: session.uploadId },
        },
        session.key,
        ['content-length'],
      )
    },
    head,
    async complete(session, parts) {
      await client.completeMultipartUpload(
        session.key,
        session.uploadId,
        parts.map(({ partNumber, etag }) => ({ number: partNumber, etag: `"${etag}"` })),
      )
      const object = await head(session.key)
      if (!object) throw new Error('Completed video was not found.')
      return object
    },
    delete: key => client.delete(key),
    abort: session => client.abortMultipartUpload(session.key, session.uploadId),
  }
}

async function streamVideo(request, key, signer, fetchObject, isAlias) {
  const range = request.headers.get('Range')
  if (range && !/^bytes=(?:\d{1,19}-\d{0,19}|-\d{1,19})$/.test(range)) {
    return new Response(null, { status: 400 })
  }
  const url = await signer.signatureUrlV4(request.method, 60, {}, key)
  const headers = new Headers({ 'Accept-Encoding': 'identity' })
  if (range) headers.set('Range', range)
  const ifRange = request.headers.get('If-Range')
  if (range && ifRange) headers.set('If-Range', ifRange)
  const upstream = await fetchObject(url, {
    method: request.method,
    headers,
    redirect: 'error',
    signal: request.signal,
  })
  if (upstream.status === 416) {
    await upstream.body?.cancel()
    const contentRange = upstream.headers.get('content-range')
    return new Response(null, {
      status: 416,
      headers: contentRange ? { 'Content-Range': contentRange } : undefined,
    })
  }
  if (![200, 206].includes(upstream.status) || upstream.headers.has('content-encoding')) {
    await upstream.body?.cancel()
    return new Response(null, { status: upstream.status === 404 ? 404 : 502 })
  }

  const responseHeaders = new Headers({
    'Content-Type': 'video/mp4',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': isAlias ? 'public, max-age=300' : 'public, max-age=86400',
  })
  for (const name of playbackHeaders) {
    const value = upstream.headers.get(name)
    if (value !== null) responseHeaders.set(name, value)
  }
  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export function createOssMediaService(env, { client, fetchObject = fetch, onError } = {}) {
  for (const name of ['OSS_BUCKET', 'OSS_REGION', 'OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET']) {
    if (!env[name]?.trim()) throw new Error(`Missing ${name}.`)
  }
  const uploadEnabled = Boolean(env.MEDIA_UPLOAD_KEY)
  if (uploadEnabled && env.MEDIA_UPLOAD_KEY.trim().length < 32) {
    throw new Error('MEDIA_UPLOAD_KEY must be at least 32 characters.')
  }
  if (uploadEnabled && !env.MEDIA_ALLOWED_ORIGINS?.trim()) {
    throw new Error('Missing MEDIA_ALLOWED_ORIGINS.')
  }
  const base = mediaPublicBase(env.MEDIA_PUBLIC_BASE_URL || env.RENDER_EXTERNAL_URL)
  if (new URL(base).origin !== base) {
    throw new Error('MEDIA_PUBLIC_BASE_URL must be the HTTPS origin of the media service.')
  }
  const aliases = readAliases(env.OSS_PLAYBACK_ALIASES)
  const endpoint = env.OSS_CUSTOM_ENDPOINT && new URL(env.OSS_CUSTOM_ENDPOINT)
  if (endpoint && (mediaPublicBase(endpoint) !== endpoint.origin || endpoint.pathname !== '/')) {
    throw new Error('OSS_CUSTOM_ENDPOINT must be the HTTPS origin bound to the bucket.')
  }
  const signer = new OSS({
    region: env.OSS_REGION,
    bucket: env.OSS_BUCKET,
    accessKeyId: env.OSS_ACCESS_KEY_ID,
    accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
    authorizationV4: true,
    secure: true,
    ...(endpoint && { endpoint: endpoint.origin, cname: true }),
  })
  const upload = uploadEnabled
    ? createMediaUploadHandler(
        { ...env, MEDIA_PUBLIC_BASE_URL: base },
        () => ossStorage(client || signer, signer, env.OSS_ACCESS_KEY_SECRET),
        onError,
      )
    : null

  return async request => {
    const path = new URL(request.url).pathname
    const canRead = request.method === 'GET' || request.method === 'HEAD'
    if (path === '/healthz' && canRead) return new Response(null, { status: 204 })
    if (path === '/upload' && upload) return upload(request)
    const alias = aliases.get(path)
    const key = alias ?? (uploadedPath.test(path) ? path.slice(1) : undefined)
    if (!key) return new Response(null, { status: 404 })
    if (!canRead) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
    try {
      return await streamVideo(request, key, signer, fetchObject, Boolean(alias))
    } catch (error) {
      if (!request.signal.aborted) onError?.(error)
      return new Response(null, { status: 502 })
    }
  }
}
