import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createSectionRegistry, resolveSectionRegistry } from '../src/lib/section-registry.js'

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
})
