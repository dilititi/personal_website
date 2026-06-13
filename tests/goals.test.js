import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { SITE, TEXTS } from '../src/data.js'
import { EXPORTABLE_SECTIONS } from '../src/components/editor/schema.js'
import { GOAL_PRESETS, resolveGoalSelection } from '../src/components/editor/goals.js'

function leafPaths(value, path = '', result = []) {
  if (Array.isArray(value)) return result
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) =>
      leafPaths(entry, path ? `${path}.${key}` : key, result),
    )
  } else {
    result.push(path)
  }
  return result
}

function valueAt(value, path) {
  return path.split('.').reduce((current, key) => current?.[key], value)
}

describe('goal presets', () => {
  it('maps every goal to a complete content override and a style preset', () => {
    const required = EXPORTABLE_SECTIONS.map(section => section.key).sort()

    for (const goal of GOAL_PRESETS) {
      const selection = resolveGoalSelection(goal.id)
      assert.deepEqual(Object.keys(selection.content).sort(), required)
      assert.equal(typeof selection.stylePreset, 'string')
      assert.ok(selection.stylePreset)
    }
  })

  it('maps the curated goals to their intended visual direction', () => {
    assert.equal(resolveGoalSelection('blank').stylePreset, 'editorial')
    assert.equal(resolveGoalSelection('minimal-portfolio').stylePreset, 'minimalPortfolio')
    assert.equal(resolveGoalSelection('personal-journal').stylePreset, 'personalJournal')
    assert.equal(resolveGoalSelection('gradient-studio').stylePreset, 'gradientStudio')
  })

  it('returns isolated data that cannot mutate the preset source', () => {
    const first = resolveGoalSelection('personal-journal')
    first.content.SITE.name.en = 'Changed'

    const second = resolveGoalSelection('personal-journal')
    assert.equal(second.content.SITE.name.en, 'LIN')
  })

  it('uses neutral template metadata instead of retaining the demo identity', () => {
    const blank = resolveGoalSelection('blank').content
    const digital = resolveGoalSelection('gradient-studio').content

    assert.equal(blank.SITE.url, '')
    assert.match(blank.SITE.name.en, /<Your name>/)
    assert.equal(digital.SITE.url, '')
    assert.equal(digital.TEXTS.landing.metaRole.en, 'FRONTEND · DATA DESIGN')
    assert.deepEqual(digital.READING_LOG, [])
  })

  it('applies distinct module structures instead of visual-only skins', () => {
    const minimal = resolveGoalSelection('minimal-portfolio').content.MODULES
    const journal = resolveGoalSelection('personal-journal').content.MODULES
    const studio = resolveGoalSelection('gradient-studio').content.MODULES

    assert.equal(minimal.works.layout, 'feature')
    assert.equal(minimal.library.enabled, false)
    assert.equal(journal.library.enabled, true)
    assert.equal(journal.library.layout, 'feature')
    assert.equal(studio.photography.enabled, true)
    assert.equal(studio.travel.enabled, false)
    assert.ok(studio.works.order < studio.about.order)
  })

  it('fully overrides identity-bearing SITE and TEXTS fields', () => {
    const textPaths = leafPaths(TEXTS)

    for (const goal of GOAL_PRESETS) {
      const content = resolveGoalSelection(goal.id).content
      assert.deepEqual(
        Object.keys(SITE).filter(key => content.SITE[key] === undefined),
        [],
      )
      assert.deepEqual(
        textPaths.filter(path => valueAt(content.TEXTS, path) === undefined),
        [],
      )
    }
  })
})
