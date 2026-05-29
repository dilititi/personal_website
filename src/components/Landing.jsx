import React from 'react'
import { useLang } from '../lang'
import { useData } from '../data-context'
import { useClock, formatTime } from '../hooks'

// Pick a valid IANA timezone for the clock.
// Priority: explicit SITE.tzName → SITE.timezone if it looks IANA → fallback.
function resolveTz(SITE) {
  if (SITE.tzName) return SITE.tzName
  if (typeof SITE.timezone === 'string' && SITE.timezone.includes('/')) return SITE.timezone
  return 'Asia/Shanghai'
}

export default function Landing({ onJump }) {
  const { t } = useLang()
  const { SITE, TEXTS, isModuleEnabled } = useData()
  const TL = TEXTS.landing
  const now = useClock()

  // Frame 00 displayed values derive from SITE — single source of truth.
  const displayName = t(SITE.name) || ''
  const displayNameR = t(SITE.nameRight) || t(TL.nameRight) || ''  // fallback to old TEXTS
  const cityRaw = t(SITE.location) || ''
  const displayCity = (cityRaw.split(/[,，]/)[0] || cityRaw).trim().toUpperCase()

  return (
    <section id="home" className="landing landing-masthead">
      <div className="landing-bg"></div>

      <div className="mh-content">
        <div className="mh-name">
          <div className="mh-name-l">{displayName}</div>
          <div className="mh-name-r"><i>{displayNameR}</i></div>
        </div>

        <div className="mh-rule"></div>

        <div className="mh-meta">
          <span className="mh-meta-c">{t(TL.metaRole)}</span>
          <span className="mh-meta-c">{t(TL.metaSchool)}</span>
          <a className="mh-meta-c link" href={`mailto:${SITE.email}`}>{t(TL.metaEmailLbl)}</a>
          <span className="mh-meta-c right">{displayCity} {formatTime(now, resolveTz(SITE))}</span>
        </div>

        <div className="mh-statement">
          <div className="mh-row">
            {isModuleEnabled('about') && (
              <button className="mh-pill pill-about" onClick={() => onJump('about')}>
                <span>{t(TL.pillAboutLbl)}</span>
                <em>01</em>
              </button>
            )}
            <span className="mh-word">{t(TL.wordA)}</span>
            {isModuleEnabled('works') && (
              <button className="mh-pill pill-works" onClick={() => onJump('works')}>
                <span>{t(TL.pillWorksLbl)}</span>
                <em>02</em>
              </button>
            )}
          </div>

          <div className="mh-rule"></div>

          <div className="mh-row mh-row-mid">
            <span className="mh-word mh-word-full">{t(TL.wordB)}</span>
          </div>

          <div className="mh-rule"></div>

          <div className="mh-row">
            <span className="mh-word">{t(TL.wordC)}</span>
            {isModuleEnabled('library') && (
              <button className="mh-pill pill-library" onClick={() => onJump('library')}>
                <span>{t(TL.pillLibraryLbl)}</span>
                <em>03</em>
              </button>
            )}
            <span className="mh-word">{t(TL.wordD)}</span>
          </div>

          <div className="mh-rule"></div>
        </div>
      </div>
    </section>
  )
}
