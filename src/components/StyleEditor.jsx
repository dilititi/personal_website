import React, { useEffect, useMemo, useState } from 'react'
import { useLang } from '../lang.jsx'
import { useStyle } from '../style-context.jsx'
import {
  STYLE_ANCHOR_TYPES,
  STYLE_DIMENSIONS,
  STYLE_MOOD_KEYWORDS,
  STYLE_PRESETS,
} from '../style.js'
import { findMissingPublicPaths, pathWarning } from './editor/export.js'
import PreviewFrame from './editor/PreviewFrame.jsx'

const LIVE_DIMENSIONS = new Set([
  'design',
  'color',
  'typography',
  'space',
  'motion',
  'texture',
  'light',
  'depth',
])

const STATIC_TABS = [{ key: 'presets', label: { zh: '预设', en: 'Presets' }, live: true }]

const REFERENCE_TAB = { key: 'reference', label: { zh: '情绪板', en: 'Mood board' }, live: true }

const FONT_OPTIONS = [
  { value: 'serif', zh: '衬线 / 文学', en: 'Serif' },
  { value: 'sans', zh: '无衬线 / 现代', en: 'Sans' },
  { value: 'mono', zh: '等宽 / 技术', en: 'Mono' },
]

const EASING_OPTIONS = [
  { value: 'easeOut', zh: '柔和进入', en: 'Ease out' },
  { value: 'easeInOut', zh: '平滑往返', en: 'Ease in-out' },
  { value: 'sharp', zh: '利落响应', en: 'Sharp' },
]

const MOTION_OPTIONS = [
  { value: 'lively', zh: '生动', en: 'Lively' },
  { value: 'calm', zh: '安静', en: 'Calm' },
]

const DESIGN_ALIGNMENT_OPTIONS = [
  { value: 'editorial', zh: '编排 / Editorial', en: 'Editorial' },
  { value: 'grid', zh: '网格 / Grid', en: 'Grid' },
  { value: 'center', zh: '居中 / Center', en: 'Center' },
  { value: 'offset', zh: '错位 / Offset', en: 'Offset' },
  { value: 'loose', zh: '松弛 / Loose', en: 'Loose' },
]

const THUMB_FONTS = {
  serif: '"Lora", Georgia, serif',
  sans: '"Manrope", -apple-system, sans-serif',
  mono: '"IBM Plex Mono", monospace',
}

function pick(label, lang) {
  if (!label) return ''
  if (typeof label === 'string') return label
  return label[lang] || label.en || label.zh || ''
}

function validHex(value, fallback = '#000000') {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback
}

