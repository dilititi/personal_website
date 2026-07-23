import { deepMerge, isPlainObject } from './persist.js'

export const MODULE_LAYOUTS = new Set(['default', 'compact', 'feature'])

// Normalize a module config to the object shape
// `{ enabled, nav, order, label, layout }`. Legacy boolean overrides
// (enabled/disabled) are still accepted and upgraded. Pure — unit tested.
export function normalizeModuleConfig(id, base, override) {
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
  const layout =
    typeof override.layout === 'string' && MODULE_LAYOUTS.has(override.layout.trim())
      ? override.layout.trim()
      : MODULE_LAYOUTS.has(baseConfig.layout)
        ? baseConfig.layout
        : 'default'
  return {
    ...baseConfig,
    ...override,
    enabled:
      override.enabled !== undefined ? override.enabled !== false : baseConfig.enabled !== false,
    nav: override.nav !== undefined ? override.nav !== false : baseConfig.nav === true,
    order: Number.isFinite(order) ? order : (baseConfig.order ?? 0),
    label: deepMerge(baseConfig.label || fallbackLabel, override.label),
    layout,
  }
}

// Resolve the full MODULES map from base + override, normalizing every entry.
export function resolveModules(baseModules, overrideModules) {
  const next = {}
  Object.keys(baseModules || {}).forEach(id => {
    next[id] = normalizeModuleConfig(id, baseModules?.[id], overrideModules?.[id])
  })
  return next
}

export function buildNavigationItems(modules, legacyNav = []) {
  const home = (Array.isArray(legacyNav) && legacyNav.find(item => item?.id === 'home')) || {
    num: '00',
    id: 'home',
    label: { en: 'Home', zh: '首页' },
  }
  const visibleModules = Object.entries(modules || {})
    .filter(([, config]) => config?.enabled !== false && config?.nav === true)
    .sort(
      ([leftId, left], [rightId, right]) =>
        (left.order ?? 0) - (right.order ?? 0) || leftId.localeCompare(rightId),
    )
    .map(([id, config], index) => ({
      id,
      num: String(index + 1).padStart(2, '0'),
      label: config.label,
    }))

  return [home, ...visibleModules]
}
