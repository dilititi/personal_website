import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { languageFromUrl } from '../src/lib/seo.js'
import { prerender } from '../src/prerender.jsx'

describe('prerender entry', () => {
  it('maps root and language routes to stable initial languages', () => {
    assert.equal(languageFromUrl('/'), 'zh')
    assert.equal(languageFromUrl('/en/'), 'en')
    assert.equal(languageFromUrl('/zh/'), 'zh')
    assert.equal(languageFromUrl('not a valid absolute URL'), 'zh')
  })

  it('renders complete English and Chinese application shells', async () => {
    const en = await prerender({ url: '/en/' })
    const zh = await prerender({ url: '/zh/' })

    assert.match(en.html, /class="landing landing-template landing-minimal"/)
    assert.match(en.html, /class="landing-minimal-projects"/)
    assert.match(en.html, /class="theme-motif-layer motif-film/)
    assert.match(en.html, /id="about"/)
    assert.match(en.html, />Xie Jingcheng</)
    assert.match(zh.html, /class="landing landing-template landing-minimal"/)
    assert.match(zh.html, /id="about"/)
    assert.match(zh.html, />谢靖程</)
    assert.equal(en.head.lang, 'en')
    assert.equal(zh.head.lang, 'zh')
    assert.match(en.head.title, /^Xie Jingcheng/)
    assert.match(zh.head.title, /^谢靖程/)
    assert.deepEqual([...en.links], ['/en', '/zh'])
    assert.doesNotMatch(`${en.html}${zh.html}`, /undefined/)
    assert.doesNotMatch(
      `${en.html}${zh.html}`,
      /resume-portrait|class="portrait"|class="landing-template-media"/,
    )
  })
})
