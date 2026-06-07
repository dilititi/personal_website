import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { pick } from './data.js'

export const LangContext = createContext({ lang: 'en', setLang: () => {} })
const SUPPORTED_LANGS = new Set(['en', 'zh'])

function normalizeLang(value) {
  return SUPPORTED_LANGS.has(value) ? value : ''
}

function routeLang(pathname = '') {
  return normalizeLang(pathname.split('/').filter(Boolean)[0])
}

function storedLang() {
  try {
    return normalizeLang(localStorage.getItem('chen.lang'))
  } catch {
    return ''
  }
}

export function resolveInitialLang({
  pathname = '',
  initialLang = '',
  prerendered = false,
  stored = '',
} = {}) {
  const routed = routeLang(pathname)
  if (routed) return routed

  const initial = normalizeLang(initialLang)
  if (prerendered) return initial || 'en'
  return normalizeLang(stored) || initial || 'en'
}

export function useLang() {
  const ctx = useContext(LangContext)
  const t = useCallback(v => pick(v, ctx.lang), [ctx.lang])
  return { ...ctx, t }
}

export function LangProvider({ children, initialLang, prerendered = false }) {
  const [lang, setLangRaw] = useState(() =>
    resolveInitialLang({
      pathname: typeof window === 'undefined' ? '' : window.location.pathname,
      initialLang,
      prerendered,
      stored: prerendered ? '' : storedLang(),
    }),
  )

  const setLang = useCallback(
    value => {
      const nextLang = normalizeLang(value)
      if (!nextLang) return

      try {
        localStorage.setItem('chen.lang', nextLang)
      } catch {}

      if (prerendered && typeof window !== 'undefined') {
        const destination = new URL(`/${nextLang}/`, window.location.origin)
        destination.search = window.location.search
        destination.hash = window.location.hash
        window.location.assign(destination.href)
        return
      }

      setLangRaw(nextLang)
      if (typeof document !== 'undefined') document.documentElement.lang = nextLang
    },
    [prerendered],
  )

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang
  }, [lang])

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}
