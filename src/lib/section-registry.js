import { deepMerge, isPlainObject } from './persist.js'

const DATA_EXPORT_NAME = /^[A-Z][A-Z0-9_]*$/

export function createSectionRegistry(moduleExports) {
  return Object.fromEntries(
    Object.entries(moduleExports).filter(
      ([key, value]) => DATA_EXPORT_NAME.test(key) && typeof value !== 'function',
    ),
  )
}

// WORKS is an editable collection, but its published image assets must remain
// available when an older local override predates the asset fields. Preserve
// the user's edited entries and append only newly published image-backed work.
export function resolveWorks(baseWorks, overrideWorks) {
  if (!Array.isArray(overrideWorks)) return deepMerge(baseWorks, overrideWorks)

  const baseById = new Map(
    (Array.isArray(baseWorks) ? baseWorks : [])
      .filter(work => work?.id)
      .map(work => [work.id, work]),
  )
  const overrideIds = new Set()
  const resolved = overrideWorks.map(work => {
    if (!isPlainObject(work) || !work.id) return work
    overrideIds.add(work.id)
    const baseWork = baseById.get(work.id)
    if (!baseWork) return work

    const next = deepMerge(baseWork, work)
    if (!next.coverImg && baseWork.coverImg) next.coverImg = baseWork.coverImg
    return next
  })

  return resolved.concat(
    (Array.isArray(baseWorks) ? baseWorks : []).filter(
      work => work?.coverImg && work.id && !overrideIds.has(work.id),
    ),
  )
}

export function resolveSectionRegistry(baseData, overrides, resolvers = {}) {
  const safeOverrides = isPlainObject(overrides) ? overrides : {}
  return Object.fromEntries(
    Object.entries(baseData).map(([key, baseValue]) => {
      const resolve = resolvers[key] || deepMerge
      return [key, resolve(baseValue, safeOverrides[key])]
    }),
  )
}
