import { useCallback, useEffect, useRef, useState } from 'react'

// ── Pure helpers ──────────────────────────────────────────────────────────

export function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false
  const prototype = Object.getPrototypeOf(v)
  return prototype === Object.prototype || prototype === null
}

// Recursive deep-merge. Override wins; arrays are REPLACED (not merged); an
// `undefined` override keeps base; a non-object override on an object base
// keeps base. This is the single canonical merge for both content and style
// overrides (ENGINEERING.md INV-9 / §2 — do not add a second one).
export function deepMerge(base, override) {
  if (override === undefined) return base
  if (Array.isArray(base)) return Array.isArray(override) ? override : base
  if (isPlainObject(base)) {
    if (!isPlainObject(override)) return base
    const next = { ...base }
    Object.keys(override).forEach(key => {
      next[key] = deepMerge(base[key], override[key])
    })
    return next
  }
  return override
}

// Safe JSON read from localStorage; returns `fallback` on any failure.
export function readJSON(key, fallback, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// Read a positive timestamp; null if missing/invalid.
export function readTimestamp(key, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(key)
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

function storageError(error, quotaHint) {
  return error?.name === 'QuotaExceededError'
    ? `Browser storage is full. ${quotaHint}`
    : `Storage write failed: ${error?.message || String(error)}`
}

export function persistenceSnapshot(value, options = {}) {
  const { isDefault = () => false, serialize = item => JSON.stringify(item) } = options
  return isDefault(value) ? 'default:' : `value:${serialize(value)}`
}

export function writePersistedValue({
  storage = globalThis.localStorage,
  key,
  lastSavedKey,
  value,
  isDefault = () => false,
  serialize = item => JSON.stringify(item),
  quotaHint = 'Remove large data before saving more.',
  now = Date.now,
}) {
  let snapshot
  try {
    snapshot = persistenceSnapshot(value, { isDefault, serialize })
    if (isDefault(value)) storage?.removeItem(key)
    else storage?.setItem(key, serialize(value))
  } catch (error) {
    return { ok: false, error: storageError(error, quotaHint), lastSaved: null, snapshot: null }
  }

  const timestamp = now()
  try {
    storage?.setItem(lastSavedKey, String(timestamp))
    return { ok: true, error: '', lastSaved: timestamp, snapshot }
  } catch (error) {
    return {
      ok: true,
      error: `Data saved, but the save timestamp could not be updated: ${error?.message || String(error)}`,
      lastSaved: null,
      snapshot,
    }
  }
}

export function clearPersistedValue({
  storage = globalThis.localStorage,
  key,
  lastSavedKey,
  quotaHint = 'Remove large data before saving more.',
}) {
  try {
    storage?.removeItem(key)
  } catch (error) {
    return { ok: false, error: storageError(error, quotaHint) }
  }

  try {
    storage?.removeItem(lastSavedKey)
    return { ok: true, error: '' }
  } catch (error) {
    return {
      ok: true,
      error: `Data was reset, but the save timestamp could not be cleared: ${error?.message || String(error)}`,
    }
  }
}

// ── Persisted-state hook ──────────────────────────────────────────────────

// State backed by localStorage, with a "last saved" timestamp and a
// persisted snapshot (so mounting/StrictMode replay does not bump lastSaved).
// Options:
//   init       – lazy initial value (called once)
//   loadOnMount – optional browser-only restore. Until it runs, the hook keeps
//                 `init` as the hydration-safe value and does not persist it.
//   isDefault  – when true for a value, the key is REMOVED instead of written
//   serialize  – value → string (default JSON.stringify)
//   quotaHint  – appended to the "storage full" message
//   onApply    – side-effect run with the value on every change (e.g. write
//                style vars onto the document)
// Returns [value, setValue, { storageError, lastSaved, isDirty, reset }].
export function useLocalStorageState(key, lastSavedKey, options = {}) {
  const {
    init,
    loadOnMount,
    isDefault = () => false,
    serialize = item => JSON.stringify(item),
    quotaHint = 'Remove large data before saving more.',
    onApply,
  } = options

  const defersRestore = typeof loadOnMount === 'function'
  const [value, setValue] = useState(init)
  const [storageError, setStorageError] = useState('')
  const [lastSaved, setLastSaved] = useState(() =>
    defersRestore ? null : readTimestamp(lastSavedKey),
  )
  const [isDirty, setIsDirty] = useState(false)
  const [restoreComplete, setRestoreComplete] = useState(!defersRestore)

  // Keep the latest callbacks without making them effect dependencies.
  const cbRef = useRef({ isDefault, serialize, quotaHint, onApply, loadOnMount })
  cbRef.current = { isDefault, serialize, quotaHint, onApply, loadOnMount }
  const persistedSnapshotRef = useRef(null)
  if (persistedSnapshotRef.current === null) {
    persistedSnapshotRef.current = persistenceSnapshot(value, { isDefault, serialize })
  }

  const setPersistedValue = useCallback(nextValue => {
    setIsDirty(true)
    setValue(nextValue)
  }, [])

  useEffect(() => {
    if (restoreComplete) return

    const { isDefault, serialize, loadOnMount } = cbRef.current
    let restoredValue
    try {
      restoredValue = loadOnMount()
      persistedSnapshotRef.current = persistenceSnapshot(restoredValue, {
        isDefault,
        serialize,
      })
    } catch (error) {
      setStorageError(`Storage restore failed: ${error?.message || String(error)}`)
      setRestoreComplete(true)
      return
    }

    setValue(restoredValue)
    setLastSaved(readTimestamp(lastSavedKey))
    setIsDirty(false)
    setRestoreComplete(true)
  }, [lastSavedKey, restoreComplete])

  useEffect(() => {
    const { isDefault, serialize, quotaHint, onApply } = cbRef.current
    if (onApply) onApply(value)
    if (!restoreComplete) return

    let snapshot
    try {
      snapshot = persistenceSnapshot(value, { isDefault, serialize })
    } catch (error) {
      setStorageError(`Storage serialization failed: ${error?.message || String(error)}`)
      setIsDirty(true)
      return
    }

    if (snapshot === persistedSnapshotRef.current) {
      setIsDirty(false)
      return
    }

    const result = writePersistedValue({
      key,
      lastSavedKey,
      value,
      isDefault,
      serialize,
      quotaHint,
    })
    setStorageError(result.error)
    if (!result.ok) {
      console.warn(result.error)
      setIsDirty(true)
      return
    }

    persistedSnapshotRef.current = result.snapshot
    setLastSaved(result.lastSaved)
    setIsDirty(false)
  }, [value, key, lastSavedKey, restoreComplete])

  const reset = useCallback(
    nextValue => {
      const { isDefault, serialize, quotaHint, onApply } = cbRef.current
      const result = clearPersistedValue({ key, lastSavedKey, quotaHint })
      setValue(nextValue)
      if (onApply) onApply(nextValue)
      setStorageError(result.error)
      setLastSaved(null)

      if (result.ok) {
        persistedSnapshotRef.current = persistenceSnapshot(nextValue, { isDefault, serialize })
        setIsDirty(false)
      } else {
        setIsDirty(true)
      }
    },
    [key, lastSavedKey],
  )

  return [
    value,
    setPersistedValue,
    {
      storageError,
      lastSaved,
      isDirty,
      isRestored: restoreComplete,
      reset,
    },
  ]
}
