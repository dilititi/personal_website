import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readSource = path => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('initial scroll guard', () => {
  it('starts before fonts and the application module', () => {
    const html = readSource('../index.html')
    const guard = html.indexOf('window.__CHEN_INITIAL_SCROLL__')
    const fonts = html.indexOf('fonts.googleapis.com')
    const application = html.indexOf('/src/main.jsx')

    expect(guard).toBeGreaterThan(-1)
    expect(guard).toBeLessThan(fonts)
    expect(guard).toBeLessThan(application)
    expect(html).toContain("window.history.scrollRestoration = 'manual'")
    expect(html).toContain("window.addEventListener('scroll', reset")
  })

  it('waits for application, page, fonts, and a minimum guard window', () => {
    const main = readSource('../src/main.jsx')
    const app = readSource('../src/App.jsx')

    expect(main).toContain('const INITIAL_SCROLL_MIN_MS = 2500')
    expect(main).toContain('const INITIAL_SCROLL_SETTLE_MS = 2000')
    expect(main).toContain("waitForEvent(window, 'chen:app-ready')")
    expect(main).toContain("waitForEvent(window, 'load')")
    expect(main).toContain('document.fonts?.ready')
    expect(app).toContain("window.dispatchEvent(new Event('chen:app-ready'))")
  })
})
