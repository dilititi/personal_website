import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import * as dataExports from '../src/data.js'
import {
  auditSiteData,
  MAX_AUDIT_TITLE_LENGTH,
  runSiteAudit,
} from '../src/components/editor/audit.js'
import { resolveGoalSelection } from '../src/components/editor/goals.js'
import { createSectionRegistry } from '../src/lib/section-registry.js'

function baseData() {
  return structuredClone(createSectionRegistry(dataExports))
}

describe('site audit', () => {
  it('keeps the source demo publishable while reporting placeholder links as warnings', () => {
    const report = auditSiteData(baseData())

    assert.equal(report.errors.length, 0)
    assert.ok(report.warnings.some(entry => entry.code === 'empty-link'))
  })

  it('finds unresolved template placeholders but ignores supported inline markup', () => {
    const data = baseData()
    data.SITE.tagline.en = 'A portfolio for <Your field>'
    data.TEXTS.contact.statementEn = 'I am <em>open</em> to work.'

    const report = auditSiteData(data)

    assert.ok(
      report.errors.some(
        entry => entry.code === 'unresolved-placeholder' && entry.path === 'SITE.tagline.en',
      ),
    )
    assert.equal(
      report.errors.some(entry => entry.path === 'TEXTS.contact.statementEn'),
      false,
    )
  })

  it('locates empty links, missing titles, and titles that exceed the layout budget', () => {
    const data = baseData()
    data.SITE.social = [{ label: { en: 'Link', zh: '链接' }, handle: '@x', url: '#' }]
    data.WORKS = [
      { title: { en: '', zh: '' } },
      { title: { en: 'x'.repeat(MAX_AUDIT_TITLE_LENGTH + 1), zh: '短标题' } },
    ]

    const report = auditSiteData(data)

    assert.ok(
      report.errors.some(
        entry => entry.code === 'missing-title' && entry.path === 'WORKS[0].title',
      ),
    )
    assert.ok(
      report.warnings.some(
        entry => entry.code === 'long-title' && entry.path === 'WORKS[1].title.en',
      ),
    )
    assert.ok(
      report.warnings.some(
        entry => entry.code === 'empty-link' && entry.path === 'SITE.social[0].url',
      ),
    )
  })

  it('treats large embedded media as a publication error', () => {
    const data = baseData()
    data.WORKS[0].coverImg = `data:image/png;base64,${'a'.repeat(160_000)}`

    const report = auditSiteData(data)

    assert.ok(
      report.errors.some(
        entry => entry.code === 'embedded-data-url' && entry.path === 'WORKS[0].coverImg',
      ),
    )
  })

  it('keeps curated goals free of blocking content errors', () => {
    for (const goalId of ['minimal-portfolio', 'personal-journal', 'gradient-studio']) {
      assert.equal(auditSiteData(resolveGoalSelection(goalId).content).errors.length, 0)
    }
    assert.ok(auditSiteData(resolveGoalSelection('blank').content).errors.length > 0)
  })

  it('adds unavailable public assets to the asynchronous report', async () => {
    const originalFetch = globalThis.fetch
    const data = baseData()
    data.SITE.portrait = '/missing-portrait.jpg'
    globalThis.fetch = async url =>
      new Response(null, { status: String(url).includes('missing-portrait') ? 404 : 200 })

    try {
      const report = await runSiteAudit(data)
      assert.ok(
        report.errors.some(
          entry => entry.code === 'missing-public-asset' && entry.path === 'SITE.portrait',
        ),
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
