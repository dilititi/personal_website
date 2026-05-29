import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_STYLE, STYLE_PRESETS } from './style'
import { deriveStyleVars } from './style-engine'

const STORAGE_KEY = 'chen.style.overrides'
const StyleContext = createContext(null)

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function mergeStyle(base, override) {
  if (override === undefined) return base
  if (Array.isArray(base)) return Array.isArray(override) ? override : base
  if (isPlainObject(base)) {
    if (!isPlainObject(override)) return base
    const next = { ...base }
    Object.keys(override).forEach((key) => {
      next[key] = mergeStyle(base[key], override[key])
    })
    return next
  }
  return override
}

function loadStoredStyle() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? mergeStyle(DEFAULT_STYLE, JSON.parse(raw)) : DEFAULT_STYLE
  } catch {
    return DEFAULT_STYLE
  }
}

function stylesMatch(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function persistStyle(style) {
  try {
    if (stylesMatch(style, DEFAULT_STYLE)) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(style))
    return ''
  } catch (e) {
    const message = e?.name === 'QuotaExceededError'
      ? 'Browser storage is full. Remove large local assets before saving more style data.'
      : `Style override write failed: ${e?.message || String(e)}`
    console.warn(message, e)
    return message
  }
}

function applyStyleToDocument(style) {
  if (typeof document === 'undefined') return
  const vars = deriveStyleVars(style)
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
  document.body.dataset.motion = style?.motion?.mode || 'lively'
}

export function useStyle() {
  const ctx = useContext(StyleContext)
  if (!ctx) throw new Error('useStyle must be used inside <StyleProvider>')
  return ctx
}

export function StyleProvider({ children }) {
  const [style, setStyleState] = useState(loadStoredStyle)
  const [storageError, setStorageError] = useState('')

  useEffect(() => {
    applyStyleToDocument(style)
    setStorageError(persistStyle(style))
  }, [style])

  const setStyle = useCallback((nextStyle) => {
    setStyleState((prev) => {
      const next = typeof nextStyle === 'function' ? nextStyle(prev) : nextStyle
      return mergeStyle(DEFAULT_STYLE, next)
    })
  }, [])

  const updateDimension = useCallback((key, patch) => {
    setStyleState((prev) => ({
      ...prev,
      preset: 'custom',
      [key]: {
        ...(isPlainObject(prev[key]) ? prev[key] : {}),
        ...(isPlainObject(patch) ? patch : {}),
      },
    }))
  }, [])

  const applyPreset = useCallback((id) => {
    const preset = STYLE_PRESETS[id]
    if (!preset) return
    setStyleState(mergeStyle(DEFAULT_STYLE, preset.style))
  }, [])

  const resetStyle = useCallback(() => {
    setStyleState(DEFAULT_STYLE)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  const exportStyle = useCallback(() => {
    return `export const DEFAULT_STYLE = ${JSON.stringify(style, null, 2)}\n`
  }, [style])

  const value = useMemo(() => ({
    style,
    setStyle,
    updateDimension,
    applyPreset,
    resetStyle,
    exportStyle,
    storageError,
    isCustomized: !stylesMatch(style, DEFAULT_STYLE),
  }), [style, setStyle, updateDimension, applyPreset, resetStyle, exportStyle, storageError])

  return <StyleContext.Provider value={value}>{children}</StyleContext.Provider>
}
