import { collectDataUrls, exportAllWarning, findMissingPublicPaths } from './export.js'
import { validateSiteData } from './validation.js'

export const MAX_AUDIT_TITLE_LENGTH = 80
export const MAX_INLINE_DATA_URL_KB = 100

const TITLE_FIELDS = {
  JOURNEY: 'title',
  WORKS: 'title',
  BOOKS: 'title',
  READING_LOG: 'title',
  USER_READING_LOG: 'title',
  FILMS: 'title',
  MUSIC: 'track',
  PHOTOS: 'caption',
  TRAVEL: 'city',
}

const LINK_FIELD = /(?:^|\.)(?:url|href|link|secondaryUrl)$/i
const SAFE_INLINE_TAG = /^\/?(?:em|strong|br)\s*\/?$/i

function message(en, zh) {
  return { en, zh }
}

function sectionFromPath(path) {
  return String(path || 'data').split(/[.[\]]/, 1)[0] || 'data'
}

function item(severity, code, path, text) {
  return {
    severity,
    code,
    path,
    section: sectionFromPath(path),
    message: text,
  }
}

function reportFromItems(items, extra = {}) {
  return {
    items,
    errors: items.filter(entry => entry.severity === 'error'),
    warnings: items.filter(entry => entry.severity === 'warning'),
    ...extra,
  }
}

function stringsAt(value, path) {
  if (typeof value === 'string' || typeof value === 'number') {
    return [{ path, value: String(value) }]
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return ['en', 'zh']
      .filter(lang => value[lang] !== undefined)
      .map(lang => ({ path: `${path}.${lang}`, value: String(value[lang] ?? '') }))
  }
  return []
}

function hasPlaceholder(value) {
  if (typeof value !== 'string') return false
  return [...value.matchAll(/<([^<>]+)>/g)].some(match => !SAFE_INLINE_TAG.test(match[1].trim()))
}

function walkStrings(value, path, visit) {
  if (typeof value === 'string') {
    visit(value, path)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkStrings(entry, `${path}[${index}]`, visit))
    return
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => walkStrings(entry, `${path}.${key}`, visit))
  }
}

function structuralPath(error) {
  return error.match(/[A-Z][A-Z0-9_]*(?:\.[A-Za-z0-9_]+|\[\d+\])*/)?.[0] || 'data'
}

export function auditMessage(entry, lang = 'en') {
  const value = entry?.message
  if (typeof value === 'string') return value
  return value?.[lang] || value?.zh || value?.en || ''
}

export function formatAuditError(entry, lang = 'en') {
  const text = auditMessage(entry, lang)
  return entry?.path ? `${entry.path}: ${text}` : text
}

export function auditSiteData(data) {
  const items = []

  validateSiteData(data).forEach(error => {
    const path = structuralPath(error)
    items.push(item('error', 'invalid-structure', path, message(error, error)))
  })

  walkStrings(data, 'data', (value, path) => {
    if (hasPlaceholder(value)) {
      items.push(
        item(
          'error',
          'unresolved-placeholder',
          path.replace(/^data\./, ''),
          message('Replace the unresolved <...> placeholder.', '请替换尚未完成的 <...> 占位符。'),
        ),
      )
    }
  })

  collectDataUrls(data, 'data').forEach(ref => {
    const path = ref.path.replace(/^data\./, '')
    items.push(
      item(
        ref.kb > MAX_INLINE_DATA_URL_KB ? 'error' : 'warning',
        'embedded-data-url',
        path,
        message(
          `This field contains an embedded data URL (${ref.kb}KB). Upload it to public/ first.`,
          `此字段包含内联 data URL（${ref.kb}KB），请先上传到 public/。`,
        ),
      ),
    )
  })

  if (!String(data?.SITE?.portrait || '').trim()) {
    items.push(
      item(
        'error',
        'missing-portrait',
        'SITE.portrait',
        message('Add a portrait image path.', '请填写头像图片路径。'),
      ),
    )
  }
  if (!String(data?.SITE?.ogImage || '').trim()) {
    items.push(
      item(
        'warning',
        'missing-og-image',
        'SITE.ogImage',
        message(
          'Add a dedicated 1200x630 social image before deployment.',
          '部署前请添加独立的 1200×630 社交分享图。',
        ),
      ),
    )
  }

  Object.entries(TITLE_FIELDS).forEach(([section, field]) => {
    const entries = data?.[section]
    if (!Array.isArray(entries)) return

    entries.forEach((entry, index) => {
      const path = `${section}[${index}].${field}`
      const values = stringsAt(entry?.[field], path)
      if (!values.length || values.every(value => !value.value.trim())) {
        items.push(
          item(
            'error',
            'missing-title',
            path,
            message('Add a title for this entry.', '请为此条目填写标题。'),
          ),
        )
        return
      }

      values.forEach(value => {
        if (value.value.trim().length > MAX_AUDIT_TITLE_LENGTH) {
          items.push(
            item(
              'warning',
              'long-title',
              value.path,
              message(
                `Title is longer than ${MAX_AUDIT_TITLE_LENGTH} characters and may wrap poorly.`,
                `标题超过 ${MAX_AUDIT_TITLE_LENGTH} 个字符，可能影响排版。`,
              ),
            ),
          )
        }
      })
    })
  })

  walkStrings(data, 'data', (value, path) => {
    const cleanPath = path.replace(/^data\./, '')
    if (LINK_FIELD.test(cleanPath) && (!value.trim() || value.trim() === '#')) {
      items.push(
        item(
          'warning',
          'empty-link',
          cleanPath,
          message('Replace the empty or placeholder link.', '请替换空链接或 # 占位链接。'),
        ),
      )
    }
  })

  return reportFromItems(items, { exportWarning: exportAllWarning(data) })
}

export async function runSiteAudit(data) {
  const base = auditSiteData(data)
  const paths = await findMissingPublicPaths(data, 'content')
  const pathItems = paths.missing.map(ref =>
    item(
      'error',
      'missing-public-asset',
      ref.path.replace(/^content\./, ''),
      message(
        `Public asset is unavailable (${ref.status}): ${ref.url}`,
        `public 资源不可访问（${ref.status}）：${ref.url}`,
      ),
    ),
  )

  return reportFromItems([...base.items, ...pathItems], {
    exportWarning: base.exportWarning,
    assets: paths,
  })
}
