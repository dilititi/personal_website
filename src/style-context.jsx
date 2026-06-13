import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_STYLE, STYLE_PRESETS } from './style.js'
import { deriveStyleVars } from './style-engine.js'
import { deepMerge, isPlainObject, readJSON, useLocalStorageState } from './lib/persist.js'
import { isStylePreviewMessage, isStylePreviewSurface } from './lib/style-preview.js'

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
  document.body.dataset.motif = style?.motion?.motif || 'none'
  document.body.dataset.motifAmbient = style?.motion?.ambient === false ? 'off' : 'on'
  document.body.dataset.motifInteraction = style?.motion?.interaction || 'subtle'
  document.body.dataset.styleAlignment = style?.design?.alignment || 'editorial'
  document.body.dataset.landingLayout = style?.layout?.landing || 'minimal'
}

export function useStyle() {
  const ctx = useContext(StyleContext)
  if (!ctx) throw new Error('useStyle must be used inside <StyleProvider>')
  return ctx
}

export function StyleProvider({ children, prerendered = false }) {
  const [previewStyle, setPreviewStyle] = useState(null)
  const [persistedStyle, setStyleState, { storageError, lastSaved, isDirty, reset }] =
    useLocalStorageState(STORAGE_KEY, LAST_SAVED_KEY, {
      init: () => {
        if (prerendered) return DEFAULT_STYLE
        const stored = readJSON(STORAGE_KEY, null)
        return stored ? deepMerge(DEFAULT_STYLE, stored) : DEFAULT_STYLE
      },
      loadOnMount: prerendered
        ? () => {
            const stored = readJSON(STORAGE_KEY, null)
            return stored ? deepMerge(DEFAULT_STYLE, stored) : DEFAULT_STYLE
          }
        : undefined,
      isDefault: value => stylesMatch(value, DEFAULT_STYLE),
      quotaHint: 'Remove large local assets before saving more style data.',
      onApply: applyStyleToDocument,
    })
  const style = previewStyle || persistedStyle

  useEffect(() => {
    if (typeof window === 'undefined' || !isStylePreviewSurface()) return undefined

    const receivePreviewStyle = event => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isStylePreviewMessage(event.data)
      ) {
        return
      }
      setPreviewStyle(deepMerge(DEFAULT_STYLE, event.data.style))
    }

    window.addEventListener('message', receivePreviewStyle)
    return () => window.removeEventListener('message', receivePreviewStyle)
  }, [])

  useEffect(() => {
    if (previewStyle) applyStyleToDocument(previewStyle)
  }, [previewStyle])

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
