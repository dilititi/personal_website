import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'vitest'
import {
  DEFAULT_PUBLISH_CONFIG,
  GITHUB_CONFIG_KEY,
  GITHUB_TOKEN_KEY,
  clearGitHubToken,
  isGitHubTokenRemembered,
  normalizePublishConfig,
  readGitHubToken,
  readPublishConfig,
  saveGitHubToken,
  savePublishConfig,
  validatePublishConfig,
} from '../src/lib/publish-config.js'

function createStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }
}

function installWindow() {
  const localStorage = createStorage()
  const sessionStorage = createStorage()
  globalThis.window = { localStorage, sessionStorage }
  return { localStorage, sessionStorage }
}

afterEach(() => {
  delete globalThis.window
})

describe('publish configuration storage', () => {
  it('normalizes and validates repository coordinates', () => {
    assert.deepEqual(
      normalizePublishConfig({ owner: ' alice ', repo: ' site ', branch: ' dev ' }),
      {
        owner: 'alice',
        repo: 'site',
        branch: 'dev',
      },
    )
    assert.equal(validatePublishConfig({ owner: 'bad/name' }), 'Invalid GitHub owner')
    for (const branch of ['bad..branch', '/leading', 'trailing/', 'feature/@{bad}', 'bad.lock']) {
      assert.equal(
        validatePublishConfig({ owner: 'alice', repo: 'site', branch }),
        'Invalid Git branch',
      )
    }
  })

  it('stores tokens in sessionStorage by default and localStorage only when requested', () => {
    const { localStorage, sessionStorage } = installWindow()

    saveGitHubToken('session-secret')
    assert.equal(sessionStorage.getItem(GITHUB_TOKEN_KEY), 'session-secret')
    assert.equal(localStorage.getItem(GITHUB_TOKEN_KEY), null)
    assert.equal(isGitHubTokenRemembered(), false)

    saveGitHubToken('remembered-secret', { remember: true })
    assert.equal(sessionStorage.getItem(GITHUB_TOKEN_KEY), null)
    assert.equal(localStorage.getItem(GITHUB_TOKEN_KEY), 'remembered-secret')
    assert.equal(readGitHubToken(), 'remembered-secret')
    assert.equal(isGitHubTokenRemembered(), true)

    clearGitHubToken()
    assert.equal(readGitHubToken(), '')
  })

  it('persists repository config and safely falls back when storage access throws', () => {
    const { localStorage } = installWindow()
    const saved = savePublishConfig({ owner: 'alice', repo: 'portfolio', branch: 'content' })
    assert.deepEqual(readPublishConfig(), saved)
    assert.match(localStorage.getItem(GITHUB_CONFIG_KEY), /portfolio/)

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        get localStorage() {
          throw new DOMException('blocked', 'SecurityError')
        },
        get sessionStorage() {
          throw new DOMException('blocked', 'SecurityError')
        },
      },
    })
    assert.deepEqual(readPublishConfig(), DEFAULT_PUBLISH_CONFIG)
    assert.equal(readGitHubToken(), '')
    assert.equal(saveGitHubToken('memory-only'), 'memory-only')
    assert.deepEqual(savePublishConfig({ owner: 'alice', repo: 'site', branch: 'main' }), {
      owner: 'alice',
      repo: 'site',
      branch: 'main',
    })
  })
})
