import React, { useRef, useState } from 'react'
import { useData } from '../../data-context.jsx'
import { useStyle } from '../../style-context.jsx'
import { AI_PROMPT, CONTENT_PRESETS, STARTER_TEMPLATE } from './contentPresets.js'
import { validateImportData } from './validation.js'

const PRE_IMPORT_KEY = 'chen.content.preImport'

export default function ImportPanel() {
  const data = useData()
  const { applyPreset } = useStyle()
  const [jsonText, setJsonText] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [promptCopied, setPromptCopied] = useState(false)
  const [applied, setApplied] = useState('')
  const [hasSnapshot, setHasSnapshot] = useState(() => {
    try {
      return !!localStorage.getItem(PRE_IMPORT_KEY)
    } catch {
      return false
    }
  })
  const [snapshotInfo, setSnapshotInfo] = useState(() => {
    try {
      const raw = localStorage.getItem(PRE_IMPORT_KEY)
      if (!raw) return null
      const obj = JSON.parse(raw)
      return { ts: obj._ts || null, keys: Object.keys(obj).filter(key => key !== '_ts') }
    } catch {
      return null
    }
  })
  const fileRef = useRef(null)

  const handleParse = text => {
    if (!text.trim()) {
      setParseResult(null)
      return
    }
    try {
      // Strip common markdown code-block fencing AI sometimes adds
      let cleaned = text.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      const parsed = JSON.parse(cleaned)
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        setParseResult({ valid: false, error: 'JSON 必须是对象,顶层有 SITE / ABOUT 等键' })
        return
      }
      setParseResult(validateImportData(parsed))
    } catch (e) {
      setParseResult({ valid: false, error: e.message })
    }
  }

  const handleFile = e => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      setJsonText(text)
      handleParse(text)
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  const saveSnapshot = () => {
    try {
      const snap = { ...(data.userOverrides || data.overrides || {}), _ts: Date.now() }
      localStorage.setItem(PRE_IMPORT_KEY, JSON.stringify(snap))
      setHasSnapshot(true)
      setSnapshotInfo({ ts: snap._ts, keys: Object.keys(snap).filter(key => key !== '_ts') })
    } catch (e) {
      console.warn('Snapshot save failed:', e)
    }
  }

  const applySections = (sections, source, message) => {
    saveSnapshot()
    sections.forEach(key => {
      data.setSection(key, deepClone(source[key]))
    })
    setApplied(message)
    setJsonText('')
    setParseResult(null)
    setTimeout(() => setApplied(''), 5000)
  }

  const handleApply = () => {
    if (!parseResult?.valid) return
    const sections = parseResult.sections
    if (
      !window.confirm(
        `将覆盖以下 ${sections.length} 个章节:\n\n${sections.join(', ')}\n\n继续?(下方会出现「撤销」按钮可一键回退)`,
      )
    )
      return
    applySections(
      sections,
      parseResult.data,
      `✓ 已应用 ${sections.length} 个章节: ${sections.join(' · ')}`,
    )
  }

  const handleUndo = () => {
    if (!window.confirm('撤销上次自动填充?会还原到导入前的所有 localStorage 编辑状态。')) return
    try {
      const raw = localStorage.getItem(PRE_IMPORT_KEY)
      if (!raw) return
      const snap = JSON.parse(raw)
      delete snap._ts
      data.replaceOverrides(snap)
      localStorage.removeItem(PRE_IMPORT_KEY)
      setHasSnapshot(false)
      setSnapshotInfo(null)
      setApplied('↺ 已撤销上次导入')
      setTimeout(() => setApplied(''), 4000)
    } catch (e) {
      window.alert('撤销失败: ' + e.message)
    }
  }

  const handleResetAll = () => {
    if (
      !window.confirm(
        '清除所有本地编辑?\n\n所有章节恢复到 data.js 代码默认值。手动编辑过的内容也一并清掉。此操作不可撤销。',
      )
    )
      return
    data.resetAll()
    try {
      localStorage.removeItem(PRE_IMPORT_KEY)
    } catch {}
    setHasSnapshot(false)
    setSnapshotInfo(null)
    setApplied('已清除所有本地编辑')
    setTimeout(() => setApplied(''), 4000)
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT).then(() => {
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2500)
    })
  }

  const downloadStarter = () => {
    const blob = new Blob([JSON.stringify(STARTER_TEMPLATE, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'starter.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const applyContentPreset = preset => {
    const sections = Object.keys(preset.data)
    if (
      !window.confirm(`应用「${preset.label}」会覆盖这些章节:\n\n${sections.join(', ')}\n\n继续吗?`)
    )
      return
    applySections(sections, preset.data, `✓ 已应用预制模板: ${preset.label}`)
    if (preset.stylePreset) {
      applyPreset(preset.stylePreset)
    }
  }

  return (
    <div className="ce-import">
      <div className="ce-import-intro">
        <p>用自然语言描述你自己,AI 帮你填好整个网站的全部数据 —— 这是模板最有意思的功能。</p>
      </div>

      <div className="ce-import-step">
        <h4>预制模板</h4>
        <p>
          先选择一个完整方向，文字、模块和图片路径会一起填入。图片只保存 public 路径，不写入大体积
          base64。
        </p>
        <div className="ce-template-grid">
          {CONTENT_PRESETS.map(preset => (
            <article key={preset.id} className="ce-template-card">
              <span
                className="ce-template-thumb"
                style={{ backgroundImage: `url("${preset.preview}")` }}
              />
              <div className="ce-template-copy">
                <strong>{preset.label}</strong>
                <p>{preset.description}</p>
              </div>
              <button className="ce-btn" type="button" onClick={() => applyContentPreset(preset)}>
                应用模板
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="ce-import-step">
        <h4>① 复制 AI 提示词</h4>
        <p>提示词内置了整个网站需要的 JSON 结构,AI 拿到就知道每个字段填什么。</p>
        <button className="ce-btn" onClick={copyPrompt}>
          {promptCopied ? '✓ 已复制到剪贴板' : '📋 复制 AI 提示词'}
        </button>
      </div>

      <div className="ce-import-step">
        <h4>② 打开任意大语言模型,粘贴 + 填好你的信息</h4>
        <p>
          推荐: <strong>ChatGPT</strong> · <strong>Claude</strong> · <strong>豆包</strong> ·{' '}
          <strong>智谱 GLM</strong> · <strong>Kimi</strong> · <strong>通义千问</strong>
        </p>
        <p style={{ color: 'var(--cream-mute)' }}>
          提示词的「我的信息」部分需要你填——姓名、职业、城市、教育经历、作品、爱好等。填得越具体,AI
          写得越像你。
        </p>
      </div>

      <div className="ce-import-step">
        <h4>③ 把 AI 返回的 JSON 粘到这里</h4>
        <textarea
          className="ce-input ce-import-textarea"
          value={jsonText}
          onChange={e => {
            setJsonText(e.target.value)
            handleParse(e.target.value)
          }}
          placeholder={
            '粘贴 JSON,例如:\n{\n  "SITE": { "name": { "en": "...", "zh": "..." }, ... },\n  "ABOUT": { ... },\n  ...\n}'
          }
          spellCheck={false}
          rows={10}
        />
        <div className="ce-import-actions">
          <button
            type="button"
            className="ce-btn ce-btn-ghost"
            onClick={() => fileRef.current?.click()}
          >
            📁 或者上传 .json 文件
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <button type="button" className="ce-btn ce-btn-ghost" onClick={downloadStarter}>
            📥 下载空白模板
          </button>
        </div>
      </div>

      {parseResult && (
        <div className="ce-import-step">
          <h4>④ 校验结果</h4>
          {parseResult.valid ? (
            <>
              <div className="ce-file-status ce-file-status-ok">
                ✓ JSON 格式合法 · 检测到 {parseResult.sections.length} 个章节
              </div>
              <ul className="ce-import-sections">
                {parseResult.sections.map(s => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <button className="ce-btn" onClick={handleApply} style={{ marginTop: 8 }}>
                ✓ 应用到网站(覆盖现有内容)
              </button>
            </>
          ) : (
            <div className="ce-file-status ce-file-status-error">✗ {parseResult.error}</div>
          )}
        </div>
      )}

      {applied && <div className="ce-import-applied">{applied}</div>}

      <div className="ce-import-step ce-import-danger">
        <h4>回退 / 重置</h4>
        {hasSnapshot ? (
          <>
            <p style={{ color: 'var(--cream)' }}>
              检测到上次自动填充前的快照
              {snapshotInfo?.ts ? `(${new Date(snapshotInfo.ts).toLocaleString('zh-CN')})` : ''}。
              可以一键撤销那次导入,恢复到导入前的状态。
            </p>
            <button type="button" className="ce-btn" onClick={handleUndo}>
              ↺ 撤销上次自动填充
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--cream-faint)', fontStyle: 'italic' }}>
            没有可撤销的导入(每次应用 JSON 或预制模板时自动存快照)。
          </p>
        )}

        <div className="ce-import-divider"></div>

        <p>
          清除所有本地编辑(自动填充 + 手动编辑都包括),恢复到 <code>data.js</code> 代码默认值:
        </p>
        <button type="button" className="ce-btn ce-btn-danger" onClick={handleResetAll}>
          重置所有本地编辑
        </button>
      </div>

      <div className="ce-import-step ce-import-help">
        <h4>查阅完整字段文档</h4>
        <p>
          项目根目录的 <code>CONTENT_GUIDE.md</code> 详列所有字段、双语规则、图片要求、AI
          提示词使用方法。
        </p>
      </div>
    </div>
  )
}

function deepClone(v) {
  return JSON.parse(JSON.stringify(v))
}
