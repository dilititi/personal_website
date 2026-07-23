import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { buildContentDraft } from '../src/components/editor/contentDraft.js'

describe('buildContentDraft', () => {
  const baseData = {
    SITE: { name: { en: 'Base', zh: '默认' } },
    WORKS: [],
  }

  it('includes the unsaved active section in every resolved draft', () => {
    const draft = buildContentDraft({
      baseData,
      resolvedData: baseData,
      userOverrides: {},
      activeKey: 'SITE',
      workingValue: { name: { en: 'Draft', zh: '草稿' } },
    })

    assert.equal(draft.resolved.SITE.name.en, 'Draft')
    assert.deepEqual(draft.changedKeys, ['SITE'])
    assert.equal(draft.workingChanged, true)
  })

  it('keeps persisted overrides while replacing only the active working section', () => {
    const resolvedData = {
      SITE: { name: { en: 'Saved', zh: '已保存' } },
      WORKS: [{ id: 'saved-work' }],
    }
    const draft = buildContentDraft({
      baseData,
      resolvedData,
      userOverrides: {
        SITE: resolvedData.SITE,
        WORKS: resolvedData.WORKS,
      },
      activeKey: 'SITE',
      workingValue: { name: { en: 'Draft', zh: '草稿' } },
    })

    assert.equal(draft.resolved.SITE.name.en, 'Draft')
    assert.deepEqual(draft.resolved.WORKS, [{ id: 'saved-work' }])
    assert.deepEqual(draft.changedKeys.sort(), ['SITE', 'WORKS'])
  })

  it('does not inject special editor panels into exported data', () => {
    const draft = buildContentDraft({
      baseData,
      resolvedData: baseData,
      userOverrides: {},
      activeKey: '_AUDIT',
      workingValue: { transient: true },
    })

    assert.equal('_AUDIT' in draft.resolved, false)
    assert.equal(draft.workingChanged, false)
  })
})
