import React, { useRef, useEffect } from 'react'

export function FilmstripProgress() {
  useEffect(() => {
    const el = document.querySelector('.filmstrip-fill')
    if (!el) return
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      const p = h > 0 ? (window.scrollY / h) * 100 : 0
      el.style.width = p + '%'
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="filmstrip">
      <div className="filmstrip-fill"></div>
    </div>
  )
}

export function CursorSpotlight() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let stopMotion = () => {}

    const syncMotion = () => {
      stopMotion()
      document.body.classList.remove('cursor-active')
      if (media.matches) return

      let raf = 0
      let x = window.innerWidth / 2
      let y = window.innerHeight / 2
      let tx = x
      let ty = y
      const onMove = event => {
        tx = event.clientX
        ty = event.clientY
        document.body.classList.add('cursor-active')
      }
      const onLeave = () => document.body.classList.remove('cursor-active')
      const tick = () => {
        x += (tx - x) * 0.18
        y += (ty - y) * 0.18
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
        raf = requestAnimationFrame(tick)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseleave', onLeave)
      raf = requestAnimationFrame(tick)
      stopMotion = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseleave', onLeave)
      }
    }

    syncMotion()
    media.addEventListener('change', syncMotion)
    return () => {
      media.removeEventListener('change', syncMotion)
      stopMotion()
      document.body.classList.remove('cursor-active')
    }
  }, [])
  return <div ref={ref} className="cursor-spotlight"></div>
}
