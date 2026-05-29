import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import * as defaults from './data'

const STORAGE_KEY = 'chen.content.overrides'
const DataContext = createContext(null)

// All editable section keys, in order they'll show in the editor.
export const SECTION_KEYS = [
  'SITE', 'MODULES', 'TEXTS', 'ABOUT', 'JOURNEY',
  'WORKS', 'BOOKS', 'FILMS', 'MUSIC',
  'TRAVEL', 'PHOTOS', 'USER_READING_LOG', 'NOW_PLAYING', 'NAV',
]

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

function mergeSection(def, ovr) {
  if (ovr === undefined) return def
  if (Array.isArray(def)) return Array.isArray(ovr) ? ovr : def
  if (isPlainObject(def)) {
    if (!isPlainObject(ovr)) return def
    const next = { ...def }
    Object.keys(ovr).forEach((key) => {
      next[key] = mergeSection(def[key], ovr[key])
    })
    return next
  }
  return ovr
}

function normalizeModuleConfig(id, base, override) {
  const fallbackLabel = { en: id, zh: id }
  const baseConfig = isPlainObject(base)
    ? base
    : { enabled: base !== false, nav: false, order: 0, label: fallbackLabel, layout: 'default' }

  if (typeof override === 'boolean') {
    return { ...baseConfig, enabled: override }
  }
  if (!isPlainObject(override)) {
    return baseConfig
  }

  const order = Number(override.order)
  return {
    ...baseConfig,
    ...override,
    enabled: override.enabled !== undefined ? override.enabled !== false : baseConfig.enabled !== false,
    nav: override.nav !== undefined ? override.nav !== false : baseConfig.nav === true,
    order: Number.isFinite(order) ? order : baseConfig.order ?? 0,
    label: mergeSection(baseConfig.label || fallbackLabel, override.label),
    layout: typeof override.layout === 'string' && override.layout.trim() ? override.layout.trim() : baseConfig.layout || 'default',
  }
}

function resolveModules(baseModules, overrideModules) {
  const ids = new Set([
    ...Object.keys(baseModules || {}),
    ...(isPlainObject(overrideModules) ? Object.keys(overrideModules) : []),
  ])
  const next = {}
  ids.forEach((id) => {
    next[id] = normalizeModuleConfig(id, baseModules?.[id], overrideModules?.[id])
  })
  return next
}

function isEmptyObject(value) {
  return isPlainObject(value) && Object.keys(value).length === 0
}

function formatStorageError(error) {
  if (error?.name === 'QuotaExceededError') {
    return 'Browser storage is full. Remove large base64 media or export paths instead.'
  }
  return `Content override write failed: ${error?.message || String(error)}`
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveOverrides(obj) {
  try {
    if (!obj || isEmptyObject(obj)) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    return ''
  } catch (e) {
    const message = formatStorageError(e)
    console.warn(message, e)
    return message
  }
}

function jsLiteral(value) {
  return JSON.stringify(value, null, 2)
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}

export function DataProvider({ children }) {
  const [overrides, setOverrides] = useState(loadOverrides)
  const [storageError, setStorageError] = useState('')

  useEffect(() => {
    setStorageError(saveOverrides(overrides))
  }, [overrides])

  const merge = (key) => {
    const def = defaults[key]
    const ovr = overrides[key]
    if (key === 'MODULES') return resolveModules(def, ovr)
    return mergeSection(def, ovr)
  }

  const baseData = useMemo(() => ({
    SITE: defaults.SITE,
    MODULES: defaults.MODULES,
    TEXTS: defaults.TEXTS,
    ABOUT: defaults.ABOUT,
    JOURNEY: defaults.JOURNEY,
    WORKS: defaults.WORKS,
    BOOKS: defaults.BOOKS,
    FILMS: defaults.FILMS,
    MUSIC: defaults.MUSIC,
    TRAVEL: defaults.TRAVEL,
    NOW_PLAYING: defaults.NOW_PLAYING,
    NAV: defaults.NAV,
    PHOTOS: defaults.PHOTOS,
    PHOTO_SERIES: defaults.PHOTO_SERIES,
    READING_LOG: defaults.READING_LOG,
    USER_READING_LOG: defaults.USER_READING_LOG,
  }), [])

  const resolvedData = {
    SITE:         merge('SITE'),
    MODULES:      merge('MODULES'),
    TEXTS:        merge('TEXTS'),
    ABOUT:        merge('ABOUT'),
    JOURNEY:      merge('JOURNEY'),
    WORKS:        merge('WORKS'),
    BOOKS:        merge('BOOKS'),
    FILMS:        merge('FILMS'),
    MUSIC:        merge('MUSIC'),
    TRAVEL:       merge('TRAVEL'),
    NOW_PLAYING:  merge('NOW_PLAYING'),
    NAV:          merge('NAV'),
    PHOTOS:       merge('PHOTOS'),
    PHOTO_SERIES: merge('PHOTO_SERIES'),
    READING_LOG:  merge('READING_LOG'),
    USER_READING_LOG: merge('USER_READING_LOG'),
  }

  const exportResolvedData = useCallback(() => {
    return SECTION_KEYS
      .map((key) => `export const ${key} = ${jsLiteral(resolvedData[key])}`)
      .join('\n\n')
  }, [resolvedData])

  const exportOverrides = useCallback(() => {
    return JSON.stringify(overrides, null, 2)
  }, [overrides])

  const getModuleConfig = useCallback((id) => {
    return resolvedData.MODULES?.[id] || normalizeModuleConfig(id, undefined, true)
  }, [resolvedData.MODULES])

  const isModuleEnabled = useCallback((id) => {
    return getModuleConfig(id).enabled !== false
  }, [getModuleConfig])

  const isModuleInNav = useCallback((id) => {
    const config = getModuleConfig(id)
    return config.enabled !== false && config.nav === true
  }, [getModuleConfig])

  const value = {
    ...resolvedData,
    baseData,
    userOverrides: overrides,
    resolvedData,
    storageError,

    // Mutation methods used by the editor
    overrides,
    setSection: useCallback((key, value) => {
      setOverrides(prev => ({ ...prev, [key]: value }))
    }, []),
    resetSection: useCallback((key) => {
      setOverrides(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }, []),
    resetAll: useCallback(() => setOverrides({}), []),
    resetData: useCallback(() => setOverrides({}), []),
    isOverridden: (key) => overrides[key] !== undefined,
    exportResolvedData,
    exportOverrides,
    getModuleConfig,
    isModuleEnabled,
    isModuleInNav,

    // Re-export helpers
    pick: defaults.pick,
    defaults,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
