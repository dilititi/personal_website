import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import * as dataExports from '../src/data.js'
import { resolveModules } from '../src/lib/modules.js'
import { createSectionRegistry, resolveSectionRegistry } from '../src/lib/section-registry.js'

const EXPECTED_DATA_EXPORTS = [
  'ABOUT',
  'BOOKS',
  'FILMS',
  'JOURNEY',
  'MODULES',
  'MUSIC',
  'NAV',
  'NOW_PLAYING',
  'PHOTOS',
  'PHOTO_SERIES',
  'READING_LOG',
  'SITE',
  'TEXTS',
  'TRAVEL',
  'USER_READING_LOG',
  'WORKS',
]

describe('section registry', () => {
  it('derives data sections from uppercase module exports', () => {
    const registry = createSectionRegistry({
      SITE: { name: 'Chen' },
      WORKS: [],
      pick: () => '',
      helper: 'ignored',
    })

    assert.deepEqual(registry, {
      SITE: { name: 'Chen' },
      WORKS: [],
    })
  })

  it('matches the current data.js runtime section contract', () => {
    const registry = createSectionRegistry(dataExports)

    assert.deepEqual(Object.keys(registry).sort(), EXPECTED_DATA_EXPORTS)
    assert.equal(registry.SITE, dataExports.SITE)
    assert.equal(registry.WORKS, dataExports.WORKS)
    assert.equal(registry.READING_LOG, dataExports.READING_LOG)
  })

  it('resolves all registry entries and supports key-specific resolvers', () => {
    const resolved = resolveSectionRegistry(
      {
        SITE: { name: 'Chen', location: 'Hangzhou' },
        MODULES: { works: true },
      },
      {
        SITE: { name: 'A.' },
        MODULES: { works: false },
      },
      {
        MODULES: (base, override) => ({ base, override }),
      },
    )

    assert.deepEqual(resolved.SITE, { name: 'A.', location: 'Hangzhou' })
    assert.deepEqual(resolved.MODULES, {
      base: { works: true },
      override: { works: false },
    })
  })

  it('keeps parity with the former provider merge rules', () => {
    const baseData = createSectionRegistry(dataExports)
    const workOverride = [{ id: 'only-work' }]
    const readingOverride = [{ date: '2026.06', title: { en: 'Test', zh: '测试' } }]
    const resolved = resolveSectionRegistry(
      baseData,
      {
        SITE: { name: { en: 'Override' } },
        WORKS: workOverride,
        READING_LOG: readingOverride,
        MODULES: { works: false },
      },
      { MODULES: resolveModules },
    )

    assert.deepEqual(resolved.SITE.name, {
      en: 'Override',
      zh: dataExports.SITE.name.zh,
    })
    assert.equal(resolved.SITE.location, dataExports.SITE.location)
    assert.equal(resolved.WORKS, workOverride)
    assert.equal(resolved.READING_LOG, readingOverride)
    assert.equal(resolved.MODULES.works.enabled, false)
    assert.equal(resolved.MODULES.works.nav, dataExports.MODULES.works.nav)
  })
})
