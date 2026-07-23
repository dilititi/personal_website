import React, { useState } from 'react'
import { useLang } from '../../lang.jsx'
import { useData } from '../../data-context.jsx'
import { pick } from '../../data.js'
import { ABOUT_SCHEMA, MODULES_SCHEMA, SITE_SCHEMA } from './schema.js'
import { JsonEditor, ObjectArrayField, ObjectField } from './fields/index.jsx'
import { FIELD_TEMPLATES } from './contentPresets.js'
import ImportPanel from './ImportPanel.jsx'
import AuditPanel from './AuditPanel.jsx'

export default function SectionEditor({ section, value, onChange, onTemplateApply }) {
  const data = useData()
  const { lang } = useLang()

  if (section.type === 'import') return <ImportPanel />
  if (section.type === 'audit') return <AuditPanel />
  if (section.key === 'SITE') {
    return (
      <>
        <SectionTemplateStrip
          templates={FIELD_TEMPLATES.SITE}
          onApply={(next, label) => {
            onTemplateApply?.(label)
            onChange(next)
          }}
        />
        <ObjectField
          value={value}
          onChange={onChange}
          fields={SITE_SCHEMA}
          onTemplateApply={onTemplateApply}
        />
      </>
    )
  }
  if (section.key === 'MODULES') {
    return (
      <>
        <ModuleOrderPanel value={value} onChange={onChange} />
        <ObjectField
          value={value}
          onChange={onChange}
          fields={MODULES_SCHEMA}
          onTemplateApply={onTemplateApply}
        />
      </>
    )
  }
  if (section.key === 'ABOUT') {
    return (
      <>
        <SectionTemplateStrip
          templates={FIELD_TEMPLATES.ABOUT}
          onApply={(next, label) => {
            onTemplateApply?.(label)
            onChange(next)
          }}
        />
        <ObjectField
          value={value}
          onChange={onChange}
          fields={ABOUT_SCHEMA}
          onTemplateApply={onTemplateApply}
        />
      </>
    )
  }
  if (section.key === 'NAV') {
    const home = (Array.isArray(value) && value.find(item => item?.id === 'home')) || {
      num: '00',
      id: 'home',
      label: { en: 'Home', zh: '首页' },
      en: { en: 'home', zh: '首页' },
    }
    return (
      <>
        <p className="ce-hint">{section.hint}</p>
        <ObjectField
          value={home}
          onChange={next => onChange([{ ...next, id: 'home', num: '00' }])}
          fields={section.itemSchema}
          onTemplateApply={onTemplateApply}
        />
      </>
    )
  }
  if (section.type === 'photos') {
    const seriesLabels = {}
    ;(data.PHOTO_SERIES || []).forEach(series => {
      if (series.id !== 'all') seriesLabels[series.id] = pick(series.label, lang)
    })
    return (
      <ObjectArrayField
        value={value}
        onChange={onChange}
        itemSchema={section.itemSchema}
        titleFor={section.titleFor}
        groupBy="series"
        groupLabels={seriesLabels}
        itemTemplates={FIELD_TEMPLATES[section.key] || []}
        onTemplateApply={onTemplateApply}
      />
    )
  }
  if (section.type === 'array') {
    return (
      <ObjectArrayField
        value={value}
        onChange={onChange}
        itemSchema={section.itemSchema}
        titleFor={section.titleFor}
        itemTemplates={FIELD_TEMPLATES[section.key] || []}
        onTemplateApply={onTemplateApply}
      />
    )
  }
  if (section.type === 'now-playing') {
    const current = value || { spotify: [], netease: [], html5: [] }
    return (
      <div className="ce-np-editor">
        {['spotify', 'netease', 'html5'].map(source => (
          <div key={source} className="ce-np-group">
            <h4 className="ce-np-group-title">{source.toUpperCase()}</h4>
            <ObjectArrayField
              value={current[source] || []}
              onChange={items => onChange({ ...current, [source]: items })}
              itemSchema={section.itemSchema}
              titleFor={entry =>
                (typeof entry.track === 'object' ? entry.track?.en : entry.track) || '(empty)'
              }
              itemTemplates={source === 'html5' ? FIELD_TEMPLATES.MUSIC || [] : []}
              onTemplateApply={onTemplateApply}
            />
          </div>
        ))}
      </div>
    )
  }
  if (section.type === 'raw') {
    return (
      <>
        {section.hint && <p className="ce-hint">{section.hint}</p>}
        <JsonEditor value={value} onChange={onChange} />
      </>
    )
  }
  return <p>未实现的章节类型：{section.type}</p>
}

