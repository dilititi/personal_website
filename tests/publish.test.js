import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'vitest'
import * as dataExports from '../src/data.js'
import { exportLine } from '../src/components/editor/export.js'
import { createSectionRegistry } from '../src/lib/section-registry.js'
import {
  buildContentSource,
  buildStyleSource,
  CONTENT_END,
  CONTENT_START,
  publishContent,
  STYLE_END,
  STYLE_START,
  validateContentPublication,
} from '../src/lib/publish.js'
import { base64ToUtf8, createGitHubClient, utf8ToBase64 } from '../src/lib/github.js'

describe('sentinel publishing', () => {
  it('replaces only the selected content export and preserves everything else', async () => {
    const source = await readFile(new URL('../src/data.js', import.meta.url), 'utf8')
    const nextSite = { name: { en: 'Published', zh: '已发布' } }
    const next = buildContentSource(source, { SITE: nextSite }, ['SITE'])

    const start = source.indexOf(CONTENT_START)
    const end = source.indexOf(CONTENT_END)
    const nextStart = next.indexOf(CONTENT_START)
    const nextEnd = next.indexOf(CONTENT_END)
    assert.equal(next.slice(0, nextStart), source.slice(0, start))
    assert.equal(next.slice(nextEnd + CONTENT_END.length), source.slice(end + CONTENT_END.length))
    assert.match(next, /export const SITE = \{\r?\n {2}name: L\('Published', '已发布'\)\r?\n\}/)
    assert.equal(
      next.match(/export const NAV = \[[\s\S]*?(?=\nexport const ABOUT)/)?.[0],
      source.match(/export const NAV = \[[\s\S]*?(?=\nexport const ABOUT)/)?.[0],
    )
  })

  it('preserves comments and whitespace after the changed declaration', () => {
    const source = `${CONTENT_START}
export const SITE = {
  name: 'Before',
}

// Keep this section note.
export const NAV = []
${CONTENT_END}`
    const next = buildContentSource(source, { SITE: { name: 'After' } }, ['SITE'])

    assert.match(next, /name: 'After'/)
    assert.match(next, /\n\n\/\/ Keep this section note\.\nexport const NAV = \[\]/)
  })

  it('replaces only DEFAULT_STYLE inside style markers', async () => {
    const source = await readFile(new URL('../src/style.js', import.meta.url), 'utf8')
    const generated = exportLine('DEFAULT_STYLE', { version: 1, preset: 'published' })
    const next = buildStyleSource(source, generated)

    assert.match(next, /preset: 'published'/)
    assert.equal(next.slice(next.indexOf(STYLE_END)), source.slice(source.indexOf(STYLE_END)))
    assert.equal(
      next.slice(0, next.indexOf(STYLE_START)),
      source.slice(0, source.indexOf(STYLE_START)),
    )
  })

  it('refuses a large inline data URL before making network checks', async () => {
    const data = {
      ...createSectionRegistry(dataExports),
      WORKS: [{ coverImg: `data:image/png;base64,${'a'.repeat(160_000)}` }],
    }
    await assert.rejects(() => validateContentPublication(data, {}, 'main'), /embedded data URL/)
  })

  it('blocks unresolved starter placeholders before GitHub publication', async () => {
    const data = {
      ...createSectionRegistry(dataExports),
      SITE: {
        ...dataExports.SITE,
        name: { en: '<Your name>', zh: '<你的名字>' },
      },
    }

    await assert.rejects(
      () => validateContentPublication(data, {}, 'main'),
      /SITE\.name\.en: Replace the unresolved/,
    )
  })

  it('rejects missing or duplicate markers', () => {
    assert.throws(
      () => buildContentSource('export const SITE = {}', { SITE: {} }, ['SITE']),
      /Missing or invalid editor markers/,
    )
    assert.throws(
      () =>
        buildContentSource(
          `${CONTENT_START}\n${CONTENT_START}\nexport const SITE = {}\n${CONTENT_END}`,
          { SITE: {} },
          ['SITE'],
        ),
      /Duplicate editor marker/,
    )
  })

  it('strips query strings before checking a missing asset in GitHub', async () => {
    const originalFetch = globalThis.fetch
    const checkedPaths = []
    globalThis.fetch = async () => new Response(null, { status: 404 })
    try {
      const data = {
        ...createSectionRegistry(dataExports),
        SITE: {
          ...dataExports.SITE,
          ogImage: '/og-cover.jpg?v=2#share',
        },
      }
      await validateContentPublication(
        data,
        {
          getFileMetadata: async path => {
            checkedPaths.push(path)
            return { path }
          },
        },
        'main',
      )
    } finally {
      globalThis.fetch = originalFetch
    }

    assert(checkedPaths.includes('public/og-cover.jpg'))
    assert.equal(
      checkedPaths.some(path => path.includes('?') || path.includes('#')),
      false,
    )
  })

  it('accepts repository asset metadata without inline file content', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => new Response(null, { status: 404 })
    try {
      const data = {
        ...createSectionRegistry(dataExports),
        NOW_PLAYING: {
          ...dataExports.NOW_PLAYING,
          html5: [{ track: 'Large local file', artist: 'Test', audio: '/audio/large.mp3' }],
        },
      }
      await validateContentPublication(
        data,
        {
          getFileMetadata: async path => ({
            type: 'file',
            path,
            sha: 'asset-sha',
            size: 4_000_000,
          }),
        },
        'main',
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('reports only GitHub 404 responses as missing assets', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => new Response(null, { status: 404 })
    const data = {
      ...createSectionRegistry(dataExports),
      SITE: {
        ...dataExports.SITE,
        ogImage: '/missing-share.jpg',
      },
    }
    try {
      await assert.rejects(
        () =>
          validateContentPublication(
            data,
            {
              getFileMetadata: async () => {
                throw Object.assign(new Error('GitHub API rate limited'), { status: 403 })
              },
            },
            'main',
          ),
        /rate limited/,
      )
      await assert.rejects(
        () =>
          validateContentPublication(
            data,
            {
              getFileMetadata: async () => {
                throw Object.assign(new Error('Not Found'), { status: 404 })
              },
            },
            'main',
          ),
        /Missing public asset/,
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('runs validation, sentinel replacement, and GitHub PUT as one content publish flow', async () => {
    const source = await readFile(new URL('../src/data.js', import.meta.url), 'utf8')
    const originalFetch = globalThis.fetch
    let putBody
    globalThis.fetch = async () => new Response(null, { status: 200 })
    const github = createGitHubClient({
      token: 'test-token',
      owner: 'owner',
      repo: 'site',
      fetchImpl: async (_url, options = {}) => {
        if (options.method === 'PUT') {
          putBody = JSON.parse(options.body)
          return new Response(
            JSON.stringify({
              commit: { html_url: 'https://github.test/commit/content' },
              content: {},
            }),
            { status: 200 },
          )
        }
        return new Response(
          JSON.stringify({
            type: 'file',
            path: 'src/data.js',
            sha: 'source-sha',
            encoding: 'base64',
            content: utf8ToBase64(source),
          }),
          { status: 200 },
        )
      },
    })
    const data = {
      ...createSectionRegistry(dataExports),
      SITE: {
        ...dataExports.SITE,
        name: { en: 'Published through GitHub', zh: '通过 GitHub 发布' },
      },
    }

    try {
      const result = await publishContent({
        github,
        branch: 'main',
        data,
        changedKeys: ['SITE'],
      })
      const publishedSource = base64ToUtf8(putBody.content)
      assert.equal(result.commit.html_url, 'https://github.test/commit/content')
      assert.equal(putBody.sha, 'source-sha')
      assert.equal(putBody.branch, 'main')
      assert.match(publishedSource, /Published through GitHub/)
      assert.equal(
        publishedSource.slice(publishedSource.indexOf(CONTENT_END)),
        source.slice(source.indexOf(CONTENT_END)),
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
