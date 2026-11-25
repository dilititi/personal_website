export const MAX_PROJECT_VIDEO_BYTES = 1_000_000_000
export const PROJECT_VIDEO_PART_BYTES = 16 * 1024 * 1024
const PART_ATTEMPTS = 3

export function mediaUploadEndpoint(value) {
  try {
    const url = new URL(value)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if (
      (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return ''
    return url.href.replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function newProjectVideoUpload(file) {
  return { file, session: '', parts: new Map() }
}

async function control(action, payload, { endpoint, key, signal, fetchImpl }) {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    redirect: 'error',
    credentials: 'omit',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
    signal,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new Error(result.error || `Upload service returned HTTP ${response.status}.`)
  return result
}

export async function uploadProjectVideo(job, options) {
  const { file } = job
  const { onProgress, signal, fetchImpl = fetch } = options
  const config = { ...options, fetchImpl }
  if (!/\.mp4$/i.test(file.name) || file.size < 1 || file.size > MAX_PROJECT_VIDEO_BYTES) {
    throw new Error('Choose a non-empty MP4 of up to 1 GB.')
  }
  if (!job.session) {
    const result = await control('start', { name: file.name, size: file.size }, config)
    if (!result.session || result.partBytes !== PROJECT_VIDEO_PART_BYTES) {
      throw new Error('Unexpected upload session from the media service.')
    }
    job.session = result.session
  }

  const total = Math.ceil(file.size / PROJECT_VIDEO_PART_BYTES)
  onProgress?.(job.parts.size, total)
  for (let partNumber = 1; partNumber <= total; partNumber++) {
    signal?.throwIfAborted()
    if (job.parts.has(partNumber)) continue
    const start = (partNumber - 1) * PROJECT_VIDEO_PART_BYTES
    const slice = file.slice(start, start + PROJECT_VIDEO_PART_BYTES, 'application/octet-stream')

    for (let attempt = 1; attempt <= PART_ATTEMPTS; attempt++) {
      const { url } = await control('part', { session: job.session, partNumber }, config)
      const response = await fetchImpl(url, {
        method: 'PUT',
        redirect: 'error',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: slice,
        signal,
      }).catch(error => {
        if (signal?.aborted || attempt === PART_ATTEMPTS) throw error
        return null
      })
      if (!response) continue
      if (!response.ok) {
        const retryable = [408, 429].includes(response.status) || response.status >= 500
        if (retryable && attempt < PART_ATTEMPTS) continue
        throw new Error(`Video part ${partNumber} could not be uploaded (HTTP ${response.status}).`)
      }
      const etag = response.headers.get('etag')?.replace(/^"|"$/g, '')
      if (!etag) throw new Error('R2 did not expose the part ETag. Check the bucket CORS settings.')
      job.parts.set(partNumber, etag)
      onProgress?.(job.parts.size, total)
      break
    }
  }
  const { url } = await control(
    'complete',
    {
      session: job.session,
      parts: [...job.parts]
        .sort(([a], [b]) => a - b)
        .map(([partNumber, etag]) => ({ partNumber, etag })),
    },
    config,
  )
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error('The media service did not return a playback URL.')
  }
  return url
}

export async function abortProjectVideoUpload(job, options) {
  if (!job?.session) return
  await control('abort', { session: job.session }, { fetchImpl: fetch, ...options })
}