function normalizeKeyword(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function keywordLabel(value, lang) {
  const option = STYLE_MOOD_KEYWORDS.find(item => item.value === value)
  return option ? pick(option.label, lang) : value
}

function makeAnchorId() {
  return `anchor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function isImageUrl(value) {
  const url = String(value || '').trim()
  return (
    /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url) ||
    url.startsWith('/picture/') ||
    url.startsWith('/photos/') ||
    url.startsWith('/works/')
  )
}

function Field({ label, children }) {
  return (
    <label className="ce-field se-field">
      <span className="ce-field-label">{label}</span>
      <span className="ce-field-input">{children}</span>
    </label>
  )
}

function RangeControl({ label, value, min, max, step = 1, suffix = '', onChange }) {
  return (
    <Field label={label}>
      <div className="se-range-row">
        <input
          className="se-range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <output>
          {value}
          {suffix}
        </output>
      </div>
    </Field>
  )
}

function ColorControl({ label, value, onChange }) {
  const safeValue = validHex(value)
  return (
    <Field label={label}>
      <div className="se-color-row">
        <input
          className="se-color-picker"
          type="color"
          value={safeValue}
          onChange={e => onChange(e.target.value)}
        />
        <input
          className="ce-input se-hex-input"
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          spellCheck="false"
        />
      </div>
    </Field>
  )
}

function SelectControl({ label, value, options, onChange, lang }) {
  return (
    <Field label={label}>
      <select className="ce-input se-select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {pick(option.label || option, lang)}
          </option>
        ))}
      </select>
    </Field>
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

function PresetPanel({ lang, activePreset, onApply }) {
  return (
    <div className="se-panel">
      <p className="ce-hint">
        {lang === 'zh'
          ? '预设是风格初稿。选择后仍然可以继续调色彩、字体、空间、质感、光影、深度和动态。'
          : 'Presets are starting points. Apply one, then keep tuning color, type, space, texture, light, depth, and motion.'}
      </p>
      {activePreset === 'custom' && (
        <div className="se-custom-note">
          {lang === 'zh'
            ? '当前是自定义风格。点击任意预设会覆盖这组微调。'
            : 'Current style is custom. Applying a preset will replace these tweaks.'}
        </div>
      )}
      <div className="se-preset-grid">
        {Object.entries(STYLE_PRESETS).map(([id, preset]) => {
          const presetStyle = preset.style
          const color = preset.style.color
          const typography = presetStyle.typography || {}
          const space = presetStyle.space || {}
          const motion = presetStyle.motion || {}
          const texture = presetStyle.texture || {}
          const active = activePreset === id
          return (
            <button
              key={id}
              type="button"
              className={`se-preset-card ${active ? 'act' : ''}`}
              onClick={() => onApply(id)}
              aria-pressed={active}
            >
              <span
                className="se-preset-thumb"
                style={{
                  '--preset-bg': color.background,
                  '--preset-surface': color.surface,
                  '--preset-text': color.text,
                  '--preset-muted': color.muted,
                  '--preset-primary': color.primary,
                  '--preset-secondary': color.secondary,
                  '--preset-radius': `${space.radius ?? 6}px`,
                  '--preset-gap': `${Math.max(4, Math.round((space.cardGap || 20) / 5))}px`,
                  '--preset-motion': `${motion.duration || 280}ms`,
                  '--preset-grain': texture.grain ?? 0.09,
                  fontFamily: THUMB_FONTS[typography.display] || THUMB_FONTS.serif,
                }}
              >
                <i className="se-preset-thumb-top">
                  <b />
                  <b />
                </i>
                <i className="se-preset-thumb-title">Aa</i>
                <i className="se-preset-thumb-card">
                  <b />
                  <b />
                  <b />
                </i>
                <i className="se-preset-thumb-line" />
                <i className="se-preset-thumb-dot" />
              </span>
              <strong>{pick(preset.label, lang)}</strong>
              <span>{pick(preset.description, lang)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ReferencePanel({ style, setStyle, lang }) {
  const mood = Array.isArray(style.mood) ? style.mood : []
  const anchors = Array.isArray(style.anchors) ? style.anchors : []
  const [keyword, setKeyword] = useState('')
  const [draft, setDraft] = useState({
    type: 'image',
    title: '',
    url: '',
    note: '',
    weight: 0.65,
  })

  const setMood = nextMood => {
    setStyle(prev => ({ ...prev, preset: 'custom', mood: nextMood }))
  }

  const setAnchors = nextAnchors => {
    setStyle(prev => ({ ...prev, preset: 'custom', anchors: nextAnchors }))
  }

  const addMood = raw => {
    const next = normalizeKeyword(raw)
    if (!next || mood.includes(next)) return
    setMood([...mood, next])
    setKeyword('')
  }

  const removeMood = target => {
    setMood(mood.filter(item => item !== target))
  }

  const addAnchor = () => {
    const title = draft.title.trim()
    const url = draft.url.trim()
    const note = draft.note.trim()
    if (!title && !url && !note) return
    setAnchors([
      ...anchors,
      {
        id: makeAnchorId(),
        type: draft.type || 'image',
        title: title || url || (lang === 'zh' ? '未命名参考' : 'Untitled anchor'),
        url,
        note,
        weight: Number(draft.weight) || 0.65,
      },
    ])
    setDraft({ type: 'image', title: '', url: '', note: '', weight: 0.65 })
  }

  const removeAnchor = index => {
    setAnchors(anchors.filter((_, i) => i !== index))
  }

  const updateAnchor = (index, patch) => {
    setAnchors(anchors.map((anchor, i) => (i === index ? { ...anchor, ...patch } : anchor)))
  }

  return (
    <div className="se-panel se-reference-panel">
      <p className="ce-hint">
        {lang === 'zh'
          ? '情绪板：保存 mood keywords 和 visual anchors，作为风格的描述性参考。这些信号不会直接改 CSS（不影响实时渲染），但会随风格一起导出，供预设挑选或后续 AI 解析参考图时生成初始风格值。'
          : "A mood board: save mood keywords and visual anchors as descriptive references for your style. These signals are not applied to the live theme (they don't change CSS), but they export with your style and can seed presets or later AI style generation."}
      </p>

      <section className="se-reference-section">
        <div className="se-reference-head">
          <strong>{lang === 'zh' ? 'Mood keywords' : 'Mood keywords'}</strong>
          <span>
            {lang === 'zh'
              ? '描述你希望网站散发的情绪，不直接改 CSS。'
              : 'Describe the feeling before it becomes CSS.'}
          </span>
        </div>
        <div className="se-chip-grid">
          {STYLE_MOOD_KEYWORDS.map(option => {
            const active = mood.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                className={`se-chip ${active ? 'act' : ''}`}
                aria-pressed={active}
                onClick={() => (active ? removeMood(option.value) : addMood(option.value))}
              >
                {pick(option.label, lang)}
              </button>
            )
          })}
        </div>
        <div className="se-token-row">
          {mood.length === 0 && (
            <span className="se-empty">
              {lang === 'zh' ? '还没有 mood keyword' : 'No mood keywords yet'}
            </span>
          )}
          {mood.map(item => (
            <button key={item} type="button" className="se-token" onClick={() => removeMood(item)}>
              {keywordLabel(item, lang)}
              <span aria-hidden="true">x</span>
            </button>
          ))}
        </div>
        <div className="se-inline-add">
          <input
            className="ce-input"
            type="text"
            value={keyword}
            placeholder={
              lang === 'zh' ? '自定义关键词，例如 nostalgic' : 'Custom keyword, e.g. nostalgic'
            }
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addMood(keyword)
              }
            }}
          />
          <button className="ce-btn ce-btn-ghost" type="button" onClick={() => addMood(keyword)}>
            {lang === 'zh' ? '添加' : 'Add'}
          </button>
        </div>
      </section>

      <section className="se-reference-section">
        <div className="se-reference-head">
          <strong>{lang === 'zh' ? 'Visual anchors' : 'Visual anchors'}</strong>
          <span>
            {lang === 'zh'
              ? '记录图片、电影、网站、物件或文字参考。'
              : 'Capture images, films, sites, objects, or text references.'}
          </span>
        </div>
        <div className="se-anchor-builder">
          <SelectControl
            label={lang === 'zh' ? '类型' : 'Type'}
            value={draft.type}
            options={STYLE_ANCHOR_TYPES}
            onChange={type => setDraft(prev => ({ ...prev, type }))}
            lang={lang}
          />
          <Field label={lang === 'zh' ? '标题' : 'Title'}>
            <input
              className="ce-input"
              type="text"
              value={draft.title}
              onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
            />
          </Field>
          <Field label={lang === 'zh' ? 'URL / 路径' : 'URL / path'}>
            <input
              className="ce-input"
              type="text"
              value={draft.url}
              placeholder="/photos/reference.jpg"
              onChange={e => setDraft(prev => ({ ...prev, url: e.target.value }))}
            />
          </Field>
          <RangeControl
            label={lang === 'zh' ? '权重' : 'Weight'}
            min={0}
            max={1}
            step={0.01}
            value={draft.weight}
            onChange={weight => setDraft(prev => ({ ...prev, weight }))}
          />
          <Field label={lang === 'zh' ? '提示' : 'Note'}>
            <textarea
              className="ce-input se-anchor-note"
              value={draft.note}
              onChange={e => setDraft(prev => ({ ...prev, note: e.target.value }))}
            />
          </Field>
          <button className="ce-btn" type="button" onClick={addAnchor}>
            {lang === 'zh' ? '添加参考' : 'Add anchor'}
          </button>
        </div>

        <div className="se-anchor-list">
          {anchors.length === 0 && (
            <div className="se-empty se-anchor-empty">
              {lang === 'zh' ? '还没有 visual anchor' : 'No visual anchors yet'}
            </div>
          )}
          {anchors.map((anchor, index) => {
            const type = STYLE_ANCHOR_TYPES.find(item => item.value === anchor.type)
            const hasImage = anchor.type === 'image' && isImageUrl(anchor.url)
            return (
              <article key={anchor.id || `${anchor.title}-${index}`} className="se-anchor-card">
                <span
                  className={`se-anchor-thumb ${hasImage ? 'has-image' : ''}`}
                  style={
                    hasImage
                      ? { backgroundImage: `url("${String(anchor.url).replace(/"/g, '\\"')}")` }
                      : undefined
                  }
                >
                  {!hasImage && <b>{pick(type?.label, lang) || anchor.type || 'ref'}</b>}
                </span>
                <div className="se-anchor-copy">
                  <strong>
                    {anchor.title ||
                      anchor.url ||
                      (lang === 'zh' ? '未命名参考' : 'Untitled anchor')}
                  </strong>
                  {anchor.url && <span>{anchor.url}</span>}
                  {anchor.note && <p>{anchor.note}</p>}
                  <label className="se-anchor-weight">
                    <span>{lang === 'zh' ? '权重' : 'Weight'}</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={anchor.weight ?? 0.65}
                      onChange={e => updateAnchor(index, { weight: Number(e.target.value) })}
                    />
                    <output>{Math.round((anchor.weight ?? 0.65) * 100)}%</output>
                  </label>
                </div>
                <button
                  className="se-anchor-remove"
                  type="button"
                  onClick={() => removeAnchor(index)}
                  aria-label={lang === 'zh' ? '删除参考' : 'Remove anchor'}
                >
                  x
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function DesignPanel({ style, updateDimension, lang }) {
  const design = style.design || {}
  const update = patch => updateDimension('design', patch)
  return (
    <div className="se-panel se-design-panel">
      <p className="ce-hint">
        {lang === 'zh'
          ? '这五项是网站视觉的总控：先决定页面节奏、对齐方式、信息层级、整体对比和图文比例，再去微调色彩、字体和质感。'
          : 'These five controls shape the site first: rhythm, alignment, hierarchy, contrast, and proportion before finer color, type, and texture tweaks.'}
      </p>
      <div className="se-grid">
        <RangeControl
          label={lang === 'zh' ? '间距' : 'Spacing'}
          min={0}
          max={1}
          step={0.01}
          value={design.spacing ?? 0.5}
          onChange={spacing => update({ spacing })}
        />
        <SelectControl
          label={lang === 'zh' ? '对齐' : 'Alignment'}
          value={design.alignment || 'editorial'}
          options={DESIGN_ALIGNMENT_OPTIONS}
          onChange={alignment => update({ alignment })}
          lang={lang}
        />
        <RangeControl
          label={lang === 'zh' ? '层级' : 'Hierarchy'}
          min={0}
          max={1}
          step={0.01}
          value={design.hierarchy ?? 0.62}
          onChange={hierarchy => update({ hierarchy })}
        />
        <RangeControl
          label={lang === 'zh' ? '对比' : 'Contrast'}
          min={0}
          max={1}
          step={0.01}
          value={design.contrast ?? 0.66}
          onChange={contrast => update({ contrast })}
        />
        <RangeControl
          label={lang === 'zh' ? '比例' : 'Proportion'}
          min={0}
          max={1}
          step={0.01}
          value={design.proportion ?? 0.5}
          onChange={proportion => update({ proportion })}
        />
      </div>
    </div>
  )
}

