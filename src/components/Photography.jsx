import React, { useState, useEffect, useRef } from 'react'
import { useLang } from '../lang.jsx'
import { useData } from '../data-context.jsx'
import { resizeImage } from '../utils.js'

const LEGACY_PHOTO_STORAGE_KEY = 'chen.photos.userEntries'
// Compatibility shim for pre-unified storage. Remove after 2026-12-31.

export default function Photography({ layout = 'default' }) {
  const { lang, t } = useLang()
  const { PHOTOS, PHOTO_SERIES, setSection } = useData()
  const [series, setSeries] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null) // id of editing photo, or null

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LEGACY_PHOTO_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed) && parsed.length) {
        const existing = new Set(PHOTOS.map(p => p.id))
        const migrated = parsed.filter(p => p?.id && !existing.has(p.id))
        if (migrated.length) setSection('PHOTOS', [...migrated, ...PHOTOS])
        localStorage.removeItem(LEGACY_PHOTO_STORAGE_KEY)
      }
    } catch {}
  }, [PHOTOS, setSection])

  const allPhotos = PHOTOS
  const filtered = allPhotos.filter(p => series === 'all' || p.series === series)
  const open = allPhotos.find(p => p.id === openId)

  // Keyboard navigation. Use refs so the listener installs once and always
  // reads the latest state — avoids re-registering every time filter changes.
  const navRef = useRef({ open, openId, filtered })
  useEffect(() => {
    navRef.current = { open, openId, filtered }
  })
  useEffect(() => {
    const onKey = e => {
      const { open, openId, filtered } = navRef.current
      if (!open) return
      if (e.key === 'Escape') setOpenId(null)
      if (e.key === 'ArrowRight') {
        const i = filtered.findIndex(p => p.id === openId)
        if (i < filtered.length - 1) setOpenId(filtered[i + 1].id)
      }
      if (e.key === 'ArrowLeft') {
        const i = filtered.findIndex(p => p.id === openId)
        if (i > 0) setOpenId(filtered[i - 1].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const addPhoto = entry => {
    const next = editing
      ? PHOTOS.map(p => (p.id === editing ? { ...entry, id: editing } : p))
      : [entry, ...PHOTOS]
    setSection('PHOTOS', next)
    setShowForm(false)
    setEditing(null)
  }

  const removePhoto = id => {
    if (!window.confirm(lang === 'zh' ? '删除这张照片？' : 'Delete this photo?')) return
    setSection(
      'PHOTOS',
      PHOTOS.filter(p => p.id !== id),
    )
    if (openId === id) setOpenId(null)
  }

  const editPhoto = id => {
    setEditing(id)
    setShowForm(true)
  }

  return (
    <section id="photography" data-layout={layout}>
      <div className="section-header">
        <div>
          <div className="section-num">05 / {lang === 'zh' ? '影像' : 'Stills'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '平时拍的画面' : 'Frames I keep'}
            <em>{lang === 'zh' ? 'photography' : '摄影'}</em>
          </h2>
        </div>
        <div className="section-meta">
          {filtered.length} / {allPhotos.length} {lang === 'zh' ? '张' : 'frames'}
        </div>
      </div>

      <div className="photo-toolbar">
        <div className="medium-filter">
          {PHOTO_SERIES.map(s => {
            const count =
              s.id === 'all' ? allPhotos.length : allPhotos.filter(p => p.series === s.id).length
            return (
              <button
                key={s.id}
                className={`medium-pill ${series === s.id ? 'active' : ''}`}
                onClick={() => setSeries(s.id)}
              >
                <span>{t(s.label)}</span>
                <em>{String(count).padStart(2, '0')}</em>
              </button>
            )
          })}
        </div>
        <button
          className="btn"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
        >
          <span>+ {lang === 'zh' ? '上传照片' : 'Upload photo'}</span>
        </button>
      </div>

      <div className="contact-sheet">
        {filtered.map((p, i) => (
          <div key={p.id} className="contact-frame-wrap">
            <button className="contact-frame" onClick={() => setOpenId(p.id)}>
              <div className="contact-frame-num">{String(i + 1).padStart(3, '0')}A</div>
              <div className="contact-frame-img" style={{ background: p.color || '#1a1a1a' }}>
                {p.image ? (
                  <img
                    src={p.image}
                    alt={t(p.caption)}
                    className="contact-frame-photo"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="contact-frame-placeholder">
                    <span>{p.id.toUpperCase()}</span>
                  </div>
                )}
                <div className="contact-frame-hover">
                  <div className="caption">{t(p.caption)}</div>
                  <div className="metadata">
                    {t(p.date)} · {t(p.camera)}
                  </div>
                </div>
              </div>
            </button>
            <div className="contact-frame-actions">
              <button onClick={() => editPhoto(p.id)} className="cf-action">
                {lang === 'zh' ? '编辑' : 'edit'}
              </button>
              <button onClick={() => removePhoto(p.id)} className="cf-action cf-action-danger">
                {lang === 'zh' ? '删除' : 'delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={`lightbox ${open ? 'open' : ''}`} onClick={() => setOpenId(null)}>
        {open && (
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setOpenId(null)}>
              ✕
            </button>
            <div className="lightbox-img" style={{ background: open.color || '#1a1a1a' }}>
              {open.image ? (
                <img
                  src={open.image}
                  alt={t(open.caption)}
                  className="lightbox-photo"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <span className="lightbox-id">{open.id.toUpperCase()}</span>
              )}
            </div>
            <div className="lightbox-meta">
              <div className="lightbox-caption">
                <h4>{t(open.caption)}</h4>
                <p>{t(PHOTO_SERIES.find(s => s.id === open.series)?.label || '')}</p>
              </div>
              <div className="lightbox-exif">
                <span>{t(open.date)}</span>
                <span>{t(open.camera)}</span>
                <span>
                  {filtered.findIndex(p => p.id === open.id) + 1} / {filtered.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <PhotoForm
          initial={editing ? PHOTOS.find(p => p.id === editing) : null}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSubmit={addPhoto}
        />
      )}
    </section>
  )
}

function PhotoForm({ initial, onSubmit, onCancel }) {
  const { lang } = useLang()
  const { PHOTO_SERIES } = useData()
  const isEdit = !!initial
  const [image, setImage] = useState(initial?.image || '')
  const [series, setSeries] = useState(
    initial?.series || PHOTO_SERIES.find(s => s.id !== 'all')?.id || 'all',
  )
  const [captionEn, setCaptionEn] = useState(initial?.caption?.en || '')
  const [captionZh, setCaptionZh] = useState(initial?.caption?.zh || '')
  const [date, setDate] = useState(
    initial?.date || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
  )
  const [camera, setCamera] = useState(initial?.camera || '')
  const [color, setColor] = useState(initial?.color || '#1a1a1a')
  const [resizing, setResizing] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = e => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  // Resize image to keep localStorage usage reasonable (~1500px on long edge, 0.8 quality JPEG)
  const handleImageFile = async e => {
    const f = e.target.files?.[0]
    if (!f) return
    setResizing(true)
    try {
      const dataUrl = await resizeImage(f, 1500, 0.82)
      setImage(dataUrl)
      // Auto-extract dominant color (rough — sample center pixel)
      try {
        const c = await sampleColor(dataUrl)
        if (c) setColor(c)
      } catch {}
    } catch (err) {
      console.error('Image processing failed:', err)
      alert(lang === 'zh' ? '图片处理失败' : 'Image processing failed')
    }
    setResizing(false)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!image) {
      alert(lang === 'zh' ? '请先选择一张图片' : 'Please pick an image first')
      return
    }
    const entry = {
      id: initial?.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      series,
      caption: { en: captionEn || captionZh, zh: captionZh || captionEn },
      date,
      camera: camera || 'Phone',
      color,
      image,
    }
    onSubmit(entry)
  }

  // Approx storage size hint
  const approxKb = image ? Math.round((image.length / 1024) * 0.75) : 0

  return (
    <div className="rlog-modal" onClick={onCancel}>
      <div className="rlog-modal-doc photo-form-doc" onClick={e => e.stopPropagation()}>
        <button className="rlog-modal-close" onClick={onCancel}>
          ✕
        </button>
        <h2 className="rlog-modal-title">
          {isEdit
            ? lang === 'zh'
              ? '编辑照片'
              : 'Edit photo'
            : lang === 'zh'
              ? '上传一张照片'
              : 'New photo'}
        </h2>

        <form className="rlog-form" onSubmit={handleSubmit}>
          <div className="rlog-form-row">
            <label className="rlog-form-row-full">
              <span>{lang === 'zh' ? '图片' : 'Image'}</span>
              <div className="photo-form-pick">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="np-upload-btn"
                  style={{ width: 'auto', marginBottom: 0 }}
                >
                  {resizing
                    ? lang === 'zh'
                      ? '处理中…'
                      : 'Processing…'
                    : image
                      ? lang === 'zh'
                        ? '换一张'
                        : 'Replace'
                      : lang === 'zh'
                        ? '+ 选择图片'
                        : '+ Choose image'}
                </button>
                {image && (
                  <span className="photo-form-size">
                    ~{approxKb}KB ·{' '}
                    {lang === 'zh' ? '已自动压缩到长边 1500px' : 'auto-resized to 1500px'}
                  </span>
                )}
                {approxKb > 1200 && (
                  <span className="photo-form-size photo-form-warning">
                    {lang === 'zh'
                      ? '这张图会占用较多浏览器存储；发布版建议改用 /photos/... 路径。'
                      : 'This image uses a lot of browser storage. Prefer a /photos/... path for publishing.'}
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  style={{ display: 'none' }}
                />
              </div>
              {image && (
                <div className="photo-form-preview" style={{ background: color }}>
                  <img src={image} alt="" />
                </div>
              )}
            </label>
          </div>

          <div className="rlog-form-row">
            <label>
              <span>{lang === 'zh' ? '系列' : 'Series'}</span>
              <select value={series} onChange={e => setSeries(e.target.value)}>
                {PHOTO_SERIES.filter(s => s.id !== 'all').map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label.en} / {s.label.zh}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{lang === 'zh' ? '日期' : 'Date'}</span>
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                placeholder="2026.05.27"
              />
            </label>
          </div>

          <div className="rlog-form-row">
            <label>
              <span>{lang === 'zh' ? '英文说明' : 'Caption (EN)'}</span>
              <input
                type="text"
                value={captionEn}
                onChange={e => setCaptionEn(e.target.value)}
                placeholder="West Lake, before dawn"
              />
            </label>
            <label>
              <span>{lang === 'zh' ? '中文说明' : 'Caption (中文)'}</span>
              <input
                type="text"
                value={captionZh}
                onChange={e => setCaptionZh(e.target.value)}
                placeholder="西湖，破晓前"
              />
            </label>
          </div>

          <div className="rlog-form-row">
            <label>
              <span>{lang === 'zh' ? '相机 / 镜头' : 'Camera / lens'}</span>
              <input
                type="text"
                value={camera}
                onChange={e => setCamera(e.target.value)}
                placeholder="FX3 · 35mm"
              />
            </label>
            <label>
              <span>{lang === 'zh' ? '底色（占位用）' : 'Fallback color'}</span>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ height: 38 }}
              />
            </label>
          </div>

          <div className="rlog-form-foot">
            <div style={{ flex: 1 }} />
            <button type="button" className="btn ghost" onClick={onCancel}>
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button type="submit" className="btn" disabled={resizing}>
              {isEdit
                ? lang === 'zh'
                  ? '保存修改'
                  : 'Save changes'
                : lang === 'zh'
                  ? '保存'
                  : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// resizeImage imported from ../utils

// Sample average color from the center 20% of the image.
function sampleColor(dataUrl) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 16
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        // Sample center 20% area for average color
        const cropW = img.width * 0.6,
          cropH = img.height * 0.6
        const cropX = (img.width - cropW) / 2,
          cropY = (img.height - cropH) / 2
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        let r = 0,
          g = 0,
          b = 0,
          n = size * size
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
        }
        r = Math.round((r / n) * 0.4) // darken sample for use as background
        g = Math.round((g / n) * 0.4)
        b = Math.round((b / n) * 0.4)
        resolve('#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}
