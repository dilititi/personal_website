import React from 'react'
import { useLang } from '../lang'
import { NAV, SITE } from '../data'
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

function BottomStrip({ activeId, onJump }) {
  const { t } = useLang()
  return (
    <nav className="bottom-strip" aria-label="Sections">
      {NAV.map((n) => (
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

function TopBar({ onJump }) {
  const { lang, t } = useLang()
  return (
    <div className="top-bar">
      <button className="nav-mark" onClick={() => onJump('home')}>
        <span className="dot"></span>
        <span>{t(SITE.name)} · {t(SITE.location)}</span>
      </button>
      <LangToggle />
    </div>
  )
}

export default function NavShell({ onJump }) {
  const active = useActiveSection(NAV.map(n => n.id))
  return (
    <>
      <TopBar onJump={onJump} />
      <BottomStrip activeId={active} onJump={onJump} />
    </>
  )
}
