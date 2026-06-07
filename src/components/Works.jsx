import React, { useState, useEffect, useMemo } from 'react'
import { useLang } from '../lang.jsx'
import { useData } from '../data-context.jsx'

const WORK_MEDIA_LABELS = {
  short: { en: 'Shorts', zh: '短片' },
  doc: { en: 'Docs', zh: '纪录片' },
  sound: { en: 'Sound', zh: '声音' },
  mv: { en: 'MV', zh: 'MV' },
  visual: { en: 'Visual', zh: '视觉' },
  design: { en: 'Design', zh: '设计' },
  mission: { en: 'Missions', zh: '任务' },
  sticker: { en: 'Stickers', zh: '贴纸' },
}

function mediaLabel(id) {
  if (WORK_MEDIA_LABELS[id]) return WORK_MEDIA_LABELS[id]
  const text = String(id || 'other').replace(/[-_]/g, ' ')
  return { en: text.replace(/\b\w/g, m => m.toUpperCase()), zh: text }
}

export default function Works({ layout = 'default' }) {
  const { lang, t } = useLang()
  const { WORKS } = useData()
  const [openId, setOpenId] = useState(null)
  const [medium, setMedium] = useState('all')
  const open = WORKS.find(w => w.id === openId)
  const mediaOptions = useMemo(() => {
    const ids = [...new Set(WORKS.map(w => w.medium).filter(Boolean))]
    return [
      { id: 'all', label: { en: 'All', zh: '全部' } },
      ...ids.map(id => ({ id, label: mediaLabel(id) })),
    ]
  }, [WORKS])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') setOpenId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (medium !== 'all' && !mediaOptions.some(m => m.id === medium)) {
      setMedium('all')
    }
  }, [medium, mediaOptions])

  const filtered = WORKS.filter(w => medium === 'all' || w.medium === medium)
  const counts = mediaOptions.reduce((acc, m) => {
    acc[m.id] = m.id === 'all' ? WORKS.length : WORKS.filter(w => w.medium === m.id).length
    return acc
  }, {})

  return (
    <section id="works" data-layout={layout}>
      <div className="section-header">
        <div>
          <div className="section-num">03 / {lang === 'zh' ? '作品集' : 'Works'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '作品集' : 'Things I have made'}
            <em>{lang === 'zh' ? 'portfolio · by medium' : '作品集 · 按媒介分类'}</em>
          </h2>
        </div>
        <div className="section-meta">
          {filtered.length} / {WORKS.length} · 2024 – {lang === 'zh' ? '至今' : 'present'}
        </div>
      </div>

      <div className="medium-filter">
        {mediaOptions.map(m => (
          <button
            key={m.id}
            className={`medium-pill ${medium === m.id ? 'active' : ''}`}
            onClick={() => setMedium(m.id)}
            disabled={counts[m.id] === 0}
          >
            <span>{t(m.label)}</span>
            <em>{String(counts[m.id]).padStart(2, '0')}</em>
          </button>
        ))}
      </div>

      <div className="works-grid">
        {filtered.map(w => (
          <button
            type="button"
            className="work-card"
            key={w.id}
            onClick={() => setOpenId(w.id)}
            data-reveal
          >
            <div className={`work-cover ${w.cover}`}>
              {w.coverImg ? (
                <img
                  src={w.coverImg}
                  alt={t(w.title)}
                  className="work-cover-img"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="placeholder">
                  [ {t(w.title).toUpperCase()} — {lang === 'zh' ? '主图' : 'primary image'} ]
                </div>
              )}
              <div className="work-cover-meta">
                <span>{w.year}</span>
                <span>·</span>
                <span>{t(w.subtitle)}</span>
              </div>
              <div className="work-cover-badge">
                {t(mediaOptions.find(m => m.id === w.medium)?.label || mediaLabel(w.medium))}
              </div>
            </div>
            <div className="work-meta">
              <span className="role">{t(w.role)}</span>
              <span>{w.year}</span>
            </div>
            <h3 className="work-title">
              {t(w.title)}
              <em>{t(w.subtitle)}</em>
            </h3>
            <p className="work-summary">{t(w.summary)}</p>
            <div className="work-footer">
              <div className="tags">
                {w.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="open">
                {lang === 'zh' ? '打开' : 'Open'} <span className="arrow">↗</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Work Modal */}
      <div className={`work-modal ${open ? 'open' : ''}`} onClick={() => setOpenId(null)}>
        {open && (
          <div className="work-modal-inner" onClick={e => e.stopPropagation()}>
            <button className="work-modal-close" onClick={() => setOpenId(null)}>
              ✕
            </button>
            <div className={`work-modal-hero ${open.cover}`}>
              {open.coverImg ? (
                <img
                  src={open.coverImg}
                  alt={t(open.title)}
                  className="work-modal-hero-img"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'repeating-linear-gradient(-25deg, transparent 0 8px, rgba(255,255,255,0.04) 8px 9px)',
                  }}
                ></div>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: 40,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  color: 'var(--cream-mute)',
                  textTransform: 'uppercase',
                  zIndex: 2,
                }}
              >
                {open.year} · {t(open.subtitle)}
              </div>
            </div>
            <div className="work-modal-body">
              <div>
                <h1>
                  {t(open.title)} <em>{t(open.subtitle)}</em>
                </h1>
                <p className="lead">{t(open.summary)}</p>
                <div className="prose">
                  {open.body.map((p, i) => (
                    <p key={i}>{t(p)}</p>
                  ))}
                </div>
              </div>
              <aside className="work-modal-side">
                {Object.entries({
                  [lang === 'zh' ? '年份' : 'Year']: open.field.year,
                  [lang === 'zh' ? '格式' : 'Format']: t(open.field.format),
                  [lang === 'zh' ? '角色' : 'Role']: t(open.field.role),
                  [lang === 'zh' ? '团队' : 'Crew']: t(open.field.crew),
                  [lang === 'zh' ? '展映' : 'Festivals']: t(open.field.festivals),
                  [lang === 'zh' ? '状态' : 'Status']: t(open.field.status),
                }).map(([k, v]) => (
                  <div className="field" key={k}>
                    <h6>{k}</h6>
                    <p>{v}</p>
                  </div>
                ))}
              </aside>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
