import { isPlainObject } from './persist.js'

export const STYLE_PREVIEW_MESSAGE = 'chen:style-preview'

export function isStylePreviewSurface(location = globalThis.location) {
  try {
    return new URLSearchParams(location?.search || '').has('stylePreview')
  } catch {
    return false
  }
}

export function createStylePreviewMessage(style) {
  return { type: STYLE_PREVIEW_MESSAGE, style }
}

export function isStylePreviewMessage(data) {
  return data?.type === STYLE_PREVIEW_MESSAGE && isPlainObject(data.style)
}
