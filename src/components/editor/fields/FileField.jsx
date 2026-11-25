import React, { useContext, useEffect, useRef, useState } from 'react'
import { createResponsiveImageVariants, fileToDataUrl, resizeImage } from '../../../utils.js'
import { RESPONSIVE_IMAGE_WIDTHS, responsiveUploadFilename } from '../../../lib/images.js'
import { createGitHubClient, dataUrlBase64 } from '../../../lib/github.js'
import { readGitHubToken, readPublishConfig } from '../../../lib/publish-config.js'
import { workVideoSource } from '../../../lib/work-video.js'
import { FILE_IMAGE_TEMPLATES } from '../contentPresets.js'
import { OpenPublishPanelContext } from '../publish-panel-context.js'

const DEV_UPLOAD = import.meta.env.DEV

export function FileField({
  value,
  onChange,
  subfolder = 'picture',
  accept = 'image/*',
  isAudio = false,
  isVideo = false,
  onTemplateApply,
}) {
  const openPublish = useContext(OpenPublishPanelContext)
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

  useEffect(() => {
    const controller = new AbortController()
    const id = setTimeout(async () => {
      const path = isVideo ? workVideoSource(value) : value
      if (isVideo && value && !path) {
        setStatus('error')
        setStatusMsg('请输入站内视频路径或 HTTP(S) 视频直链')
        return
      }
      // A playable external video does not need to allow cross-origin HEAD requests.
      if (!path || (isVideo && !path.startsWith('/'))) {
        setStatus('')
        setStatusMsg('')
        return
      }
      if (uploadedPathRef.current === path) {
        setStatus('ok')
        setStatusMsg(
          isVideo
            ? '视频文件已上传。请发布内容，将视频关联到项目。'
            : '已提交到 GitHub，等待静态站重新部署',
        )
        return
      }
      try {
        const response = await fetch(path, { method: 'HEAD', signal: controller.signal })
        if (controller.signal.aborted) return
        setStatus(response.ok ? 'ok' : 'missing')
        setStatusMsg(response.ok ? '文件存在' : `未找到（${response.status}）`)
      } catch {
        if (controller.signal.aborted) return
        setStatus('missing')
        setStatusMsg('未找到')
      }
    }, 250)
    return () => {
      clearTimeout(id)
      controller.abort()
    }
  }, [value, isVideo])

  useEffect(() => {
    if (!pendingFile || (!isVideo && !pendingFile.type.startsWith('image/'))) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(pendingFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingFile, isVideo])

  const onPick = e => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (isVideo && (!/\.mp4$/i.test(f.name) || f.size > 50 * 1024 * 1024 || f.size === 0)) {
      setPendingFile(null)
      setStatus('error')
      setStatusMsg('请选择非空且不超过 50 MiB 的 MP4，较大的视频请填写直链')
      return
    }
    setPendingFile(f)
    setFilename(sanitizeFilename(f.name))
    setFileSize(f.size)
  }

  const saveToPublic = async () => {
    if (!pendingFile || !filename) return
    if (isVideo && !/\.mp4$/i.test(filename)) {
      setStatus('error')
      setStatusMsg('视频文件名必须以 .mp4 结尾')
      return
    }
    const token = DEV_UPLOAD ? '' : readGitHubToken()
    if (!DEV_UPLOAD && !token) {
      setStatus('missing')
      setStatusMsg('请在「发布」面板验证 GitHub 连接后，再点击上传。已保留所选文件。')
      openPublish?.()
      return
    }
    setBusy(true)
    const isImage = !isVideo && pendingFile.type.startsWith('image/')
    setStatusMsg(isImage ? '生成响应式图片 + 上传中...' : '上传中...')
    try {
      let github = null
      let publishConfig = null
      if (!DEV_UPLOAD) {
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
          aria-label={isVideo ? '项目视频路径或直链' : undefined}
          placeholder={`/${subfolder}/example.${isVideo ? 'mp4' : isAudio ? 'mp3' : 'jpg'}`}
        />
        <button
          type="button"
          className="ce-icon-btn"
          onClick={() => fileRef.current?.click()}
          aria-label={isVideo ? '选择 MP4 文件' : undefined}
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
          {isVideo
            ? '可直接粘贴视频直链。上传本地 MP4 到网站需要连接 GitHub。'
            : '上传本地文件需要连接 GitHub。也可以直接填写已有资源的路径。'}
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
          {previewUrl && isVideo && (
            <video
              className="ce-file-video-preview"
              src={previewUrl}
              aria-label="待上传视频预览"
              controls
              playsInline
              preload="metadata"
            />
          )}
          {previewUrl && !isAudio && !isVideo && (
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
                setPendingFile(null)
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
                : isVideo && !DEV_UPLOAD
                  ? '上传到 GitHub'
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
