import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { LangProvider, useLang } from './lang.jsx'
import { NowPlayingProvider } from './np-context.jsx'
import { DataProvider, useData } from './data-context.jsx'
import { StyleProvider } from './style-context.jsx'
import { useReveal } from './hooks.jsx'
import { useDocumentHead } from './lib/useDocumentHead.js'
import { PAGE_MODULE_MANIFEST } from './lib/module-manifest.js'
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
import ThemeMotifLayer from './components/ThemeMotifLayer.jsx'
import InlineQuickEditor from './components/editor/InlineQuickEditor.jsx'
import { getInlineQuickEditConfig } from './components/editor/inlineQuickEdit.js'

const ContentEditor = lazy(() => import('./components/ContentEditor.jsx'))
const StyleEditor = lazy(() => import('./components/StyleEditor.jsx'))

function InlineEditScope({
  enabled = true,
  sectionKey,
  quickKey = sectionKey,
  onEditContent,
  onEditStyle,
  children,
}) {
  const { lang } = useLang()
  const [quickOpen, setQuickOpen] = useState(false)
  if (!enabled) return children
  const quickConfig = getInlineQuickEditConfig(quickKey)

  const openFullEditor = () => {
    setQuickOpen(false)
    onEditContent(sectionKey)
  }

  return (
    <div
      className={`inline-edit-scope ${quickOpen ? 'is-quick-editing' : ''}`}
      data-edit-scope={sectionKey}
      data-quick-edit-scope={quickKey}
    >
      {children}
      <div className="inline-edit-tools" role="group" aria-label={`${sectionKey} editor`}>
        <button
          type="button"
          aria-expanded={quickConfig ? quickOpen : undefined}
          onClick={() => (quickConfig ? setQuickOpen(value => !value) : openFullEditor())}
        >
          {quickConfig ? (lang === 'zh' ? '编辑' : 'Edit') : lang === 'zh' ? '内容' : 'Content'}
        </button>
        <button
          type="button"
          onClick={() => {
            setQuickOpen(false)
            onEditStyle()
          }}
        >
          {lang === 'zh' ? '风格' : 'Style'}
        </button>
      </div>
      {quickOpen && quickConfig && (
        <InlineQuickEditor
          configKey={quickKey}
          onClose={() => setQuickOpen(false)}
          onOpenFull={openFullEditor}
        />
      )}
    </div>
  )
}

function AppInner({ prerendered = false }) {
  const [cvOpen, setCvOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [styleEditorOpen, setStyleEditorOpen] = useState(false)
  const [editorSection, setEditorSection] = useState('SITE')
  const [styleEditorView, setStyleEditorView] = useState('templates')
  const [hydrationComplete, setHydrationComplete] = useState(!prerendered)
  const { getModuleConfig, isModuleEnabled, userOverrides } = useData()
  const hasContentDraft = Object.keys(userOverrides || {}).length > 0
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

  const openContentEditor = useCallback(sectionKey => {
    setEditorSection(sectionKey || 'SITE')
    setEditorOpen(true)
  }, [])

  const openStyleEditor = useCallback((view = 'templates') => {
    setStyleEditorView(view)
    setStyleEditorOpen(true)
  }, [])

  const sections = useMemo(() => {
    const renderers = {
      about: layout => <About layout={layout} onOpenCV={() => setCvOpen(true)} />,
      journey: layout => <Journey layout={layout} />,
      works: layout => <Works layout={layout} />,
      library: layout => <Library layout={layout} />,
      photography: layout => <Photography layout={layout} />,
      travel: layout => <Travel layout={layout} />,
      contact: layout => <Contact layout={layout} />,
      colophon: layout => <Colophon layout={layout} />,
      nowPlaying: layout => <NowPlaying layout={layout} prerendered={prerendered} />,
    }

    return PAGE_MODULE_MANIFEST.map(module => ({
      key: module.id,
      editorKey: module.editorKey,
      quickKey: module.quickKey,
      render: renderers[module.id],
    }))
      .filter(section => isModuleEnabled(section.key))
      .sort((a, b) => (getModuleConfig(a.key).order ?? 0) - (getModuleConfig(b.key).order ?? 0))
  }, [getModuleConfig, isModuleEnabled, prerendered])
  const renderedSections = prerendered && !hydrationComplete ? sections.slice(0, 1) : sections

  return (
    <>
      <CursorSpotlight />
      <FilmstripProgress />
      <ThemeMotifLayer />
      <NavShell
        onJump={onJump}
        onOpenEditor={() => openContentEditor(hasContentDraft ? 'SITE' : '_IMPORT')}
        onOpenStyleEditor={() => openStyleEditor('templates')}
      />
      <main id="main-content">
        <Landing onJump={onJump} prerendered={prerendered} />
        {renderedSections.map(section => {
          const config = getModuleConfig(section.key)
          return (
            <InlineEditScope
              enabled={hydrationComplete}
              key={section.key}
              sectionKey={section.editorKey}
              quickKey={section.quickKey}
              onEditContent={openContentEditor}
              onEditStyle={() => openStyleEditor('tune')}
            >
              {section.render(config.layout || 'default')}
            </InlineEditScope>
          )
        })}
      </main>
      <CVModal open={cvOpen} onClose={() => setCvOpen(false)} />
      {editorOpen && (
        <Suspense fallback={null}>
          <ContentEditor open initialSection={editorSection} onClose={() => setEditorOpen(false)} />
        </Suspense>
      )}
      {styleEditorOpen && (
        <Suspense fallback={null}>
          <StyleEditor
            open
            initialView={styleEditorView}
            onClose={() => setStyleEditorOpen(false)}
          />
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
