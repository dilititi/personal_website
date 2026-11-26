import { AwsClient } from 'aws4fetch'
import { createMediaUploadHandler, PART_URL_LIFETIME_SECONDS } from './media-upload-control.js'

function r2Storage(env) {
  const bucket = env.VIDEO_BUCKET
  if (
    !bucket ||
    !env.R2_BUCKET_NAME ||
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY
  ) {
    throw new Error('Missing R2 service configuration.')
  }
  return {
    sessionSecret: env.R2_SECRET_ACCESS_KEY,
    async start(key) {
      const upload = await bucket.createMultipartUpload(key, {
        httpMetadata: {
          contentType: 'video/mp4',
          cacheControl: 'public, max-age=31536000, immutable',
        },
      })
      return upload.uploadId
    },
    async signPart(session, partNumber, length) {
      const url = new URL(
        `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${session.key}`,
      )
      url.searchParams.set('uploadId', session.uploadId)
      url.searchParams.set('partNumber', String(partNumber))
      url.searchParams.set('X-Amz-Expires', String(PART_URL_LIFETIME_SECONDS))
      const client = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        service: 's3',
        region: 'auto',
      })
      const signed = await client.sign(url, {
        method: 'PUT',
        headers: { 'Content-Length': String(length), 'Content-Type': 'application/octet-stream' },
        aws: { signQuery: true, allHeaders: true },
      })
      return signed.url
    },
    head: key => bucket.head(key),
    complete: (session, parts) =>
      bucket.resumeMultipartUpload(session.key, session.uploadId).complete(parts),
    delete: key => bucket.delete(key),
    abort: session => bucket.resumeMultipartUpload(session.key, session.uploadId).abort(),
  }
}

export default {
  fetch(request, env) {
    return createMediaUploadHandler(env, () => r2Storage(env))(request)
  },
}