function ColorPanel({ style, updateDimension, lang }) {
  const color = style.color
  const update = patch => updateDimension('color', patch)
  return (
    <div className="se-panel se-grid">
      <ColorControl
        label={lang === 'zh' ? '背景' : 'Background'}
        value={color.background}
        onChange={background => update({ background })}
      />
      <ColorControl
        label={lang === 'zh' ? '表面' : 'Surface'}
        value={color.surface}
        onChange={surface => update({ surface })}
      />
      <ColorControl
        label={lang === 'zh' ? '正文' : 'Text'}
        value={color.text}
        onChange={text => update({ text })}
      />
      <ColorControl
        label={lang === 'zh' ? '弱文本' : 'Muted'}
        value={color.muted}
        onChange={muted => update({ muted })}
      />
      <ColorControl
        label={lang === 'zh' ? '主色' : 'Primary'}
        value={color.primary}
        onChange={primary => update({ primary })}
      />
      <ColorControl
        label={lang === 'zh' ? '辅色' : 'Secondary'}
        value={color.secondary}
        onChange={secondary => update({ secondary })}
      />
      <RangeControl
        label={lang === 'zh' ? '对比度' : 'Contrast'}
        min={0}
        max={1}
        step={0.01}
        value={color.contrast}
        onChange={contrast => update({ contrast })}
      />
      <RangeControl
        label={lang === 'zh' ? '饱和度' : 'Saturation'}
        min={0}
        max={1}
        step={0.01}
        value={color.saturation}
        onChange={saturation => update({ saturation })}
      />
      <RangeControl
        label={lang === 'zh' ? '冷暖' : 'Temperature'}
        min={-1}
        max={1}
        step={0.01}
        value={color.temperature}
        onChange={temperature => update({ temperature })}
      />
    </div>
  )
}

