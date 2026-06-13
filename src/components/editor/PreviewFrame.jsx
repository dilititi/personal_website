import React, { useEffect, useMemo, useRef, useState } from 'react'
import { deriveStyleVars } from '../../style-engine.js'

function previewSrc() {
  if (typeof window === 'undefined') return '/'
  const url = new URL(window.location.href)
  url.searchParams.set('previewSurface', '1')
  url.searchParams.set('stylePreview', '1')
  // Intentionally drop url.hash: the preview should open at the top, not jump to
  // whatever section anchor the main page currently sits at.
  return `${url.pathname}${url.search}`
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
    doc.body.dataset.landingLayout = style.layout?.landing || 'minimal'
  }
}

function getScrollParent(node) {
  let el = node?.parentElement
  while (el) {
    const overflowY = getComputedStyle(el).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return el
    el = el.parentElement
  }
  return null
}

export default function PreviewFrame({ style, lang, label, viewport = 'desktop', reloadKey = '' }) {
  const iframeRef = useRef(null)
  const frameRef = useRef(null)
  const scrollerRef = useRef(null)
  const userTopRef = useRef(0)
  const lastYankRef = useRef(0)
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
      // Cross-origin / blocked: the frame keeps showing persisted state.
    }
  }, [reloadKey])

  // Track where the editor panel actually sits. When the preview grabs focus on
  // (re)load (an embedded element inside the site), the browser scrolls the
  // iframe into view and drags the panel down; restoring the tracked position in
  // the iframe's focus handler reverts that instantly, so nothing visibly moves.
  // We capture every scroll position (user scroll, or the editor resetting to the
  // top on a tab switch) EXCEPT the brief window right after a yank/restore.
  useEffect(() => {
    const scroller = getScrollParent(frameRef.current)
    scrollerRef.current = scroller
    if (!scroller) return undefined
    userTopRef.current = scroller.scrollTop
    const onScroll = () => {
      if (performance.now() - lastYankRef.current > 250) {
        userTopRef.current = scroller.scrollTop
      }
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    try {
      applyPreviewStyle(iframeRef.current?.contentDocument, style)
    } catch {
      // Same-origin during local dev; if access is blocked the iframe still shows persisted state.
    }
  }, [style, loadTick])

  const restoreUserScroll = () => {
    lastYankRef.current = performance.now()
    const scroller = scrollerRef.current
    if (scroller) scroller.scrollTop = userTopRef.current
  }

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
      <div className="se-live-preview-frame" ref={frameRef}>
        <iframe
          ref={iframeRef}
          src={src}
          title={lang === 'zh' ? '网站实时预览' : 'Live site preview'}
          loading="lazy"
          tabIndex={-1}
          onFocus={restoreUserScroll}
          onLoad={() => {
            setLoadTick(tick => tick + 1)
            // Belt-and-suspenders: the focus that triggers the yank can land
            // right around load; revert on the next frame too.
            requestAnimationFrame(restoreUserScroll)
          }}
        />
      </div>
    </section>
  )
}