function SectionTemplateStrip({ templates = [], onApply }) {
  if (!templates.length) return null
  return (
    <div className="ce-field-template-row ce-section-template-row">
      <span className="ce-field-template-label">预制模板</span>
      {templates.map(template => (
        <button
          key={template.id}
          type="button"
          className="ce-field-template-btn"
          onClick={() => {
            if (!window.confirm(`应用「${template.label}」会覆盖当前字段内容，继续吗？`)) return
            onApply(cloneValue(template.value), template.label)
          }}
        >
          {template.label}
        </button>
      ))}
    </div>
  )
}

function ModuleOrderPanel({ value, onChange }) {
  const [draggingKey, setDraggingKey] = useState('')
  const [dropKey, setDropKey] = useState('')
  if (!value || typeof value !== 'object') return null

  const rows = MODULES_SCHEMA.map((field, index) => {
    const raw = value[field.key]
    const config = raw && typeof raw === 'object' ? raw : { enabled: raw !== false }
    return {
      key: field.key,
      label: field.label,
      index,
      config,
      order: Number.isFinite(Number(config.order)) ? Number(config.order) : index + 1,
    }
  }).sort((left, right) => left.order - right.order || left.index - right.index)

  const applyOrder = nextRows => {
    const next = { ...value }
    nextRows.forEach((row, index) => {
      next[row.key] = { ...(row.config || {}), order: (index + 1) * 10 }
    })
    onChange(next)
  }

  const move = (key, delta) => {
    const current = rows.findIndex(row => row.key === key)
    const target = current + delta
    if (current < 0 || target < 0 || target >= rows.length) return
    const nextRows = rows.slice()
    const [item] = nextRows.splice(current, 1)
    nextRows.splice(target, 0, item)
    applyOrder(nextRows)
  }

  const moveBefore = (sourceKey, targetKey) => {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return
    const sourceIndex = rows.findIndex(row => row.key === sourceKey)
    const targetIndex = rows.findIndex(row => row.key === targetKey)
    if (sourceIndex < 0 || targetIndex < 0) return
    const nextRows = rows.slice()
    const [item] = nextRows.splice(sourceIndex, 1)
    const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
    nextRows.splice(adjustedTarget, 0, item)
    applyOrder(nextRows)
  }

  const finishDrag = () => {
    setDraggingKey('')
    setDropKey('')
  }

  return (
    <div className="ce-module-order-panel">
      <div className="ce-module-order-head">
        <span>模块顺序</span>
        <small>拖动左侧手柄，页面与导航会同步排序</small>
      </div>
      <div className="ce-module-order-list">
        {rows.map((row, index) => (
          <div
            className={[
              'ce-module-order-row',
              draggingKey === row.key ? 'is-dragging' : '',
              dropKey === row.key && draggingKey !== row.key ? 'is-drop-target' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={row.key}
            data-module-key={row.key}
            draggable
            onDragStart={event => {
              setDraggingKey(row.key)
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', row.key)
            }}
            onDragOver={event => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              setDropKey(row.key)
            }}
            onDragLeave={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDropKey('')
            }}
            onDrop={event => {
              event.preventDefault()
              moveBefore(event.dataTransfer.getData('text/plain') || draggingKey, row.key)
              finishDrag()
            }}
            onDragEnd={finishDrag}
          >
            <span className="ce-module-order-handle" aria-hidden="true" title="拖动排序">
              ⠿
            </span>
            <span className="ce-module-order-rank">{String(index + 1).padStart(2, '0')}</span>
            <span className="ce-module-order-name">{row.label}</span>
            <span className="ce-module-order-meta">
              {row.config.enabled === false ? 'hidden' : 'enabled'}
              {' · '}
              {row.config.nav === false ? 'no nav' : 'nav'}
              {' · '}
              {row.config.layout || 'default'}
            </span>
            <div className="ce-module-order-actions">
              <button
                type="button"
                className="ce-field-template-btn"
                disabled={index === 0}
                onClick={() => move(row.key, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="ce-field-template-btn"
                disabled={index === rows.length - 1}
                onClick={() => move(row.key, 1)}
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function cloneValue(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}
