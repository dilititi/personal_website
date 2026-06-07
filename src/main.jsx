import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import { languageFromUrl } from './lib/seo.js'
import './styles.css'

function lockInitialScrollPosition() {
  if (window.location.hash) return () => {}

  let cancelled = false
  let frame = 0
  const deadline = performance.now() + 1200
  const userEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown']
  const cancel = () => {
    cancelled = true
    cancelAnimationFrame(frame)
    userEvents.forEach(event => window.removeEventListener(event, cancel))
  }
  const tick = () => {
    if (cancelled) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    if (performance.now() < deadline) frame = requestAnimationFrame(tick)
    else cancel()
  }

  userEvents.forEach(event => window.addEventListener(event, cancel, { once: true, passive: true }))
  tick()
  return cancel
}

function appTree({ prerendered, initialLang }) {
  return (
    <React.StrictMode>
      <App prerendered={prerendered} initialLang={initialLang} />
    </React.StrictMode>
  )
}

if (typeof document !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  lockInitialScrollPosition()

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
