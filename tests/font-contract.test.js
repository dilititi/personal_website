import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const baseCss = readFileSync(new URL('../src/styles/base.css', import.meta.url), 'utf8')
const styleEngine = readFileSync(new URL('../src/style-engine.js', import.meta.url), 'utf8')

describe('font loading contract', () => {
  it('loads one slim Google Fonts stylesheet through preload with a no-script fallback', () => {
    expect(indexHtml).toContain('rel="preload"')
    expect(indexHtml).toContain('as="style"')
    expect(indexHtml).toMatch(
      /onload="[\s\S]*this\.onload\s*=\s*null[\s\S]*this\.rel\s*=\s*'stylesheet'/,
    )
    expect(indexHtml).toContain('<noscript>')
    expect(baseCss).not.toContain('fonts.googleapis.com')
    expect(indexHtml).not.toContain('wght@300')
    expect(indexHtml).not.toContain('0,600')
    expect(indexHtml).not.toContain('0,700')
  })

  it('defines metric-adjusted local fallbacks used by base and derived stacks', () => {
    ;[
      'Lora Fallback',
      'Manrope Fallback',
      'IBM Plex Mono Fallback',
      'Noto Serif SC Fallback',
      'Noto Sans SC Fallback',
    ].forEach(name => {
      expect(baseCss).toContain(`font-family: '${name}'`)
      expect(styleEngine).toContain(name)
    })
    expect(baseCss).toContain('size-adjust:')
    expect(baseCss).toContain('ascent-override:')
    expect(baseCss).toContain('descent-override:')
    expect(baseCss).toContain('line-gap-override:')
  })
})
