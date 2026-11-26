import { describe, expect, it, vi } from 'vitest'
import { createOssMediaService } from '../services/oss-media.js'
import {
  MAX_PROJECT_VIDEO_BYTES,
  newProjectVideoUpload,
  uploadProjectVideo,
} from '../src/lib/project-video-upload.js'

const origin = 'https://personal-website-x3u4.onrender.com'
const media = 'https://portfolio-media.example.com'
const uploadKey = 'fixture-upload-key-not-a-credential'
const etag = 'a'.repeat(32)

function fixture(overrides = {}) {
  const client = {
    initMultipartUpload: vi.fn(async () => ({ uploadId: 'upload+id' })),
    completeMultipartUpload: vi.fn(async () => {}),
    abortMultipartUpload: vi.fn(async () => {}),
    head: vi
      .fn()
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValue({
        res: { headers: { 'content-length': '32' } },
      }),
    delete: vi.fn(async () => {}),
  }
  const fetchObject = vi.fn(
    async (_url, { method }) =>
      new Response(method === 'HEAD' ? null : 'a', {
        status: method === 'HEAD' ? 200 : 206,
        headers: {
          'content-length': method === 'HEAD' ? '32' : '1',
          'content-range': 'bytes 0-0/32',
          'content-disposition': 'attachment',
          'content-type': 'application/octet-stream',
        },
      }),
  )
  const service = createOssMediaService(
    {
      OSS_BUCKET: 'websitemp4',
      OSS_REGION: 'oss-cn-hongkong',
      OSS_ACCESS_KEY_ID: 'fixture-access-key',
      OSS_ACCESS_KEY_SECRET: 'fixture-storage-secret',
      MEDIA_UPLOAD_KEY: uploadKey,
      MEDIA_ALLOWED_ORIGINS: origin,
      MEDIA_PUBLIC_BASE_URL: media,
      OSS_PLAYBACK_ALIASES: JSON.stringify({ 'spiral.mp4': 'videos/沉默的螺旋.mp4' }),
      ...overrides,
    },
    { client, fetchObject },
  )
  return { service, client, fetchObject }
}

