import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
  cacheDirectives,
  deploymentCommitMatches,
  htmlMustRevalidate,
  linkHref,
  metaContent,
} from '../scripts/check-deploy.mjs'

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

  it('accepts browser revalidation without confusing s-maxage for max-age', () => {
    assert.equal(htmlMustRevalidate('no-cache'), true)
    assert.equal(htmlMustRevalidate('public, max-age=0, s-maxage=300'), true)
    assert.equal(htmlMustRevalidate('public, s-maxage=0, max-age=300'), false)
    assert.equal(cacheDirectives('public, max-age=0').get('max-age'), '0')
  })

  it('matches full and abbreviated deployed commit identifiers', () => {
    const commit = 'abcdef1234567890abcdef1234567890abcdef12'

    assert.equal(deploymentCommitMatches(commit, commit), true)
    assert.equal(deploymentCommitMatches(commit, 'abcdef1'), true)
    assert.equal(deploymentCommitMatches('', 'abcdef1'), false)
    assert.equal(deploymentCommitMatches(commit, '1234567'), false)
  })
})
