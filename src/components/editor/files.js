export function formatLocalTimestamp(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function timestampedJsonFilename(filenameStem, now = new Date()) {
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${filenameStem}-${stamp}.json`
}

export function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function downloadJson(filenameStem, payload) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
  downloadText(timestampedJsonFilename(filenameStem), text, 'application/json')
}
