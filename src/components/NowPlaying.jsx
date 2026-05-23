import React, { useState, useEffect } from 'react'
import { useLang } from '../lang'
import { NOW_PLAYING } from '../data'

export default function NowPlaying() {
  const { lang, t } = useLang()
  const [idx, setIdx] = useState(0)
  const [pos, setPos] = useState(NOW_PLAYING[0].position)
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setPos((p) => {
        const cur = NOW_PLAYING[idx]
        if (p + 1 >= cur.duration) {
          setIdx((i) => (i + 1) % NOW_PLAYING.length)
          return NOW_PLAYING[(idx + 1) % NOW_PLAYING.length].position
        }
        return p + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [idx])

  useEffect(() => {
    setPos(NOW_PLAYING[idx].position)
  }, [idx])

  const cur = NOW_PLAYING[idx]
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const pct = (pos / cur.duration) * 100

  if (collapsed) {
    return (
      <button className="np-widget collapsed" onClick={() => setCollapsed(false)}>
        <span className="np-led"></span>
        <span>{lang === 'zh' ? '现在在听' : 'ON AIR'}</span>
      </button>
    )
  }

  return (
    <div className="np-widget">
      <button className="np-close" onClick={() => setCollapsed(true)} aria-label="collapse">−</button>
      <div className="np-head">
        <span className="np-led"></span>
        <span className="np-label">{lang === 'zh' ? '现在在听 · ON AIR' : 'ON AIR · 现在在听'}</span>
      </div>
      <div className="np-body">
        <div className="np-cover" style={{ background: ['#1a2228', '#26201a', '#1a261e', '#241a1a'][idx] }}>
          <span>♪</span>
        </div>
        <div className="np-info">
          <div className="np-track">{cur.track}</div>
          <div className="np-artist">{cur.artist}</div>
          <div className="np-mood">{t(cur.mood)}</div>
        </div>
      </div>
      <div className="np-progress">
        <div className="np-progress-fill" style={{ width: `${pct}%` }}></div>
      </div>
      <div className="np-times">
        <span>{fmt(pos)}</span>
        <span>{fmt(cur.duration)}</span>
      </div>
    </div>
  )
}