function TypographyPanel({ style, updateDimension, lang }) {
  const typography = style.typography
  const update = patch => updateDimension('typography', patch)
  return (
    <div className="se-panel se-grid">
      <Field label={lang === 'zh' ? '人格' : 'Personality'}>
        <input
          className="ce-input"
          type="text"
          value={typography.personality}
          onChange={e => update({ personality: e.target.value })}
        />
      </Field>
      <SelectControl
        label={lang === 'zh' ? '标题字体' : 'Display font'}
        value={typography.display}
        options={FONT_OPTIONS}
        onChange={display => update({ display })}
        lang={lang}
      />
      <SelectControl
        label={lang === 'zh' ? '正文字体' : 'Body font'}
        value={typography.body}
        options={FONT_OPTIONS}
        onChange={body => update({ body })}
        lang={lang}
      />
      <RangeControl
        label={lang === 'zh' ? '字号比例' : 'Type scale'}
        min={1.1}
        max={1.7}
        step={0.001}
        value={typography.scale}
        onChange={scale => update({ scale })}
      />
      <RangeControl
        label={lang === 'zh' ? '字距' : 'Tracking'}
        min={-30}
        max={60}
        step={1}
        value={typography.tracking}
        onChange={tracking => update({ tracking })}
      />
    </div>
  )
}

