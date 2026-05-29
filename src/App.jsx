import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { LangProvider } from './lang'
import { NowPlayingProvider } from './np-context'
import { DataProvider, useData } from './data-context'
import { StyleProvider } from './style-context'
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
import ContentEditor from './components/ContentEditor'
import StyleEditor from './components/StyleEditor'
import { FilmstripProgress, CursorSpotlight } from './components/Overlays'

function AppInner() {
  const [cvOpen, setCvOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [styleEditorOpen, setStyleEditorOpen] = useState(false)
  const { getModuleConfig, isModuleEnabled } = useData()
  useReveal()

  const onJump = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }, [])

  const sections = useMemo(() => ([
    { key: 'about', render: (layout) => <About layout={layout} onOpenCV={() => setCvOpen(true)} /> },
    { key: 'journey', render: (layout) => <Journey layout={layout} /> },
    { key: 'works', render: (layout) => <Works layout={layout} /> },
    { key: 'library', render: (layout) => <Library layout={layout} /> },
    { key: 'photography', render: (layout) => <Photography layout={layout} /> },
    { key: 'travel', render: (layout) => <Travel layout={layout} /> },
    { key: 'contact', render: (layout) => <Contact layout={layout} /> },
    { key: 'colophon', render: (layout) => <Colophon layout={layout} /> },
    { key: 'nowPlaying', render: (layout) => <NowPlaying layout={layout} /> },
  ])
    .filter((section) => isModuleEnabled(section.key))
    .sort((a, b) => (getModuleConfig(a.key).order ?? 0) - (getModuleConfig(b.key).order ?? 0)),
  [getModuleConfig, isModuleEnabled])

  return (
    <>
      <CursorSpotlight />
      <FilmstripProgress />
      <NavShell
        onJump={onJump}
        onOpenEditor={() => setEditorOpen(true)}
        onOpenStyleEditor={() => setStyleEditorOpen(true)}
      />
      <Landing onJump={onJump} />
      {sections.map((section) => {
        const config = getModuleConfig(section.key)
        return <React.Fragment key={section.key}>{section.render(config.layout || 'default')}</React.Fragment>
      })}
      <CVModal open={cvOpen} onClose={() => setCvOpen(false)} />
      <ContentEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
      <StyleEditor open={styleEditorOpen} onClose={() => setStyleEditorOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <DataProvider>
        <StyleProvider>
          <NowPlayingProvider>
            <AppInner />
          </NowPlayingProvider>
        </StyleProvider>
      </DataProvider>
    </LangProvider>
  )
}
