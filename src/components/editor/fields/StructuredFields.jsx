import React, { useState } from 'react'
import { useLang } from '../../../lang.jsx'
import {
  BilingualField,
  BoolField,
  NumberField,
  SelectField,
  StringArrayField,
  StringField,
} from './BasicFields.jsx'
import { FileField } from './FileField.jsx'

export function ObjectField({ value, onChange, fields, onTemplateApply }) {
  const v = value && typeof value === 'object' ? value : {}
  const setKey = (k, kv) => onChange({ ...v, [k]: kv })
  return (
    <div className="ce-obj">
      {fields.map(f => (
        <FieldRow
          key={f.key}
          field={f}
          value={v[f.key]}
          onChange={kv => setKey(f.key, kv)}
          onTemplateApply={onTemplateApply}
        />
      ))}
    </div>
  )
}

// ─── FileField: pick → preview → write to project's public/{subfolder}/ ───
// In production this endpoint doesn't exist — users edit content during local dev only.

export function ObjectArrayField({
  value,
  onChange,
  itemSchema,
  titleFor,
  groupBy,
  groupLabels,
  itemTemplates = [],
  onTemplateApply,
}) {
  const { lang } = useLang()
  const arr = Array.isArray(value) ? value : []
  const [expanded, setExpanded] = useState({})

  const update = (i, v) => onChange(arr.map((x, k) => (k === i ? v : x)))
  const remove = i => {
    if (!window.confirm('删除这一项？')) return
    onChange(arr.filter((_, k) => k !== i))
    setExpanded(e => {
      const n = { ...e }
      delete n[i]
      return n
    })
  }
  const add = presetGroup => {
    const empty = createEmpty(itemSchema)
    if (groupBy && presetGroup !== undefined) empty[groupBy] = presetGroup
    onChange([...arr, empty])
    setExpanded(e => ({ ...e, [arr.length]: true }))
  }
  const addTemplate = template => {
    onTemplateApply?.(template.label)
    const item = deepClone(template.value)
    if (groupBy && !item[groupBy]) item[groupBy] = Object.keys(groupLabels || {})[0] || ''
    onChange([...arr, item])
    setExpanded(e => ({ ...e, [arr.length]: true }))
  }
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    const next = arr.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  // Render a single card (extracted so it works for both flat and grouped layouts).
  const renderCard = (item, i) => {
    const title = titleFor ? titleFor(item, i, lang) : `Item ${i + 1}`
    const isOpen = expanded[i]
    return (
      <div key={i} className={`ce-arr-card ${isOpen ? 'open' : ''}`}>
        <div className="ce-arr-card-head">
          <button
            type="button"
            className="ce-arr-card-toggle"
            onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
          >
            <span className="ce-arr-card-chevron">{isOpen ? '▼' : '▶'}</span>
            <span className="ce-arr-card-title">{title || '(empty)'}</span>
          </button>
          <div className="ce-arr-card-actions">
            {!groupBy && (
              <>
                <button
                  type="button"
                  className="ce-icon-btn"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="ce-icon-btn"
                  onClick={() => move(i, +1)}
                  disabled={i === arr.length - 1}
                  title="下移"
                >
                  ↓
                </button>
              </>
            )}
            <button
              type="button"
              className="ce-icon-btn ce-danger"
              onClick={() => remove(i)}
              title="删除"
            >
              ×
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="ce-arr-card-body">
            {Array.isArray(itemSchema) ? (
              itemSchema.map(f => (
                <FieldRow
                  key={f.key}
                  field={f}
                  value={item?.[f.key]}
                  onChange={kv => update(i, { ...item, [f.key]: kv })}
                  onTemplateApply={onTemplateApply}
                />
              ))
            ) : (
              <SingleItemEditor
                schema={itemSchema}
                value={item}
                onChange={v => update(i, v)}
                onTemplateApply={onTemplateApply}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Grouped layout (e.g. PHOTOS by series) ──
  if (groupBy) {
    const groups = {}
    const orderedKeys = []
    arr.forEach((item, idx) => {
      const k = item?.[groupBy] ?? '(未分类)'
      if (!groups[k]) {
        groups[k] = []
        orderedKeys.push(k)
      }
      groups[k].push({ item, idx })
    })
    // Also include groupLabels keys that have no items (so user can see empty groups)
    if (groupLabels) {
      Object.keys(groupLabels).forEach(k => {
        if (!groups[k]) {
          groups[k] = []
          orderedKeys.push(k)
        }
      })
    }
    return (
      <div className="ce-arr ce-arr-grouped">
        <TemplateButtons templates={itemTemplates} onApply={addTemplate} />
        {orderedKeys.map(gk => (
          <div key={gk} className="ce-arr-group">
            <div className="ce-arr-group-head">
              <span className="ce-arr-group-name">{groupLabels?.[gk] || gk}</span>
              <span className="ce-arr-group-count">{groups[gk].length} 项</span>
              <button type="button" className="ce-add-btn ce-add-inline" onClick={() => add(gk)}>
                + 新增到此组
              </button>
            </div>
            {groups[gk].length === 0 && (
              <div className="ce-arr-group-empty">空。点上方按钮新增一项。</div>
            )}
            {groups[gk].map(({ item, idx }) => renderCard(item, idx))}
          </div>
        ))}
      </div>
    )
  }

  // ── Flat layout (default) ──
  return (
    <div className="ce-arr">
      <TemplateButtons templates={itemTemplates} onApply={addTemplate} />
      {arr.map((item, i) => renderCard(item, i))}
      <button type="button" className="ce-add-btn ce-add-arr" onClick={() => add()}>
        + 新增一项
      </button>
    </div>
  )
}

function TemplateButtons({ templates, onApply }) {
  if (!templates.length) return null
  return (
    <div className="ce-field-template-row">
      <span className="ce-field-template-label">预制条目</span>
      {templates.map(template => (
        <button
          key={template.id}
          type="button"
          className="ce-field-template-btn"
          onClick={() => onApply(template)}
        >
          {template.label}
        </button>
      ))}
    </div>
  )
}

function SingleItemEditor({ schema, value, onChange, onTemplateApply }) {
  const fakeField = { ...schema, key: '_', label: '' }
  return (
    <FieldRow
      field={fakeField}
      value={value}
      onChange={onChange}
      onTemplateApply={onTemplateApply}
      hideLabel
    />
  )
}

// Generic field row — picks the right input component for the field type.
// IMPORTANT: don't wrap the switch in an inline component like `<Body />` —
// that creates a new component identity every render and unmounts inputs,
// which makes any focused input lose focus after every keystroke. Use a
// plain function call instead so React just sees JSX, not a new component.
function FieldRow({ field, value, onChange, hideLabel, onTemplateApply }) {
  let body
  switch (field.type) {
    case 'str':
      body = <StringField value={value} onChange={onChange} placeholder={field.placeholder} />
      break
    case 'text':
      body = (
        <StringField value={value} onChange={onChange} multiline placeholder={field.placeholder} />
      )
      break
    case 'num':
      body = <NumberField value={value} onChange={onChange} placeholder={field.placeholder} />
      break
    case 'select':
      body = <SelectField value={value} onChange={onChange} options={field.options || []} />
      break
    case 'bi':
      body = <BilingualField value={value} onChange={onChange} />
      break
    case 'bi-text':
    case 'bi-text-bare':
      body = <BilingualField value={value} onChange={onChange} multiline />
      break
    case 'str-arr':
      body = <StringArrayField value={value} onChange={onChange} />
      break
    case 'obj':
      body = (
        <ObjectField
          value={value}
          onChange={onChange}
          fields={field.fields}
          onTemplateApply={onTemplateApply}
        />
      )
      break
    case 'obj-arr':
      body = (
        <ObjectArrayField
          value={value}
          onChange={onChange}
          itemSchema={field.itemSchema}
          titleFor={field.titleFor}
          onTemplateApply={onTemplateApply}
        />
      )
      break
    case 'file-image':
      body = (
        <FileField
          value={value}
          onChange={onChange}
          subfolder={field.subfolder || 'picture'}
          accept="image/*"
          onTemplateApply={onTemplateApply}
        />
      )
      break
    case 'file-audio':
      body = (
        <FileField
          value={value}
          onChange={onChange}
          subfolder={field.subfolder || 'audio'}
          accept="audio/*"
          isAudio
          onTemplateApply={onTemplateApply}
        />
      )
      break
    case 'file-pdf':
      body = (
        <FileField
          value={value}
          onChange={onChange}
          subfolder={field.subfolder || 'docs'}
          accept="application/pdf"
          isAudio
          onTemplateApply={onTemplateApply}
        />
      )
      break
    case 'bool':
      body = <BoolField value={value} onChange={onChange} />
      break
    default:
      body = <code className="ce-unsupported">未支持的字段类型: {field.type}</code>
  }
  return (
    <div className={`ce-field ce-field-${field.type}`}>
      {!hideLabel && <label className="ce-field-label">{field.label || field.key}</label>}
      <div className="ce-field-input">{body}</div>
    </div>
  )
}

// Create an empty value matching a schema (for "+ add new")
function createEmpty(schema) {
  if (!Array.isArray(schema)) {
    // Single-field item — return empty value for that type
    if (schema?.type === 'bi' || schema?.type === 'bi-text' || schema?.type === 'bi-text-bare')
      return { en: '', zh: '' }
    if (schema?.type === 'num') return 0
    if (schema?.type === 'bool') return true
    if (schema?.type === 'select') return schema.options?.[0]?.value || ''
    return ''
  }
  const obj = {}
  for (const f of schema) {
    if (f.type === 'bi' || f.type === 'bi-text') obj[f.key] = { en: '', zh: '' }
    else if (f.type === 'num') obj[f.key] = 0
    else if (f.type === 'bool') obj[f.key] = true
    else if (f.type === 'select') obj[f.key] = f.options?.[0]?.value || ''
    else if (f.type === 'str-arr') obj[f.key] = []
    else if (f.type === 'obj-arr') obj[f.key] = []
    else if (f.type === 'obj') obj[f.key] = createEmpty(f.fields)
    else obj[f.key] = ''
  }
  return obj
}

function deepClone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}

// ════════════════════════════════════════════════════════════════════
// JSON RAW EDITOR — for sections too complex for schema (TEXTS)
// ════════════════════════════════════════════════════════════════════
