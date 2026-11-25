const uploadedVideoPreviews = new Map()

export function setUploadedVideoPreview(path, file) {
  const previous = uploadedVideoPreviews.get(path)
  if (previous) URL.revokeObjectURL(previous)
  uploadedVideoPreviews.set(path, URL.createObjectURL(file))
}

export function getUploadedVideoPreview(path) {
  return uploadedVideoPreviews.get(path) || ''
}

export function workVideoSource(value) {
  if (typeof value !== 'string') return ''
  const source = value.trim()
  if (/[\\\r\n\t]/.test(source)) return ''
  if (/^\/(?!\/)[^?#]/.test(source)) return source
  if (!/^https?:\/\//i.test(source)) return ''

  try {
    const url = new URL(source)
    return url.hostname && !url.username && !url.password ? source : ''
  } catch {
    return ''
  }
}
