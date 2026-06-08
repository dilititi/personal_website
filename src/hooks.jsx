import { useEffect, useRef, useState } from 'react'

export function useClock({ defer = false } = {}) {
  const [now, setNow] = useState(() => (defer || typeof window === 'undefined' ? null : new Date()))
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function formatTime(d, tz = 'Asia/Shanghai') {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: tz,
    }).format(d)
  } catch {
    return d.toLocaleTimeString()
  }
}

export function useReveal(refreshKey) {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(el => el.classList.add('is-revealed'))
      return
    }
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-revealed')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 },
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [refreshKey])
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useFocusTrap({ active, containerRef, onClose }) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFirst = () => {
      const first = container.querySelector(FOCUSABLE_SELECTOR)
      ;(first || container).focus({ preventScroll: true })
    }
    const frame = requestAnimationFrame(focusFirst)

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
        node => !node.hidden && node.getAttribute('aria-hidden') !== 'true',
      )
      if (!focusable.length) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [active, containerRef])
}

export function useActiveSection(navIds) {
  const [active, setActive] = useState(navIds[0] || 'home')
  useEffect(() => {
    const sections = navIds.map(id => document.getElementById(id)).filter(Boolean)
    if (!sections.length) return
    const obs = new IntersectionObserver(
      entries => {
        let best = null
        entries.forEach(e => {
          if (e.isIntersecting) {
            if (
              !best ||
              Math.abs(e.boundingClientRect.top) < Math.abs(best.boundingClientRect.top)
            ) {
              best = e
            }
          }
        })
        if (best) setActive(best.target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    )
    sections.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [navIds])
  return active
}

export function emph(str) {
  if (!str) return null
  const parts = String(str).split(/(\*[^*]+\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('*') && p.endsWith('*')) {
      return <em key={i}>{p.slice(1, -1)}</em>
    }
    return p
  })
}

export function Stars({ n, of = 5 }) {
  const filled = '★'.repeat(n)
  const empty = '·'.repeat(of - n)
  return <span className="stars">{filled + empty}</span>
}
