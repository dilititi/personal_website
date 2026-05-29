import React, { useState, useRef, useEffect } from 'react'
import { useLang } from '../lang'
import { useData } from '../data-context'
import { emph } from '../hooks'

export default function Journey() {
  const { lang, t } = useLang()
  const { JOURNEY } = useData()
  const [active, setActive] = useState(() => JOURNEY[JOURNEY.length - 1]?.id ?? null)
  const node = JOURNEY.find(n => n.id === active) || JOURNEY[JOURNEY.length - 1] || null
  const reelRef = useRef(null)

  useEffect(() => {
    if (!JOURNEY.length) {
      setActive(null)
      return
    }
    if (!JOURNEY.some(n => n.id === active)) {
      setActive(JOURNEY[JOURNEY.length - 1].id)
    }
  }, [JOURNEY, active])

  useEffect(() => {
    const reel = reelRef.current
    if (!reel) return
    const el = reel.querySelector(`[data-frame-id="${active}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  const chapters = {
    'I':   lang === 'zh' ? '一・童年' : 'I · Childhood',
    'II':  lang === 'zh' ? '二・成长' : 'II · Coming of age',
    'III': lang === 'zh' ? '三・在学' : 'III · At university',
    'IV':  lang === 'zh' ? '四・当下' : 'IV · Present',
  }

  return (
    <section id="journey">
      <div className="section-header">
        <div>
          <div className="section-num">02 / {lang === 'zh' ? '影格' : 'Reel'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '一卷自传影片' : 'An autobiographical reel'}
            <em>{lang === 'zh' ? 'journey' : '旅程'}</em>
          </h2>
        </div>
        <div className="section-meta">{JOURNEY.length} {lang === 'zh' ? '格 · 2004 至今' : 'frames · 2004 – now'}</div>
      </div>

      <div className="reel-shell">
        <div className="reel-perfs top"></div>

        <div className="reel-scroll" ref={reelRef}>
          {JOURNEY.map((n, i) => (
            <button
              key={n.id}
              data-frame-id={n.id}
              className={`reel-frame ${active === n.id ? 'active' : ''} ${n.image ? 'has-image' : ''}`}
              style={n.image ? { backgroundImage: `url(${n.image})` } : undefined}
              onClick={() => setActive(n.id)}
            >
              <div className="reel-frame-inner">
                <div className="reel-frame-num">FRAME {String(i + 1).padStart(2, '0')}</div>
                <div className="reel-frame-year">{n.year}</div>
                <div className="reel-frame-label">{t(n.label)}</div>
                <div className="reel-frame-place">{t(n.place)}</div>
              </div>
              <div className="reel-frame-chapter">{n.chapter}</div>
            </button>
          ))}
        </div>

        <div className="reel-perfs bottom"></div>
        <div className="reel-audiostrip">
          {Array.from({ length: 80 }).map((_, i) => {
            const h = Math.abs(Math.sin(i * 0.4) * 70) + 10
            return <span key={i} style={{ height: `${h}%`, opacity: 0.4 + (Math.sin(i * 0.2) + 1) * 0.2 }}></span>
          })}
        </div>

        <div className="reel-controls">
          <div className="reel-chapters">
            <span>{node ? chapters[node.chapter] : ''}</span>
          </div>
          <div className="reel-nav">
            <button disabled={!JOURNEY.length} onClick={() => {
              const i = JOURNEY.findIndex(n => n.id === active)
              if (i > 0) setActive(JOURNEY[i - 1].id)
            }}>← {lang === 'zh' ? '上一格' : 'PREV'}</button>
            <span className="reel-count">
              {String(JOURNEY.findIndex(n => n.id === active) + 1).padStart(2, '0')} / {String(JOURNEY.length).padStart(2, '0')}
            </span>
            <button disabled={!JOURNEY.length} onClick={() => {
              const i = JOURNEY.findIndex(n => n.id === active)
              if (i >= 0 && i < JOURNEY.length - 1) setActive(JOURNEY[i + 1].id)
            }}>{lang === 'zh' ? '下一格' : 'NEXT'} →</button>
          </div>
        </div>

        <div className="reel-detail">
          <div className="reel-detail-side">
            <div className="reel-detail-year">{node?.year || ''}</div>
            <div className="reel-detail-place">{node ? t(node.place) : ''}</div>
            <div className="reel-detail-chapter">{node ? chapters[node.chapter] : ''}</div>
          </div>
          <div className="reel-detail-body">
            <h3>{node ? emph(t(node.title)) : ''}</h3>
            <p>{node ? t(node.text) : ''}</p>
            <div className="tags">
              {(node?.tags || []).map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
