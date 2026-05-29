import React, { useRef, useEffect, useState } from 'react'
import { useLang } from '../lang'
import { useData } from '../data-context'
import { useNP } from '../np-context'

const SOURCES = [
  { id: 'spotify', label: 'Spotify' },
  { id: 'netease', label: '网易云' },
  { id: 'html5',   label: lang => lang === 'zh' ? '本地' : 'Local' },
]
const POS_KEY = 'chen.np.pos'

export default function NowPlaying() {
  const { lang, t } = useLang()
  const { NOW_PLAYING } = useData()
  const np = useNP()
  const fileRef = useRef(null)
  const widgetRef = useRef(null)
  const draggedRef = useRef(false)

  const {
    active, stop,
    uploads, addUploads, removeUpload,
    source, setSource,
    trackIdx, setTrackIdx,
    collapsed, setCollapsed,
    playTrack,
  } = np

  // ── Drag-to-move position ─────────────────────────────
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(POS_KEY)
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  useEffect(() => {
    if (pos) try { localStorage.setItem(POS_KEY, JSON.stringify(pos)) } catch {}
  }, [pos])

  // Clamp to viewport on resize (so it never ends up off-screen).
  // Note: no `pos` in deps — we use the functional setter form so the latest pos
  // is read at clamp time, and the resize listener stays installed once.
  useEffect(() => {
    const onResize = () => {
      const w = widgetRef.current?.offsetWidth ?? 0
      const h = widgetRef.current?.offsetHeight ?? 0
      setPos(p => {
        if (!p) return p
        return {
          x: Math.max(8, Math.min(window.innerWidth - w - 8, p.x)),
          y: Math.max(8, Math.min(window.innerHeight - h - 8, p.y)),
        }
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Suppress the click after a drag (capture-phase listener)
  useEffect(() => {
    const widget = widgetRef.current
    if (!widget) return
    const onClickCapture = (e) => {
      if (draggedRef.current) {
        e.stopPropagation()
        e.preventDefault()
        draggedRef.current = false
      }
    }
    widget.addEventListener('click', onClickCapture, true)
    return () => widget.removeEventListener('click', onClickCapture, true)
  }, [])

  const onPointerDown = (e) => {
    // Skip drag if user pressed on a "no-drag" element: list rows, iframe, form input, etc.
    if (e.target.closest('.np-list, .np-player, iframe, audio, input, select, textarea, .np-list-x')) return

    const widget = widgetRef.current
    if (!widget) return
    const rect = widget.getBoundingClientRect()
    const startX = e.clientX, startY = e.clientY
    const offsetX = e.clientX - rect.left, offsetY = e.clientY - rect.top
    let dragging = false

    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!dragging && Math.hypot(dx, dy) < 6) return
      if (!dragging) {
        dragging = true
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
        widget.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none')
      }
      const w = widget.offsetWidth, h = widget.offsetHeight
      const x = Math.max(8, Math.min(window.innerWidth - w - 8, ev.clientX - offsetX))
      const y = Math.max(8, Math.min(window.innerHeight - h - 8, ev.clientY - offsetY))
      setPos({ x, y })
    }

    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      widget.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = '')
      if (dragging) draggedRef.current = true
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  // ──────────────────────────────────────────────────────

  // List for the currently-viewed source
  let list = []
  if (source === 'html5') {
    const bundled = NOW_PLAYING.html5 || []
    list = [
      ...bundled,
      ...uploads.map((u, k) => ({
        id: u.id,
        audio: u.url,
        track: u.name,
        artist: lang === 'zh' ? '上传' : 'Uploaded',
        _uploadIdx: k,
      })),
    ]
  } else {
    list = NOW_PLAYING[source] || []
  }
  const selectedIdx = Math.min(trackIdx[source] ?? 0, Math.max(0, list.length - 1))

  const playFromList = (idx) => {
    const tr = list[idx]
    if (!tr) return
    setTrackIdx(prev => ({ ...prev, [source]: idx }))
    playTrack({ source, ...tr }, { openWidget: false })
  }

  const isPlayingThis = (j) => {
    if (!active || active.source !== source) return false
    const tr = list[j]
    if (!tr) return false
    if (source === 'spotify') return active.spotifyId === tr.spotifyId
    if (source === 'netease') return active.neteaseId === tr.neteaseId
    if (source === 'html5')   return active.audio === tr.audio
    return false
  }

  const playerJsx = active && (
    <div className="np-player">
      {active.source === 'spotify' && active.spotifyId && (
        <iframe key={`sp-${active.spotifyId}`}
          src={`https://open.spotify.com/embed/track/${active.spotifyId}?utm_source=generator`}
          width="100%" height="80" frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          loading="lazy" title="Spotify player" />
      )}
      {active.source === 'netease' && active.neteaseId && (
        <iframe key={`ne-${active.neteaseId}`}
          src={`https://music.163.com/outchain/player?type=2&id=${active.neteaseId}&auto=1&height=66`}
          width="100%" height="86" frameBorder="no"
          marginWidth="0" marginHeight="0" title="NetEase player" />
      )}
      {active.source === 'html5' && active.audio && (
        <audio key={`a-${active.audio}`} src={active.audio} controls autoPlay preload="metadata"
          style={{ width: '100%', height: 36 }} />
      )}
    </div>
  )

  const positionStyle = pos
    ? { left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
    : undefined

  return (
    <div
      ref={widgetRef}
      className={`np-widget ${collapsed ? 'collapsed' : 'is-open'} ${active ? 'has-active' : ''}`}
      style={positionStyle}
      onPointerDown={onPointerDown}
    >
      <div className="np-pill-wrap">
        <button className="np-pill-expand" onClick={() => setCollapsed(false)}>
          <span className="np-led"></span>
          <span className="np-pill-label">
            {active ? (
              <>
                <span className="np-pill-status">{lang === 'zh' ? '在听' : 'PLAYING'}</span>
                <span className="np-pill-track">{t(active.track)}</span>
              </>
            ) : (lang === 'zh' ? '现在在听' : 'NOW PLAYING')}
          </span>
        </button>
        {active && (
          <button className="np-pill-stop" onClick={stop}
            aria-label="stop" title={lang === 'zh' ? '停止播放' : 'Stop playback'}>■</button>
        )}
      </div>

      <div className="np-open-wrap">
        <button className="np-close" onClick={() => setCollapsed(true)} aria-label="collapse">−</button>

        <div className="np-head">
          <span className="np-led"></span>
          <span className="np-label">
            {active ? (lang === 'zh' ? '正在播放' : 'NOW PLAYING') : (lang === 'zh' ? '点击列表开始' : 'PICK A TRACK')}
          </span>
        </div>

        <div className="np-sources">
          {SOURCES.map(s => {
            const label = typeof s.label === 'function' ? s.label(lang) : s.label
            return (
              <button key={s.id}
                className={`np-source-tab ${source === s.id ? 'act' : ''}`}
                onClick={() => setSource(s.id)}>{label}</button>
            )
          })}
        </div>

        {source === 'html5' && (
          <>
            <button className="np-upload-btn" onClick={() => fileRef.current?.click()}>
              + {lang === 'zh' ? '上传音乐文件' : 'Upload audio'}
            </button>
            <input ref={fileRef} type="file" accept="audio/*" multiple
              onChange={(e) => { addUploads(e.target.files, { autoplay: false }); e.target.value = '' }}
              style={{ display: 'none' }} />
          </>
        )}

        {list.length > 0 ? (
          <div className="np-list" role="list">
            {list.map((tr, j) => {
              const playing = isPlayingThis(j)
              const sel = j === selectedIdx
              const key = tr.id || tr.spotifyId || tr.neteaseId || tr.audio || `idx-${j}`
              return (
                <div key={key} className={`np-list-row ${sel ? 'sel' : ''} ${playing ? 'playing' : ''}`} role="listitem">
                  <button className="np-list-item" onClick={() => playFromList(j)}>
                    <span className="np-list-num">{String(j + 1).padStart(2, '0')}</span>
                    <span className="np-list-text">
                      <span className="np-list-track">{t(tr.track)}</span>
                      <span className="np-list-artist">{t(tr.artist)}</span>
                    </span>
                    {playing && <span className="np-list-eq" aria-hidden="true"><i/><i/><i/></span>}
                  </button>
                  {tr._uploadIdx !== undefined && (
                    <button className="np-list-x"
                      onClick={() => removeUpload(tr._uploadIdx)}
                      aria-label="remove">×</button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="np-empty">
            {source === 'html5'
              ? (lang === 'zh' ? '点上面按钮上传音乐' : 'Upload audio to start')
              : (lang === 'zh' ? '这个源没有歌曲' : 'No tracks in this source')}
          </div>
        )}

        {playerJsx}
      </div>
    </div>
  )
}
