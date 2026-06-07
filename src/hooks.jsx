import { useState, useEffect } from 'react'

export function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
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

export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
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
  }, [])
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