function SpacePanel({ style, updateDimension, lang }) {
  const space = style.space
  const update = patch => updateDimension('space', patch)
  return (
    <div className="se-panel se-grid">
      <RangeControl
        label={lang === 'zh' ? '密度' : 'Density'}
        min={0}
        max={1}
        step={0.01}
        value={space.density}
        onChange={density => update({ density })}
      />
      <RangeControl
        label={lang === 'zh' ? '圆角' : 'Radius'}
        min={0}
        max={24}
        step={1}
        suffix="px"
        value={space.radius}
        onChange={radius => update({ radius })}
      />
      <RangeControl
        label={lang === 'zh' ? '章节呼吸' : 'Section rhythm'}
        min={64}
        max={140}
        step={1}
        suffix="px"
        value={space.sectionGap}
        onChange={sectionGap => update({ sectionGap })}
      />
      <RangeControl
        label={lang === 'zh' ? '卡片间距' : 'Card gap'}
        min={10}
        max={36}
        step={1}
        suffix="px"
        value={space.cardGap}
        onChange={cardGap => update({ cardGap })}
      />
    </div>
  )
}

function MotionPanel({ style, updateDimension, lang }) {
  const motion = style.motion
  const update = patch => updateDimension('motion', patch)
  return (
    <div className="se-panel se-grid">
      <SelectControl
        label={lang === 'zh' ? '动态模式' : 'Motion mode'}
        value={motion.mode}
        options={MOTION_OPTIONS}
        onChange={mode => update({ mode })}
        lang={lang}
      />
      <SelectControl
        label={lang === 'zh' ? '缓动曲线' : 'Easing'}
        value={motion.easing}
        options={EASING_OPTIONS}
        onChange={easing => update({ easing })}
        lang={lang}
      />
      <RangeControl
        label={lang === 'zh' ? '速度' : 'Duration'}
        min={80}
        max={800}
        step={10}
        suffix="ms"
        value={motion.duration}
        onChange={duration => update({ duration })}
      />
    </div>
  )
}

function TexturePanel({ style, updateDimension, lang }) {
  const texture = style.texture
  const update = patch => updateDimension('texture', patch)
  return (
    <div className="se-panel se-grid">
      <RangeControl
        label={lang === 'zh' ? '\u9897\u7c92\u8986\u5c42' : 'Grain overlay'}
        min={0}
        max={0.32}
        step={0.01}
        value={texture.grain}
        onChange={grain => update({ grain })}
      />
      <RangeControl
        label={lang === 'zh' ? '\u5f71\u50cf\u9971\u548c' : 'Image saturation'}
        min={0.4}
        max={1.8}
        step={0.01}
        value={texture.imageSaturation}
        onChange={imageSaturation => update({ imageSaturation })}
      />
      <RangeControl
        label={lang === 'zh' ? '\u5f71\u50cf\u5bf9\u6bd4' : 'Image contrast'}
        min={0.7}
        max={1.5}
        step={0.01}
        value={texture.imageContrast}
        onChange={imageContrast => update({ imageContrast })}
      />
      <RangeControl
        label={lang === 'zh' ? '\u5f71\u50cf\u4eae\u5ea6' : 'Image brightness'}
        min={0.7}
        max={1.3}
        step={0.01}
        value={texture.imageBrightness}
        onChange={imageBrightness => update({ imageBrightness })}
      />
    </div>
  )
}

