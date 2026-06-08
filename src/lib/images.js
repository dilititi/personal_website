export const RESPONSIVE_IMAGE_WIDTHS = [480, 960, 1440, 1800]

const RESPONSIVE_SOURCE_RE = /^(.*)-1800\.(jpe?g|png|webp)$/i

function splitUrl(value) {
  const source = String(value || '')
  const suffixIndex = source.search(/[?#]/)
  if (suffixIndex < 0) return { pathname: source, suffix: '' }
  return {
    pathname: source.slice(0, suffixIndex),
    suffix: source.slice(suffixIndex),
  }
}

export function responsiveImagePath(src, width) {
  const { pathname, suffix } = splitUrl(src)
  const match = pathname.match(RESPONSIVE_SOURCE_RE)
  if (!match) return ''
  return `${match[1]}-${width}.${match[2]}${suffix}`
}

export function buildImageSrcSet(src, widths = RESPONSIVE_IMAGE_WIDTHS) {
  if (!responsiveImagePath(src, 1800)) return ''
  return [...new Set(widths)]
    .filter(width => Number.isInteger(width) && width > 0 && width <= 1800)
    .sort((a, b) => a - b)
    .map(width => `${responsiveImagePath(src, width)} ${width}w`)
    .join(', ')
}

export function responsiveImageAttributes(src, sizes) {
  const srcSet = buildImageSrcSet(src)
  return {
    src,
    ...(srcSet ? { srcSet, sizes } : {}),
  }
}

export function responsiveUploadFilename(filename, width, extension = 'jpg') {
  const cleanExtension = String(extension).replace(/^\./, '').toLowerCase() || 'jpg'
  const stem = String(filename || 'image')
    .replace(/\.[^.]+$/, '')
    .replace(/-1800$/i, '')
  return `${stem}-${width}.${cleanExtension}`
}
