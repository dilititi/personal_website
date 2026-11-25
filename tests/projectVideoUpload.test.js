import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
  abortProjectVideoUpload,
  MAX_PROJECT_VIDEO_BYTES,
  mediaUploadEndpoint,
  newProjectVideoUpload,
  PROJECT_VIDEO_PART_BYTES,
  uploadProjectVideo,
} from '../src/lib/project-video-upload.js'
import worker from '../workers/project-video-upload.js'

const origin = 'https://portfolio.example.com'
const playback = 'https://media.example.com'
const key = 'upload-key-fixture-used-only-for-tests'
const etag = 'a'.repeat(32)
const endpoint = 'https://upload.example.com'

function fixture(size) {
  return {
    name: 'work.mp4',
    size,
    slice(start, end, type) {
      return { size: Math.min(end, size) - start, type }
    },
  }
}

function workerFixture() {
  const calls = []
  let object = null
  let receivedSize = 0
  const env = {
    MEDIA_UPLOAD_KEY: key,
    MEDIA_ALLOWED_ORIGINS: origin,
    MEDIA_PUBLIC_BASE_URL: playback,
    R2_ACCOUNT_ID: '123456',
    R2_BUCKET_NAME: 'portfolio-videos',
    R2_ACCESS_KEY_ID: 'access-key-fixture',
    R2_SECRET_ACCESS_KEY: 'storage-secret-fixture',
    VIDEO_BUCKET: {
      async createMultipartUpload(name, options) {
        calls.push(['start', name, options])
        return { uploadId: 'upload/session+id' }
      },
      resumeMultipartUpload(name, uploadId) {
        return {
          async complete(parts) {
            calls.push(['complete', name, uploadId, parts])
            object = { size: receivedSize }
            return object
          },
          async abort() {
            calls.push(['abort', name, uploadId])
          },
        }
      },
      async head() {
        return object
      },
      async delete(name) {
        calls.push(['delete', name])
        object = null
      },
    },
  }
  function post(body, headers = {}) {
    return worker.fetch(
      new Request(endpoint, {
        method: 'POST',
        headers: { Origin: origin, Authorization: `Bearer ${key}`, ...headers },
        body: JSON.stringify(body),
      }),
      env,
    )
  }
  return {
    calls,
    env,
    post,
    setSize: size => {
      receivedSize = size
    },
  }
}

describe('project video upload', () => {
  it('accepts secure endpoints and local development', () => {
    assert.equal(mediaUploadEndpoint(endpoint + '/'), endpoint)
    assert.equal(mediaUploadEndpoint('http://127.0.0.1:8787/'), 'http://127.0.0.1:8787')
    assert.equal(mediaUploadEndpoint('http://upload.example.com'), '')
    assert.equal(mediaUploadEndpoint('https://user:pass@upload.example.com'), '')
  })

  it('signs and sends an exact 1 GB video in parts and resumes only incomplete parts', async () => {
    const service = workerFixture()
    service.setSize(MAX_PROJECT_VIDEO_BYTES)
    const job = newProjectVideoUpload(fixture(MAX_PROJECT_VIDEO_BYTES))
    const sent = []
    let rejectSecondPart = true
    let uploadedBytes = 0
    const progress = []
    const options = {
      endpoint,
      key,
      onProgress: (completed, total) => progress.push([completed, total]),
      fetchImpl: async (url, request) => {
        if (url === endpoint) return service.post(JSON.parse(request.body))
        const signed = new URL(url)
        assert.equal(signed.hostname, '123456.r2.cloudflarestorage.com')
        assert.match(signed.pathname, /^\/portfolio-videos\/works\/[a-f\d-]+\.mp4$/)
        assert.equal(signed.searchParams.get('uploadId'), 'upload/session+id')
        assert.equal(
          signed.searchParams.get('X-Amz-SignedHeaders'),
          'content-length;content-type;host',
        )
        assert.ok(signed.searchParams.get('X-Amz-Signature'))
        assert.equal(request.method, 'PUT')
        assert.equal(request.body.type, 'application/octet-stream')
        const part = Number(signed.searchParams.get('partNumber'))
        sent.push(part)
        if (part === 2 && rejectSecondPart) return new Response(null, { status: 503 })
        uploadedBytes += request.body.size
        return new Response(null, { headers: { ETag: `"${etag}"` } })
      },
    }
    await assert.rejects(() => uploadProjectVideo(job, options), /part 2/)
    assert.deepEqual(sent, [1, 2, 2, 2])
    rejectSecondPart = false
    const url = await uploadProjectVideo(job, options)
    assert.match(url, /^https:\/\/media\.example\.com\/works\/[a-f\d-]+\.mp4$/)
    assert.equal(uploadedBytes, MAX_PROJECT_VIDEO_BYTES)
    assert.equal(sent.filter(part => part === 1).length, 1)
    assert.equal(service.calls.filter(([action]) => action === 'start').length, 1)
    const total = Math.ceil(MAX_PROJECT_VIDEO_BYTES / PROJECT_VIDEO_PART_BYTES)
    assert.deepEqual(progress.at(-1), [total, total])
    assert.equal(await uploadProjectVideo(job, options), url)
    assert.equal(service.calls.filter(([action]) => action === 'complete').length, 1)
  })

  it('enforces the limit, authentication, origin and signed sessions', async () => {
    const service = workerFixture()
    assert.equal(
      (
        await service.post(
          { action: 'start', size: 42, name: 'work.mp4' },
          {
            Authorization: 'Bearer incorrect',
          },
        )
      ).status,
      401,
    )
    assert.equal(
      (
        await service.post(
          { action: 'start', size: 42, name: 'work.mp4' },
          {
            Origin: 'https://unauthorized.example.com',
          },
        )
      ).status,
      403,
    )
    assert.equal(
      (
        await service.post({
          action: 'start',
          size: MAX_PROJECT_VIDEO_BYTES + 1,
          name: 'work.mp4',
        })
      ).status,
      413,
    )
    assert.equal(service.calls.length, 0)
    await assert.rejects(
      () =>
        uploadProjectVideo(newProjectVideoUpload(fixture(MAX_PROJECT_VIDEO_BYTES + 1)), {
          endpoint,
          key,
          fetchImpl: () => assert.fail('Oversize video must not send any request'),
        }),
      /up to 1 GB/,
    )
    const first = await service.post({ action: 'start', size: 42, name: 'work.mp4' })
    const { session } = await first.json()
    const tampered = (session.startsWith('A') ? 'B' : 'A') + session.slice(1)
    assert.equal(
      (await service.post({ action: 'part', session: tampered, partNumber: 1 })).status,
      400,
    )
    assert.equal((await service.post({ action: 'part', session, partNumber: 2 })).status, 400)
    assert.equal((await service.post({ action: 'complete', session, parts: [] })).status, 400)
    await abortProjectVideoUpload(
      { session },
      {
        endpoint,
        key,
        fetchImpl: (_url, request) => service.post(JSON.parse(request.body)),
      },
    )
    assert.equal(service.calls.at(-1)[0], 'abort')
  })
})
