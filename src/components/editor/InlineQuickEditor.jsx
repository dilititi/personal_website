import React, { useEffect, useRef } from 'react'
import { useData } from '../../data-context.jsx'
import { useLang } from '../../lang.jsx'
import {
  getInlineQuickEditConfig,
  readQuickFieldValue,
  writeQuickFieldValue,
} from './inlineQuickEdit.js'

function labelFor(value, lang) {
  return value?.[lang] || value?.zh || value?.en || ''
}

export default function InlineQuickEditor({ configKey, onClose, onOpenFull }) {
  const { lang } = useLang()
  const data = useData()
  const config = getInlineQuickEditConfig(configKey)
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    panelRef.current?.querySelector('input, textarea')?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!config) return null

  const updateField = (field, value) => {
    const sectionValue = data[field.section]
    data.setSection(field.section, writeQuickFieldValue(sectionValue, field, lang, value))
  }

  return (
    <aside
      className="inline-quick-editor"
      ref={panelRef}
      role="dialog"
      aria-label={lang === 'zh' ? '页面内快速编辑' : 'Inline quick edit'}
      onClick={event => event.stopPropagation()}
    >
      <header>
        <div>
          <span>{lang === 'zh' ? '快速编辑' : 'Quick edit'}</span>
          <strong>{labelFor(config.label, lang)}</strong>
        </div>
        <button type="button" onClick={onClose} aria-label={lang === 'zh' ? '关闭' : 'Close'}>
          x
        </button>
      </header>

      <div className="inline-quick-fields">
        {config.fields.map(field => {
          const value = readQuickFieldValue(data[field.section], field, lang)
          const id = `${configKey}-${field.section}-${resolveFieldId(field, lang)}`
          return (
            <label key={id} htmlFor={id}>
              <span>{labelFor(field.label, lang)}</span>
              {field.multiline ? (
                <textarea
                  id={id}
                  rows="4"
                  value={value}
                  onChange={event => updateField(field, event.target.value)}
                />
              ) : (
                <input
                  id={id}
                  type="text"
                  value={value}
                  onChange={event => updateField(field, event.target.value)}
                />
              )}
              {field.image && value && (
                <span className="inline-quick-image-preview">
                  <img
                    key={value}
                    src={value}
                    alt=""
                    onLoad={event => (event.currentTarget.hidden = false)}
                    onError={event => (event.currentTarget.hidden = true)}
                  />
                </span>
              )}
            </label>
          )
        })}
      </div>

      <footer>
        <span>{lang === 'zh' ? '修改会自动保存' : 'Changes save automatically'}</span>
        <button type="button" onClick={onOpenFull}>
          {lang === 'zh' ? '打开完整编辑器' : 'Open full editor'}
        </button>
      </footer>
    </aside>
  )
}

function resolveFieldId(field, lang) {
  const path = field.pathByLang?.[lang] || field.path || []
  return path.join('-')
}
