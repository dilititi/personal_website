import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readSource = path => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('accessibility contracts', () => {
  it('keeps the visitor content inside one main landmark', () => {
    const app = readSource('../src/App.jsx')

    expect(app).toContain('<main id="main-content">')
    expect(app.match(/<main\b/g)).toHaveLength(1)
  })

  it('does not use headings for small metadata labels', () => {
    const sources = [
      readSource('../src/components/About.jsx'),
      readSource('../src/components/Contact.jsx'),
      readSource('../src/components/Library.jsx'),
      readSource('../src/components/Travel.jsx'),
    ].join('\n')

    for (const className of [
      'stat-label',
      'contact-status-label',
      'book-cover-title',
      'atlas-list-label',
    ]) {
      expect(sources).toContain(`<div className="${className}"`)
      expect(sources).not.toMatch(new RegExp(`<h[1-6][^>]+className="${className}"`))
    }
  })

  it('keeps visible content headings in sequence', () => {
    const about = readSource('../src/components/About.jsx')
    const colophon = readSource('../src/components/Colophon.jsx')

    expect(about).toContain('<h3>{b.title}</h3>')
    expect(about).toContain('<h4>{emph(t(e.title))}</h4>')
    expect(colophon).not.toMatch(/<h6/)
    expect(colophon.match(/<h2 className="colophon-heading"/g)).toHaveLength(4)
  })

  it('preserves 44px touch targets for compact visitor controls', () => {
    const css = [
      readSource('../src/styles/sections.css'),
      readSource('../src/styles/motion.css'),
    ].join('\n')

    for (const selector of ['.cf-action', '.np-pill-expand', '.mobile-disclosure-toggle']) {
      const rule = css.match(new RegExp(`\\${selector}\\s*\\{[^}]+\\}`, 's'))?.[0] || ''
      expect(rule).toContain('min-height: 44px')
    }

    const atlasPin = css.match(/\.atlas-pin\s*\{[^}]+\}/s)?.[0] || ''
    expect(atlasPin).toContain('width: 32px')
    expect(atlasPin).toContain('height: 32px')
  })

  it('keeps progressive mobile disclosures explicitly accessible', () => {
    const disclosure = readSource('../src/components/MobileDisclosure.jsx')

    expect(disclosure).toContain('aria-controls={contentId}')
    expect(disclosure).toContain('aria-expanded={expanded}')
    expect(disclosure).toContain('type="button"')
  })
})
