import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { linkHref, metaContent } from '../scripts/check-deploy.mjs'

describe('deployment checker parsers', () => {
  const head = `
    <meta content="A quiet portfolio" property="og:title">
    <meta property="og:image" content="https://example.com/og-cover.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <link href="https://example.com/" rel="canonical">
    <link rel="alternate" href="https://example.com/en/" hreflang="en">
  `

  it('reads metadata regardless of attribute order', () => {
    assert.equal(metaContent(head, 'property', 'og:title'), 'A quiet portfolio')
    assert.equal(metaContent(head, 'property', 'og:image'), 'https://example.com/og-cover.jpg')
  })

  it('reads canonical and language links regardless of attribute order', () => {
    assert.equal(linkHref(head, 'canonical'), 'https://example.com/')
    assert.equal(linkHref(head, 'alternate', 'hreflang', 'en'), 'https://example.com/en/')
  })
})
