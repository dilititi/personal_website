import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLang } from '../../../lang.jsx'
import { createResponsiveImageVariants, fileToDataUrl, resizeImage } from '../../../utils.js'
import { RESPONSIVE_IMAGE_WIDTHS, responsiveUploadFilename } from '../../../lib/images.js'
import {
  createGitHubClient,
  dataUrlBase64,
  githubTokenPermissionHelp,
} from '../../../lib/github.js'
import { readGitHubToken, readPublishConfig } from '../../../lib/publish-config.js'
import {
  abortProjectVideoUpload,
  MAX_PROJECT_VIDEO_BYTES,
  mediaUploadEndpoint,
  newProjectVideoUpload,
  uploadProjectVideo,
} from '../../../lib/project-video-upload.js'
import {
  getUploadedVideoPreview,
  setUploadedVideoPreview,
  workVideoSource,
} from '../../../lib/work-video.js'
import { FILE_IMAGE_TEMPLATES } from '../contentPresets.js'
import { OpenPublishPanelContext } from '../publish-panel-context.js'
import PublishPanel from '../PublishPanel.jsx'

const DEV_UPLOAD = import.meta.env.DEV
const VIDEO_UPLOAD_ENDPOINT = mediaUploadEndpoint(import.meta.env.VITE_WORK_MEDIA_UPLOAD_URL)
const REPO_VIDEO_LIMIT = 50 * 1024 * 1024
const VIDEO_FILENAME = /^[a-z\d][a-z\d._-]*\.mp4$/i

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
  const { lang } = useLang()
  const [filename, setFilename] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('') // '' | 'ok' | 'missing' | 'error'
  const [statusMsg, setStatusMsg] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [showVideoConnection, setShowVideoConnection] = useState(false)
  const [mediaKey, setMediaKey] = useState('')
  const [mediaProgress, setMediaProgress] = useState(null)
  const fileRef = useRef(null)
  const fieldRef = useRef(null)
  const mediaJob = useRef(null)
  const mediaRequest = useRef(null)
  const uploadedPathRef = useRef('')
  const uploadToMedia = isVideo && Boolean(VIDEO_UPLOAD_ENDPOINT)
  const uploadedPreview = isVideo && !pendingFile ? getUploadedVideoPreview(value) : ''
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

  useEffect(() => () => mediaRequest.current?.abort(), [])

  const clearSelection = () => {
    setPendingFile(null)
    setFilename('')
    setFileSize(0)
    setMediaProgress(null)
  }

  const cancelMediaUpload = () => {
    mediaRequest.current?.abort()
    mediaRequest.current = null
    if (mediaJob.current) {
      abortProjectVideoUpload(mediaJob.current, {
        endpoint: VIDEO_UPLOAD_ENDPOINT,
        key: mediaKey.trim(),
      }).catch(() => {})
      mediaJob.current = null
    }
    setBusy(false)
    setStatus('')
    clearSelection()
  }

  const onPick = e => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const limit = uploadToMedia ? MAX_PROJECT_VIDEO_BYTES : REPO_VIDEO_LIMIT
    if (isVideo && (!/\.mp4$/i.test(f.name) || f.size > limit || f.size === 0)) {
      clearSelection()
      setStatus('error')
      const sizeLabel = uploadToMedia ? '1 GB' : '50 MiB'
      setStatusMsg(
        lang === 'zh'
          ? `请选择非空且不超过 ${sizeLabel} 的 MP4。超过上限请用达芬奇或 FFmpeg 压缩后重选。`
          : `Choose a non-empty MP4 up to ${sizeLabel}. Compress larger videos before selecting them again.`,
      )
      return
    }
    setStatus('')
    setPendingFile(f)
    const name = sanitizeFilename(f.name)
    setFilename(
      isVideo && !VIDEO_FILENAME.test(name) ? `project-video-${crypto.randomUUID()}.mp4` : name,
    )
    setFileSize(f.size)
  }

  const saveToMedia = async () => {
    if (!pendingFile || !mediaKey.trim() || mediaRequest.current) return
    const controller = new AbortController()
    mediaRequest.current = controller
    mediaJob.current ||= newProjectVideoUpload(pendingFile)
    setBusy(true)
    setStatus('')
    try {
      const url = await uploadProjectVideo(mediaJob.current, {
        endpoint: VIDEO_UPLOAD_ENDPOINT,
        key: mediaKey.trim(),
        signal: controller.signal,
        onProgress: (uploaded, total) => setMediaProgress({ uploaded, total }),
      })
      if (controller.signal.aborted || !fieldRef.current) return
      onChange(url)
      mediaJob.current = null
      clearSelection()
      setStatus('ok')
      setStatusMsg(
        lang === 'zh'
          ? '视频已上传，可以预览。请发布内容，将视频公开关联到项目。'
          : 'Video uploaded and ready to preview. Publish the project content to make it visible to visitors.',
      )
    } catch (error) {
      if (!controller.signal.aborted) {
        setStatus('error')
        setStatusMsg(error.message)
      }
    } finally {
      if (mediaRequest.current === controller) {
        mediaRequest.current = null
        setBusy(false)
      }
    }
  }

  const saveToPublic = async (target = null) => {
    if (!fieldRef.current || !pendingFile || !filename) return
    if (isVideo && !VIDEO_FILENAME.test(filename)) {
      setStatus('error')
      setStatusMsg('视频文件名必须以字母或数字开头，并以 .mp4 结尾')
      return
    }
    const token = DEV_UPLOAD ? '' : readGitHubToken()
    if (!DEV_UPLOAD && !token && !target) {
      if (isVideo) {
        openPublish?.(false)
        setShowVideoConnection(true)
        return
      }
      setStatus('missing')
      setStatusMsg('请在「发布」面板验证 GitHub 连接后，再点击上传。已保留所选文件。')
      openPublish?.()
      return
    }
    setBusy(true)
    const isImage = !isVideo && pendingFile.type.startsWith('image/')
    setStatusMsg(isImage ? '生成响应式图片 + 上传中...' : '上传中...')
    try {
      let github = target?.github
      let publishConfig = target?.config
      if (!DEV_UPLOAD && !github) {
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

      if (!fieldRef.current) return
      if (isVideo && !DEV_UPLOAD) setUploadedVideoPreview(saved.path, pendingFile)
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
      if (target) throw e
      const help = !DEV_UPLOAD && githubTokenPermissionHelp(e, readPublishConfig(), lang)
      setStatus('error')
      setStatusMsg(help?.message || e.message)
      if (isVideo && !DEV_UPLOAD && (e.status === 401 || e.status === 403)) {
        openPublish?.(false)
        setShowVideoConnection(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ce-file" ref={fieldRef}>
      <div className="ce-file-row">
        <input
          className="ce-input"
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          disabled={uploadToMedia && busy}
          aria-label={isVideo ? '项目视频路径或直链' : undefined}
          placeholder={`/${subfolder}/example.${isVideo ? 'mp4' : isAudio ? 'mp3' : 'jpg'}`}
        />
        <button
          type="button"
          className="ce-icon-btn"
          onClick={() => fileRef.current?.click()}
          disabled={busy || showVideoConnection || (uploadToMedia && Boolean(pendingFile))}
          aria-label={isVideo ? '选择 MP4 文件' : undefined}
          title={
            uploadToMedia
              ? '选择不超过 1 GB 的 MP4'
              : DEV_UPLOAD
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
      {(!DEV_UPLOAD || uploadToMedia) && (
        <div className="ce-file-status ce-file-status-missing">
          {uploadToMedia
            ? lang === 'zh'
              ? 'MP4 · 最大 1 GB'
              : 'MP4 · max 1 GB'
            : isVideo
              ? '可直接粘贴视频直链。上传本地 MP4 到网站需要连接 GitHub。'
              : '上传本地文件需要连接 GitHub。也可以直接填写已有资源的路径。'}
        </div>
      )}
      {status && (
        <div className={`ce-file-status ce-file-status-${status}`}>
          {status === 'ok' ? '✓' : status === 'missing' ? '⚠' : '✗'} {statusMsg}
        </div>
      )}
      {(uploadedPreview || (uploadToMedia && !pendingFile && workVideoSource(value))) && (
        <video
          className="ce-file-video-preview"
          src={uploadedPreview || workVideoSource(value)}
          aria-label="已上传视频的本地预览"
          controls
          playsInline
          preload="metadata"
        />
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
            <strong>{pendingFile.name}</strong> · {(fileSize / (1024 * 1024)).toFixed(2)} MiB
            {!uploadToMedia && (
              <span className="ce-file-target">
                → public/{subfolder}/
                <input
                  type="text"
                  className="ce-input ce-file-name-input"
                  value={filename}
                  disabled={busy || showVideoConnection}
                  onChange={e => setFilename(sanitizeFilename(e.target.value))}
                />
              </span>
            )}
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
          {uploadToMedia ? (
            <>
              <label className="ce-file-media-key">
                <span>{lang === 'zh' ? '媒体上传密钥' : 'Media upload key'}</span>
                <input
                  className="ce-input"
                  type="password"
                  autoComplete="off"
                  value={mediaKey}
                  disabled={busy}
                  onChange={event => setMediaKey(event.target.value)}
                />
              </label>
              {mediaProgress && (
                <progress
                  className="ce-file-upload-progress"
                  aria-label={lang === 'zh' ? '视频上传进度' : 'Video upload progress'}
                  max={mediaProgress.total}
                  value={mediaProgress.uploaded}
                />
              )}
              <div className="ce-file-stage-actions">
                <button className="ce-btn ce-btn-ghost" type="button" onClick={cancelMediaUpload}>
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  className="ce-btn"
                  type="button"
                  onClick={saveToMedia}
                  disabled={busy || !mediaKey.trim()}
                >
                  {busy
                    ? lang === 'zh'
                      ? '上传中…'
                      : 'Uploading…'
                    : mediaProgress
                      ? lang === 'zh'
                        ? '继续上传'
                        : 'Resume upload'
                      : lang === 'zh'
                        ? '上传视频'
                        : 'Upload video'}
                </button>
              </div>
            </>
          ) : (
            <div className="ce-file-stage-actions">
              <button
                type="button"
                className="ce-btn ce-btn-ghost"
                disabled={busy || showVideoConnection}
                onClick={() => {
                  clearSelection()
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="ce-btn"
                onClick={() => saveToPublic()}
                disabled={busy || showVideoConnection || !filename}
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
          )}
          {showVideoConnection && (
            <PublishPanel
              lang={lang}
              kind="video"
              onPublish={saveToPublic}
              onClose={() => setShowVideoConnection(false)}
            />
          )}
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
