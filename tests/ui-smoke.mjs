import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(import.meta.dirname, '..')
const PREVIEW_MODE = process.argv.includes('--preview')
const CONTENT_KEY = 'chen.content.overrides'
const CONTENT_SAVED_KEY = 'chen.content.lastSaved'
const STYLE_KEY = 'chen.style.overrides'
const STYLE_SAVED_KEY = 'chen.style.lastSaved'
const MOBILE_DISCLOSURE_KEY = 'chen.ui.mobileDisclosures'
const LEGACY_READING_KEY = 'chen.readingLog.userEntries'
const LEGACY_PHOTO_KEY = 'chen.photos.userEntries'

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  return candidates.find(existsSync) || ''
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => resolve(address.port))
    })
  })
}

async function waitFor(check, label, timeout = 15000) {
  const started = Date.now()
  let lastError
  while (Date.now() - started < timeout) {
    try {
      const result = await check()
      if (result) return result
    } catch (error) {
      lastError = error
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ''}`)
}

class CdpClient {
  constructor(url) {
    this.url = url
    this.nextId = 1
    this.pending = new Map()
    this.handlers = new Map()
  }

  async connect() {
    assert.equal(
      typeof WebSocket,
      'function',
      'WebSocket is unavailable. Run the script through npm run test:ui.',
    )
    this.socket = new WebSocket(this.url)
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(String(event.data))
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error)
          pending.reject(new Error(`${message.error.message} (${message.error.code})`))
        else pending.resolve(message.result)
        return
      }
      const handlers = this.handlers.get(message.method) || []
      handlers.forEach(handler => handler(message.params || {}))
    })
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) || []
    handlers.push(handler)
    this.handlers.set(method, handlers)
  }

  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.socket?.close()
  }
}

async function run() {
  const browserPath = findBrowser()
  assert(browserPath, 'Chrome or Edge was not found. Set CHROME_PATH to run the UI tests.')

  const serverPort = await freePort()
  const debugPort = await freePort()
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'miles-ui-'))
  const profileDir = path.join(tempRoot, 'profile')
  const downloadDir = path.join(tempRoot, 'downloads')
  const viteCli = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  let server
  let browser
  let cdp

  try {
    const serverArgs = PREVIEW_MODE
      ? [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(serverPort), '--strictPort']
      : [viteCli, '--host', '127.0.0.1', '--port', String(serverPort), '--strictPort']
    server = spawn(process.execPath, serverArgs, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    let serverOutput = ''
    server.stdout.on('data', chunk => {
      serverOutput += chunk
    })
    server.stderr.on('data', chunk => {
      serverOutput += chunk
    })
    await waitFor(
      async () => {
        if (server.exitCode != null) throw new Error(`Vite exited early:\n${serverOutput}`)
        const response = await fetch(`http://127.0.0.1:${serverPort}/`)
        return response.ok
      },
      PREVIEW_MODE ? 'Vite preview server' : 'Vite dev server',
    )

    if (PREVIEW_MODE) {
      const [rootHtml, enHtml, zhHtml] = await Promise.all(
        ['/', '/en/', '/zh/'].map(async route => {
          const response = await fetch(`http://127.0.0.1:${serverPort}${route}`)
          assert(response.ok, `Preview route ${route} must return 200.`)
          return response.text()
        }),
      )
      ;[
        ['/', rootHtml, /<html lang="en">/, /class="landing landing-template landing-minimal"/],
        ['/en/', enHtml, /<html lang="en">/, /id="about"/],
        ['/zh/', zhHtml, /<html lang="zh">/, /id="about"/],
      ].forEach(([route, html, languagePattern, bodyPattern]) => {
        assert.match(html, languagePattern, `${route} must contain its static language.`)
        assert.match(html, bodyPattern, `${route} must contain prerendered body copy.`)
        assert.match(
          html,
          /<meta name="build-commit" content="[0-9a-f]{40}">/,
          `${route} must expose the build commit marker.`,
        )
        assert.doesNotMatch(html, /undefined/, `${route} must not emit undefined values.`)
      })
    }

    browser = spawn(
      browserPath,
      [
        '--headless=new',
        '--disable-gpu',
        '--disable-extensions',
        '--no-first-run',
        '--no-default-browser-check',
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${profileDir}`,
        `http://127.0.0.1:${serverPort}/`,
      ],
      {
        stdio: 'ignore',
        windowsHide: true,
      },
    )

    const pageTarget = await waitFor(async () => {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
      const targets = await response.json()
      return targets.find(
        target => target.type === 'page' && target.url.includes(`127.0.0.1:${serverPort}`),
      )
    }, 'browser page target')

    cdp = new CdpClient(pageTarget.webSocketDebuggerUrl)
    await cdp.connect()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir })
    cdp.on('Page.javascriptDialogOpening', () => {
      cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {})
    })

    const evaluate = async expression => {
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      })
      if (result.exceptionDetails) {
        throw new Error(
          result.exceptionDetails.exception?.description || result.exceptionDetails.text,
        )
      }
      return result.result?.value
    }

    const waitForExpression = (expression, label, timeout) =>
      waitFor(async () => Boolean(await evaluate(expression)), label, timeout)

    const click = async (selector, text = '') => {
      const clicked = await evaluate(`(() => {
        const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})]
        const node = nodes.find((item) => !${JSON.stringify(text)} || item.textContent.includes(${JSON.stringify(text)}))
        if (!node || node.disabled) return false
        node.click()
        return true
      })()`)
      assert(clicked, `Could not click ${selector}${text ? ` containing "${text}"` : ''}`)
    }

    const pressKey = async key => {
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key })
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key })
    }

    const setValue = async (selector, value, index = 0) => {
      const changed = await evaluate(`(() => {
        const node = document.querySelectorAll(${JSON.stringify(selector)})[${index}]
        if (!node) return false
        const proto = node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, ${JSON.stringify(value)})
        node.dispatchEvent(new Event('input', { bubbles: true }))
        node.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      })()`)
      assert(changed, `Could not change ${selector}[${index}]`)
    }

    const waitForDownload = filename =>
      waitFor(
        async () => {
          const files = await readdir(downloadDir).catch(() => [])
          return files.includes(filename)
        },
        `download ${filename}`,
        20000,
      )

    await waitForExpression(
      `document.readyState === 'complete' && !!document.querySelector('[title="Content editor"]')`,
      'application shell',
      30000,
    )
    if (PREVIEW_MODE) {
      assert.deepEqual(
        await evaluate(`window.__CHEN_HYDRATION_ERRORS__ || []`),
        [],
        'Root prerender must hydrate without recoverable errors.',
      )
    }

    await evaluate(`(() => {
      localStorage.clear()
      localStorage.setItem(${JSON.stringify(LEGACY_READING_KEY)}, JSON.stringify([{
        id: 'legacy-reading',
        date: '2025.01',
        title: { en: 'Legacy reading', zh: '旧阅读' },
        author: 'Archive',
        status: 'finished',
        rating: 4,
        note: { en: 'Migrated entry', zh: '迁移条目' }
      }]))
      localStorage.setItem(${JSON.stringify(LEGACY_PHOTO_KEY)}, JSON.stringify([{
        id: 'legacy-photo',
        img: '/photos/legacy.jpg',
        series: 'street',
        title: { en: 'Legacy photo', zh: '旧照片' },
        location: { en: 'Archive', zh: '档案' },
        year: '2025'
      }]))
      location.reload()
    })()`)
    await waitForExpression(
      `document.readyState === 'complete' && !!document.querySelector('.collection-tab')`,
      'application shell with legacy data',
    )
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}').PHOTOS?.some((item) => item.id === 'legacy-photo')`,
      'legacy photo migration',
      5000,
    )
    await click('.collection-tab:nth-child(4)')
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}').USER_READING_LOG?.some((item) => item.id === 'legacy-reading')`,
      'legacy reading migration',
      5000,
    )
    await waitForExpression(
      `!localStorage.getItem(${JSON.stringify(LEGACY_READING_KEY)}) && !localStorage.getItem(${JSON.stringify(LEGACY_PHOTO_KEY)})`,
      'legacy key cleanup',
      5000,
    )

    await evaluate(`localStorage.clear(); location.reload()`)
    await waitForExpression(
      `document.readyState === 'complete' && !!document.querySelector('[title="Content editor"]')`,
      'clean application shell',
    )
    assert(
      await evaluate(`(() => {
        const description = document.querySelector('meta[name="description"]')?.content || ''
        return document.title.includes('CHEN')
          && description.length > 20
          && !description.includes('*')
          && document.querySelectorAll('meta[name="description"]').length === 1
          && document.querySelectorAll('meta[property="og:title"]').length === 1
          && document.querySelectorAll('meta[name="twitter:card"]').length === 1
      })()`),
      'Default runtime SEO metadata must be populated once from SITE.',
    )
    assert(
      await evaluate(`(() => {
        const motif = document.querySelector('.theme-motif-layer')
        return document.body.dataset.motif === 'film'
          && motif?.classList.contains('motif-film')
          && getComputedStyle(motif).pointerEvents === 'none'
      })()`),
      'The default theme motif must render without intercepting page interaction.',
    )
    const englishTitle = await evaluate(`document.title`)
    await click('.lang-toggle button', '中')
    await waitForExpression(`document.documentElement.lang === 'zh'`, 'Chinese document language')
    if (PREVIEW_MODE) {
      await waitForExpression(
        `location.pathname === '/zh/' && document.readyState === 'complete'`,
        'Chinese prerendered route',
      )
      assert.deepEqual(
        await evaluate(`window.__CHEN_HYDRATION_ERRORS__ || []`),
        [],
        'Chinese prerender must hydrate without recoverable errors.',
      )
    }
    await waitForExpression(
      `document.title !== ${JSON.stringify(englishTitle)}`,
      'localized document title',
    )
    assert(
      await evaluate(`(() => {
        const description = document.querySelector('meta[name="description"]')?.content || ''
        return description.includes('电影')
          && document.querySelectorAll('meta[name="description"]').length === 1
          && document.querySelectorAll('meta[property="og:title"]').length === 1
          && document.querySelectorAll('meta[property="og:locale"]').length === 1
      })()`),
      'Language switching must update SEO metadata without duplicating tags.',
    )
    await click('.lang-toggle button', 'EN')
    await waitForExpression(`document.documentElement.lang === 'en'`, 'English document language')
    if (PREVIEW_MODE) {
      await waitForExpression(
        `location.pathname === '/en/' && document.readyState === 'complete'`,
        'English prerendered route',
      )
      assert.deepEqual(
        await evaluate(`window.__CHEN_HYDRATION_ERRORS__ || []`),
        [],
        'English prerender must hydrate without recoverable errors.',
      )
    }
    await waitForExpression(
      `document.body.scrollHeight > window.innerHeight + 1000`,
      'hydrated page scroll range',
      10000,
    )
    await evaluate(`new Promise(resolve => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }))
      const target = document.querySelector('#works') || document.querySelector('main section:nth-of-type(2)')
      target?.scrollIntoView({ block: 'start', behavior: 'instant' })
      requestAnimationFrame(() => resolve(window.scrollY))
    })`)
    await waitForExpression(`window.scrollY > 500`, 'scroll away from landing')
    await evaluate(`location.reload()`)
    await waitForExpression(
      `document.readyState === 'complete' && !!document.querySelector('#home.landing')`,
      'application shell after scroll restoration reload',
    )
    await new Promise(resolve => setTimeout(resolve, 1600))
    await evaluate(`window.scrollTo(0, Math.max(900, document.body.scrollHeight * 0.35))`)
    await waitForExpression(`window.scrollY < 10`, 'late browser scroll restoration reset', 3000)
    await new Promise(resolve => setTimeout(resolve, 1200))
    const restoredScrollY = await evaluate(`window.scrollY`)
    assert(
      restoredScrollY < 10,
      `A normal page load must start at the landing instead of restoring an old scroll position (scrollY: ${restoredScrollY}).`,
    )
    assert(
      await evaluate(`(() => {
        const landing = document.querySelector('#home.landing')
        const name = landing?.querySelector('h1, .mh-name')
        if (!landing || !name) return false
        const mastheadRect = landing.getBoundingClientRect()
        const nameRect = name.getBoundingClientRect()
        return Math.abs(mastheadRect.top) < 10
          && nameRect.top >= 0
          && nameRect.bottom <= window.innerHeight
      })()`),
      'The landing name must be visible in the first viewport after load.',
    )

    assert(
      await evaluate(`!document.querySelector('#journey')`),
      'Journey must remain available as an optional module instead of rendering by default.',
    )

    await click('#works .medium-pill', 'Docs')
    await waitForExpression(
      `document.querySelectorAll('#works .work-card').length === 1 && document.querySelector('#works .works-grid')?.classList.contains('is-single')`,
      'single-result work filter',
    )
    assert(
      await evaluate(`(() => {
        const grid = document.querySelector('#works .works-grid')
        const card = grid?.querySelector('.work-card')
        if (!grid || !card || !card.textContent.includes('Late Bus')) return false
        return card.getBoundingClientRect().width >= grid.getBoundingClientRect().width - 4
      })()`),
      'A single filtered work must fill the grid instead of leaving a blank color column.',
    )
    await click('#works .medium-pill', 'All')
    await waitForExpression(
      `document.querySelectorAll('#works .work-card').length > 1`,
      'all work filter restore',
    )

    const desktopViewportWidth = await evaluate(`window.innerWidth`)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    })
    await waitForExpression(`window.innerWidth === 390`, 'mobile viewport emulation')
    assert(
      await evaluate(`(() => {
        const grid = document.querySelector('#about .about-grid')
        const disclosures = [...document.querySelectorAll('.mobile-disclosure-toggle')]
        if (!grid) return false
        const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean)
        return document.body.scrollWidth <= window.innerWidth
          && document.documentElement.scrollWidth <= window.innerWidth
          && columns.length === 1
          && disclosures.length >= 3
          && disclosures.every(button => button.getAttribute('aria-expanded') === 'false')
      })()`),
      'The mobile layout must use one About column without horizontal overflow.',
    )
    await click('.about-cv-disclosure .mobile-disclosure-toggle')
    await waitForExpression(
      `document.querySelector('.about-cv-disclosure .mobile-disclosure-toggle')?.getAttribute('aria-expanded') === 'true'`,
      'mobile About disclosure expansion',
    )
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(MOBILE_DISCLOSURE_KEY)}) || '{}')['about-cv'] === true`,
      'mobile About disclosure persistence',
    )
    await cdp.send('Emulation.clearDeviceMetricsOverride')
    await waitForExpression(
      `window.innerWidth === ${JSON.stringify(desktopViewportWidth)}`,
      'desktop viewport restore',
    )

    assert(
      await evaluate(`(() => {
        const trigger = document.querySelector('.work-card')
        if (!trigger) return false
        trigger.scrollIntoView({ block: 'center' })
        trigger.focus()
        trigger.click()
        return true
      })()`),
      'A work card must be available for the dialog accessibility smoke test.',
    )
    await waitForExpression(
      `!!document.querySelector('[role="dialog"][aria-modal="true"]')`,
      'accessible work dialog',
    )
    await waitForExpression(
      `(() => {
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]')
        return dialog?.contains(document.activeElement)
      })()`,
      'dialog focus entry',
    )
    await pressKey('Escape')
    await waitForExpression(`!document.querySelector('.work-modal.open')`, 'work dialog close')
    assert(
      await evaluate(`document.activeElement?.classList.contains('work-card')`),
      'Closing a dialog with Escape must restore focus to its trigger.',
    )

    await cdp.send('Emulation.setEmulatedMedia', {
      media: '',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    await waitForExpression(
      `matchMedia('(prefers-reduced-motion: reduce)').matches`,
      'reduced motion emulation',
    )
    await waitForExpression(
      `(() => {
        const spotlight = document.querySelector('.cursor-spotlight')
        const reveal = document.querySelector('[data-reveal]')
        const motif = document.querySelector('.theme-motif-layer')
        const filmGate = motif?.querySelector('.motif-film-gate')
        if (!spotlight || !reveal || !motif || !filmGate) return false
        return getComputedStyle(spotlight).display === 'none'
          && getComputedStyle(reveal).opacity === '1'
          && getComputedStyle(reveal).transform === 'none'
      })()`,
      'reduced motion styles and motif freeze',
    )
    const reducedMotionState = await evaluate(`(() => {
        const spotlight = document.querySelector('.cursor-spotlight')
        const reveal = document.querySelector('[data-reveal]')
        const motif = document.querySelector('.theme-motif-layer')
        const filmGate = motif?.querySelector('.motif-film-gate')
        if (!spotlight || !reveal || !motif || !filmGate) return null
        const spotlightStyle = getComputedStyle(spotlight)
        const revealStyle = getComputedStyle(reveal)
        return {
          spotlightDisplay: spotlightStyle.display,
          revealOpacity: revealStyle.opacity,
          revealTransform: revealStyle.transform,
          motifProgress: Number(
            getComputedStyle(motif).getPropertyValue('--motif-progress').trim(),
          ),
          motifTransform: getComputedStyle(filmGate).transform,
        }
      })()`)
    assert.deepEqual(
      reducedMotionState,
      {
        spotlightDisplay: 'none',
        revealOpacity: '1',
        revealTransform: 'none',
        motifProgress: 0.18,
        motifTransform: 'none',
      },
      'System reduced-motion preference must disable spotlight and reveal transforms.',
    )
    await cdp.send('Emulation.setEmulatedMedia', { media: '', features: [] })

    assert.equal(
      await evaluate(
        `localStorage.getItem(${JSON.stringify(CONTENT_SAVED_KEY)}) || localStorage.getItem(${JSON.stringify(STYLE_SAVED_KEY)})`,
      ),
      null,
      'Initial StrictMode mount must not create a save timestamp.',
    )

    await click('[title="Content editor"]')
    await waitForExpression(
      `!!document.querySelector('.ce-overlay .ce-shell')`,
      'content editor open',
    )
    await waitForExpression(
      `document.querySelectorAll('.ce-onboarding-path li').length === 5`,
      'first-run guided path',
    )
    await click('.ce-tab', 'SITE')

    await click('.ce-header-actions button', 'Publish')
    await waitForExpression(`!!document.querySelector('.ce-publish-panel')`, 'publish panel open')
    assert(
      await evaluate(`(() => {
        const button = [...document.querySelectorAll('.ce-publish-actions button')]
          .find(node => node.textContent.includes('Publish content'))
        return button?.disabled === true
          && document.querySelector('.ce-publish-note')?.textContent.includes('no content changes')
      })()`),
      'Content publishing must be disabled when the browser draft matches source defaults.',
    )
    await click('.ce-publish-actions button', 'Verify')
    await waitForExpression(
      `document.querySelector('.ce-publish-status')?.textContent.includes('Enter a GitHub token')`,
      'publish panel missing-token feedback',
    )
    await click('.ce-header-actions button', 'Publish')
    await waitForExpression(`!document.querySelector('.ce-publish-panel')`, 'publish panel close')

    await evaluate(`(() => {
      const original = Storage.prototype.setItem
      window.__uiSmokeOriginalSetItem = original
      Storage.prototype.setItem = function(key, value) {
        if (key === ${JSON.stringify(CONTENT_KEY)}) {
          throw new DOMException('quota reached', 'QuotaExceededError')
        }
        return original.call(this, key, value)
      }
    })()`)
    await setValue('.ce-main .ce-bi input', 'UI Smoke Unsaved', 0)
    await waitForExpression(
      `document.querySelector('.ce-banner')?.textContent.includes('Local draft is not saved')`,
      'content unsaved status',
      5000,
    )
    await evaluate(`(() => {
      Storage.prototype.setItem = window.__uiSmokeOriginalSetItem
      delete window.__uiSmokeOriginalSetItem
    })()`)
    await setValue('.ce-main .ce-bi input', 'UI Smoke Name', 0)
    await click('.ce-footer .ce-btn:not(.ce-btn-ghost)')
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)})).SITE.name.en === 'UI Smoke Name'`,
      'content save',
    )
    await waitForExpression(
      `Number(localStorage.getItem(${JSON.stringify(CONTENT_SAVED_KEY)}))`,
      'content save timestamp',
    )
    const contentSavedAt = await evaluate(
      `Number(localStorage.getItem(${JSON.stringify(CONTENT_SAVED_KEY)}))`,
    )
    await evaluate(`location.reload()`)
    await waitForExpression(
      `document.readyState === 'complete' && !!document.querySelector('[title="Content editor"]')`,
      'application shell after content refresh',
    )
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal(
      await evaluate(`Number(localStorage.getItem(${JSON.stringify(CONTENT_SAVED_KEY)}))`),
      contentSavedAt,
      'Refreshing must not change the content lastSaved timestamp.',
    )
    await click('[title="Content editor"]')
    await waitForExpression(
      `!!document.querySelector('.ce-overlay .ce-shell')`,
      'content editor reopened',
    )

    await click('.ce-footer .ce-btn-ghost', '重置本章')
    await waitForExpression(
      `!JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}').SITE`,
      'content reset',
    )

    await click('.ce-tab', 'About')
    await waitForExpression(
      `!!document.querySelector('.ce-section-template-row .ce-field-template-btn')`,
      'about templates',
    )
    await click('.ce-section-template-row .ce-field-template-btn')
    await waitForExpression(
      `[...document.querySelectorAll('.ce-main textarea')].some((node) => node.value.includes('small digital systems'))`,
      'field template application',
    )
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}').ABOUT?.intro?.en?.includes('small digital systems')`,
      'field template auto-save',
      5000,
    )

    await click('.ce-header-actions button', 'data.js')
    await waitForDownload('data.generated.js')

    await click('.ce-tab', 'Start')
    await waitForExpression(
      `!!document.querySelector('[data-goal-id="personal-journal"] .ce-btn')`,
      'goal picker',
    )
    await click('[data-goal-id="personal-journal"] .ce-btn')
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}').SITE?.portrait === '/picture/template-organic-portrait.svg'`,
      'goal content save',
      5000,
    )
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(STYLE_KEY)}) || '{}').preset === 'personalJournal'`,
      'goal content and style linkage',
      5000,
    )
    assert(
      await evaluate(`(() => {
        const content = JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}')
        return Array.isArray(content.READING_LOG)
          && content.READING_LOG.length === 0
          && content.TEXTS?.landing?.metaRole?.en === 'CREATIVE TECHNOLOGIST'
      })()`),
      'A goal must replace identity-sensitive visitor data instead of inheriting the demo.',
    )

    await click('.ce-header-actions button', 'Paths')
    await waitForExpression(`!!document.querySelector('.ce-path-audit')`, 'media path audit', 20000)
    const auditText = await evaluate(`document.querySelector('.ce-path-audit').textContent`)
    assert(
      auditText.includes('checked') ||
        auditText.includes('已检查') ||
        auditText.includes('available') ||
        auditText.includes('可访问'),
      `Path audit did not report a result. Received: ${auditText}`,
    )
    assert(
      !auditText.includes('0 media path'),
      `Path audit did not inspect preset assets. Received: ${auditText}`,
    )

    await click('.ce-tab', 'Audit')
    await waitForExpression(`!!document.querySelector('.ce-audit .ce-btn')`, 'layout audit panel')
    await click('.ce-audit .ce-btn', 'Run full audit')
    await waitForExpression(
      `!!document.querySelector('.ce-audit-report')`,
      'layout audit report',
      20000,
    )
    assert(
      await evaluate(`document.querySelectorAll('.ce-audit-list li.is-error').length === 0`),
      'A curated goal should have no publication-blocking content audit errors.',
    )

    await click('.ce-tab', 'MODULES')
    await waitForExpression(
      `document.querySelectorAll('.ce-module-order-row').length >= 3`,
      'module order controls',
    )
    assert(
      await evaluate(`(() => {
        const source = document.querySelector('[data-module-key="works"]')
        const target = document.querySelector('[data-module-key="about"]')
        if (!source || !target) return false
        const transfer = new DataTransfer()
        source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }))
        target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: transfer }))
        target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }))
        source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: transfer }))
        return true
      })()`),
      'Could not dispatch module drag events.',
    )
    await waitForExpression(
      `(() => {
        const modules = JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}').MODULES
        return modules && modules.works.order < modules.about.order
      })()`,
      'module drag persistence',
      5000,
    )

    await click('.ce-tab', 'Start')
    await click('[data-goal-id="blank"] .ce-btn')
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}').SITE?.name?.en === '<Your name>'`,
      'blank goal save',
      5000,
    )
    await click('.ce-tab', 'Audit')
    await click('.ce-audit .ce-btn', 'Run full audit')
    await waitForExpression(
      `[...document.querySelectorAll('.ce-audit-list li.is-error code')].some(node => node.textContent === 'SITE.name.en')`,
      'blank goal placeholder audit',
      20000,
    )

    await click('.ce-tab', 'Start')
    await waitForExpression(`!!document.querySelector('.ce-btn-danger')`, 'content reset all')
    await click('.ce-btn-danger', '重置所有本地编辑')
    await waitForExpression(
      `!localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) && !localStorage.getItem(${JSON.stringify(CONTENT_SAVED_KEY)})`,
      'content reset clears data and timestamp',
      5000,
    )

    await click('.ce-close')
    await waitForExpression(
      `!document.querySelector('.ce-overlay .ce-shell')`,
      'content editor close',
    )

    await click('[data-edit-scope="ABOUT"] .inline-edit-tools button', 'Edit')
    await waitForExpression(
      `!!document.querySelector('[data-edit-scope="ABOUT"] .inline-quick-editor')`,
      'section inline quick editor',
    )
    await setValue('[data-edit-scope="ABOUT"] .inline-quick-fields input', 'Inline biography')
    await waitForExpression(
      `document.querySelector('#about .section-title')?.textContent?.includes('Inline biography')`,
      'inline title update',
    )
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}').TEXTS?.about?.headerTitle?.en === 'Inline biography'`,
      'inline edit persistence',
      5000,
    )
    await click('[data-edit-scope="ABOUT"] .inline-quick-editor footer button', 'Open full editor')
    await waitForExpression(
      `document.querySelector('.ce-section-title')?.textContent?.includes('About')`,
      'section-scoped content editor',
    )
    await click('.ce-close')
    await waitForExpression(
      `!document.querySelector('.ce-overlay .ce-shell')`,
      'section-scoped content editor close',
    )

    await click('[title="Style editor"]')
    await waitForExpression(
      `!!document.querySelector('.se-overlay .ce-shell')`,
      'style editor shell',
    )
    await waitForExpression(`!!document.querySelector('.se-workspace-nav')`, 'style workbench')
    await click('[data-site-template-id="minimal-portfolio"] .ce-btn')
    await waitForExpression(
      `(() => {
        const content = JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}')
        const style = JSON.parse(localStorage.getItem(${JSON.stringify(STYLE_KEY)}) || '{}')
        return content.MODULES?.library?.enabled === false
          && style.preset === 'minimalPortfolio'
          && document.body.dataset.motif === 'none'
          && !document.querySelector('.theme-motif-layer')
      })()`,
      'structure and style template linkage',
      5000,
    )
    await waitForExpression(`!!document.querySelector('.se-preset-card')`, 'style editor open')
    await click('.se-preset-card:nth-child(2)')
    await waitForExpression(
      `!!localStorage.getItem(${JSON.stringify(STYLE_KEY)})`,
      'style preset save',
    )
    await waitForExpression(
      `Number(localStorage.getItem(${JSON.stringify(STYLE_SAVED_KEY)}))`,
      'style save timestamp',
    )
    await click('.se-workspace-nav button', 'Tune')
    await waitForExpression(
      `!!document.querySelector('[data-style-group="design"].is-active') && !!document.querySelector('.se-workbench-preview iframe')`,
      'single-page tuning and live preview',
    )
    await click('[data-style-group="motion"] .se-tuning-section-toggle')
    await waitForExpression(
      `(() => {
        const motion = document.querySelector('[data-style-group="motion"].is-active')
        const options = [...(motion?.querySelectorAll('option') || [])].map(node => node.value)
        return options.includes('film') && options.includes('web') && options.includes('botanical') && options.includes('scanline')
      })()`,
      'theme motif controls',
    )
    assert(
      await evaluate(`(() => {
        const motion = document.querySelector('[data-style-group="motion"].is-active')
        const select = [...(motion?.querySelectorAll('select') || [])]
          .find(node => [...node.options].some(option => option.value === 'web'))
        if (!select) return false
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
        setter?.call(select, 'web')
        select.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      })()`),
      'The motif select must accept a live Web preview choice.',
    )
    await waitForExpression(
      `(() => {
        const frame = document.querySelector('.se-live-preview iframe')
        const doc = frame?.contentDocument
        return doc?.body?.dataset.motif === 'web'
          && !!doc.querySelector('.theme-motif-layer.motif-web')
      })()`,
      'live motif preview bridge',
    )
    assert(
      await evaluate(`(() => {
        const doc = document.querySelector('.se-live-preview iframe')?.contentDocument
        const runner = doc?.querySelector('.motif-web-runner')
        runner?.click()
        return !!runner
      })()`),
      'The Web motif must expose its optional interaction in the live preview.',
    )
    await waitForExpression(
      `document.querySelector('.se-live-preview iframe')?.contentDocument
        ?.querySelector('.theme-motif-layer.motif-web')?.classList.contains('is-bursting')`,
      'live Web motif interaction',
    )
    await click('.se-advanced-toggle', 'Advanced expression')
    await waitForExpression(
      `(() => {
        const labels = [...document.querySelectorAll('.se-advanced-tabs button')].map(node => node.textContent.trim())
        return labels.length === 5 && labels.includes('Culture') && labels.includes('Mood')
      })()`,
      'advanced style dimensions',
    )
    const styleSavedAt = await evaluate(
      `Number(localStorage.getItem(${JSON.stringify(STYLE_SAVED_KEY)}))`,
    )

    await click('.ce-header-actions button', 'style.js')
    await waitForDownload('style.generated.js')

    await evaluate(`location.reload()`)
    await waitForExpression(
      `document.readyState === 'complete' && !!document.querySelector('[title="Style editor"]')`,
      'application shell after style refresh',
    )
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal(
      await evaluate(
        `document.querySelector('.about-cv-disclosure .mobile-disclosure-toggle')?.getAttribute('aria-expanded')`,
      ),
      'true',
      'Refreshing must restore the visitor’s mobile disclosure choice.',
    )
    assert.equal(
      await evaluate(`Number(localStorage.getItem(${JSON.stringify(STYLE_SAVED_KEY)}))`),
      styleSavedAt,
      'Refreshing must not change the style lastSaved timestamp.',
    )
    await click('[title="Style editor"]')
    await waitForExpression(
      `!!document.querySelector('.se-overlay .ce-shell')`,
      'style editor reopened',
    )

    await click('.ce-footer .ce-btn-ghost', 'Reset style')
    await waitForExpression(
      `!localStorage.getItem(${JSON.stringify(STYLE_KEY)}) && !localStorage.getItem(${JSON.stringify(STYLE_SAVED_KEY)})`,
      'style reset clears data and timestamp',
    )

    if (PREVIEW_MODE) {
      assert.deepEqual(
        await evaluate(`window.__CHEN_HYDRATION_ERRORS__ || []`),
        [],
        'Persisted content and style must restore after hydration without recoverable errors.',
      )
    }

    console.log(
      `UI smoke tests passed${PREVIEW_MODE ? ' against prerendered production output' : ''}: runtime SEO localization, landing scroll reset, dialog focus restoration, reduced motion, legacy migration, storage failure feedback, publish fallback, editors, refresh-safe timestamps, save/reset, templates, goal linkage, layout audit, drag order, path audit, and exports.`,
    )
  } finally {
    try {
      await cdp?.send('Browser.close')
    } catch {}
    cdp?.close()
    browser?.kill()
    server?.kill()
    if (tempRoot.startsWith(os.tmpdir())) {
      await rm(tempRoot, { recursive: true, force: true }).catch(() => {})
    }
  }
}

run().catch(error => {
  console.error(error.stack || error)
  process.exitCode = 1
})
