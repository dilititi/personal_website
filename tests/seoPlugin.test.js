import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { describe, it } from 'vitest'
import {
  buildDiscoveryFiles,
  prerenderArtifactCleanupPlugin,
  renderSeoHead,
} from '../vite.config.js'

const site = {
  url: 'https://example.com/',
  name: { en: 'Example', zh: '示例' },
  tagline: { en: 'A *quiet* portfolio.', zh: '一个*安静*的作品集。' },
  portrait: '/picture/portrait.jpg',
}

describe('SEO build plugin helpers', () => {
  it('renders static Open Graph and Twitter metadata from SITE', () => {
    const head = renderSeoHead(site, 'en')

    assert.match(head.title, /Example/)
    assert.match(head.tags, /property="og:title"/)
    assert.match(head.tags, /name="twitter:card"/)
    assert.match(head.tags, /rel="canonical" href="https:\/\/example\.com"/)
    assert.doesNotMatch(head.tags, /undefined/)
  })

  it('derives robots and sitemap from the canonical root', () => {
    const output = buildDiscoveryFiles(site)

    assert.match(output.robots, /Sitemap: https:\/\/example\.com\/sitemap\.xml/)
    assert.match(output.sitemap, /<loc>https:\/\/example\.com\/<\/loc>/)
    assert.match(output.sitemap, /<loc>https:\/\/example\.com\/en\/<\/loc>/)
    assert.match(output.sitemap, /<loc>https:\/\/example\.com\/zh\/<\/loc>/)
  })

  it('keeps empty-url discovery output valid without fake absolute URLs', () => {
    const output = buildDiscoveryFiles({ ...site, url: '' })
    const head = renderSeoHead({ ...site, url: '' }, 'en')

    assert.doesNotMatch(output.robots, /Sitemap:/)
    assert.doesNotMatch(output.sitemap, /<loc>/)
    assert.doesNotMatch(head.tags, /rel="canonical"/)
    assert.doesNotMatch(head.tags, /property="og:url"/)
    assert.doesNotMatch(`${output.robots}${output.sitemap}${head.tags}`, /undefined/)
  })

  it('removes prerender-only chunks while retaining browser-reachable lazy chunks', () => {
    // Build OS-absolute facadeModuleIds the way vite/rollup does, so the
    // plugin's resolve(prerenderScript) match works on Windows AND POSIX. A
    // hardcoded 'C:/...' literal is absolute on Windows but RELATIVE on Linux,
    // where resolve() prepends the cwd and the entry match silently fails.
    const srcDir = resolve('src')
    const prerenderPath = resolve(srcDir, 'prerender.jsx')
    const bundle = {
      'prerender.js': {
        type: 'chunk',
        facadeModuleId: prerenderPath,
        imports: ['App.js', 'server.edge.js'],
        dynamicImports: [],
      },
      'main.js': {
        type: 'chunk',
        facadeModuleId: resolve(srcDir, 'main.jsx'),
        imports: ['App.js'],
        dynamicImports: [],
      },
      'App.js': {
        type: 'chunk',
        facadeModuleId: resolve(srcDir, 'App.jsx'),
        imports: [],
        dynamicImports: ['Editor.js'],
      },
      'Editor.js': {
        type: 'chunk',
        facadeModuleId: resolve(srcDir, 'components/ContentEditor.jsx'),
        imports: [],
        dynamicImports: [],
      },
      'server.edge.js': {
        type: 'chunk',
        facadeModuleId: 'react-dom/server.edge',
        imports: [],
        dynamicImports: [],
      },
    }

    prerenderArtifactCleanupPlugin(prerenderPath).generateBundle({}, bundle)

    assert.deepEqual(Object.keys(bundle).sort(), ['App.js', 'Editor.js', 'main.js'])
  })
})
