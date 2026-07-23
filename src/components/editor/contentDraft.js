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
    workingChanged = !sameValue(workingValue, resolvedData[activeKey])
    resolved[activeKey] = workingValue
    if (sameValue(workingValue, baseData[activeKey])) delete overrides[activeKey]
    else overrides[activeKey] = workingValue
  }

  const changedKeys = Object.keys(overrides).filter(
    key => key in resolved && !sameValue(resolved[key], baseData[key]),
  )

  return { resolved, overrides, changedKeys, workingChanged }
}
