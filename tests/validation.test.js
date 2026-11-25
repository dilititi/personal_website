import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { validateImportData, validateSectionValue } from '../src/components/editor/validation.js'
import { EXPORTABLE_SECTIONS } from '../src/components/editor/schema.js'
import { collectPublicPathRefs } from '../src/components/editor/export.js'
import { WORKS } from '../src/data.js'

describe('validation', () => {
  it('rejects unknown top-level sections', () => {
    const res = validateImportData({ BOGUS: {} })
    assert.equal(res.valid, false)
  })
  it('accepts a valid SITE-only import', () => {
    const res = validateImportData({ SITE: { name: { en: 'X', zh: 'X' } } })
    assert.equal(res.valid, true)
    assert.ok(res.sections.includes('SITE'))
  })
  it('requires array sections to be arrays', () => {
    const works = EXPORTABLE_SECTIONS.find(s => s.key === 'WORKS')
    assert.ok(validateSectionValue(works, {})) // truthy error string
    assert.equal(validateSectionValue(works, []), '')
  })
  it('rejects work items that omit render-critical collections', () => {
    const res = validateImportData({
      WORKS: [
        {
          id: 'incomplete',
          title: { en: 'Incomplete', zh: '不完整' },
          medium: 'web',
        },
      ],
    })

    assert.equal(res.valid, false)
    assert.match(res.error, /WORKS\[0\]\.(tags|field|body)/)
  })
  it('rejects module ids that have no renderer manifest entry', () => {
    const res = validateImportData({ MODULES: { inventedSection: true } })
    assert.equal(res.valid, false)
    assert.match(res.error, /inventedSection/)
  })
  it('accepts optional project videos from public paths or external media URLs', () => {
    const work = WORKS[0]
    const path = '/works/preview.mp4?v=2'
    const directUrl = 'https://media.example.com/preview?signature=abc'
    for (const videoSrc of [undefined, '', path, directUrl]) {
      assert.equal(validateImportData({ WORKS: [{ ...work, videoSrc }] }).valid, true)
    }
    assert.deepEqual(collectPublicPathRefs({ videoSrc: path }), [
      { path: 'data.videoSrc', url: path },
    ])
    assert.deepEqual(collectPublicPathRefs({ videoSrc: directUrl }), [])
  })
  it('rejects temporary, malformed, and executable URLs in project video fields', () => {
    for (const videoSrc of [
      'data:video/mp4;base64,AAAA',
      'blob:https://example.com/123',
      'javascript:alert(1)',
      '//example.com/video.mp4',
      'https://',
      123,
    ]) {
      const result = validateImportData({ WORKS: [{ ...WORKS[0], videoSrc }] })
      assert.equal(result.valid, false)
      assert.match(result.error, /WORKS\[0\]\.videoSrc/)
    }
  })
})