function LightPanel({ style, updateDimension, lang }) {
  const light = style.light
  const update = patch => updateDimension('light', patch)
  return (
    <div className="se-panel se-grid">
      <RangeControl
        label={lang === 'zh' ? '\u6295\u5f71\u6df1\u5ea6' : 'Shadow depth'}
        min={0}
        max={1}
        step={0.01}
        value={light.shadowDepth}
        onChange={shadowDepth => update({ shadowDepth })}
      />
      <RangeControl
        label={lang === 'zh' ? '\u9634\u5f71\u67d4\u548c' : 'Shadow softness'}
        min={0}
        max={1}
        step={0.01}
        value={light.shadowSoftness}
        onChange={shadowSoftness => update({ shadowSoftness })}
      />
      <RangeControl
        label={lang === 'zh' ? '\u9ad8\u5149\u5f3a\u5ea6' : 'Highlight'}
        min={0}
        max={1}
        step={0.01}
        value={light.highlight}
        onChange={highlight => update({ highlight })}
      />
    </div>
  )
}

function DepthPanel({ style, updateDimension, lang }) {
  const depth = style.depth
  const update = patch => updateDimension('depth', patch)
  return (
    <div className="se-panel se-grid">
      <RangeControl
        label={lang === 'zh' ? '\u80cc\u666f\u6a21\u7cca' : 'Background blur'}
        min={0}
        max={16}
        step={1}
        suffix="px"
        value={depth.blur}
        onChange={blur => update({ blur })}
      />
      <RangeControl
        label={lang === 'zh' ? '\u73bb\u7483\u611f' : 'Glass'}
        min={0}
        max={1}
        step={0.01}
        value={depth.glass}
        onChange={glass => update({ glass })}
      />
      <RangeControl
        label={lang === 'zh' ? '\u5c42\u6b21\u4f4d\u79fb' : 'Parallax shift'}
        min={0}
        max={1}
        step={0.01}
        value={depth.parallax}
        onChange={parallax => update({ parallax })}
      />
    </div>
  )
}

function ReservedPanel({ dimension, lang }) {
  return (
    <div className="se-panel se-reserved-panel">
      <p className="ce-hint">
        {lang === 'zh'
          ? `${pick(dimension.label, lang)} 是描述性语境，随风格一起保存，但不直接驱动渲染（不改 CSS）。`
          : `${pick(dimension.label, lang)} is descriptive context — saved with your style as part of the mood board, but it does not drive rendering (no CSS effect).`}
      </p>
      <div className="se-reserved-card">
        <strong>{pick(dimension.label, lang)}</strong>
        <span>{dimension.summary}</span>
        <em>
          {lang === 'zh' ? '描述性信号，非实时控件。' : 'Descriptive signal, not a live control.'}
        </em>
      </div>
    </div>
  )
}

