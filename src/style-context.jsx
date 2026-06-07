import React, { createContext, useCallback, useContext, useMemo } from 'react'
import { DEFAULT_STYLE, STYLE_PRESETS } from './style'
import { deriveStyleVars } from './style-engine'
import { deepMerge, isPlainObject, readJSON, useLocalStorageState } from './lib/persist'

const STORAGE_KEY = 'chen.style.overrides'
const LAST_SAVED_KEY = 'chen.style.lastSaved'
const StyleContext = createContext(null)

function stylesMatch(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function applyStyleToDocument(style) {
  if (typeof document === 'undefined') return
  const vars = deriveStyleVars(style)
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
  document.body.dataset.motion = style?.motion?.mode || 'lively'
  document.body.dataset.styleAlignment = style?.design?.alignment || 'editorial'
}

export function useStyle() {
  const ctx = useContext(StyleContext)
  if (!ctx) throw new Error('useStyle must be used inside <StyleProvider>')
  return ctx
}

export function StyleProvider({ children }) {
  const [style, setStyleState, { storageError, lastSaved, isDirty, reset }] = useLocalStorageState(
    STORAGE_KEY,
    LAST_SAVED_KEY,
    {
      init: () => {
        const stored = readJSON(STORAGE_KEY, null)
        return stored ? deepMerge(DEFAULT_STYLE, stored) : DEFAULT_STYLE
      },
      isDefault: value => stylesMatch(value, DEFAULT_STYLE),
      quotaHint: 'Remove large local assets before saving more style data.',
      onApply: applyStyleToDocument,
    },
  )

  const setStyle = useCallback(
    nextStyle => {
      setStyleState(prev => {
        const next = typeof nextStyle === 'function' ? nextStyle(prev) : nextStyle
        return deepMerge(DEFAULT_STYLE, next)
      })
    },
    [setStyleState],
  )

  const updateDimension = useCallback(
    (key, patch) => {
      setStyleState(prev => ({
        ...prev,
        preset: 'custom',
        [key]: {
          ...(isPlainObject(prev[key]) ? prev[key] : {}),
          ...(isPlainObject(patch) ? patch : {}),
        },
      }))
    },
    [setStyleState],
  )

  const applyPreset = useCallback(
    id => {
      const preset = STYLE_PRESETS[id]
      if (!preset) return
      setStyleState(deepMerge(DEFAULT_STYLE, preset.style))
    },
    [setStyleState],
  )

  const resetStyle = useCallback(() => {
    reset(DEFAULT_STYLE)
  }, [reset])

  const exportStyle = useCallback(
    () => `export const DEFAULT_STYLE = ${JSON.stringify(style, null, 2)}\n`,
    [style],
  )

  const value = useMemo(
    () => ({
      style,
      setStyle,
      updateDimension,
      applyPreset,
      resetStyle,
      exportStyle,
      storageError,
      lastSaved,
      isDirty,
      isCustomized: !stylesMatch(style, DEFAULT_STYLE),
    }),
    [
      style,
      setStyle,
      updateDimension,
      applyPreset,
      resetStyle,
      exportStyle,
      storageError,
      lastSaved,
      isDirty,
    ],
  )

  return <StyleContext.Provider value={value}>{children}</StyleContext.Provider>
}
