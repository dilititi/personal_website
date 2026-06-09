import React, { useEffect, useRef, useState } from 'react'
import { useLang } from '../lang.jsx'
import { useData } from '../data-context.jsx'
import { pick } from '../data.js'
import { useStyle } from '../style-context.jsx'
import {
  ABOUT_SCHEMA,
  EXPORTABLE_SECTIONS,
  MODULES_SCHEMA,
  SECTIONS,
  SITE_SCHEMA,
} from './editor/schema.js'
import {
  exportAllWarning,
  exportLine,
  exportWarning,
  findMissingPublicPaths,
  pathWarning,
} from './editor/export.js'
import { JsonEditor, ObjectArrayField, ObjectField } from './editor/fields/index.jsx'
import { FIELD_TEMPLATES } from './editor/contentPresets.js'
import ImportPanel from './editor/ImportPanel.jsx'
import PreviewFrame from './editor/PreviewFrame.jsx'

function SectionEditor({ section, value, onChange, onTemplateApply }) {
  const data = useData()
  const { lang } = useLang()

  if (section.type === 'import') {
    return <ImportPanel />
  }
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
  if (section.type === 'photos') {
    const seriesLabels = {}
    ;(data.PHOTO_SERIES || []).forEach(s => {
      if (s.id !== 'all') seriesLabels[s.id] = pick(s.label, lang)
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
    const v = value || { spotify: [], netease: [], html5: [] }
    return (
      <div className="ce-np-editor">
        {['spotify', 'netease', 'html5'].map(src => (
          <div key={src} className="ce-np-group">
            <h4 className="ce-np-group-title">{src.toUpperCase()}</h4>
            <ObjectArrayField
              value={v[src] || []}
              onChange={arr => onChange({ ...v, [src]: arr })}
              itemSchema={section.itemSchema}
              titleFor={e => (typeof e.track === 'object' ? e.track?.en : e.track) || '(empty)'}
              itemTemplates={src === 'html5' ? FIELD_TEMPLATES.MUSIC || [] : []}
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
            onApply(deepClone(template.value), template.label)
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
  }).sort((a, b) => a.order - b.order || a.index - b.index)

  const applyOrder = nextRows => {
    const next = { ...value }
    nextRows.forEach((row, index) => {
      next[row.key] = {
        ...(row.config || {}),
        order: (index + 1) * 10,
      }
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

function formatLocalTs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function downloadJson(filenameStem, payload) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filenameStem}-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function ContentEditor({ open, onClose }) {
  const { lang } = useLang()
  const data = useData()
  const { setSection } = data
  const dataRef = useRef(data)
  dataRef.current = data
  const ceMainRef = useRef(null)
  const { style } = useStyle()
  const [activeKey, setActiveKey] = useState('SITE')
  const [workingValue, setWorkingValue] = useState(null)
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState('')
  const [templateUndo, setTemplateUndo] = useState(null)
  const [pathAudit, setPathAudit] = useState(null)
  const [checkingPaths, setCheckingPaths] = useState(false)
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('chen.ce.mode') === 'side' ? 'side' : 'modal'
    } catch {
      return 'modal'
    }
  })
  const [sideWidth, setSideWidth] = useState(() => {
    try {
      return Number(localStorage.getItem('chen.ce.sideWidth')) || 520
    } catch {
      return 520
    }
  })
  const [autoSave, setAutoSave] = useState(() => {
    try {
      const v = localStorage.getItem('chen.ce.autosave')
      return v === null ? true : v === '1'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('chen.ce.mode', mode)
    } catch {}
  }, [mode])
  useEffect(() => {
    try {
      localStorage.setItem('chen.ce.autosave', autoSave ? '1' : '0')
    } catch {}
  }, [autoSave])
  useEffect(() => {
    try {
      localStorage.setItem('chen.ce.sideWidth', String(sideWidth))
    } catch {}
  }, [sideWidth])

  const onResizeStart = e => {
    e.preventDefault()
    const startX = e.clientX
    const startW = sideWidth
    const onMove = ev => {
      const next = Math.max(360, Math.min(window.innerWidth - 100, startW + (startX - ev.clientX)))
      setSideWidth(next)
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  useEffect(() => {
    if (!open) return
    if (activeKey.startsWith('_')) {
      setWorkingValue(null)
      setShowCode(false)
      return
    }
    setWorkingValue(deepClone(dataRef.current[activeKey]))
    setShowCode(false)
  }, [activeKey, open])

  // Switching tabs reveals the new section's fields from the top of the panel.
  // The live-preview iframe no longer yanks the panel down (it only loads while
  // visible — see PreviewFrame), so a plain instant reset is enough here.
  useEffect(() => {
    if (ceMainRef.current) ceMainRef.current.scrollTop = 0
  }, [activeKey])

  useEffect(() => {
    if (!autoSave || workingValue == null || activeKey.startsWith('_')) return
    const id = setTimeout(() => {
      setSection(activeKey, workingValue)
    }, 400)
    return () => clearTimeout(id)
  }, [workingValue, autoSave, activeKey, setSection])

  const flushRef = useRef({ autoSave, workingValue, activeKey })
  useEffect(() => {
    flushRef.current = { autoSave, workingValue, activeKey }
  })
  useEffect(() => {
    return () => {
      const { autoSave: a, workingValue: wv, activeKey: ak } = flushRef.current
      if (a && wv != null && !ak.startsWith('_')) setSection(ak, wv)
    }
  }, [activeKey, open, setSection])

  useEffect(() => {
    if (!open) return
    if (mode === 'modal') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, mode, onClose])

  if (!open) return null

  const section = SECTIONS.find(s => s.key === activeKey) || SECTIONS[0]
  const isSpecial = activeKey.startsWith('_')
  const isOverridden = !isSpecial && data.isOverridden(activeKey)
  const sectionWarning =
    !isSpecial && workingValue != null ? exportWarning(activeKey, workingValue) : ''
  const showContentPreview = mode === 'modal' && !isSpecial

  const handleSave = () => {
    data.setSection(activeKey, workingValue)
    flash(setCopied, '✓ 已保存到浏览器（实时生效）')
  }

  const rememberTemplateUndo = label => {
    if (isSpecial || workingValue == null) return
    setTemplateUndo({
      key: activeKey,
      label,
      ts: Date.now(),
      value: deepClone(workingValue),
    })
  }

  const handleUndoTemplate = () => {
    if (!templateUndo || templateUndo.key !== activeKey) return
    const restored = deepClone(templateUndo.value)
    setWorkingValue(restored)
    data.setSection(activeKey, restored)
    setTemplateUndo(null)
    flash(setCopied, `↶ 已恢复到应用「${templateUndo.label}」前`)
  }

  const handleReset = () => {
    if (!window.confirm(`重置 ${activeKey} 到代码默认值？localStorage 里的编辑会丢失。`)) return
    data.resetSection(activeKey)
    setWorkingValue(deepClone(data.defaults[activeKey]))
    setTemplateUndo(null)
    flash(setCopied, '↺ 已重置到代码默认值')
  }

  const handleCopy = () => {
    const code = exportLine(activeKey, workingValue)
    navigator.clipboard.writeText(code).then(
      () => {
        flash(setCopied, '✓ 已复制代码到剪贴板')
      },
      () => {
        flash(setCopied, '✗ 复制失败，请手动选中下方代码块')
      },
    )
  }

  const exportDataWarning = async payload => {
    const structuralWarning = exportAllWarning(payload)
    if (structuralWarning) return structuralWarning
    const missingPaths = await findMissingPublicPaths(payload, 'content')
    return pathWarning(missingPaths)
  }

  const handleCheckPaths = async () => {
    setCheckingPaths(true)
    try {
      const result = await findMissingPublicPaths(data.resolvedData || data, 'content')
      setPathAudit({ ...result, checkedAt: Date.now() })
      flash(
        setCopied,
        result.missing.length
          ? lang === 'zh'
            ? `发现 ${result.missing.length} 个缺失媒体路径`
            : `${result.missing.length} missing media path(s)`
          : lang === 'zh'
            ? `✓ ${result.checked} 个媒体路径全部可访问`
            : `✓ ${result.checked} media path(s) available`,
      )
    } catch (error) {
      setPathAudit({
        total: 0,
        checked: 0,
        missing: [],
        error: error?.message || String(error),
        checkedAt: Date.now(),
      })
      flash(setCopied, lang === 'zh' ? '✗ 路径检查失败' : '✗ Path check failed')
    } finally {
      setCheckingPaths(false)
    }
  }

  const handleCopyAll = async () => {
    const payload = EXPORTABLE_SECTIONS.map(s => exportLine(s.key, data[s.key])).join('\n\n')
    const warning = await exportDataWarning(data.resolvedData || data)
    navigator.clipboard.writeText(payload).then(
      () => {
        flash(setCopied, warning || '✓ 已复制全部 export 到剪贴板')
      },
      () => {
        flash(setCopied, '✗ 复制失败')
      },
    )
  }

  const handleDownloadBackup = () => {
    try {
      downloadJson('chen-content-backup', data.exportOverrides())
      flash(setCopied, lang === 'zh' ? '✓ 已下载备份 JSON' : '✓ Backup JSON downloaded')
    } catch (e) {
      flash(
        setCopied,
        lang === 'zh'
          ? '✗ 下载失败：' + (e?.message || e)
          : '✗ Download failed: ' + (e?.message || e),
      )
    }
  }

  const handleDownloadGeneratedData = async () => {
    const warning = await exportDataWarning(data.resolvedData || data)
    const payload = EXPORTABLE_SECTIONS.map(s => exportLine(s.key, data[s.key])).join('\n\n')
    downloadText('data.generated.js', payload, 'text/javascript')
    flash(
      setCopied,
      warning || (lang === 'zh' ? '✓ 已下载 data.generated.js' : '✓ data.generated.js downloaded'),
    )
  }

  const handleDownloadSiteConfig = async () => {
    const payload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      content: data.resolvedData,
      style,
    }
    const contentWarning = await exportDataWarning(data.resolvedData || data)
    const configPathWarning = pathWarning(await findMissingPublicPaths(payload, 'siteConfig'))
    const warning = contentWarning || configPathWarning
    downloadText('site-config.json', JSON.stringify(payload, null, 2), 'application/json')
    flash(
      setCopied,
      warning || (lang === 'zh' ? '✓ 已下载 site-config.json' : '✓ site-config.json downloaded'),
    )
  }

  return (
    <div
      className={`ce-overlay mode-${mode}`}
      style={mode === 'side' ? { width: sideWidth } : undefined}
    >
      <div className="ce-shell">
        {mode === 'side' && (
          <div className="ce-resize-handle" onPointerDown={onResizeStart} title="拖动调整宽度" />
        )}
        <header className="ce-header">
          <div className="ce-title">
            <span className="ce-title-main">{lang === 'zh' ? '内容编辑器' : 'Content Editor'}</span>
            <span className="ce-title-sub">
              {mode === 'side'
                ? lang === 'zh'
                  ? '侧栏模式 · 左侧主站可实时预览'
                  : 'Side mode · live preview on the left'
                : lang === 'zh'
                  ? '保存到浏览器即时生效；复制代码粘贴到 data.js 永久保存'
                  : 'Save -> live preview · copy code -> paste into data.js to persist'}
            </span>
          </div>
          <div className="ce-header-actions">
            <label
              className="ce-autosave"
              title={lang === 'zh' ? '改完自动保存到浏览器' : 'Auto-save edits to browser'}
            >
              <input
                type="checkbox"
                checked={autoSave}
                onChange={e => setAutoSave(e.target.checked)}
              />
              <span>{lang === 'zh' ? '自动保存' : 'Auto-save'}</span>
            </label>
            <button
              className="ce-mode-toggle"
              onClick={() => setMode(m => (m === 'modal' ? 'side' : 'modal'))}
              title={lang === 'zh' ? '切换布局模式' : 'Toggle layout'}
            >
              {mode === 'modal'
                ? '⊟ ' + (lang === 'zh' ? '侧栏' : 'Side')
                : '⊞ ' + (lang === 'zh' ? '全屏' : 'Modal')}
            </button>
            <button className="ce-btn ce-btn-ghost" onClick={handleCopyAll} title="复制所有 export">
              📋 {lang === 'zh' ? '全部' : 'All'}
            </button>
            <button
              className="ce-btn ce-btn-ghost"
              onClick={handleDownloadGeneratedData}
              title="下载 data.generated.js"
            >
              ⬇ data.js
            </button>
            <button
              className="ce-btn ce-btn-ghost"
              onClick={handleDownloadSiteConfig}
              title="下载 site-config.json"
            >
              ⬇ config
            </button>
            <button
              className="ce-btn ce-btn-ghost"
              type="button"
              onClick={handleCheckPaths}
              disabled={checkingPaths}
              title={lang === 'zh' ? '批量检查 public 媒体路径' : 'Check public media paths'}
            >
              {checkingPaths ? '…' : '✓'} {lang === 'zh' ? '路径' : 'Paths'}
            </button>
            <button
              className="ce-btn ce-btn-ghost"
              onClick={handleDownloadBackup}
              title={lang === 'zh' ? '下载本地备份 (JSON)' : 'Download local backup (JSON)'}
            >
              ⬇ {lang === 'zh' ? '备份 JSON' : 'Backup JSON'}
            </button>
            <button className="ce-close" onClick={onClose} aria-label="close">
              ✕
            </button>
          </div>
        </header>

        <div className="ce-banner" role="status" aria-live="polite">
          <div className="ce-banner-text">
            {data.storageError ||
              (lang === 'zh'
                ? '当前修改只保存在本浏览器。发布前请点击「📋 全部」导出代码并提交到 Git。'
                : 'Edits live only in this browser. Click "📋 All" to export and commit to Git before publishing.')}
          </div>
          {data.storageError ? (
            <div className="ce-banner-meta">
              {lang === 'zh' ? '本地草稿尚未保存' : 'Local draft is not saved'}
            </div>
          ) : data.isDirty ? (
            <div className="ce-banner-meta">
              {lang === 'zh' ? '正在保存本地草稿…' : 'Saving local draft…'}
            </div>
          ) : data.lastSaved ? (
            <div className="ce-banner-meta">
              {lang === 'zh' ? '上次本地保存：' : 'Last local save: '}
              {formatLocalTs(data.lastSaved)}
            </div>
          ) : null}
        </div>

        {pathAudit && (
          <div
            className={`ce-path-audit ${pathAudit.error || pathAudit.missing.length ? 'has-errors' : 'is-clean'}`}
            role="status"
          >
            <div className="ce-path-audit-head">
              <strong>
                {pathAudit.error
                  ? lang === 'zh'
                    ? '媒体路径检查失败'
                    : 'Media path check failed'
                  : pathAudit.missing.length
                    ? lang === 'zh'
                      ? `缺失 ${pathAudit.missing.length} / 已检查 ${pathAudit.checked}`
                      : `${pathAudit.missing.length} missing / ${pathAudit.checked} checked`
                    : lang === 'zh'
                      ? `${pathAudit.checked} 个媒体路径全部可访问`
                      : `${pathAudit.checked} media path(s) available`}
              </strong>
              <button
                type="button"
                onClick={() => setPathAudit(null)}
                aria-label={lang === 'zh' ? '关闭检查结果' : 'Close audit'}
              >
                x
              </button>
            </div>
            {pathAudit.error && <p>{pathAudit.error}</p>}
            {!!pathAudit.missing.length && (
              <ul>
                {pathAudit.missing.map(item => (
                  <li key={item.url}>
                    <code>{item.url}</code>
                    <span>
                      {item.status} · {item.path}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="ce-body">
          <nav className="ce-tabs" aria-label="sections">
            {SECTIONS.map((s, i) => {
              const prevGroup = i > 0 ? SECTIONS[i - 1].group : null
              const showGroupHeader = s.group && s.group !== prevGroup
              return (
                <React.Fragment key={s.key}>
                  {showGroupHeader && <div className="ce-tab-group">{s.group}</div>}
                  <button
                    className={`ce-tab ${activeKey === s.key ? 'act' : ''}`}
                    onClick={() => setActiveKey(s.key)}
                  >
                    <span className="ce-tab-label">{s.label}</span>
                    {!s.key.startsWith('_') && data.isOverridden(s.key) && (
                      <span className="ce-tab-dot" title="已被本地编辑过">
                        ●
                      </span>
                    )}
                  </button>
                </React.Fragment>
              )
            })}
          </nav>

          <main className="ce-main" ref={ceMainRef}>
            <div className="ce-main-head">
              <h3 className="ce-section-title">{section.label}</h3>
              {!isSpecial && isOverridden && <span className="ce-tag">本地编辑中</span>}
            </div>

            {isSpecial ? (
              <div className="ce-section-body">
                <SectionEditor section={section} value={null} onChange={() => {}} />
              </div>
            ) : (
              workingValue !== null && (
                <div className="ce-section-body">
                  <SectionEditor
                    section={section}
                    value={workingValue}
                    onChange={setWorkingValue}
                    onTemplateApply={rememberTemplateUndo}
                  />
                </div>
              )
            )}

            {!isSpecial && sectionWarning && (
              <div className="ce-file-status ce-file-status-missing">{sectionWarning}</div>
            )}

            {!isSpecial && showCode && (
              <div className="ce-code-block">
                <div className="ce-code-head">
                  <span>{activeKey} 导出代码 — 复制到 data.js</span>
                  <button className="ce-btn ce-btn-ghost" onClick={handleCopy}>
                    📋 复制
                  </button>
                </div>
                <pre className="ce-code">
                  <code>{exportLine(activeKey, workingValue)}</code>
                </pre>
              </div>
            )}

            {showContentPreview && (
              <PreviewFrame
                style={style}
                lang={lang}
                label={`${section.label} · ${lang === 'zh' ? '内容预览' : 'Content preview'}`}
                reloadKey={`${data.lastSaved || 0}`}
              />
            )}
          </main>
        </div>

        <footer className="ce-footer">
          <div className={`ce-footer-msg ${data.storageError ? 'ce-footer-error' : ''}`}>
            {data.storageError || copied}
          </div>
          <div className="ce-footer-actions">
            {!isSpecial && (
              <>
                {templateUndo?.key === activeKey && (
                  <button
                    className="ce-btn ce-btn-ghost"
                    onClick={handleUndoTemplate}
                    title={formatLocalTs(templateUndo.ts)}
                  >
                    ↶ 模板前
                  </button>
                )}
                <button
                  className="ce-btn ce-btn-ghost"
                  onClick={handleReset}
                  disabled={!isOverridden}
                >
                  ↺ 重置本章
                </button>
                <button className="ce-btn ce-btn-ghost" onClick={() => setShowCode(s => !s)}>
                  {showCode ? '隐藏代码' : '< />  查看代码'}
                </button>
                <button className="ce-btn" onClick={handleSave}>
                  💾 保存到浏览器
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

function deepClone(v) {
  return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v))
}

function flash(setter, msg) {
  setter(msg)
  setTimeout(() => setter(''), 2400)
}