export default function StyleEditor({ open, onClose }) {
  const { lang } = useLang()
  const {
    style,
    setStyle,
    updateDimension,
    applyPreset,
    resetStyle,
    exportStyle,
    isCustomized,
    storageError,
    lastSaved,
    isDirty,
  } = useStyle()
  const [active, setActive] = useState('design')
  const [copied, setCopied] = useState('')
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('chen.se.mode') === 'modal' ? 'modal' : 'side'
    } catch {
      return 'side'
    }
  })
  const [sideWidth, setSideWidth] = useState(() => {
    try {
      return Number(localStorage.getItem('chen.se.sideWidth')) || 520
    } catch {
      return 520
    }
  })

  const tabs = useMemo(
    () => [
      ...STATIC_TABS,
      ...STYLE_DIMENSIONS.map(dim => ({
        key: dim.key,
        label: dim.label,
        summary: dim.summary,
        live: LIVE_DIMENSIONS.has(dim.key),
      })),
      REFERENCE_TAB,
    ],
    [],
  )
  const activeTab = tabs.find(tab => tab.key === active) || tabs[0]
  const reservedTabs = tabs.filter(tab => !tab.live)

  useEffect(() => {
    try {
      localStorage.setItem('chen.se.mode', mode)
    } catch {}
  }, [mode])
  useEffect(() => {
    try {
      localStorage.setItem('chen.se.sideWidth', String(sideWidth))
    } catch {}
  }, [sideWidth])

  useEffect(() => {
    if (!open) return
    if (mode === 'modal') document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''

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

  const onResizeStart = e => {
    e.preventDefault()
    const startX = e.clientX
    const startW = sideWidth
    const onMove = ev => {
      const next = Math.max(380, Math.min(window.innerWidth - 100, startW + (startX - ev.clientX)))
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

  const copyStyle = async () => {
    const text = exportStyle()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(lang === 'zh' ? '已复制 STYLE 导出代码' : 'STYLE export copied')
    } catch {
      setCopied(text)
    }
  }

  const handleDownloadBackup = () => {
    try {
      downloadJson('chen-style-backup', JSON.stringify(style, null, 2))
      setCopied(lang === 'zh' ? '✓ 已下载备份 JSON' : '✓ Backup JSON downloaded')
    } catch (e) {
      setCopied((lang === 'zh' ? '✗ 下载失败：' : '✗ Download failed: ') + (e?.message || e))
    }
  }

  const handleDownloadGeneratedStyle = async () => {
    try {
      const warning = pathWarning(await findMissingPublicPaths(style, 'style'))
      downloadText('style.generated.js', exportStyle(), 'text/javascript')
      setCopied(
        warning ||
          (lang === 'zh' ? '✓ 已下载 style.generated.js' : '✓ style.generated.js downloaded'),
      )
    } catch (e) {
      setCopied((lang === 'zh' ? '✗ 下载失败：' : '✗ Download failed: ') + (e?.message || e))
    }
  }

  const handleApplyPreset = id => {
    if (style.preset === 'custom') {
      const ok = window.confirm(
        lang === 'zh'
          ? '当前自定义风格会被这个预设覆盖。继续吗？'
          : 'This preset will replace your current custom style. Continue?',
      )
      if (!ok) return
    }
    applyPreset(id)
    setCopied(lang === 'zh' ? '已应用预设，可继续微调' : 'Preset applied. You can keep tuning it.')
  }

  const panel = {
    presets: <PresetPanel lang={lang} activePreset={style.preset} onApply={handleApplyPreset} />,
    reference: <ReferencePanel style={style} setStyle={setStyle} lang={lang} />,
    design: <DesignPanel style={style} updateDimension={updateDimension} lang={lang} />,
    color: <ColorPanel style={style} updateDimension={updateDimension} lang={lang} />,
    typography: <TypographyPanel style={style} updateDimension={updateDimension} lang={lang} />,
    space: <SpacePanel style={style} updateDimension={updateDimension} lang={lang} />,
    motion: <MotionPanel style={style} updateDimension={updateDimension} lang={lang} />,
    texture: <TexturePanel style={style} updateDimension={updateDimension} lang={lang} />,
    light: <LightPanel style={style} updateDimension={updateDimension} lang={lang} />,
    depth: <DepthPanel style={style} updateDimension={updateDimension} lang={lang} />,
  }[active] || <ReservedPanel dimension={activeTab} lang={lang} />
  const showLivePreview = mode === 'modal' && active !== 'presets' && active !== 'reference'

  return (
    <div
      className={`ce-overlay mode-${mode} se-overlay`}
      style={mode === 'side' ? { width: sideWidth } : undefined}
    >
      <div className="ce-shell se-shell">
        {mode === 'side' && (
          <div
            className="ce-resize-handle"
            onPointerDown={onResizeStart}
            title={lang === 'zh' ? '拖动调整宽度' : 'Drag to resize'}
          />
        )}
        <header className="ce-header">
          <div className="ce-title">
            <span className="ce-title-main">{lang === 'zh' ? '风格编辑器' : 'Style Editor'}</span>
            <span className="ce-title-sub">
              {mode === 'side'
                ? lang === 'zh'
                  ? '侧栏模式 - 左侧主站实时预览'
                  : 'Side mode - live preview on the left'
                : lang === 'zh'
                  ? '全屏模式 - 可切换侧栏直接观察网站'
                  : 'Modal mode - switch to side for live site preview'}
            </span>
          </div>
          <div className="ce-header-actions">
            {isCustomized && (
              <span className="ce-tag">{lang === 'zh' ? '本地风格中' : 'local style'}</span>
            )}
            <button
              className="ce-mode-toggle"
              type="button"
              onClick={() => setMode(m => (m === 'modal' ? 'side' : 'modal'))}
              title={lang === 'zh' ? '切换布局模式' : 'Toggle layout'}
            >
              {mode === 'modal'
                ? lang === 'zh'
                  ? '侧栏'
                  : 'Side'
                : lang === 'zh'
                  ? '全屏'
                  : 'Modal'}
            </button>
            <button className="ce-btn ce-btn-ghost" type="button" onClick={copyStyle}>
              {lang === 'zh' ? '复制 STYLE' : 'Copy STYLE'}
            </button>
            <button
              className="ce-btn ce-btn-ghost"
              type="button"
              onClick={handleDownloadGeneratedStyle}
            >
              ⬇ style.js
            </button>
            <button
              className="ce-btn ce-btn-ghost"
              type="button"
              onClick={handleDownloadBackup}
              title={lang === 'zh' ? '下载本地备份 (JSON)' : 'Download local backup (JSON)'}
            >
              ⬇ {lang === 'zh' ? '备份 JSON' : 'Backup JSON'}
            </button>
            <button className="ce-close" type="button" onClick={onClose} aria-label="close">
              x
            </button>
          </div>
        </header>

        <div className="ce-banner" role="status" aria-live="polite">
          <div className="ce-banner-text">
            {storageError ||
              (lang === 'zh'
                ? '当前修改只保存在本浏览器。发布前请点击「复制 STYLE」导出代码并提交到 Git。'
                : 'Edits live only in this browser. Click "Copy STYLE" to export and commit to Git before publishing.')}
          </div>
          {storageError ? (
            <div className="ce-banner-meta">
              {lang === 'zh' ? '本地草稿尚未保存' : 'Local draft is not saved'}
            </div>
          ) : isDirty ? (
            <div className="ce-banner-meta">
              {lang === 'zh' ? '正在保存本地草稿…' : 'Saving local draft…'}
            </div>
          ) : lastSaved ? (
            <div className="ce-banner-meta">
              {lang === 'zh' ? '上次本地保存：' : 'Last local save: '}
              {formatLocalTs(lastSaved)}
            </div>
          ) : null}
        </div>

        <div className="ce-body se-body">
          <nav className="ce-tabs" aria-label="style dimensions">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`ce-tab ${active === tab.key ? 'act' : ''} ${tab.live ? '' : 'se-tab-reserved'}`}
                onClick={() => setActive(tab.key)}
              >
                <span className="ce-tab-label">{pick(tab.label, lang)}</span>
                {!tab.live && (
                  <span className="ce-tab-dot" title={lang === 'zh' ? '已预留' : 'Reserved'}>
                    ○
                  </span>
                )}
              </button>
            ))}
          </nav>

          <main className="ce-main">
            <div className="ce-main-head">
              <h3 className="ce-section-title">{pick(activeTab.label, lang)}</h3>
              {!activeTab.live && (
                <span className="ce-tag">{lang === 'zh' ? '已预留' : 'reserved'}</span>
              )}
            </div>
            <div className="se-preview" aria-hidden="true">
              <span />
              <strong>{lang === 'zh' ? '风格预览' : 'Style preview'}</strong>
              <em>{style.typography.personality}</em>
            </div>
            {panel}
            {showLivePreview && (
              <PreviewFrame style={style} lang={lang} label={pick(activeTab.label, lang)} />
            )}
            {reservedTabs.length > 0 && (
              <div className="se-reserved">
                <span>{lang === 'zh' ? '后续维度' : 'Next dimensions'}</span>
                {reservedTabs.map(dim => (
                  <button
                    key={dim.key}
                    type="button"
                    className={active === dim.key ? 'act' : ''}
                    onClick={() => setActive(dim.key)}
                  >
                    {pick(dim.label, lang)}
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>

        <footer className="ce-footer">
          <div className={`ce-footer-msg ${storageError ? 'ce-footer-error' : ''}`}>
            {storageError || copied}
          </div>
          <div className="ce-footer-actions">
            <button
              className="ce-btn ce-btn-ghost"
              type="button"
              onClick={resetStyle}
              disabled={!isCustomized}
            >
              {lang === 'zh' ? '重置风格' : 'Reset style'}
            </button>
            <button className="ce-btn" type="button" onClick={onClose}>
              {lang === 'zh' ? '完成' : 'Done'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
