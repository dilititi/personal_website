import React from 'react'
import { useLang } from '../lang.jsx'
import { useData } from '../data-context.jsx'
import { emph } from '../hooks.jsx'
import { responsiveImageAttributes } from '../lib/images.js'
import MobileDisclosure from './MobileDisclosure.jsx'

export default function About({ layout = 'default', onOpenCV }) {
  const { lang, t } = useLang()
  const { ABOUT, SITE, TEXTS, isModuleEnabled } = useData()
  const TA = TEXTS.about
  const cv = ABOUT.cv
  const showCvButton = isModuleEnabled('cvButton')
  const blocks = [
    { key: 'edu', title: t(TA.blockEdu) },
    { key: 'work', title: t(TA.blockWork) },
    { key: 'awards', title: t(TA.blockAwards) },
    { key: 'skills', title: t(TA.blockSkills) },
  ]

  return (
    <section id="about" data-layout={layout}>
      <div className="section-header" data-reveal>
        <div>
          <div className="section-num">
            01 / {(TA.headerSubTag && t(TA.headerSubTag)) || 'About'}
          </div>
          <h2 className="section-title">
            {t(TA.headerTitle)}
            <em>{t(TA.headerSubTag)}</em>
          </h2>
        </div>
        <div className="section-meta">{t(TA.headerMeta)}</div>
      </div>

      <div className="about-grid">
        <aside className="about-sidebar">
          <div>
            <div className="portrait">
              {SITE.portrait && (
                <img
                  {...responsiveImageAttributes(SITE.portrait, '(max-width: 720px) 82vw, 320px')}
                  alt={
                    lang === 'zh'
                      ? `${t(SITE.nameFull)}的个人肖像`
                      : `Portrait of ${t(SITE.nameFull)}`
                  }
                  width="800"
                  height="1000"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>
            <div className="portrait-tag">
              <span>{t(TA.portraitTagL)}</span>
              <span>{TA.portraitTagR}</span>
            </div>
          </div>

          <div className="about-stats">
            {ABOUT.stats.map((s, i) => (
              <div className="stat" key={i}>
                <div className="stat-label">{t(s.label)}</div>
                <p>{emph(t(s.value))}</p>
              </div>
            ))}
          </div>

          {showCvButton && (
            <button
              className="btn"
              onClick={onOpenCV}
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <span>{t(TA.fullCvLabel)}</span>
              <span className="arrow">↗</span>
            </button>
          )}

          <div className="seal-stamp" title={TA.sealChar}>
            {TA.sealChar}
          </div>
        </aside>

        <div className="about-body" data-reveal>
          <p className="about-intro">{t(ABOUT.intro)}</p>
          <div className="about-prose">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i}>{emph(t(p))}</p>
            ))}
          </div>

          <MobileDisclosure
            className="about-cv-disclosure"
            collapsedHeight={620}
            storageId="about-cv"
          >
            {blocks.map(b => (
              <div className="cv-block" key={b.key}>
                <h3>{b.title}</h3>
                {cv[b.key].map((e, i) => (
                  <div className="cv-entry" key={i}>
                    <span className="year">{e.year}</span>
                    <div className="body">
                      <h4>{emph(t(e.title))}</h4>
                      <p>{emph(t(e.role))}</p>
                    </div>
                    <span className="place">{t(e.place)}</span>
                  </div>
                ))}
              </div>
            ))}
          </MobileDisclosure>
        </div>
      </div>
    </section>
  )
}
