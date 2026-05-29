// Shared utilities used across components.

// Resize image via canvas. Keeps aspect ratio. Returns a JPEG data URL.
// Non-image files are returned as-is (data URL).
export function resizeImage(file, maxLongEdge = 1800, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      fileToDataUrl(file).then(resolve, reject)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        try {
          const longEdge = Math.max(img.width, img.height)
          const scale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, w, h)
          // Preserve PNG if file is small and was PNG (e.g. logos with transparency).
          // Otherwise JPEG to save space.
          const useJpeg = file.size > 200 * 1024 || file.type !== 'image/png'
          const dataUrl = useJpeg
            ? canvas.toDataURL('image/jpeg', quality)
            : canvas.toDataURL('image/png')
          resolve(dataUrl)
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = () => reject(new Error('Image decode failed'))
      img.src = String(reader.result)
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(new Error('File read failed'))
    fr.readAsDataURL(file)
  })
}

// Approx size of a data URL's payload (in KB).
export function dataUrlSizeKB(dataUrl) {
  if (!dataUrl) return 0
  return Math.round((dataUrl.length / 1024) * 0.75)
}
