import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { validateImportData, validateSectionValue } from '../src/components/editor/validation.js'
import { EXPORTABLE_SECTIONS } from '../src/components/editor/schema.js'

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
})
