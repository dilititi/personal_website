import React, { useEffect, useRef, useState } from 'react'
import { fileToDataUrl, resizeImage } from '../../../utils'
import { FILE_IMAGE_TEMPLATES } from '../contentPresets'

// Uploads POST to /api/upload, a dev-only Vite middleware (see vite.config.js).
// Production builds are static and have no such endpoint, so uploading is
// disabled there and users fall back to entering a public/ path by hand.
// import.meta.env.DEV is true only under `npm run dev`.
const CAN_UPLOAD = import.meta.env.DEV

export function FileField({
  value,
  onChange,
  subfolder = 'picture',
  accept = 'image/*',
  isAudio = false,
  onTemplateApply,
}) {
  const [filename, setFilename] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('') // '' | 'ok' | 'missing' | 'error'
  const [statusMsg, setStatusMsg] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const fileRef = useRef(null)
  const imageTemplates =
    !isAudio && accept.includes('image') ? FILE_IMAGE_TEMPLATES[subfolder] || [] : []

  // Verify whether the current path actually points to an existing file in public/
  const checkPath = async p => {
    if (!p) {
      setStatus('')
      setStatusMsg('')
      return
    }
    try {
      const r = await fetch(p, { method: 'HEAD' })
      if (r.ok) {
        setStatus('ok')
        setStatusMsg('文件存在')
      } else {
        setStatus('missing')
        setStatusMsg(`未找到（${r.status}）`)
      }
    } catch {
      setStatus('missing')
      setStatusMsg('未找到')
    }
  }

  // When path text changes, debounce-check existence
  useEffect(() => {
    const id = setTimeout(() => checkPath(value), 250)
    return () => clearTimeout(id)
  }, [value])

  const onPick = e => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setPendingFile(f)
    setFilename(sanitizeFilename(f.name))
    setFileSize(f.size)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f))
    } else {
      setPreviewUrl('')
    }
  }

  const saveToPublic = async () => {
    if (!pendingFile || !filename) return
    if (!CAN_UPLOAD) {
      setStatus('error')
      setStatusMsg('生产环境不支持上传；请直接在上方填入 public 路径')
      return
    }
    setBusy(true)
    const isImage = pendingFile.type.startsWith('image/')
    setStatusMsg(isImage ? '压缩 + 上传中...' : '上传中...')
    try {
      // Auto-resize images (long edge 1800px, JPEG 0.85). Audio/PDF go through as-is.
      const dataUrl = isImage
        ? await resizeImage(pendingFile, 1800, 0.85)
        : await fileToDataUrl(pendingFile)
      // Force .jpg extension on resized JPEGs to match what canvas produced.
      let finalFilename = filename
      if (isImage && dataUrl.startsWith('data:image/jpeg') && !/\.(jpe?g)$/i.test(filename)) {
        finalFilename = filename.replace(/\.[^.]+$/, '') + '.jpg'
      }
      const r = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subfolder, filename: finalFilename, dataUrl }),
      })
      const json = await r.json()
      if (!r.ok || !json.ok) {
        setStatus('error')
        setStatusMsg(`上传失败：${json.error || r.statusText}`)
        setBusy(false)
        return
      }
      onChange(json.path)
      setStatus('ok')
      setStatusMsg(`✓ 已保存到 public${json.path}（${(json.size / 1024).toFixed(1)} KB）`)
      // Clear staged file
      setPendingFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl('')
      }
      setFilename('')
      setFileSize(0)
    } catch (e) {
      setStatus('error')
      setStatusMsg(`错误：${e.message}（确认 dev server 正在运行；生产构建里此功能无效）`)
    }
    setBusy(false)
  }

  return (
    <div className="ce-file">
      <div className="ce-file-row">
        <input
          className="ce-input"
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={`/${subfolder}/example.${isAudio ? 'mp3' : 'jpg'}`}
        />
        <button
          type="button"
          className="ce-icon-btn"
          onClick={() => fileRef.current?.click()}
          disabled={!CAN_UPLOAD}
          title={
            CAN_UPLOAD ? '选择文件' : '上传仅在 npm run dev 下可用；生产环境请直接填写 public 路径'
          }
        >
          📁
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={onPick}
          style={{ display: 'none' }}
        />
      </div>
      {!CAN_UPLOAD && (
        <div className="ce-file-status ce-file-status-missing">
          ⚠ 生产环境无法上传（/api/upload 仅在 npm run dev 下存在）。请直接在上方填入 public
          路径，或在本地 dev 上传后再发布。
        </div>
      )}
      {status && (
        <div className={`ce-file-status ce-file-status-${status}`}>
          {status === 'ok' ? '✓' : status === 'missing' ? '⚠' : '✗'} {statusMsg}
        </div>
      )}
      {imageTemplates.length > 0 && (
        <div className="ce-file-templates">
          <span className="ce-file-template-label">预制图片</span>
          <div className="ce-file-template-grid">
            {imageTemplates.map(template => (
              <button
                key={template.path}
                type="button"
                className={`ce-file-template ${value === template.path ? 'act' : ''}`}
                onClick={() => {
                  onTemplateApply?.(template.label)
                  onChange(template.path)
                }}
                title={template.path}
              >
                <span style={{ backgroundImage: `url("${template.path}")` }} />
                <em>{template.label}</em>
              </button>
            ))}
          </div>
        </div>
      )}
      {pendingFile && (
        <div className="ce-file-stage">
          <div className="ce-file-stage-info">
            <strong>{pendingFile.name}</strong> · {(fileSize / 1024).toFixed(1)} KB
            <span className="ce-file-target">
              → public/{subfolder}/
              <input
                type="text"
                className="ce-input ce-file-name-input"
                value={filename}
                onChange={e => setFilename(sanitizeFilename(e.target.value))}
              />
            </span>
          </div>
          {previewUrl && !isAudio && <img className="ce-file-preview" src={previewUrl} alt="" />}
          <div className="ce-file-stage-actions">
            <button
              type="button"
              className="ce-btn ce-btn-ghost"
              onClick={() => {
                if (previewUrl) URL.revokeObjectURL(previewUrl)
                setPendingFile(null)
                setPreviewUrl('')
                setFilename('')
                setFileSize(0)
              }}
            >
              取消
            </button>
            <button
              type="button"
              className="ce-btn"
              onClick={saveToPublic}
              disabled={busy || !filename}
            >
              {busy ? '保存中...' : `💾 写入 public/${subfolder}/`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function sanitizeFilename(name) {
  // Replace non-ASCII and unsafe chars with -, collapse multiple, strip leading/trailing -
  return (
    name
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'file'
  )
}

// fileToDataUrl, resizeImage imported from ../utils
