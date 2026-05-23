import React, { useState, useEffect } from 'react'
import { useLang } from '../lang'
import { WORKS } from '../data'

const WORK_MEDIA = [
  { id: 'all',    label: { en: 'All',            zh: '全部' } },
  { id: 'short',  label: { en: 'Short film',     zh: '短片' } },
  { id: 'doc',    label: { en: 'Documentary',    zh: '纪录片' } },
  { id: 'mv',     label: { en: 'Music video',    zh: '音乐影像' } },
  { id: 'sound',  label: { en: 'Sound',          zh: '声音' } },
  { id: 'visual', label: { en: 'Visual / Print', zh: '视觉 / 印刷' } },
]

export default function Works() {
  const { lang, t } = useLang()
  const [openId, setOpenId] = useState(null)
  const [medium, setMedium] = useState('all')
  const open = WORKS.find(w => w.id === openId)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpenId(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filtered = WORKS.filter(w => medium === 'all' || w.medium === medium)
  const counts = WORK_MEDIA.reduce((acc, m) => {
    acc[m.id] = m.id === 'all' ? WORKS.length : WORKS.filter(w => w.medium === m.id).length
    return acc
  }, {})

  return (
    <section id="works">
      <div className="section-header">
        <div>
          <div className="section-num">03 / {lang === 'zh' ? '作品集' : 'Works'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '作品集' : 'Things I have made'}
            <em>{lang === 'zh' ? 'portfolio · by medium' : '作品集 · 按媒介分类'}</em>
          </h2>
        </div>
        <div className="section-meta">{filtered.length} / {WORKS.length} · 2024 – {lang === 'zh' ? '至今' : 'present'}</div>
      </div>

      <div className="medium-filter">
        {WORK_MEDIA.map((m) => (
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
        {filtered.map((w) => (
          <div className="work-card" key={w.id} onClick={() => setOpenId(w.id)} data-reveal>
            <div className={`work-cover ${w.cover}`}>
              <div className="placeholder">
                [ {t(w.title).toUpperCase()} — {lang === 'zh' ? '主图' : 'primary image'} ]
              </div>
              <div className="work-cover-meta">
                <span>{w.year}</span>
                <span>·</span>
                <span>{t(w.subtitle)}</span>
              </div>
              <div className="work-cover-badge">
                {t(WORK_MEDIA.find(m => m.id === w.medium)?.label || '')}
              </div>
            </div>
            <div className="work-meta">
              <span className="role">{t(w.role)}</span>
              <span>{w.year}</span>
            </div>
            <h3 className="work-title">
              {t(w.title)}<em>{t(w.subtitle)}</em>
            </h3>
            <p className="work-summary">{t(w.summary)}</p>
            <div className="work-footer">
              <div className="tags">
                {w.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
              <span className="open">{lang === 'zh' ? '打开' : 'Open'} <span className="arrow">↗</span></span>
            </div>
          </div>
        ))}
      </div>

      {/* Work Modal */}
      <div className={`work-modal ${open ? 'open' : ''}`} onClick={() => setOpenId(null)}>
        {open && (
          <div className="work-modal-inner" onClick={(e) => e.stopPropagation()}>
            <button className="work-modal-close" onClick={() => setOpenId(null)}>✕</button>
            <div className={`work-modal-hero ${open.cover}`}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'repeating-linear-gradient(-25deg, transparent 0 8px, rgba(255,255,255,0.04) 8px 9px)'
              }}></div>
              <div style={{
                position: 'absolute', bottom: 24, left: 40,
                fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: '0.2em', color: 'var(--cream-mute)',
                textTransform: 'uppercase'
              }}>
                {open.year} · {t(open.subtitle)}
              </div>
            </div>
            <div className="work-modal-body">
              <div>
                <h1>{t(open.title)} <em>{t(open.subtitle)}</em></h1>
                <p className="lead">{t(open.summary)}</p>
                <div className="prose">
                  {open.body.map((p, i) => <p key={i}>{t(p)}</p>)}
                </div>
              </div>
              <aside className="work-modal-side">
                {Object.entries({
                  [lang === 'zh' ? '年份' : 'Year']:    open.field.year,
                  [lang === 'zh' ? '格式' : 'Format']:  t(open.field.format),
                  [lang === 'zh' ? '角色' : 'Role']:    t(open.field.role),
                  [lang === 'zh' ? '团队' : 'Crew']:    t(open.field.crew),
                  [lang === 'zh' ? '展映' : 'Festivals']: t(open.field.festivals),
                  [lang === 'zh' ? '状态' : 'Status']:  t(open.field.status),
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
