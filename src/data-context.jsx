import React, { createContext, useCallback, useContext, useMemo } from 'react'
import * as defaults from './data.js'
import { isPlainObject, readJSON, useLocalStorageState } from './lib/persist.js'
import { normalizeModuleConfig, resolveModules } from './lib/modules.js'
import { createSectionRegistry, resolveSectionRegistry } from './lib/section-registry.js'

const STORAGE_KEY = 'chen.content.overrides'
const LAST_SAVED_KEY = 'chen.content.lastSaved'
const DataContext = createContext(null)

function isEmptyObject(value) {
  return isPlainObject(value) && Object.keys(value).length === 0
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}

export function DataProvider({ children, prerendered = false }) {
  const [overrides, setOverrides, { storageError, lastSaved, isDirty, reset }] =
    useLocalStorageState(STORAGE_KEY, LAST_SAVED_KEY, {
      init: () => (prerendered ? {} : readJSON(STORAGE_KEY, {})),
      loadOnMount: prerendered ? () => readJSON(STORAGE_KEY, {}) : undefined,
      isDefault: value => !value || isEmptyObject(value),
      quotaHint: 'Remove large base64 media or export paths instead.',
    })

  const baseData = useMemo(() => createSectionRegistry(defaults), [])
  const resolvedData = useMemo(
    () =>
      resolveSectionRegistry(baseData, overrides, {
        MODULES: resolveModules,
      }),
    [baseData, overrides],
  )

  const setSection = useCallback(
    (key, sectionValue) => {
      setOverrides(prev => ({ ...prev, [key]: sectionValue }))
    },
    [setOverrides],
  )
  const resetSection = useCallback(
    key => {
      setOverrides(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    [setOverrides],
  )
  const resetAll = useCallback(() => reset({}), [reset])
  const replaceOverrides = useCallback(
    next => {
      setOverrides(isPlainObject(next) ? next : {})
    },
    [setOverrides],
  )
  const isOverridden = useCallback(key => overrides[key] !== undefined, [overrides])
  const exportOverrides = useCallback(() => JSON.stringify(overrides, null, 2), [overrides])

  const getModuleConfig = useCallback(
    id => resolvedData.MODULES?.[id] || normalizeModuleConfig(id, undefined, true),
    [resolvedData.MODULES],
  )
  const isModuleEnabled = useCallback(
    id => getModuleConfig(id).enabled !== false,
    [getModuleConfig],
  )
  const isModuleInNav = useCallback(
    id => {
      const config = getModuleConfig(id)
      return config.enabled !== false && config.nav === true
    },
    [getModuleConfig],
  )

  const value = useMemo(
    () => ({
      ...resolvedData,
      baseData,
      userOverrides: overrides,
      resolvedData,
      storageError,
      lastSaved,
      isDirty,

      // Mutation methods used by the editor
      overrides,
      setSection,
      resetSection,
      resetAll,
      replaceOverrides,
      isOverridden,
      exportOverrides,
      getModuleConfig,
      isModuleEnabled,
      isModuleInNav,

      // Re-export helpers
      pick: defaults.pick,
      defaults,
    }),
    [
      resolvedData,
      baseData,
      overrides,
      storageError,
      lastSaved,
      isDirty,
      setSection,
      resetSection,
      resetAll,
      replaceOverrides,
      isOverridden,
      exportOverrides,
      getModuleConfig,
      isModuleEnabled,
      isModuleInNav,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
