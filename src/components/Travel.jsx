import React, { useState } from 'react'
import { useLang } from '../lang'
import { TRAVEL } from '../data'

export default function Travel() {
  const { lang, t } = useLang()
  const [active, setActive] = useState(TRAVEL[0].city.en)

  const project = (lat, lon) => {
    const x = ((lon - 100) / (145 - 100)) * 100
    const y = ((45 - lat) / (45 - 20)) * 60
    return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(58, y)) }
  }

  const activeNode = TRAVEL.find(p => p.city.en === active)

  return (
    <section id="travel">
      <div className="section-header">
        <div>
          <div className="section-num">06 / {lang === 'zh' ? '足迹' : 'Atlas'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '去过的地方' : 'Places I have been'}
            <em>{lang === 'zh' ? 'travel' : '足迹'}</em>
          </h2>
        </div>
        <div className="section-meta">{TRAVEL.length} {lang === 'zh' ? '座城市' : 'cities'}</div>
      </div>

      <div className="atlas">
        <div className="atlas-map">
          <svg viewBox="0 0 100 60" preserveAspectRatio="none">
            <path d="M 8 30 Q 15 22, 25 24 T 45 30 Q 52 26, 62 28 T 80 32 L 88 38 L 78 48 L 60 52 L 40 50 L 22 46 L 12 40 Z"
              fill="var(--ink-soft)" stroke="var(--ink-haze)" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
            <path d="M 92 28 L 96 32 L 94 40 L 90 42 Z"
              fill="var(--ink-soft)" stroke="var(--ink-haze)" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
            {[0, 20, 40, 60, 80, 100].map(x => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="60"
                stroke="var(--ink-line)" strokeWidth="0.08" vectorEffect="non-scaling-stroke" />
            ))}
            {[0, 15, 30, 45, 60].map(y => (
              <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y}
                stroke="var(--ink-line)" strokeWidth="0.08" vectorEffect="non-scaling-stroke" />
            ))}
            {[...TRAVEL].sort((a, b) => a.year - b.year).map((p, i, arr) => {
              if (i === arr.length - 1) return null
              const a = project(p.lat, p.lon)
              const b = project(arr[i + 1].lat, arr[i + 1].lon)
              return (
                <line key={`c${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="var(--ember)" strokeOpacity="0.25" strokeWidth="0.3" strokeDasharray="0.6 0.6"
                  vectorEffect="non-scaling-stroke" />
              )
            })}
          </svg>

          {TRAVEL.map((p) => {
            const { x, y } = project(p.lat, p.lon)
            const isActive = p.city.en === active
            const isHome = p.kind === 'home'
            return (
              <button
                key={p.city.en}
                className={`atlas-pin ${isActive ? 'active' : ''} ${isHome ? 'home' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                onMouseEnter={() => setActive(p.city.en)}
                onClick={() => setActive(p.city.en)}
              >
                <span className="pin-dot"></span>
                <span className="pin-label">{t(p.city)}</span>
              </button>
            )
          })}
        </div>

        <aside className="atlas-side">
          {activeNode && (
            <div className="atlas-card">
              <div className="atlas-card-kind">
                {activeNode.kind === 'home' ? (lang === 'zh' ? '家' : 'HOME') :
                  activeNode.kind === 'frequent' ? (lang === 'zh' ? '常去' : 'FREQUENT') :
                  activeNode.kind === 'festival' ? (lang === 'zh' ? '电影节' : 'FESTIVAL') :
                  (lang === 'zh' ? '旅行' : 'TRIP')}
                <span className="atlas-card-year"> · {activeNode.year}</span>
              </div>
              <h3 className="atlas-card-city">{t(activeNode.city)}</h3>
              <p className="atlas-card-country">{t(activeNode.country)}</p>
              <p className="atlas-card-note">{t(activeNode.note)}</p>
              <div className="atlas-card-coords">
                {activeNode.lat.toFixed(2)}° N · {activeNode.lon.toFixed(2)}° E
              </div>
            </div>
          )}

          <div className="atlas-list">
            <h6>{lang === 'zh' ? '所有目的地' : 'All destinations'}</h6>
            <ul>
              {[...TRAVEL].sort((a, b) => a.year - b.year).map((p) => (
                <li
                  key={p.city.en}
                  className={p.city.en === active ? 'active' : ''}
                  onClick={() => setActive(p.city.en)}
                >
                  <span className="atlas-list-year">{p.year}</span>
                  <span className="atlas-list-city">{t(p.city)}</span>
                  <span className="atlas-list-kind">{p.kind === 'home' ? '●' : '○'}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}
