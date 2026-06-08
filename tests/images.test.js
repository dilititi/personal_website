import { describe, expect, it } from 'vitest'
import {
  buildImageSrcSet,
  responsiveImageAttributes,
  responsiveImagePath,
  responsiveUploadFilename,
} from '../src/lib/images.js'

describe('responsive image helpers', () => {
  it('builds candidates only for the responsive upload naming contract', () => {
    expect(responsiveImagePath('/works/field-1800.jpg', 960)).toBe('/works/field-960.jpg')
    expect(buildImageSrcSet('/works/field.jpg')).toBe('')
    expect(buildImageSrcSet('data:image/jpeg;base64,abc')).toBe('')
  })

  it('preserves URL suffixes and exposes sizes only with a real srcset', () => {
    const attributes = responsiveImageAttributes(
      '/photos/night-1800.webp?v=2',
      '(max-width: 720px) 100vw, 50vw',
    )
    expect(attributes.srcSet).toContain('/photos/night-480.webp?v=2 480w')
    expect(attributes.srcSet).toContain('/photos/night-1800.webp?v=2 1800w')
    expect(attributes.sizes).toBe('(max-width: 720px) 100vw, 50vw')
    expect(responsiveImageAttributes('/photos/night.jpg', '100vw')).toEqual({
      src: '/photos/night.jpg',
    })
  })

  it('creates stable upload variant filenames', () => {
    expect(responsiveUploadFilename('My Portrait.PNG', 1440, 'jpg')).toBe('My Portrait-1440.jpg')
    expect(responsiveUploadFilename('portrait-1800.jpg', 480, '.webp')).toBe('portrait-480.webp')
  })
})
