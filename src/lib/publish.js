import { collectDataUrls, exportLine, findMissingPublicPaths } from '../components/editor/export.js'
import { auditSiteData, formatAuditError } from '../components/editor/audit.js'

export const CONTENT_START = '// <<< EDITOR:CONTENT START >>>'
export const CONTENT_END = '// <<< EDITOR:CONTENT END >>>'
export const STYLE_START = '// <<< EDITOR:STYLE START >>>'
export const STYLE_END = '// <<< EDITOR:STYLE END >>>'
const MAX_INLINE_DATA_URL_KB = 100

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function markerBounds(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker)
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Missing or invalid editor markers: ${startMarker} / ${endMarker}`)
  }
  if (source.indexOf(startMarker, start + startMarker.length) >= 0) {
    throw new Error(`Duplicate editor marker: ${startMarker}`)
  }
  if (source.indexOf(endMarker, end + endMarker.length) >= 0) {
    throw new Error(`Duplicate editor marker: ${endMarker}`)
  }
  return {
    bodyStart: start + startMarker.length,
    bodyEnd: end,
  }
}

function declarationRange(source, name) {
  const pattern = new RegExp(`^export const ${escapeRegExp(name)}\\s*=`, 'm')
  const match = pattern.exec(source)
  if (!match) return null

  let index = match.index + match[0].length
  while (/\s/.test(source[index] || '')) index += 1

  const expressionStart = index
  const root = source[index]
  const rootCloser = { '{': '}', '[': ']', '(': ')' }[root]
  let depth = 0
  let quote = ''
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = ''
        if (!rootCloser) return { start: match.index, end: index + 1 }
      }
      continue
    }
    if (char === '/' && next === '/') {
      lineComment = true
      index += 1
      continue
    }
    if (char === '/' && next === '*') {
      blockComment = true
      index += 1
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === '{' || char === '[' || char === '(') {
      depth += 1
      continue
    }
    if (char === '}' || char === ']' || char === ')') {
      depth -= 1
      if (depth < 0) break
      if (rootCloser && char === rootCloser && depth === 0) {
        let end = index + 1
        while (source[end] === ' ' || source[end] === '\t') end += 1
        if (source[end] === ';') end += 1
        return { start: match.index, end }
      }
      continue
    }
    if (!rootCloser && (char === '\n' || char === '\r' || char === ';')) {
      return { start: match.index, end: char === ';' ? index + 1 : index }
    }
  }

  throw new Error(`Could not parse export ${name} in the editable region at ${expressionStart}`)
}

export function replaceMarkedExports(source, { startMarker, endMarker, exports }) {
  const { bodyStart, bodyEnd } = markerBounds(source, startMarker, endMarker)
  const before = source.slice(0, bodyStart)
  const after = source.slice(bodyEnd)
  let body = source.slice(bodyStart, bodyEnd)
  const eol = source.includes('\r\n') ? '\r\n' : '\n'

  for (const [name, generated] of Object.entries(exports)) {
    const declaration = String(generated).trim().replace(/\r?\n/g, eol)
    const range = declarationRange(body, name)
    if (!range) throw new Error(`Export ${name} is outside the editable region`)
    body = `${body.slice(0, range.start)}${declaration}${body.slice(range.end)}`
  }

  return `${before}${body}${after}`
}

export function buildContentSource(source, data, changedKeys) {
  const exports = {}
  for (const key of [...new Set(changedKeys)].sort()) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || !(key in data)) {
      throw new Error(`Unknown publish section: ${key}`)
    }
    exports[key] = exportLine(key, data[key])
  }
  if (!Object.keys(exports).length) return source
  return replaceMarkedExports(source, {
    startMarker: CONTENT_START,
    endMarker: CONTENT_END,
    exports,
  })
}

export function buildStyleSource(source, styleExport) {
  return replaceMarkedExports(source, {
    startMarker: STYLE_START,
    endMarker: STYLE_END,
    exports: { DEFAULT_STYLE: styleExport },
  })
}

async function unresolvedPublicPaths(value, github, branch, scope) {
  const result = await findMissingPublicPaths(value, scope)
  if (!result.missing.length) return []

  const unresolved = []
  for (const item of result.missing) {
    try {
      const publicPath = item.url.split(/[?#]/, 1)[0].replace(/^\/+/, 'public/')
      await github.getFileMetadata(publicPath, branch)
    } catch (error) {
      if (error?.status === 404) {
        unresolved.push(item)
        continue
      }
      throw error
    }
  }
  return unresolved
}

function assertNoLargeDataUrls(value, scope) {
  const large = collectDataUrls(value, scope).filter(item => item.kb > MAX_INLINE_DATA_URL_KB)
  if (large.length) {
    throw new Error(
      `${large[0].path} contains an embedded data URL (${large[0].kb}KB). Upload it to public/ first.`,
    )
  }
}

export async function validateContentPublication(data, github, branch) {
  const audit = auditSiteData(data)
  if (audit.errors.length) throw new Error(formatAuditError(audit.errors[0]))
  const missing = await unresolvedPublicPaths(data, github, branch, 'content')
  if (missing.length) {
    throw new Error(`Missing public asset: ${missing[0].path} -> ${missing[0].url}`)
  }
}

export async function validateStylePublication(style, github, branch) {
  if (!style || typeof style !== 'object' || Array.isArray(style)) {
    throw new Error('Style must be an object')
  }
  assertNoLargeDataUrls(style, 'style')
  const missing = await unresolvedPublicPaths(style, github, branch, 'style')
  if (missing.length) {
    throw new Error(`Missing public asset: ${missing[0].path} -> ${missing[0].url}`)
  }
}

export async function publishContent({
  github,
  branch,
  data,
  changedKeys,
  message = 'content: update via editor',
}) {
  await validateContentPublication(data, github, branch)
  return github.updateFile({
    path: 'src/data.js',
    branch,
    message,
    transform: source => buildContentSource(source, data, changedKeys),
  })
}

export async function publishStyle({
  github,
  branch,
  style,
  styleExport,
  message = 'style: update via editor',
}) {
  await validateStylePublication(style, github, branch)
  return github.updateFile({
    path: 'src/style.js',
    branch,
    message,
    transform: source => buildStyleSource(source, styleExport),
  })
}
