import { deepMerge, isPlainObject } from './persist.js'

const DATA_EXPORT_NAME = /^[A-Z][A-Z0-9_]*$/

export function createSectionRegistry(moduleExports) {
  return Object.fromEntries(
    Object.entries(moduleExports).filter(
      ([key, value]) => DATA_EXPORT_NAME.test(key) && typeof value !== 'function',
    ),
  )
}

function workId(work) {
  const id = work?.id
  return typeof id === 'string' || typeof id === 'number' ? String(id).trim() : ''
}

function coverPath(work) {
  const path = typeof work?.coverImg === 'string' ? work.coverImg.trim().split(/[?#]/, 1)[0] : ''
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

function hasTitle(title) {
  const values = typeof title === 'string' ? [title] : [title?.zh, title?.en]
  return values.some(value => typeof value === 'string' && value.trim())
}

function withUniqueWorkIds(works) {
  const reserved = new Set(works.map(workId))
  const seen = new Set()
  let next = 1
  return works.map(work => {
    let id = workId(work)
    if (!id || seen.has(id)) {
      do {
        id = `work-${next++}`
      } while (reserved.has(id))
      reserved.add(id)
    }
    seen.add(id)
    return work.id === id ? work : { ...work, id }
  })
}

export function resolveWorks(baseWorks, overrideWorks) {
  const base = Array.isArray(baseWorks) ? baseWorks.filter(isPlainObject) : []
  if (!Array.isArray(overrideWorks)) return withUniqueWorkIds(base)

  const baseById = new Map(base.map(work => [workId(work), work]))
  const baseByCover = new Map(base.filter(coverPath).map(work => [coverPath(work), work]))
  const draft = overrideWorks.filter(isPlainObject)
  const idCounts = new Map()
  draft.forEach(work => {
    const id = workId(work)
    idCounts.set(id, (idCounts.get(id) || 0) + 1)
  })

  const covers = draft.map(work => baseByCover.get(coverPath(work)))
  const covered = new Set(covers.filter(Boolean))
  const matched = new Set()
  const resolved = draft.map((work, index) => {
    const id = workId(work)
    const byId = baseById.get(id)
    // Don't borrow another project's published fields when an old draft reused its ID.
    const source =
      covers[index] || (id && idCounts.get(id) === 1 && !covered.has(byId) ? byId : null)
    if (!source || matched.has(source)) return byId ? { ...work, id: '' } : work
    matched.add(source)
    const next = { ...deepMerge(source, work), id: source.id }
    if (!next.coverImg && source.coverImg) next.coverImg = source.coverImg
    if (!hasTitle(next.title)) next.title = source.title
    return next
  })

  return withUniqueWorkIds(
    resolved.concat(base.filter(work => work.coverImg && !matched.has(work))),
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
