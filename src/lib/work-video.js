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
