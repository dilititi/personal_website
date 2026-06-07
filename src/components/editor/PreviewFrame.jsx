import React, { useEffect, useMemo, useRef, useState } from 'react'
import { deriveStyleVars } from '../../style-engine.js'

function previewSrc() {
  if (typeof window === 'undefined') return '/'
  const url = new URL(window.location.href)
  url.searchParams.set('previewSurface', '1')
  url.searchParams.set('stylePreview', '1')
  return `${url.pathname}${url.search}${url.hash}`
}

function applyPreviewStyle(doc, style) {
  if (!doc?.documentElement || !style) return
  const vars = deriveStyleVars(style)
  Object.entries(vars).forEach(([key, value]) => {
    doc.documentElement.style.setProperty(key, value)
  })
  if (doc.body) {
    doc.body.dataset.motion = style.motion?.mode || 'lively'
    doc.body.dataset.previewSurface = 'true'
    doc.body.dataset.styleAlignment = style.design?.alignment || 'editorial'
  }
}

export default function PreviewFrame({ style, lang, label, viewport = 'desktop', reloadKey = '' }) {
  const iframeRef = useRef(null)
  const [loadTick, setLoadTick] = useState(0)
  const [currentViewport, setCurrentViewport] = useState(viewport)
  const didMountRef = useRef(false)
  const src = useMemo(previewSrc, [])

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    try {
      iframeRef.current?.contentWindow?.location.reload()
    } catch {
      // If reload is blocked, the frame remains a normal static preview.
    }
  }, [reloadKey])

  useEffect(() => {
    try {
      const doc = iframeRef.current?.contentDocument
      applyPreviewStyle(doc, style)
    } catch {
      // Same-origin during local dev; if access is blocked, the iframe still shows persisted state.
    }
  }, [style, loadTick])

  return (
    <section
      className={`se-live-preview viewport-${currentViewport}`}
      aria-label={lang === 'zh' ? '实时网站预览' : 'Live site preview'}
    >
      <div className="se-live-preview-head">
        <strong>{lang === 'zh' ? '实时网站预览' : 'Live preview'}</strong>
        <span>{label}</span>
        <div
          className="se-preview-toggle"
          role="group"
          aria-label={lang === 'zh' ? '预览尺寸' : 'Preview size'}
        >
          {['desktop', 'mobile'].map(mode => (
            <button
              key={mode}
              type="button"
              className={currentViewport === mode ? 'act' : ''}
              onClick={() => setCurrentViewport(mode)}
              aria-pressed={currentViewport === mode}
            >
              {mode === 'desktop'
                ? lang === 'zh'
                  ? '桌面'
                  : 'Desktop'
                : lang === 'zh'
                  ? '移动'
                  : 'Mobile'}
            </button>
          ))}
        </div>
      </div>
      <div className="se-live-preview-frame">
        <iframe
          ref={iframeRef}
          src={src}
          title={lang === 'zh' ? '网站实时预览' : 'Live site preview'}
          loading="lazy"
          onLoad={() => setLoadTick(tick => tick + 1)}
        />
      </div>
    </section>
  )
}
