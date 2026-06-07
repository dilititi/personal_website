import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { SITE } from '../src/data.js'
import { buildLanguageLinks, buildLanguageSeo, buildSeo, SEO_DEFAULT_LANG } from '../src/lib/seo.js'

describe('SEO data', () => {
  it('builds bilingual title and description values from SITE', () => {
    const en = buildSeo(SITE, 'en')
    const zh = buildSeo(SITE, 'zh')

    assert.equal(SEO_DEFAULT_LANG, 'en')
    assert.equal(en.title, 'CHEN · Film student in Hangzhou.')
    assert.equal(
      en.description,
      'Film student in Hangzhou. A slow notebook of frames, sounds, and things I am still learning to see.',
    )
    assert.equal(zh.title, '陈 · 电影方向的学生，在杭州。')
    assert.equal(
      zh.description,
      '电影方向的学生，在杭州。这是一本慢慢生长的笔记本——影像、声音，以及还在学着「看见」的事物。',
    )
    assert.equal(typeof en.title, 'string')
    assert.equal(typeof zh.description, 'string')
  })

  it('removes emphasis stars from title and description text', () => {
    const seo = buildSeo(
      {
        name: { en: '*Chen*', zh: '陈' },
        tagline: { en: 'A *slow* notebook.', zh: '一本慢笔记。' },
      },
      'en',
    )

    assert.equal(seo.title, 'Chen · A slow notebook.')
    assert.equal(seo.description, 'A slow notebook.')
    assert.ok(!seo.title.includes('*'))
    assert.ok(!seo.description.includes('*'))
  })

  it('absolutizes portrait URLs and degrades cleanly without a site URL', () => {
    const absolute = buildSeo({
      url: 'https://example.com/',
      portrait: '/picture/me.jpg',
    })
    const relative = buildSeo({
      url: '',
      portrait: '/picture/me.jpg',
    })
    const empty = buildSeo({ url: '' })

    assert.equal(absolute.image, 'https://example.com/picture/me.jpg')
    assert.equal(absolute.canonical, 'https://example.com')
    assert.equal(relative.image, '/picture/me.jpg')
    assert.equal(relative.canonical, '')
    assert.equal(empty.image, '')
    assert.equal(empty.canonical, '')
    assert.ok(!Object.values(empty).includes(undefined))
  })

  it('maps canonical and alternate locales for both languages', () => {
    const site = { url: 'https://example.com' }
    const en = buildSeo(site, 'en')
    const zh = buildSeo(site, 'zh')

    assert.equal(en.canonical, site.url)
    assert.equal(en.locale, 'en_US')
    assert.equal(en.localeAlternate, 'zh_CN')
    assert.equal(zh.canonical, site.url)
    assert.equal(zh.locale, 'zh_CN')
    assert.equal(zh.localeAlternate, 'en_US')
  })

  it('derives language-route canonical and hreflang links from SITE.url', () => {
    const site = { url: 'https://example.com/' }

    assert.equal(buildLanguageSeo(site, 'en').canonical, 'https://example.com/en/')
    assert.equal(buildLanguageSeo(site, 'zh').canonical, 'https://example.com/zh/')
    assert.deepEqual(buildLanguageLinks(site), [
      { hreflang: 'en', href: 'https://example.com/en/' },
      { hreflang: 'zh', href: 'https://example.com/zh/' },
      { hreflang: 'x-default', href: 'https://example.com/en/' },
    ])
    assert.deepEqual(buildLanguageLinks({ url: '' }), [])
  })
})
