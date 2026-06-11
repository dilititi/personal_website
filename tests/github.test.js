import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
  base64ToUtf8,
  containsGitHubToken,
  createGitHubClient,
  dataUrlBase64,
  utf8ToBase64,
} from '../src/lib/github.js'

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GitHub REST client', () => {
  it('round-trips UTF-8 content and extracts data URL payloads', () => {
    const source = "陈安 · it's quiet"
    assert.equal(base64ToUtf8(utf8ToBase64(source)), source)
    assert.deepEqual(dataUrlBase64('data:image/png;base64,YWJj'), {
      mimeType: 'image/png',
      content: 'YWJj',
    })
  })

  it('constructs authenticated content requests and UTF-8 PUT bodies', async () => {
    const calls = []
    const client = createGitHubClient({
      token: 'test-token',
      owner: 'owner',
      repo: 'site',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, options })
        if (options.method === 'PUT') {
          return jsonResponse({ commit: { html_url: 'https://github.test/commit/1' }, content: {} })
        }
        return jsonResponse({
          type: 'file',
          path: 'src/data.js',
          sha: 'abc',
          encoding: 'base64',
          content: utf8ToBase64('export const SITE = {}'),
          html_url: 'https://github.test/file',
        })
      },
    })

    const result = await client.updateFile({
      path: 'src/data.js',
      branch: 'main',
      message: 'content: update via editor',
      transform: () => 'export const SITE = { name: "陈" }',
    })

    assert.equal(result.unchanged, false)
    assert.match(calls[0].url, /contents\/src\/data\.js\?ref=main$/)
    assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token')
    const putBody = JSON.parse(calls[1].options.body)
    assert.equal(base64ToUtf8(putBody.content), 'export const SITE = { name: "陈" }')
    assert.equal(putBody.sha, 'abc')
    assert.equal(putBody.branch, 'main')
  })

  it('requires file transforms to return source text', async () => {
    const client = createGitHubClient({
      token: 'test-token',
      owner: 'owner',
      repo: 'site',
      fetchImpl: async () =>
        jsonResponse({
          type: 'file',
          path: 'src/data.js',
          sha: 'abc',
          encoding: 'base64',
          content: utf8ToBase64('export const SITE = {}'),
        }),
    })

    await assert.rejects(
      () =>
        client.updateFile({
          path: 'src/data.js',
          transform: () => ({ source: 'not text' }),
        }),
      /must return a string/,
    )
  })

  it('refetches the SHA and retries once after a 409 conflict', async () => {
    let getCount = 0
    let putCount = 0
    const client = createGitHubClient({
      token: 'test-token',
      owner: 'owner',
      repo: 'site',
      fetchImpl: async (_url, options = {}) => {
        if (options.method === 'PUT') {
          putCount += 1
          if (putCount === 1) return jsonResponse({ message: 'conflict' }, 409)
          return jsonResponse({ commit: { html_url: 'https://github.test/commit/2' }, content: {} })
        }
        getCount += 1
        return jsonResponse({
          type: 'file',
          path: 'src/data.js',
          sha: `sha-${getCount}`,
          encoding: 'base64',
          content: utf8ToBase64(`source-${getCount}`),
        })
      },
    })

    const result = await client.updateFile({
      path: 'src/data.js',
      branch: 'main',
      message: 'update',
      transform: source => `${source}-changed`,
    })

    assert.equal(result.unchanged, false)
    assert.equal(getCount, 2)
    assert.equal(putCount, 2)
  })

  it('blocks common GitHub token formats from generated source', () => {
    assert.equal(containsGitHubToken('const value = "github_pat_secret_123"'), true)
    assert.equal(containsGitHubToken('const value = "ghp_1234567890"'), true)
    assert.equal(containsGitHubToken('safe source', 'exact-secret'), false)
    assert.equal(containsGitHubToken('contains exact-secret', 'exact-secret'), true)
  })

  it('refuses to PUT transformed source containing the active token', async () => {
    let putCount = 0
    const client = createGitHubClient({
      token: 'exact-secret',
      owner: 'owner',
      repo: 'site',
      fetchImpl: async (_url, options = {}) => {
        if (options.method === 'PUT') putCount += 1
        return jsonResponse({
          type: 'file',
          path: 'src/data.js',
          sha: 'abc',
          encoding: 'base64',
          content: utf8ToBase64('export const SITE = {}'),
        })
      },
    })

    await assert.rejects(
      () =>
        client.updateFile({
          path: 'src/data.js',
          transform: source => `${source}\n// exact-secret`,
        }),
      /Refusing to publish/,
    )
    assert.equal(putCount, 0)
  })

  it('requires an explicit push permission when validating a repository', async () => {
    const responses = [
      {
        full_name: 'owner/site',
        default_branch: 'main',
        private: false,
        permissions: { push: false },
        html_url: 'https://github.test/owner/site',
      },
      { name: 'main' },
    ]
    const client = createGitHubClient({
      token: 'test-token',
      owner: 'owner',
      repo: 'site',
      fetchImpl: async () => jsonResponse(responses.shift()),
    })

    assert.equal((await client.validateRepository('main')).canPush, false)
  })

  it('creates a missing asset and retries an asset conflict once', async () => {
    let metadataCount = 0
    let putCount = 0
    const client = createGitHubClient({
      token: 'test-token',
      owner: 'owner',
      repo: 'site',
      fetchImpl: async (_url, options = {}) => {
        if (options.method === 'PUT') {
          putCount += 1
          if (putCount === 1) return jsonResponse({ message: 'conflict' }, 409)
          return jsonResponse({
            commit: { html_url: 'https://github.test/commit/asset' },
            content: {},
          })
        }
        metadataCount += 1
        if (metadataCount === 1) return jsonResponse({ message: 'not found' }, 404)
        return jsonResponse({ type: 'file', sha: 'new-sha' })
      },
    })

    const result = await client.upsertBase64File({
      path: 'public/picture/test.jpg',
      base64Content: 'YWJj',
      branch: 'main',
      message: 'asset upload',
    })

    assert.equal(result.commit.html_url, 'https://github.test/commit/asset')
    assert.equal(metadataCount, 2)
    assert.equal(putCount, 2)
  })

  it('preserves an explicitly empty base64 asset payload', async () => {
    let putBody
    const client = createGitHubClient({
      token: 'test-token',
      owner: 'owner',
      repo: 'site',
      fetchImpl: async (_url, options = {}) => {
        if (options.method === 'PUT') {
          putBody = JSON.parse(options.body)
          return jsonResponse({ commit: {}, content: {} })
        }
        return jsonResponse({ message: 'not found' }, 404)
      },
    })

    await client.upsertBase64File({
      path: 'public/empty.bin',
      base64Content: '',
      message: 'asset: add empty fixture',
    })

    assert.equal(putBody.content, '')
  })
})
