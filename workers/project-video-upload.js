import { AwsClient } from 'aws4fetch'
import {
  MAX_PROJECT_VIDEO_BYTES,
  PROJECT_VIDEO_PART_BYTES,
} from '../src/lib/project-video-upload.js'

const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60
const LINK_LIFETIME_SECONDS = 15 * 60
const text = new TextEncoder()

class UploadError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function decodeBase64url(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char =>
    char.charCodeAt(0),
  )
}

async function sessionKey(env) {
  return crypto.subtle.importKey(
    'raw',
    text.encode(env.R2_SECRET_ACCESS_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function sessionMessage(payload) {
  return text.encode(`portfolio-video-upload:v1:${payload}`)
}

async function encodeSession(data, env) {
  const payload = base64url(text.encode(JSON.stringify(data)))
  const signature = await crypto.subtle.sign('HMAC', await sessionKey(env), sessionMessage(payload))
  return `${payload}.${base64url(new Uint8Array(signature))}`
}

async function decodeSession(value, env) {
  try {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,4096}\.[A-Za-z0-9_-]{43}$/.test(value)) {
      throw new Error()
    }
    const [payload, signature] = value.split('.')
    if (
      !(await crypto.subtle.verify(
        'HMAC',
        await sessionKey(env),
        decodeBase64url(signature),
        sessionMessage(payload),
      ))
    ) {
      throw new Error()
    }
    const data = JSON.parse(new TextDecoder().decode(decodeBase64url(payload)))
    if (data.expires <= Date.now())
      throw new UploadError(410, 'The upload session expired. Select the file again.')
    return data
  } catch (error) {
    if (error instanceof UploadError) throw error
    throw new UploadError(400, 'Invalid upload session.')
  }
}

async function authorized(request, key) {
  const header = request.headers.get('Authorization')
  if (!key || key.length < 32 || !header?.startsWith('Bearer ')) return false
  const digests = await Promise.all(
    [header.slice(7), key].map(value => crypto.subtle.digest('SHA-256', text.encode(value))),
  )
  const [given, expected] = digests.map(value => new Uint8Array(value))
  return given.reduce((different, byte, i) => different | (byte ^ expected[i]), 0) === 0
}

function publicBase(env) {
  const url = new URL(env.MEDIA_PUBLIC_BASE_URL)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid playback base URL.')
  }
  return url.href.replace(/\/+$/, '')
}

function checkConfig(env) {
  if (
    !env.VIDEO_BUCKET ||
    !env.R2_BUCKET_NAME ||
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY
  ) {
    throw new Error('Missing R2 service configuration.')
  }
  return publicBase(env)
}

async function startUpload(body, env) {
  if (
    typeof body.name !== 'string' ||
    !/\.mp4$/i.test(body.name) ||
    !Number.isSafeInteger(body.size) ||
    body.size <= 0
  ) {
    throw new UploadError(400, 'Choose a non-empty MP4 file.')
  }
  if (body.size > MAX_PROJECT_VIDEO_BYTES) {
    throw new UploadError(413, 'Video exceeds 1 GB. Compress it before uploading.')
  }
  const key = `works/${crypto.randomUUID()}.mp4`
  const upload = await env.VIDEO_BUCKET.createMultipartUpload(key, {
    httpMetadata: { contentType: 'video/mp4', cacheControl: 'public, max-age=31536000, immutable' },
  })
  return {
    session: await encodeSession(
      {
        key,
        size: body.size,
        uploadId: upload.uploadId,
        expires: Date.now() + TOKEN_LIFETIME_SECONDS * 1000,
      },
      env,
    ),
    partBytes: PROJECT_VIDEO_PART_BYTES,
  }
}

async function signPart(session, partNumber, env) {
  const bytesRemaining = session.size - (partNumber - 1) * PROJECT_VIDEO_PART_BYTES
  if (!Number.isSafeInteger(partNumber) || partNumber < 1 || bytesRemaining <= 0) {
    throw new UploadError(400, 'Invalid video part number.')
  }
  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${session.key}`,
  )
  url.searchParams.set('uploadId', session.uploadId)
  url.searchParams.set('partNumber', String(partNumber))
  url.searchParams.set('X-Amz-Expires', String(LINK_LIFETIME_SECONDS))
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  })
  const signed = await client.sign(url, {
    method: 'PUT',
    headers: {
      'Content-Length': String(Math.min(PROJECT_VIDEO_PART_BYTES, bytesRemaining)),
      'Content-Type': 'application/octet-stream',
    },
    aws: { signQuery: true, allHeaders: true },
  })
  return { url: signed.url }
}

async function completeUpload(session, parts, env, base) {
  const expected = Math.ceil(session.size / PROJECT_VIDEO_PART_BYTES)
  if (
    !Array.isArray(parts) ||
    parts.length !== expected ||
    parts.some(
      (part, i) =>
        part?.partNumber !== i + 1 ||
        typeof part.etag !== 'string' ||
        !/^[a-f0-9]{32}$/i.test(part.etag),
    )
  )
    throw new UploadError(400, 'Invalid video part list.')

  const bucket = env.VIDEO_BUCKET
  let object = await bucket.head(session.key)
  if (!object) {
    const upload = bucket.resumeMultipartUpload(session.key, session.uploadId)
    try {
      object = await upload.complete(parts)
    } catch (error) {
      object = await bucket.head(session.key)
      if (!object) throw error
    }
  }
  if (object.size !== session.size) {
    await bucket.delete(session.key)
    throw new UploadError(422, 'The uploaded size did not match the original video.')
  }
  return { url: `${base}/${session.key}` }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin')
    const allowed = (env.MEDIA_ALLOWED_ORIGINS || '').split(',').map(value => value.trim())
    if (!origin || !allowed.includes(origin)) {
      return Response.json({ error: 'Origin is not allowed.' }, { status: 403 })
    }
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Cache-Control': 'no-store',
      Vary: 'Origin',
    }
    const result = (body, status = 200) => Response.json(body, { status, headers })
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return result({ error: 'Method not allowed.' }, 405)

    try {
      if (!(await authorized(request, env.MEDIA_UPLOAD_KEY))) {
        return result({ error: 'Invalid media upload key.' }, 401)
      }
      const base = checkConfig(env)
      if (Number(request.headers.get('Content-Length')) > 16_384) {
        return result({ error: 'Upload control request is too large.' }, 413)
      }
      const body = await request.json().catch(() => null)
      if (body?.action === 'start') return result(await startUpload(body, env))
      if (!['part', 'complete', 'abort'].includes(body?.action)) {
        return result({ error: 'Unknown upload action.' }, 400)
      }
      const session = await decodeSession(body.session, env)
      if (body.action === 'part') return result(await signPart(session, body.partNumber, env))
      if (body.action === 'complete')
        return result(await completeUpload(session, body.parts, env, base))
      await env.VIDEO_BUCKET.resumeMultipartUpload(session.key, session.uploadId).abort()
      return result({ aborted: true })
    } catch (error) {
      if (error instanceof UploadError) return result({ error: error.message }, error.status)
      return result(
        {
          error:
            'The media service could not finish the operation. Check the Worker and R2 configuration.',
        },
        502,
      )
    }
  },
}
