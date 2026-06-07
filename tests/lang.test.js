import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { resolveInitialLang } from '../src/lang.jsx'

describe('language initialization', () => {
  it('uses an explicit language route before stored or injected defaults', () => {
    assert.equal(
      resolveInitialLang({
        pathname: '/zh/',
        initialLang: 'en',
        stored: 'en',
        prerendered: true,
      }),
      'zh',
    )
  })

  it('keeps the prerendered first frame aligned with its injected language', () => {
    assert.equal(
      resolveInitialLang({
        pathname: '/',
        initialLang: 'zh',
        stored: 'en',
        prerendered: true,
      }),
      'zh',
    )
  })

  it('restores the saved preference for a client-only root render', () => {
    assert.equal(
      resolveInitialLang({
        pathname: '/',
        initialLang: 'en',
        stored: 'zh',
        prerendered: false,
      }),
      'zh',
    )
  })
})
