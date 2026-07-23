import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { MODULES } from '../src/data.js'
import { MODULE_MANIFEST, PAGE_MODULE_MANIFEST } from '../src/lib/module-manifest.js'
import { MODULES_SCHEMA } from '../src/components/editor/schema.js'

describe('module manifest', () => {
  it('is the shared module id source for defaults and editor controls', () => {
    const ids = MODULE_MANIFEST.map(item => item.id).sort()
    assert.deepEqual(Object.keys(MODULES).sort(), ids)
    assert.deepEqual(MODULES_SCHEMA.map(item => item.key).sort(), ids)
  })

  it('declares editor targets for every rendered page module', () => {
    for (const module of PAGE_MODULE_MANIFEST) {
      assert.equal(typeof module.editorKey, 'string')
      assert.equal(typeof module.quickKey, 'string')
    }
  })
})
