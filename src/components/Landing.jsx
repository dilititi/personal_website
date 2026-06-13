import React from 'react'
import { useLang } from '../lang.jsx'
import { useData } from '../data-context.jsx'
import { useStyle } from '../style-context.jsx'
import { useClock, formatTime } from '../hooks.jsx'
import { responsiveImageAttributes } from '../lib/images.js'

// Pick a valid IANA timezone for the clock.
// Priority: explicit SITE.tzName → SITE.timezone if it looks IANA → fallback.
function resolveTz(SITE) {
  if (SITE.tzName) return SITE.tzName
  if (typeof SITE.timezone === 'string' && SITE.timezone.includes('/')) return SITE.timezone
  return 'Asia/Shanghai'
}

function LandingPortrait({ SITE, t, className }) {
  if (!SITE.portrait) return null
  return (
    <img
      {...responsiveImageAttributes(SITE.portrait, '100vw')}
      className={className}
      alt={t(SITE.nameFull) ? `Portrait of ${t(SITE.nameFull)}` : ''}
      width="1200"
      height="1500"
      loading="eager"
      fetchPriority="high"
      decoding="async"
    />
  )
}

function LandingActions({ TL, t, onJump, isModuleEnabled }) {
  return (
    <div className="landing-template-actions">
      {isModuleEnabled('works') && (
        <button type="button" onClick={() => onJump('works')}>
          <span>{t(TL.pillWorksLbl)}</span>
          <em>↘</em>
        </button>
      )}
      {isModuleEnabled('about') && (
        <button type="button" onClick={() => onJump('about')}>
          <span>{t(TL.pillAboutLbl)}</span>
          <em>01</em>
        </button>
      )}
    </div>
  )
}

function MinimalLanding({ SITE, TL, WORKS, t, onJump, isModuleEnabled, now }) {
  const featuredWorks = WORKS.slice(0, 3)
  return (
    <section id="home" className="landing landing-template landing-minimal">
      <LandingPortrait SITE={SITE} t={t} className="landing-template-media" />
      <div className="landing-template-shade" />
      <div className="landing-template-content">
        <div className="landing-template-meta">
          <span>{t(TL.metaRole)}</span>
          <span>{t(SITE.location)}</span>
          <span>{now ? formatTime(now, resolveTz(SITE)) : '--:--'}</span>
        </div>
        <h1>{t(SITE.nameFull) || t(SITE.name)}</h1>
        <p>{t(SITE.tagline) || t(SITE.role)}</p>
        <LandingActions TL={TL} t={t} onJump={onJump} isModuleEnabled={isModuleEnabled} />
        {isModuleEnabled('works') && featuredWorks.length > 0 && (
          <ol className="landing-minimal-projects">
            {featuredWorks.map((work, index) => (
              <li key={work.id || index}>
                <button type="button" onClick={() => onJump('works')}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{t(work.title)}</strong>
                  <em>{work.year}</em>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
      <span className="landing-next-cue" aria-hidden="true">
        01
      </span>
    </section>
  )
}

function JournalLanding({ SITE, TL, lang, t, onJump, isModuleEnabled, now }) {
  return (
    <section id="home" className="landing landing-template landing-journal">
      <LandingPortrait SITE={SITE} t={t} className="landing-template-media" />
      <div className="landing-journal-lines" aria-hidden="true" />
      <div className="landing-template-content">
        <div className="landing-journal-date">
          <span>{t(SITE.nowDate)}</span>
          <span>{now ? formatTime(now, resolveTz(SITE)) : '--:--'}</span>
        </div>
        <p className="landing-journal-kicker">{t(TL.metaRole)}</p>
        <h1>{t(SITE.nameFull) || t(SITE.name)}</h1>
        <blockquote>{t(SITE.tagline) || t(SITE.now)}</blockquote>
        <div className="landing-journal-current">
          <span>{lang === 'zh' ? '此刻' : 'Current note'}</span>
          <p>{t(SITE.now)}</p>
        </div>
        <LandingActions TL={TL} t={t} onJump={onJump} isModuleEnabled={isModuleEnabled} />
      </div>
      <span className="landing-next-cue" aria-hidden="true">
        entry 01
      </span>
    </section>
  )
}

function GradientLanding({ SITE, TL, WORKS, t, onJump, isModuleEnabled, now }) {
  const media = [...new Set(WORKS.map(work => work.medium).filter(Boolean))].slice(0, 4)
  return (
    <section id="home" className="landing landing-template landing-gradient">
      <LandingPortrait SITE={SITE} t={t} className="landing-template-media" />
      <div className="landing-gradient-wash" aria-hidden="true" />
      <div className="landing-template-content">
        <div className="landing-template-meta">
          <span>{t(SITE.role)}</span>
          <span>{t(SITE.location)}</span>
          <span>{now ? formatTime(now, resolveTz(SITE)) : '--:--'}</span>
        </div>
        <h1>
          <span>{t(SITE.name)}</span>
          <i>{t(SITE.nameRight)}</i>
        </h1>
        <p>{t(SITE.tagline)}</p>
        {media.length > 0 && (
          <div className="landing-gradient-disciplines" aria-label="Featured disciplines">
            {media.map((item, index) => (
              <span key={item}>
                <i>{String(index + 1).padStart(2, '0')}</i>
                {item}
              </span>
            ))}
          </div>
        )}
        <LandingActions TL={TL} t={t} onJump={onJump} isModuleEnabled={isModuleEnabled} />
      </div>
      <span className="landing-next-cue" aria-hidden="true">
        scroll
      </span>
    </section>
  )
}

export default function Landing({ onJump, prerendered = false }) {
  const { lang, t } = useLang()
  const { SITE, TEXTS, WORKS, isModuleEnabled } = useData()
  const { style } = useStyle()
  const TL = TEXTS.landing
  const now = useClock({ defer: prerendered })
  const landingLayout = style?.layout?.landing || 'minimal'

  const templateProps = { SITE, TL, WORKS, lang, t, onJump, isModuleEnabled, now }
  if (landingLayout === 'journal') return <JournalLanding {...templateProps} />
  if (landingLayout === 'gradient') return <GradientLanding {...templateProps} />
  if (landingLayout === 'minimal') return <MinimalLanding {...templateProps} />

  // Frame 00 displayed values derive from SITE — single source of truth.
  const displayName = t(SITE.name) || ''
  const displayNameR = t(SITE.nameRight) || t(TL.nameRight) || '' // fallback to old TEXTS
  const cityRaw = t(SITE.location) || ''
  const displayCity = (cityRaw.split(/[,，]/)[0] || cityRaw).trim().toUpperCase()

  return (
    <section id="home" className="landing landing-masthead">
      <div className="landing-bg"></div>

      <div className="mh-content">
        <div className="mh-name">
          <div className="mh-name-l">{displayName}</div>
          <div className="mh-name-r">
            <i>{displayNameR}</i>
          </div>
        </div>

        <div className="mh-rule"></div>

        <div className="mh-meta">
          <span className="mh-meta-c">{t(TL.metaRole)}</span>
          <span className="mh-meta-c">{t(TL.metaSchool)}</span>
          <a className="mh-meta-c link" href={`mailto:${SITE.email}`}>
            {t(TL.metaEmailLbl)}
          </a>
          <span className="mh-meta-c right">
            {displayCity} {now ? formatTime(now, resolveTz(SITE)) : '--:--:--'}
          </span>
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
