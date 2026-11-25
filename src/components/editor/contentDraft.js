import { resolveWorks } from '../../lib/section-registry.js'

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function buildContentDraft({
  baseData = {},
  resolvedData = {},
  userOverrides = {},
  activeKey = '',
  workingValue,
}) {
  const resolved = { ...resolvedData }
  const overrides = { ...userOverrides }
  const canApplyWorkingValue =
    activeKey && !activeKey.startsWith('_') && workingValue !== null && workingValue !== undefined
  let workingChanged = false

  if (canApplyWorkingValue) {
    const value =
      activeKey === 'WORKS' && Array.isArray(workingValue)
        ? resolveWorks(baseData.WORKS, workingValue)
        : workingValue
    workingChanged = !sameValue(value, resolvedData[activeKey])
    resolved[activeKey] = value
    if (sameValue(value, baseData[activeKey])) delete overrides[activeKey]
    else overrides[activeKey] = value
  }

  const changedKeys = Object.keys(overrides).filter(
    key => key in resolved && !sameValue(resolved[key], baseData[key]),
  )

  return { resolved, overrides, changedKeys, workingChanged }
}
