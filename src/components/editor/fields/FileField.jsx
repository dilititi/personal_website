import React, { useEffect, useRef, useState } from 'react'
import { createResponsiveImageVariants, fileToDataUrl, resizeImage } from '../../../utils.js'
import { RESPONSIVE_IMAGE_WIDTHS, responsiveUploadFilename } from '../../../lib/images.js'
import { createGitHubClient, dataUrlBase64 } from '../../../lib/github.js'
import { readGitHubToken, readPublishConfig } from '../../../lib/publish-config.js'
import { FILE_IMAGE_TEMPLATES } from '../contentPresets.js'

const DEV_UPLOAD = import.meta.env.DEV

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
  const uploadedPathRef = useRef('')
  const imageTemplates =
    !isAudio && accept.includes('image') ? FILE_IMAGE_TEMPLATES[subfolder] || [] : []

  // Verify whether the current path actually points to an existing file in public/
  const checkPath = async p => {
    if (!p) {
      setStatus('')
      setStatusMsg('')
      return
    }
    if (uploadedPathRef.current === p) {
      setStatus('ok')
      setStatusMsg('已提交到 GitHub，等待静态站重新部署')
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
    setBusy(true)
    const isImage = pendingFile.type.startsWith('image/')
    setStatusMsg(isImage ? '生成响应式图片 + 上传中...' : '上传中...')
    try {
      let github = null
      let publishConfig = null
      if (!DEV_UPLOAD) {
        const token = readGitHubToken()
        if (!token) {
          throw new Error('请先在编辑器的「发布」面板验证 GitHub token')
        }
        publishConfig = readPublishConfig()
        github = createGitHubClient({
          token,
          owner: publishConfig.owner,
          repo: publishConfig.repo,
        })
      }

      const upload = async (uploadFilename, dataUrl) => {
        if (DEV_UPLOAD) {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subfolder, filename: uploadFilename, dataUrl }),
          })
          const result = await response.json()
          if (!response.ok || !result.ok) {
            throw new Error(result.error || response.statusText)
          }
          return result
        }

        const encoded = dataUrlBase64(dataUrl)
        const publicPath = `/${subfolder}/${uploadFilename}`
        await github.upsertBase64File({
          path: `public${publicPath}`,
          base64Content: encoded.content,
          branch: publishConfig.branch,
          message: `asset: upload ${subfolder}/${uploadFilename} via editor`,
        })
        return {
          ok: true,
          path: publicPath,
          size: Math.floor((encoded.content.length * 3) / 4),
        }
      }

      const variants = isImage
        ? await createResponsiveImageVariants(pendingFile, RESPONSIVE_IMAGE_WIDTHS, 0.85)
        : []
      let saved
      let totalSize = 0

      if (variants.length) {
        const results = []
        for (const variant of variants) {
          const result = await upload(
            responsiveUploadFilename(filename, variant.width, variant.extension),
            variant.dataUrl,
          )
          results.push(result)
          totalSize += result.size || 0
        }
        saved = results.at(-1)
      } else {
        const dataUrl = isImage
          ? await resizeImage(pendingFile, 1800, 0.85)
          : await fileToDataUrl(pendingFile)
        let finalFilename = filename
        if (isImage && dataUrl.startsWith('data:image/jpeg') && !/\.(jpe?g)$/i.test(filename)) {
          finalFilename = filename.replace(/\.[^.]+$/, '') + '.jpg'
        }
        saved = await upload(finalFilename, dataUrl)
        totalSize = saved.size || 0
      }

      if (!DEV_UPLOAD) uploadedPathRef.current = saved.path
      onChange(saved.path)
      setStatus('ok')
      setStatusMsg(
        variants.length
          ? `✓ 已生成 ${variants.length} 个响应式尺寸并${DEV_UPLOAD ? '保存到本地' : '提交到 GitHub'} public/${subfolder}/（${(totalSize / 1024).toFixed(1)} KB）`
          : `✓ 已${DEV_UPLOAD ? '保存到' : '提交到 GitHub：'} public${saved.path}（${(totalSize / 1024).toFixed(1)} KB）`,
      )
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
      setStatusMsg(`错误：${e.message}`)
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
          title={
            DEV_UPLOAD
              ? '选择文件并写入本地 public/'
              : '选择文件；提交时需要编辑器「发布」面板中的 GitHub token'
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
      {!DEV_UPLOAD && (
        <div className="ce-file-status ce-file-status-missing">
          生产上传使用编辑器「发布」面板中的 GitHub
          配置；提交后需等待静态站重新部署。未配置时仍可直接填写 public 路径。
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
          {previewUrl && !isAudio && (
            <img
              className="ce-file-preview"
              src={previewUrl}
              alt=""
              width="200"
              height="200"
              loading="lazy"
              decoding="async"
            />
          )}
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
              {busy
                ? DEV_UPLOAD
                  ? '保存中...'
                  : '提交中...'
                : `${DEV_UPLOAD ? '写入' : '提交'} public/${subfolder}/`}
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
