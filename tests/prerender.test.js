import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { languageFromUrl } from '../src/lib/seo.js'
import { prerender } from '../src/prerender.jsx'

describe('prerender entry', () => {
  it('maps root and language routes to stable initial languages', () => {
    assert.equal(languageFromUrl('/'), 'en')
    assert.equal(languageFromUrl('/en/'), 'en')
    assert.equal(languageFromUrl('/zh/'), 'zh')
    assert.equal(languageFromUrl('not a valid absolute URL'), 'en')
  })

  it('renders complete English and Chinese application shells', async () => {
    const en = await prerender({ url: '/en/' })
    const zh = await prerender({ url: '/zh/' })

    assert.match(en.html, /class="landing landing-template landing-minimal"/)
    assert.match(en.html, /class="landing-minimal-projects"/)
    assert.match(en.html, /class="theme-motif-layer motif-film/)
    assert.match(en.html, /id="about"/)
    assert.match(en.html, />CHEN</)
    assert.match(zh.html, /class="landing landing-template landing-minimal"/)
    assert.match(zh.html, /id="about"/)
    assert.match(zh.html, />陈</)
    assert.equal(en.head.lang, 'en')
    assert.equal(zh.head.lang, 'zh')
    assert.match(en.head.title, /^CHEN/)
    assert.match(zh.head.title, /^陈/)
    assert.deepEqual([...en.links], ['/en', '/zh'])
    assert.doesNotMatch(`${en.html}${zh.html}`, /undefined/)
  })
})
