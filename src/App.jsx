import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { LangProvider } from './lang.jsx'
import { NowPlayingProvider } from './np-context.jsx'
import { DataProvider, useData } from './data-context.jsx'
import { StyleProvider } from './style-context.jsx'
import { useReveal } from './hooks.jsx'
import { useDocumentHead } from './lib/useDocumentHead.js'
import NavShell from './components/NavShell.jsx'
import Landing from './components/Landing.jsx'
import About from './components/About.jsx'
import Journey from './components/Journey.jsx'
import Works from './components/Works.jsx'
import Library from './components/Library.jsx'
import Photography from './components/Photography.jsx'
import Travel from './components/Travel.jsx'
import Contact from './components/Contact.jsx'
import Colophon from './components/Colophon.jsx'
import NowPlaying from './components/NowPlaying.jsx'
import CVModal from './components/CVModal.jsx'
import { FilmstripProgress, CursorSpotlight } from './components/Overlays.jsx'

const ContentEditor = lazy(() => import('./components/ContentEditor.jsx'))
const StyleEditor = lazy(() => import('./components/StyleEditor.jsx'))

function AppInner({ prerendered = false }) {
  const [cvOpen, setCvOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [styleEditorOpen, setStyleEditorOpen] = useState(false)
  const [hydrationComplete, setHydrationComplete] = useState(!prerendered)
  const { getModuleConfig, isModuleEnabled } = useData()
  useDocumentHead()
  useReveal(hydrationComplete)

  useEffect(() => {
    if (prerendered) setHydrationComplete(true)
  }, [prerendered])

  useEffect(() => {
    if (!hydrationComplete || typeof window === 'undefined') return
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('chen:app-ready'))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [hydrationComplete])

  const onJump = useCallback(id => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }, [])

  const sections = useMemo(
    () =>
      [
        {
          key: 'about',
          render: layout => <About layout={layout} onOpenCV={() => setCvOpen(true)} />,
        },
        { key: 'journey', render: layout => <Journey layout={layout} /> },
        { key: 'works', render: layout => <Works layout={layout} /> },
        { key: 'library', render: layout => <Library layout={layout} /> },
        { key: 'photography', render: layout => <Photography layout={layout} /> },
        { key: 'travel', render: layout => <Travel layout={layout} /> },
        { key: 'contact', render: layout => <Contact layout={layout} /> },
        { key: 'colophon', render: layout => <Colophon layout={layout} /> },
        {
          key: 'nowPlaying',
          render: layout => <NowPlaying layout={layout} prerendered={prerendered} />,
        },
      ]
        .filter(section => isModuleEnabled(section.key))
        .sort((a, b) => (getModuleConfig(a.key).order ?? 0) - (getModuleConfig(b.key).order ?? 0)),
    [getModuleConfig, isModuleEnabled, prerendered],
  )
  const renderedSections = prerendered && !hydrationComplete ? sections.slice(0, 1) : sections

  return (
    <>
      <CursorSpotlight />
      <FilmstripProgress />
      <NavShell
        onJump={onJump}
        onOpenEditor={() => setEditorOpen(true)}
        onOpenStyleEditor={() => setStyleEditorOpen(true)}
      />
      <main id="main-content">
        <Landing onJump={onJump} prerendered={prerendered} />
        {renderedSections.map(section => {
          const config = getModuleConfig(section.key)
          return (
            <React.Fragment key={section.key}>
              {section.render(config.layout || 'default')}
            </React.Fragment>
          )
        })}
      </main>
      <CVModal open={cvOpen} onClose={() => setCvOpen(false)} />
      {editorOpen && (
        <Suspense fallback={null}>
          <ContentEditor open onClose={() => setEditorOpen(false)} />
        </Suspense>
      )}
      {styleEditorOpen && (
        <Suspense fallback={null}>
          <StyleEditor open onClose={() => setStyleEditorOpen(false)} />
        </Suspense>
      )}
    </>
  )
}

export default function App({ prerendered = false, initialLang }) {
  return (
    <LangProvider initialLang={initialLang} prerendered={prerendered}>
      <DataProvider prerendered={prerendered}>
        <StyleProvider prerendered={prerendered}>
          <NowPlayingProvider prerendered={prerendered}>
            <AppInner prerendered={prerendered} />
          </NowPlayingProvider>
        </StyleProvider>
      </DataProvider>
    </LangProvider>
  )
}