describe('OSS video service', () => {
  it('accepts the existing editor upload protocol and returns a durable URL', async () => {
    const { service, client } = fixture()
    const file = new Blob([new Uint8Array(32)], { type: 'video/mp4' })
    file.name = 'clip.mp4'
    const url = await uploadProjectVideo(newProjectVideoUpload(file), {
      endpoint: `${media}/upload`,
      key: uploadKey,
      fetchImpl: async (url, init) => {
        if (url.startsWith(media))
          return service(
            new Request(url, { ...init, headers: { ...init.headers, Origin: origin } }),
          )
        const signed = new URL(url)
        expect(signed.hostname).toBe('websitemp4.oss-cn-hongkong.aliyuncs.com')
        expect(signed.searchParams.get('x-oss-signature-version')).toBe('OSS4-HMAC-SHA256')
        expect(signed.searchParams.get('x-oss-additional-headers')).toContain('content-length')
        expect(signed.searchParams.get('uploadId')).toBe('upload+id')
        expect(signed.searchParams.get('partNumber')).toBe('1')
        expect(init.body.size).toBe(32)
        return new Response(null, { headers: { ETag: `"${etag}"` } })
      },
    })
    expect(url).toMatch(/^https:\/\/portfolio-media\.example\.com\/works\/[a-f0-9-]+\.mp4$/)
    expect(client.initMultipartUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^works\//),
      expect.objectContaining({ mime: 'video/mp4' }),
    )
    expect(client.completeMultipartUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^works\//),
      'upload+id',
      [{ number: 1, etag: `"${etag}"` }],
    )
  })

  it('blocks unauthorized uploads and files over 1 GB', async () => {
    const { service, client } = fixture()
    const post = (auth = uploadKey, from = origin) =>
      service(
        new Request(`${media}/upload`, {
          method: 'POST',
          headers: { Origin: from, Authorization: `Bearer ${auth}` },
          body: JSON.stringify({
            action: 'start',
            name: 'clip.mp4',
            size: MAX_PROJECT_VIDEO_BYTES + 1,
          }),
        }),
      )
    expect((await post('wrong')).status).toBe(401)
    expect((await post(uploadKey, 'https://untrusted.example')).status).toBe(403)
    expect((await post()).status).toBe(413)
    expect(client.initMultipartUpload).not.toHaveBeenCalled()
  })

  it('only streams published routes and preserves byte-range playback', async () => {
    const { service, fetchObject } = fixture()
    expect((await service(new Request(`${media}/videos/private.mp4`))).status).toBe(404)
    expect((await service(new Request(`${media}/works/arbitrary.mp4`))).status).toBe(404)
    expect(fetchObject).not.toHaveBeenCalled()
    const response = await service(
      new Request(`${media}/videos/spiral.mp4`, { headers: { Range: 'bytes=0-0' } }),
    )
    expect(response.status).toBe(206)
    expect(response.headers.get('content-type')).toBe('video/mp4')
    expect(response.headers.get('content-disposition')).toBe('inline')
    expect(response.headers.get('content-range')).toBe('bytes 0-0/32')
    expect(await response.text()).toBe('a')
    expect(new URL(fetchObject.mock.calls[0][0]).pathname).toBe(
      '/videos/%E6%B2%89%E9%BB%98%E7%9A%84%E8%9E%BA%E6%97%8B.mp4',
    )
    expect(new Headers(fetchObject.mock.calls[0][1].headers).get('range')).toBe('bytes=0-0')
    const head = await service(new Request(`${media}/videos/spiral.mp4`, { method: 'HEAD' }))
    expect(head.status).toBe(200)
    expect(head.headers.get('content-length')).toBe('32')
    expect(head.body).toBeNull()
  })

  it('uses the bound OSS custom domain without exposing a signed playback URL', async () => {
    const { service, fetchObject } = fixture({
      OSS_CUSTOM_ENDPOINT: 'https://objects.example.com',
      MEDIA_PUBLIC_BASE_URL: undefined,
      RENDER_EXTERNAL_URL: media,
    })
    const response = await service(new Request(`${media}/videos/spiral.mp4`))
    expect(response.headers.get('location')).toBeNull()
    const signed = new URL(fetchObject.mock.calls[0][0])
    expect(signed.origin).toBe('https://objects.example.com')
    expect(signed.searchParams.get('x-oss-signature')).toBeTruthy()
    await response.body.cancel()
  })

  it('serves explicitly named videos in public-videos alongside existing root videos', async () => {
    const { service, fetchObject } = fixture({
      OSS_PLAYBACK_ALIASES: JSON.stringify({
        'old.mp4': 'existing.mp4',
        'new.mp4': 'public-videos/new clip.mp4',
      }),
    })
    for (const [alias, path] of [
      ['old.mp4', '/existing.mp4'],
      ['new.mp4', '/public-videos/new%20clip.mp4'],
    ]) {
      const response = await service(new Request(`${media}/videos/${alias}`, { method: 'HEAD' }))
      expect(response.status).toBe(200)
      expect(new URL(fetchObject.mock.lastCall[0]).pathname).toBe(path)
    }
    expect((await service(new Request(`${media}/public-videos/unlisted.mp4`))).status).toBe(404)
    expect(fetchObject).toHaveBeenCalledTimes(2)
  })

  it('rejects oversized streamed control requests before contacting OSS', async () => {
    const { service, client } = fixture()
    const request = new Request(`${media}/upload`, {
      method: 'POST',
      headers: { Origin: origin, Authorization: `Bearer ${uploadKey}` },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(16_385))
          controller.close()
        },
      }),
      duplex: 'half',
    })
    expect((await service(request)).status).toBe(413)
    expect(client.initMultipartUpload).not.toHaveBeenCalled()
  })
})
