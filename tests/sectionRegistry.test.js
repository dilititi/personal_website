import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import * as dataExports from '../src/data.js'
import { resolveModules } from '../src/lib/modules.js'
import {
  createSectionRegistry,
  resolveSectionRegistry,
  resolveWorks,
} from '../src/lib/section-registry.js'

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

  it('restores published work images when an older override omits them', () => {
    const baseWorks = [
      { id: 'choice', title: { en: 'Choice' }, coverImg: '/works/choice-liuye.jpg' },
      { id: 'kurt-fox', title: { en: 'Fox' }, coverImg: '/works/kurt-fox.png' },
      { id: 'text-only', title: { en: 'Text only' }, coverImg: '' },
    ]
    const resolved = resolveWorks(baseWorks, [
      { id: 'choice', title: { en: 'Edited Choice' }, coverImg: '' },
    ])

    assert.deepEqual(resolved, [
      { id: 'choice', title: { en: 'Edited Choice' }, coverImg: '/works/choice-liuye.jpg' },
      { id: 'kurt-fox', title: { en: 'Fox' }, coverImg: '/works/kurt-fox.png' },
    ])
  })

  it('matches legacy works by their own covers before resolving reused IDs', () => {
    const base = [
      { id: 'sound-map', title: 'Sound Map', coverImg: '/works/地图.png', videoSrc: '/map.mp4' },
      { id: 'rain', title: { zh: '雨中花' }, coverImg: '/works/雨中花.jpg' },
    ]
    const draft = [
      { id: 'sound-map', title: 'Independent work' },
      { id: 'sound-map', title: 'My sound map', coverImg: '/works/地图.png' },
      {
        id: 'sound-map',
        title: { zh: '' },
        coverImg: '/works/%E9%9B%A8%E4%B8%AD%E8%8A%B1.jpg?v=2',
        videoSrc: '/my-rain.mp4',
      },
      { id: '', title: 'Another work' },
      { title: 'No ID yet' },
    ]
    const works = resolveWorks(base, draft)
    assert.equal(works.length, 5)
    assert.equal(new Set(works.map(work => work.id)).size, 5)
    assert.ok(works.every(work => work.id))
    assert.equal(works[0].title, 'Independent work')
    assert.equal(works[0].videoSrc, undefined)
    assert.equal(works[1].id, 'sound-map')
    assert.equal(works[1].title, 'My sound map')
    assert.equal(works[2].id, 'rain')
    assert.equal(works[2].title.zh, '雨中花')
    assert.equal(works[2].videoSrc, '/my-rain.mp4')
    assert.deepEqual(resolveWorks(base, works), works)
  })

  it('keeps one card when a published work has a draft with another ID and cover', () => {
    const base = dataExports.WORKS.filter(work =>
      ['princess-of-discarded-things', 'zju-sound-map'].includes(work.id),
    )
    const draft = [
      {
        id: 'draft-princess',
        title: { zh: '《废弃物的公主》' },
        coverImg: '/works/princess-custom.jpg',
        videoSrc: '/works/princess.mp4',
      },
      {
        id: '',
        title: { zh: '浙大声音地图' },
        coverImg: '/works/map-custom.jpg',
        summary: { zh: 'A draft description.' },
      },
    ]

    const works = resolveWorks(base, draft)
    assert.deepEqual(
      works.map(work => work.id),
      base.map(work => work.id),
    )
    assert.equal(works[0].coverImg, '/works/princess-custom.jpg')
    assert.equal(works[0].videoSrc, '/works/princess.mp4')
    assert.equal(works[1].summary.zh, 'A draft description.')
  })

  it('collapses two saved versions of a known card without losing their filled fields', () => {
    const base = dataExports.WORKS.filter(work => work.id === 'zju-sound-map')
    const draft = [
      { id: 'original-map', title: { zh: '浙大声音地图' }, summary: { zh: 'My original text.' } },
      { ...base[0], videoSrc: '/works/sound-map.mp4' },
    ]

    const works = resolveWorks(base, draft)
    assert.equal(works.length, 1)
    assert.equal(works[0].summary.zh, 'My original text.')
    assert.equal(works[0].coverImg, base[0].coverImg)
    assert.equal(works[0].videoSrc, '/works/sound-map.mp4')
    assert.deepEqual(resolveWorks(base, works), works)
  })
})
