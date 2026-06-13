import { readJSON } from './persist.js'

export const MOBILE_DISCLOSURE_STORAGE_KEY = 'chen.ui.mobileDisclosures'

function resolveStorage(storage) {
  if (storage !== undefined) return storage
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

export function readMobileDisclosureState(id, storage) {
  if (!id) return false
  const stored = readJSON(MOBILE_DISCLOSURE_STORAGE_KEY, {}, resolveStorage(storage))
  return stored?.[id] === true
}

export function writeMobileDisclosureState(id, expanded, storage) {
  if (!id) return false

  try {
    const target = resolveStorage(storage)
    if (!target) return false
    const stored = readJSON(MOBILE_DISCLOSURE_STORAGE_KEY, {}, target)
    const next = stored && typeof stored === 'object' && !Array.isArray(stored) ? { ...stored } : {}

    if (expanded) next[id] = true
    else delete next[id]

    if (Object.keys(next).length === 0) target.removeItem(MOBILE_DISCLOSURE_STORAGE_KEY)
    else target.setItem(MOBILE_DISCLOSURE_STORAGE_KEY, JSON.stringify(next))
    return true
  } catch {
    return false
  }
}
