import { describe, expect, it } from 'vitest'
import {
  STYLE_PREVIEW_MESSAGE,
  createStylePreviewMessage,
  isStylePreviewMessage,
  isStylePreviewSurface,
} from '../src/lib/style-preview.js'
import { DEFAULT_STYLE } from '../src/style.js'

describe('style preview bridge', () => {
  it('recognizes only the bounded style preview message shape', () => {
    const message = createStylePreviewMessage(DEFAULT_STYLE)

    expect(message.type).toBe(STYLE_PREVIEW_MESSAGE)
    expect(isStylePreviewMessage(message)).toBe(true)
    expect(isStylePreviewMessage({ type: STYLE_PREVIEW_MESSAGE, style: 'film' })).toBe(false)
    expect(isStylePreviewMessage({ type: 'other', style: DEFAULT_STYLE })).toBe(false)
  })

  it('detects the dedicated preview surface query', () => {
    expect(isStylePreviewSurface({ search: '?previewSurface=1&stylePreview=1' })).toBe(true)
    expect(isStylePreviewSurface({ search: '?previewSurface=1' })).toBe(false)
  })
})
