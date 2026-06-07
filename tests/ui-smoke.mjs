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
        ['/', rootHtml, /<html lang="en">/, /class="landing landing-masthead"/],
        ['/en/', enHtml, /<html lang="en">/, /id="about"/],
        ['/zh/', zhHtml, /<html lang="zh">/, /id="about"/],
      ].forEach(([route, html, languagePattern, bodyPattern]) => {
        assert.match(html, languagePattern, `${route} must contain its static language.`)
        assert.match(html, bodyPattern, `${route} must contain prerendered body copy.`)
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
    await new Promise(resolve => setTimeout(resolve, 300))
    await evaluate(`window.scrollTo(0, document.body.scrollHeight * 0.45)`)
    await waitForExpression(`window.scrollY > 500`, 'scroll away from landing')
    await evaluate(`location.reload()`)
    await waitForExpression(
      `document.readyState === 'complete' && !!document.querySelector('.landing-masthead')`,
      'application shell after scroll restoration reload',
    )
    await new Promise(resolve => setTimeout(resolve, 500))
    const restoredScrollY = await evaluate(`window.scrollY`)
    assert(
      restoredScrollY < 10,
      `A normal page load must start at the landing masthead instead of restoring an old scroll position (scrollY: ${restoredScrollY}).`,
    )
    assert(
      await evaluate(`(() => {
        const masthead = document.querySelector('.landing-masthead')
        const name = document.querySelector('.landing-masthead .mh-name')
        if (!masthead || !name) return false
        const mastheadRect = masthead.getBoundingClientRect()
        const nameRect = name.getBoundingClientRect()
        return Math.abs(mastheadRect.top) < 10
          && nameRect.top >= 0
          && nameRect.bottom <= window.innerHeight
      })()`),
      'The landing masthead name must be visible in the first viewport after load.',
    )
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

    await click('.ce-tab', 'Auto-fill')
    await waitForExpression(
      `!!document.querySelector('.ce-template-card .ce-btn')`,
      'content presets',
    )
    await click('.ce-template-card .ce-btn')
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(CONTENT_KEY)}) || '{}').SITE?.portrait === '/picture/template-organic-portrait.svg'`,
      'content preset save',
      5000,
    )
    await waitForExpression(
      `JSON.parse(localStorage.getItem(${JSON.stringify(STYLE_KEY)}) || '{}').preset === 'organic'`,
      'content and style preset linkage',
      5000,
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

    await click('.ce-tab', 'Auto-fill')
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

    await click('[title="Style editor"]')
    await waitForExpression(
      `!!document.querySelector('.se-overlay .ce-shell')`,
      'style editor shell',
    )
    await click('.se-overlay .ce-tab', 'Presets')
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
      `UI smoke tests passed${PREVIEW_MODE ? ' against prerendered production output' : ''}: runtime SEO localization, landing scroll reset, legacy migration, storage failure feedback, editors, refresh-safe timestamps, save/reset, templates, preset linkage, drag order, path audit, and exports.`,
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
