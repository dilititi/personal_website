import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { pick } from './data'

export const LangContext = createContext({ lang: 'en', setLang: () => {} })

export function useLang() {
  const ctx = useContext(LangContext)
  const t = useCallback(v => pick(v, ctx.lang), [ctx.lang])
  return { ...ctx, t }
}

export function LangProvider({ children }) {
  const [lang, setLangRaw] = useState(() => {
    try {
      return localStorage.getItem('chen.lang') || 'en'
    } catch {
      return 'en'
    }
  })

  const setLang = useCallback(l => {
    setLangRaw(l)
    try {
      localStorage.setItem('chen.lang', l)
    } catch {}
    document.documentElement.lang = l
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}
