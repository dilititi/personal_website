import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { NOW_PLAYING } from './data'

const NPContext = createContext(null)

export function useNP() {
  return useContext(NPContext)
}

export function NowPlayingProvider({ children }) {
  const [active, setActive] = useState(null)
  const [uploads, setUploads] = useState([])
  const [source, setSource] = useState(() => {
    try {
      const saved = localStorage.getItem('chen.np.source')
      return ['spotify', 'netease', 'html5'].includes(saved) ? saved : 'spotify'
    } catch {
      return 'spotify'
    }
  })
  const [trackIdx, setTrackIdx] = useState({ spotify: 0, netease: 0, html5: 0 })
  // Auto-open when an external play happens
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    try {
      localStorage.setItem('chen.np.source', source)
    } catch {}
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
  const addUploads = useCallback(
    (fileList, opts = {}) => {
      const files = Array.from(fileList || [])
      if (!files.length) return []
      const items = files.map(f => ({
        id: 'u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        name: f.name.replace(/\.[^.]+$/, ''),
        url: URL.createObjectURL(f),
      }))
      // Position of the first NEW upload in the merged list = bundled length + current uploads length.
      const firstNewIdx = (NOW_PLAYING.html5?.length || 0) + uploads.length
      setUploads(prev => [...prev, ...items])
      setTrackIdx(prev => ({ ...prev, html5: firstNewIdx }))
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
    },
    [uploads],
  )

  const removeUpload = useCallback(
    idx => {
      const target = uploads[idx]
      if (!target) return
      URL.revokeObjectURL(target.url)
      setUploads(prev => prev.filter((_, k) => k !== idx))
      setActive(a => (a && a.source === 'html5' && a.audio === target.url ? null : a))
    },
    [uploads],
  )

  const value = {
    active,
    setActive,
    uploads,
    setUploads,
    addUploads,
    removeUpload,
    source,
    setSource,
    trackIdx,
    setTrackIdx,
    collapsed,
    setCollapsed,
    playTrack,
    stop,
  }

  return <NPContext.Provider value={value}>{children}</NPContext.Provider>
}
