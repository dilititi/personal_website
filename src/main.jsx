import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import { languageFromUrl } from './lib/seo.js'
import './styles.css'

const INITIAL_SCROLL_MIN_MS = 2500
const INITIAL_SCROLL_SETTLE_MS = 2000

function waitForEvent(target, event) {
  if (event === 'load' && document.readyState === 'complete') return Promise.resolve()
  return new Promise(resolve => target.addEventListener(event, resolve, { once: true }))
}

function settleInitialScrollPosition() {
  const guard = window.__CHEN_INITIAL_SCROLL__
  if (window.location.hash || !guard) return

  const appReady = waitForEvent(window, 'chen:app-ready')
  const pageLoaded = waitForEvent(window, 'load')
  const fontsReady = document.fonts?.ready?.catch(() => {}) || Promise.resolve()
  const minimumWindow = new Promise(resolve => window.setTimeout(resolve, INITIAL_SCROLL_MIN_MS))

  Promise.all([appReady, pageLoaded, fontsReady]).then(async () => {
    await Promise.all([
      minimumWindow,
      new Promise(resolve => window.setTimeout(resolve, INITIAL_SCROLL_SETTLE_MS)),
    ])
    if (!guard.isActive()) return
    guard.reset()
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        guard.reset()
        guard.release()
      })
    })
  })
}

function appTree({ prerendered, initialLang }) {
  return (
    <React.StrictMode>
      <App prerendered={prerendered} initialLang={initialLang} />
    </React.StrictMode>
  )
}

if (typeof document !== 'undefined') {
  settleInitialScrollPosition()

  const root = document.getElementById('root')
  const prerendered = root.hasChildNodes()
  const tree = appTree({
    prerendered,
    initialLang: languageFromUrl(window.location.href),
  })

  if (prerendered) {
    window.__CHEN_HYDRATION_ERRORS__ = []
    hydrateRoot(root, tree, {
      onRecoverableError(error, errorInfo) {
        const message = error?.message || String(error)
        window.__CHEN_HYDRATION_ERRORS__.push(message)
        console.error('Hydration recoverable error:', error, errorInfo)
      },
    })
  } else createRoot(root).render(tree)
}
