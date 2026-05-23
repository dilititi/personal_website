import React, { useState, useEffect } from 'react'
import { useLang } from '../lang'
import { PHOTOS, PHOTO_SERIES } from '../data'

export default function Photography() {
  const { lang, t } = useLang()
  const [series, setSeries] = useState('all')
  const [openId, setOpenId] = useState(null)

  const filtered = PHOTOS.filter(p => series === 'all' || p.series === series)
  const open = PHOTOS.find(p => p.id === openId)

  useEffect(() => {
    const onKey = (e) => {
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
  }, [open, openId, filtered])

  return (
    <section id="photography">
      <div className="section-header">
        <div>
          <div className="section-num">05 / {lang === 'zh' ? '影像' : 'Stills'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '平时拍的画面' : 'Frames I keep'}
            <em>{lang === 'zh' ? 'photography' : '摄影'}</em>
          </h2>
        </div>
        <div className="section-meta">{filtered.length} / {PHOTOS.length} {lang === 'zh' ? '张' : 'frames'}</div>
      </div>

      <div className="medium-filter">
        {PHOTO_SERIES.map((s) => {
          const count = s.id === 'all' ? PHOTOS.length : PHOTOS.filter(p => p.series === s.id).length
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

      <div className="contact-sheet">
        {filtered.map((p, i) => (
          <button key={p.id} className="contact-frame" onClick={() => setOpenId(p.id)}>
            <div className="contact-frame-num">{String(i + 1).padStart(3, '0')}A</div>
            <div className="contact-frame-img" style={{ background: p.color }}>
              <div className="contact-frame-placeholder">
                <span>{p.id.toUpperCase()}</span>
              </div>
              <div className="contact-frame-hover">
                <div className="caption">{t(p.caption)}</div>
                <div className="metadata">{p.date} · {p.camera}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className={`lightbox ${open ? 'open' : ''}`} onClick={() => setOpenId(null)}>
        {open && (
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setOpenId(null)}>✕</button>
            <div className="lightbox-img" style={{ background: open.color }}>
              <span className="lightbox-id">{open.id.toUpperCase()}</span>
            </div>
            <div className="lightbox-meta">
              <div className="lightbox-caption">
                <h4>{t(open.caption)}</h4>
                <p>{t(PHOTO_SERIES.find(s => s.id === open.series)?.label || '')}</p>
              </div>
              <div className="lightbox-exif">
                <span>{open.date}</span>
                <span>{open.camera}</span>
                <span>
                  {filtered.findIndex(p => p.id === open.id) + 1} / {filtered.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
