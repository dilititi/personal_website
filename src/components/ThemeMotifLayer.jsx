import React, { useEffect, useRef, useState } from 'react'
import { useLang } from '../lang.jsx'
import { useStyle } from '../style-context.jsx'

const MOTIFS = new Set(['film', 'web', 'botanical', 'scanline'])

export default function ThemeMotifLayer() {
  const { lang } = useLang()
  const { style } = useStyle()
  const layerRef = useRef(null)
  const burstTimerRef = useRef(0)
  const [burst, setBurst] = useState(false)
  const motion = style?.motion || {}
  const motif = MOTIFS.has(motion.motif) ? motion.motif : 'none'
  const ambient = motion.ambient !== false
  const interaction = motion.interaction || 'subtle'

  useEffect(() => {
    const layer = layerRef.current
    if (!layer || motif === 'none') return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const updateProgress = () => {
      frame = 0
      const range = document.documentElement.scrollHeight - window.innerHeight
      const progress = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0
      layer.style.setProperty('--motif-progress', progress.toFixed(4))
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress)
    }
    const onPointerMove = event => {
      if (interaction === 'none' || reducedMotion.matches) return
      layer.style.setProperty('--motif-pointer-x', `${event.clientX}px`)
      layer.style.setProperty('--motif-pointer-y', `${event.clientY}px`)
    }

    updateProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [interaction, motif])

  useEffect(
    () => () => {
      window.clearTimeout(burstTimerRef.current)
    },
    [],
  )

  if (!ambient || motif === 'none') return null

  const triggerBurst = () => {
    window.clearTimeout(burstTimerRef.current)
    setBurst(false)
    window.requestAnimationFrame(() => {
      setBurst(true)
      burstTimerRef.current = window.setTimeout(() => setBurst(false), 900)
    })
  }

  return (
    <div
      ref={layerRef}
      className={`theme-motif-layer motif-${motif} ${burst ? 'is-bursting' : ''}`}
      data-interaction={interaction}
      aria-hidden={motif === 'web' && interaction !== 'none' ? undefined : 'true'}
    >
      {motif === 'film' && (
        <>
          <span className="motif-film-gate motif-film-gate-a" />
          <span className="motif-film-gate motif-film-gate-b" />
          <span className="motif-film-counter">FRAME · 00</span>
        </>
      )}

      {motif === 'web' && (
        <>
          <span className="motif-web-line motif-web-line-a" />
          <span className="motif-web-line motif-web-line-b" />
          <span className="motif-web-line motif-web-line-c" />
          {interaction === 'none' ? (
            <span className="motif-web-runner" aria-hidden="true" />
          ) : (
            <button
              className="motif-web-runner"
              type="button"
              aria-label={lang === 'zh' ? '触发蛛网动效' : 'Trigger web motion'}
              title={lang === 'zh' ? '触发蛛网动效' : 'Trigger web motion'}
              onClick={triggerBurst}
            />
          )}
          <span className="motif-web-burst" aria-hidden="true" />
        </>
      )}

      {motif === 'botanical' && (
        <div className="motif-botanical-stem">
          <span className="motif-leaf motif-leaf-a" />
          <span className="motif-leaf motif-leaf-b" />
          <span className="motif-leaf motif-leaf-c" />
        </div>
      )}

      {motif === 'scanline' && (
        <>
          <span className="motif-scanline" />
          <span className="motif-scan-index">SYS · VISUAL</span>
        </>
      )}
    </div>
  )
}
