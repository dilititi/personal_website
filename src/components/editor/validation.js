import { ABOUT_SCHEMA, EXPORTABLE_SECTIONS, SITE_SCHEMA, moduleConfigFields } from './schema.js'
import { MODULE_IDS } from '../../lib/module-manifest.js'

export function isRecord(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

export function validateImportData(parsed) {
  const known = new Set(EXPORTABLE_SECTIONS.map(s => s.key))
  const topKeys = Object.keys(parsed)
  const unknown = topKeys.filter(k => /^[A-Z][A-Z_]*$/.test(k) && !known.has(k))
  if (unknown.length) {
    return { valid: false, error: `未知章节: ${unknown.join(', ')}` }
  }

  const sections = topKeys.filter(k => known.has(k))
  if (sections.length === 0) {
    return { valid: false, error: '没有找到可识别的顶层章节键(应该是 SITE / ABOUT 等大写名)' }
  }

  for (const key of sections) {
    const section = EXPORTABLE_SECTIONS.find(s => s.key === key)
    const err = validateSectionValue(section, parsed[key])
    if (err) return { valid: false, error: err }
  }

  return { valid: true, data: parsed, sections }
}

export function validateSectionValue(section, value) {
  if (!section) return '未知章节'
  if (section.type === 'raw') {
    return isRecord(value) ? '' : `${section.key} 必须是对象`
  }
  if (section.key === 'SITE') return validateFields(SITE_SCHEMA, value, 'SITE')
  if (section.key === 'MODULES') return validateModulesValue(value)
  if (section.key === 'ABOUT') return validateFields(ABOUT_SCHEMA, value, 'ABOUT')
  if (section.type === 'now-playing') {
    if (!isRecord(value)) return 'NOW_PLAYING 必须是对象'
    for (const src of ['spotify', 'netease', 'html5']) {
      if (value[src] !== undefined && !Array.isArray(value[src])) {
        return `NOW_PLAYING.${src} 必须是数组`
      }
    }
    return ''
  }
  if (section.type === 'array' || section.type === 'photos') {
    if (!Array.isArray(value)) return `${section.key} 必须是数组`
    for (let i = 0; i < value.length; i += 1) {
      const err = validateArrayItem(section.itemSchema, value[i], `${section.key}[${i}]`)
      if (err) return err
    }
  }
  return ''
}

function validateArrayItem(schema, value, path) {
  if (Array.isArray(schema)) return validateFields(schema, value, path)
  return validateFieldValue(schema, value, path)
}

function validateModulesValue(value) {
  if (!isRecord(value)) return 'MODULES 必须是对象'
  for (const [key, moduleValue] of Object.entries(value)) {
    if (!MODULE_IDS.has(key)) return `MODULES.${key} 没有对应的页面模块`
    if (typeof moduleValue === 'boolean') continue
    if (!isRecord(moduleValue)) return `MODULES.${key} 必须是 true/false 或模块配置对象`
    const err = validateFields(moduleConfigFields, moduleValue, `MODULES.${key}`)
    if (err) return err
  }
  return ''
}

export function validateFields(fields, value, path) {
  if (!isRecord(value)) return `${path} 必须是对象`
  for (const field of fields) {
    if (!(field.key in value)) {
      if (field.required) return `${path}.${field.key} 为必填字段`
      continue
    }
    if (field.required && (value[field.key] === undefined || value[field.key] === null)) {
      return `${path}.${field.key} 为必填字段`
    }
    const err = validateFieldValue(field, value[field.key], `${path}.${field.key}`)
    if (err) return err
  }
  return ''
}

function validateFieldValue(field, value, path) {
  if (value === undefined || value === null) return ''
  switch (field.type) {
    case 'str':
    case 'text':
    case 'file-image':
    case 'file-audio':
    case 'file-pdf':
      return typeof value === 'string' || typeof value === 'number' ? '' : `${path} 必须是字符串`
    case 'num':
      return typeof value === 'number' ||
        (typeof value === 'string' && (value === '' || !Number.isNaN(Number(value))))
        ? ''
        : `${path} 必须是数字`
    case 'select':
      return field.options?.some(option => option.value === value) ? '' : `${path} 必须是可选值之一`
    case 'bool':
      return typeof value === 'boolean' ? '' : `${path} 必须是 true/false`
    case 'bi':
    case 'bi-text':
    case 'bi-text-bare':
      return typeof value === 'string' || (isRecord(value) && ('en' in value || 'zh' in value))
        ? ''
        : `${path} 必须是字符串或 { en, zh }`
    case 'str-arr':
      return Array.isArray(value) ? '' : `${path} 必须是字符串数组`
    case 'obj':
      return validateFields(field.fields || [], value, path)
    case 'obj-arr':
      if (!Array.isArray(value)) return `${path} 必须是数组`
      for (let i = 0; i < value.length; i += 1) {
        const err = validateArrayItem(field.itemSchema, value[i], `${path}[${i}]`)
        if (err) return err
      }
      return ''
    default:
      return ''
  }
}

// ════════════════════════════════════════════════════════════════════

export function validateSiteData(data) {
  const errors = []
  if (!data?.SITE?.name) errors.push('Missing SITE.name')
  if (!data?.MODULES || typeof data.MODULES !== 'object') errors.push('MODULES should be an object')
  if (!Array.isArray(data?.NAV)) errors.push('NAV should be an array')
  for (const section of EXPORTABLE_SECTIONS) {
    const err = validateSectionValue(section, data?.[section.key])
    if (err) errors.push(err)
  }
  return errors
}
