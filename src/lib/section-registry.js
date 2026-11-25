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

function workTitles(title) {
  const values = typeof title === 'string' ? [title] : [title?.zh, title?.en]
  return values
    .filter(value => typeof value === 'string')
    .map(value =>
      value
        .normalize('NFKC')
        .trim()
        .replace(/^《(.+)》$/, '$1')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase(),
    )
    .filter(Boolean)
}

function fillWorkFields(original, fallback) {
  if (isPlainObject(original) && isPlainObject(fallback)) {
    return {
      ...fallback,
      ...Object.fromEntries(
        Object.entries(original).map(([key, value]) => [
          key,
          fillWorkFields(value, Object.hasOwn(fallback, key) ? fallback[key] : undefined),
        ]),
      ),
    }
  }
  if (original == null || original === '' || (Array.isArray(original) && !original.length)) {
    return fallback ?? original
  }
  return original
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
  const baseByTitle = new Map()
  for (const work of base) {
    for (const title of new Set(workTitles(work.title))) {
      baseByTitle.set(title, baseByTitle.has(title) ? null : work)
    }
  }
  const draft = overrideWorks.filter(isPlainObject)
  const idCounts = new Map()
  draft.forEach(work => {
    const id = workId(work)
    idCounts.set(id, (idCounts.get(id) || 0) + 1)
  })

  const draftTitles = draft.map(work => {
    const matches = new Set(
      workTitles(work.title)
        .map(title => baseByTitle.get(title))
        .filter(Boolean),
    )
    return matches.size === 1 ? matches.values().next().value : null
  })
  const identified = draft.map(
    (work, index) => baseByCover.get(coverPath(work)) || draftTitles[index],
  )
  const identifiedSources = new Set(identified.filter(Boolean))
  const matched = new Map()
  const rows = []
  draft.forEach((work, index) => {
    const id = workId(work)
    const byId = baseById.get(id)
    // Don't borrow another project's published fields when an old draft reused its ID.
    const source =
      identified[index] ||
      (id && idCounts.get(id) === 1 && !identifiedSources.has(byId) ? byId : null)
    const earlier = source && matched.get(source)
    if (earlier && earlier.titleMatch === source && draftTitles[index] === source) {
      earlier.work = fillWorkFields(earlier.work, work)
      return
    }
    if (!source || earlier) {
      rows.push({ work: byId ? { ...work, id: '' } : work })
      return
    }
    const row = { work, source, titleMatch: draftTitles[index] }
    rows.push(row)
    matched.set(source, row)
  })

  const resolved = rows.map(({ work, source }) => {
    if (!source) return work
    const next = { ...deepMerge(source, work), id: source.id }
    if (!next.coverImg && source.coverImg) next.coverImg = source.coverImg
    if (!workTitles(next.title).length) next.title = source.title
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
