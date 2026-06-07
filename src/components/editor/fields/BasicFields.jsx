import React from 'react'
import { useLang } from '../../../lang.jsx'

export function StringField({ value, onChange, placeholder, multiline }) {
  if (multiline) {
    return (
      <textarea
        className="ce-input ce-textarea"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    )
  }
  return (
    <input
      className="ce-input"
      type="text"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

export function NumberField({ value, onChange, placeholder }) {
  return (
    <input
      className="ce-input"
      type="number"
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      placeholder={placeholder}
    />
  )
}

export function SelectField({ value, onChange, options = [] }) {
  return (
    <select
      className="ce-input ce-select-field"
      value={value ?? options[0]?.value ?? ''}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function BoolField({ value, onChange }) {
  const { lang } = useLang()
  const on = value !== false
  return (
    <label className="ce-bool">
      <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} />
      <span className={`ce-bool-switch ${on ? 'on' : 'off'}`}>
        <span className="ce-bool-thumb"></span>
      </span>
      <span className="ce-bool-label">
        {on ? (lang === 'zh' ? '显示' : 'Visible') : lang === 'zh' ? '隐藏' : 'Hidden'}
      </span>
    </label>
  )
}

export function BilingualField({ value, onChange, multiline }) {
  const v =
    value && typeof value === 'object'
      ? value
      : { en: typeof value === 'string' ? value : '', zh: '' }
  const setEn = en => onChange({ ...v, en })
  const setZh = zh => onChange({ ...v, zh })
  return (
    <div className="ce-bi">
      <div>
        <span className="ce-bi-lbl">EN</span>
        <StringField value={v.en} onChange={setEn} multiline={multiline} placeholder="English..." />
      </div>
      <div>
        <span className="ce-bi-lbl">中文</span>
        <StringField value={v.zh} onChange={setZh} multiline={multiline} placeholder="中文..." />
      </div>
    </div>
  )
}

export function StringArrayField({ value, onChange }) {
  const arr = Array.isArray(value) ? value : []
  const update = (i, v) => onChange(arr.map((x, k) => (k === i ? v : x)))
  const remove = i => onChange(arr.filter((_, k) => k !== i))
  const add = () => onChange([...arr, ''])
  return (
    <div className="ce-str-arr">
      {arr.map((s, i) => (
        <div key={i} className="ce-str-arr-row">
          <input
            className="ce-input"
            type="text"
            value={s}
            onChange={e => update(i, e.target.value)}
          />
          <button
            type="button"
            className="ce-icon-btn"
            onClick={() => remove(i)}
            aria-label="remove"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="ce-add-btn" onClick={add}>
        + 添加
      </button>
    </div>
  )
}
