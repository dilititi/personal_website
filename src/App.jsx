import React, { useState, useEffect, useCallback } from 'react'
import { LangProvider } from './lang'
import { useReveal } from './hooks'
import NavShell from './components/NavShell'
import Landing from './components/Landing'
import About from './components/About'
import Journey from './components/Journey'
import Works from './components/Works'
import Library from './components/Library'
import Photography from './components/Photography'
import Travel from './components/Travel'
import Contact from './components/Contact'
import Colophon from './components/Colophon'
import NowPlaying from './components/NowPlaying'
import CVModal from './components/CVModal'
import { FilmstripProgress, CursorSpotlight } from './components/Overlays'

function AppInner() {
  const [cvOpen, setCvOpen] = useState(false)
  useReveal()

  const onJump = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }, [])

  return (
    <>
      <CursorSpotlight />
      <FilmstripProgress />
      <NavShell onJump={onJump} />
      <Landing onJump={onJump} />
      <About onOpenCV={() => setCvOpen(true)} />
      <Journey />
      <Works />
      <Library />
      <Photography />
      <Travel />
      <Contact />
      <Colophon />
      <NowPlaying />
      <CVModal open={cvOpen} onClose={() => setCvOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  )
}
