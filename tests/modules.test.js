import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeModuleConfig, resolveModules } from '../src/lib/modules.js'

const base = {
  enabled: true,
  nav: true,
  order: 3,
  label: { en: 'Works', zh: '作品' },
  layout: 'default',
}

describe('normalizeModuleConfig', () => {
  it('legacy boolean override toggles enabled, keeps the rest', () => {
    assert.deepEqual(normalizeModuleConfig('works', base, false), { ...base, enabled: false })
    assert.deepEqual(normalizeModuleConfig('works', base, true), { ...base, enabled: true })
  })
  it('returns the base config when override is undefined', () => {
    assert.deepEqual(normalizeModuleConfig('works', base, undefined), base)
  })
  it('merges an object override', () => {
    const out = normalizeModuleConfig('works', base, { order: 5, nav: false })
    assert.equal(out.order, 5)
    assert.equal(out.nav, false)
    assert.equal(out.enabled, true)
  })
  it('rejects an invalid layout, accepts a valid one', () => {
    assert.equal(normalizeModuleConfig('works', base, { layout: 'bogus' }).layout, 'default')
    assert.equal(normalizeModuleConfig('works', base, { layout: 'feature' }).layout, 'feature')
  })
  it('synthesizes a config from a bare boolean base', () => {
    const out = normalizeModuleConfig('x', true, undefined)
    assert.equal(out.enabled, true)
    assert.equal(out.layout, 'default')
    assert.deepEqual(out.label, { en: 'x', zh: 'x' })
  })
  it('deep-merges the bilingual label', () => {
    const out = normalizeModuleConfig('works', base, { label: { en: 'Projects' } })
    assert.deepEqual(out.label, { en: 'Projects', zh: '作品' })
  })
})

describe('resolveModules', () => {
  it('normalizes every id from base and override', () => {
    const out = resolveModules({ about: base }, { about: false, extra: true })
    assert.equal(out.about.enabled, false)
    assert.equal(out.extra.enabled, true)
  })
})
