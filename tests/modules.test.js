import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { buildNavigationItems, normalizeModuleConfig, resolveModules } from '../src/lib/modules.js'

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
  it('normalizes base ids and ignores override-only modules with no renderer', () => {
    const out = resolveModules({ about: base }, { about: false, extra: true })
    assert.equal(out.about.enabled, false)
    assert.equal(out.extra, undefined)
  })
})

describe('buildNavigationItems', () => {
  it('uses module order for sorting but sequential ranks for visible labels', () => {
    const modules = {
      works: { ...base, order: 30, label: { en: 'Works', zh: '作品' } },
      about: { ...base, order: 10, label: { en: 'About', zh: '关于' } },
      hidden: { ...base, order: 20, nav: false },
    }
    const items = buildNavigationItems(modules, [
      { id: 'home', num: '00', label: { en: 'Home', zh: '首页' } },
    ])

    assert.deepEqual(
      items.map(item => [item.id, item.num]),
      [
        ['home', '00'],
        ['about', '01'],
        ['works', '02'],
      ],
    )
  })
})
