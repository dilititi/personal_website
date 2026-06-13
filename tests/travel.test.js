import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { resolveTravelTheme, TRAVEL_THEME_IDS } from '../src/lib/travel.js'

describe('travel themes', () => {
  it('keeps an explicit supported theme', () => {
    assert.equal(resolveTravelTheme({ city: { en: 'Anywhere' }, theme: 'rain' }), 'rain')
  })

  it('maps known bilingual city names to distinct visual themes', () => {
    assert.equal(resolveTravelTheme({ city: { en: 'Hangzhou', zh: '杭州' } }), 'botanical')
    assert.equal(resolveTravelTheme({ city: { en: 'Shanghai', zh: '上海' } }), 'metropolitan')
    assert.notEqual(
      resolveTravelTheme({ city: { zh: '杭州' } }),
      resolveTravelTheme({ city: { zh: '上海' } }),
    )
  })

  it('falls back safely for new cities and invalid theme values', () => {
    assert.equal(
      resolveTravelTheme({ city: 'Unknown', kind: 'home', theme: 'invalid' }),
      'botanical',
    )
    assert.equal(resolveTravelTheme({ city: 'Unknown', kind: 'trip' }), 'graphic')
    assert.ok(TRAVEL_THEME_IDS.includes(resolveTravelTheme({})))
  })
})
