import { deepMerge, isPlainObject } from './persist.js'

const DATA_EXPORT_NAME = /^[A-Z][A-Z0-9_]*$/

export function createSectionRegistry(moduleExports) {
  return Object.fromEntries(
    Object.entries(moduleExports).filter(
      ([key, value]) => DATA_EXPORT_NAME.test(key) && typeof value !== 'function',
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
