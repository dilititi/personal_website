import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { NOW_PLAYING } from './data'

const NPContext = createContext(null)

export function useNP() { return useContext(NPContext) }

export function NowPlayingProvider({ children }) {
  const [active, setActive] = useState(null)
  const [uploads, setUploads] = useState([])
  const [source, setSource] = useState(() => {
    try {
      const saved = localStorage.getItem('chen.np.source')
      return ['spotify', 'netease', 'html5'].includes(saved) ? saved : 'spotify'
    } catch { return 'spotify' }
  })
  const [trackIdx, setTrackIdx] = useState({ spotify: 0, netease: 0, html5: 0 })
  // Auto-open when an external play happens
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    try { localStorage.setItem('chen.np.source', source) } catch {}
  }, [source])

  // Play a track. trackInfo = { source, spotifyId?, neteaseId?, audio?, track, artist }
  // If no source field, infer from which ID is present (spotifyId → spotify, etc).
  const playTrack = useCallback((trackInfo, opts = {}) => {
    let src = trackInfo.source
    if (!src) {
      if (trackInfo.spotifyId) src = 'spotify'
      else if (trackInfo.neteaseId) src = 'netease'
      else if (trackInfo.audio) src = 'html5'
    }
    if (!src) return
    setActive({ source: src, ...trackInfo })
    setSource(src)
    if (opts.openWidget !== false) setCollapsed(false)
  }, [])

  const stop = useCallback(() => setActive(null), [])

  // Add files (from external upload UI). Returns the new upload objects.
  const addUploads = useCallback((fileList, opts = {}) => {
    const files = Array.from(fileList || [])
    if (!files.length) return []
    const items = files.map(f => ({
      name: f.name.replace(/\.[^.]+$/, ''),
      url: URL.createObjectURL(f),
    }))
    setUploads(prev => [...prev, ...items])
    setTrackIdx(prev => ({ ...prev, html5: (NOW_PLAYING.html5 || []).length }))
    // Auto-play the first new upload and switch to local source
    if (opts.autoplay !== false && items[0]) {
      const first = items[0]
      setActive({
        source: 'html5',
        audio: first.url,
        track: first.name,
        artist: 'Uploaded',
      })
      setSource('html5')
      setCollapsed(false)
    }
    return items
  }, [])

  const removeUpload = useCallback((idx) => {
    setUploads(prev => {
      const target = prev[idx]
      if (target) {
        URL.revokeObjectURL(target.url)
        // If active is this upload, stop
        setActive(a => (a && a.source === 'html5' && a.audio === target.url) ? null : a)
      }
      return prev.filter((_, k) => k !== idx)
    })
  }, [])

  const value = {
    active, setActive,
    uploads, setUploads, addUploads, removeUpload,
    source, setSource,
    trackIdx, setTrackIdx,
    collapsed, setCollapsed,
    playTrack, stop,
  }

  return <NPContext.Provider value={value}>{children}</NPContext.Provider>
}
