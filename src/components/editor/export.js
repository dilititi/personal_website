import { dataUrlSizeKB } from '../../utils.js'
import { EXPORTABLE_SECTIONS } from './schema.js'
import { validateSectionValue, validateSiteData } from './validation.js'

export function jsLiteral(value, indent = '') {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return strLit(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map(v => indent + '  ' + jsLiteral(v, indent + '  '))
    return '[\n' + items.join(',\n') + '\n' + indent + ']'
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 2 && 'en' in value && 'zh' in value) {
      return `L(${strLit(value.en)}, ${strLit(value.zh)})`
    }
    if (keys.length === 0) return '{}'
    const items = keys.map(
      k => indent + '  ' + safeKey(k) + ': ' + jsLiteral(value[k], indent + '  '),
    )
    return '{\n' + items.join(',\n') + '\n' + indent + '}'
  }
  return String(value)
}

function strLit(s) {
  const v = s ?? ''
  // Single-quoted string with proper escapes
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'"
}

function safeKey(k) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : strLit(k)
}

export function exportLine(name, value) {
  return `export const ${name} = ${jsLiteral(value)}`
}

export function collectDataUrls(value, path = 'data') {
  const found = []
  const walk = (v, p) => {
    if (typeof v === 'string') {
      if (v.startsWith('data:')) found.push({ path: p, kb: dataUrlSizeKB(v) })
      return
    }
    if (Array.isArray(v)) {
      v.forEach((item, index) => walk(item, `${p}[${index}]`))
      return
    }
    if (v && typeof v === 'object') {
      Object.entries(v).forEach(([key, item]) => walk(item, `${p}.${key}`))
    }
  }
  walk(value, path)
  return found
}

const PUBLIC_ASSET_RE = /\.(avif|gif|jpe?g|m4a|mp3|ogg|pdf|png|svg|wav|webp)([?#].*)?$/i

export function collectPublicPathRefs(value, path = 'data') {
  const found = []
  const walk = (v, p) => {
    if (typeof v === 'string') {
      const text = v.trim()
      if (
        text.startsWith('/') &&
        !text.startsWith('//') &&
        !text.startsWith('/api/') &&
        PUBLIC_ASSET_RE.test(text)
      ) {
        found.push({ path: p, url: text })
      }
      return
    }
    if (Array.isArray(v)) {
      v.forEach((item, index) => walk(item, `${p}[${index}]`))
      return
    }
    if (v && typeof v === 'object') {
      Object.entries(v).forEach(([key, item]) => walk(item, `${p}.${key}`))
    }
  }
  walk(value, path)
  return found
}

export async function findMissingPublicPaths(value, path = 'data') {
  const refs = collectPublicPathRefs(value, path)
  const uniqueRefs = [...new Map(refs.map(ref => [ref.url, ref])).values()]
  const checked = await Promise.all(
    uniqueRefs.map(async ref => {
      try {
        let response = await fetch(ref.url, { method: 'HEAD', cache: 'no-store' })
        if (response.status === 405 || response.status === 501) {
          response = await fetch(ref.url, {
            method: 'GET',
            cache: 'no-store',
            headers: { Range: 'bytes=0-0' },
          })
        }
        return response.ok ? null : { ...ref, status: response.status }
      } catch {
        return { ...ref, status: 'unreachable' }
      }
    }),
  )
  return {
    total: refs.length,
    checked: uniqueRefs.length,
    missing: checked.filter(Boolean),
  }
}

export function pathWarning(result) {
  if (!result?.missing?.length) return ''
  const first = result.missing[0]
  const more = result.missing.length > 1 ? ` (+${result.missing.length - 1} more)` : ''
  return `Warning: ${result.missing.length} missing public path(s)${more}. First: ${first.path} -> ${first.url}`
}

export function exportWarning(sectionKey, value) {
  const section = EXPORTABLE_SECTIONS.find(s => s.key === sectionKey)
  const validation = section ? validateSectionValue(section, value) : ''
  if (validation) return `Warning: ${validation}`
  const dataUrls = collectDataUrls(value, sectionKey)
  if (!dataUrls.length) return ''
  const total = dataUrls.reduce((sum, item) => sum + item.kb, 0)
  return `Warning: export contains ${dataUrls.length} embedded data URL(s), about ${total}KB. Prefer public file paths for long-term publishing.`
}

export function exportAllWarning(data) {
  const validation = validateSiteData(data)
  if (validation.length) return `Warning: ${validation[0]}`
  const warnings = EXPORTABLE_SECTIONS.map(section =>
    exportWarning(section.key, data[section.key]),
  ).filter(Boolean)
  return warnings[0] || ''
}
