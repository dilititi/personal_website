import React from 'react'
import { useLang } from '../lang'
import { useData } from '../data-context'
import { useActiveSection } from '../hooks'

function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-toggle">
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
      <button className={lang === 'zh' ? 'active' : ''} onClick={() => setLang('zh')}>中</button>
    </div>
  )
}

function isStylePreviewSurface() {
  try {
    return new URLSearchParams(window.location.search).has('stylePreview')
  } catch {
    return false
  }
}

function BottomStrip({ activeId, onJump }) {
  const { t } = useLang()
  const { NAV, MODULES, getModuleConfig, isModuleInNav } = useData()
  const home = NAV.find(n => n.id === 'home') || { num: '00', id: 'home', label: { en: 'Home', zh: '首页' } }
  const visible = [
    home,
    ...Object.keys(MODULES || {})
      .filter((id) => isModuleInNav(id))
      .sort((a, b) => (getModuleConfig(a).order ?? 0) - (getModuleConfig(b).order ?? 0))
      .map((id) => {
        const config = getModuleConfig(id)
        return {
          id,
          num: String(config.order ?? 0).padStart(2, '0'),
          label: config.label,
        }
      }),
  ]
  return (
    <nav className="bottom-strip" aria-label="Sections" style={{ gridTemplateColumns: `repeat(${visible.length}, 1fr)` }}>
      {visible.map((n) => (
        <button
          key={n.id}
          className={`bs-ch ${activeId === n.id ? 'act' : ''}`}
          onClick={() => onJump(n.id)}
          aria-current={activeId === n.id ? 'true' : undefined}
        >
          <span className="bs-num">{n.num}</span>
          <span className="bs-lb">{t(n.label)}</span>
        </button>
      ))}
    </nav>
  )
}

function TopBar({ onJump, onOpenEditor, onOpenStyleEditor }) {
  const { lang, t } = useLang()
  const { SITE } = useData()
  const previewSurface = isStylePreviewSurface()
  return (
    <div className="top-bar">
      <button className="nav-mark" onClick={() => onJump('home')}>
        <span className="dot"></span>
        <span>{t(SITE.name)} · {t(SITE.location)}</span>
      </button>
      <div className="top-bar-right">
        {!previewSurface && (onOpenEditor || onOpenStyleEditor) && (
          <div className="top-bar-editor-group" role="group" aria-label={lang === 'zh' ? '编辑器' : 'Editors'}>
            {onOpenEditor && (
              <button
                className="top-bar-tool-btn top-bar-tool-btn-segment"
                onClick={onOpenEditor}
                title={lang === 'zh' ? '内容编辑器' : 'Content editor'}
              >
                <span>{lang === 'zh' ? '内容' : 'Content'}</span>
              </button>
            )}
            {onOpenStyleEditor && (
              <button
                className="top-bar-tool-btn top-bar-tool-btn-segment"
                onClick={onOpenStyleEditor}
                title={lang === 'zh' ? '风格编辑器' : 'Style editor'}
              >
                <span>{lang === 'zh' ? '风格' : 'Style'}</span>
              </button>
            )}
          </div>
        )}
        <LangToggle />
      </div>
    </div>
  )
}

export default function NavShell({ onJump, onOpenEditor, onOpenStyleEditor }) {
  const { MODULES, getModuleConfig, isModuleInNav } = useData()
  const navIds = [
    'home',
    ...Object.keys(MODULES || {})
      .filter((id) => isModuleInNav(id))
      .sort((a, b) => (getModuleConfig(a).order ?? 0) - (getModuleConfig(b).order ?? 0)),
  ]
  const active = useActiveSection(navIds)
  return (
    <>
      <TopBar onJump={onJump} onOpenEditor={onOpenEditor} onOpenStyleEditor={onOpenStyleEditor} />
      <BottomStrip activeId={active} onJump={onJump} />
    </>
  )
}
