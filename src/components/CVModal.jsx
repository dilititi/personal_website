import React, { useRef } from 'react'
import { useLang } from '../lang.jsx'
import { useData } from '../data-context.jsx'
import { emph, useFocusTrap } from '../hooks.jsx'

export default function CVModal({ open, onClose }) {
  const { lang, t } = useLang()
  const { SITE, ABOUT, TEXTS } = useData()
  const TC = TEXTS.cvModal
  const dialogRef = useRef(null)

  useFocusTrap({ active: open, containerRef: dialogRef, onClose })

  const blocks = [
    { key: 'edu', title: t(TC.blockEdu) },
    { key: 'work', title: t(TC.blockWork) },
    { key: 'awards', title: t(TC.blockAwards) },
    { key: 'skills', title: t(TC.blockSkills) },
  ]

  if (!open) return null

  return (
    <div className="cv-modal open" onClick={onClose}>
      <div
        ref={dialogRef}
        className="cv-doc"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-dialog-title"
        tabIndex="-1"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="cv-close"
          onClick={onClose}
          aria-label={lang === 'zh' ? '关闭简历' : 'Close CV'}
        >
          ✕
        </button>

        <header className="cv-doc-head">
          <div>
            <div className="cv-eyebrow">{t(TC.eyebrow)}</div>
            <h1 id="cv-dialog-title">{t(SITE.nameFull)}</h1>
            <p className="cv-role">{t(SITE.role)}</p>
            <p className="cv-contact">
              {t(SITE.location)} · {SITE.timezone} · {SITE.email}
            </p>
          </div>
          <div className="cv-doc-seal">
            <div className="seal-stamp" style={{ transform: 'rotate(-3deg)' }}>
              {TC.sealChar}
            </div>
            <span className="cv-doc-stamp">
              {t(TC.lastUpdated)}
              {t(SITE.nowDate)}
            </span>
          </div>
        </header>

        <div className="cv-doc-body">
          <aside className="cv-doc-side">
            <div>
              <h6>{t(TC.contactLabel)}</h6>
              <p>{SITE.email}</p>
              <p>{t(SITE.location)}</p>
            </div>
            <div>
              <h6>{t(TC.linksLabel)}</h6>
              {SITE.social.map((s, i) => (
                <p key={i}>
                  {t(s.label)} · {s.handle}
                </p>
              ))}
            </div>
            <div>
              <h6>{t(TC.langsLabel)}</h6>
              {(TC.langItems || []).map((it, i) => (
                <p key={i}>{t(it)}</p>
              ))}
            </div>
            <div>
              <h6>{t(TC.nowLabel)}</h6>
              {(TC.nowItems || []).map((it, i) => (
                <p key={i}>{t(it)}</p>
              ))}
            </div>
          </aside>

          <main className="cv-doc-main">
            <p className="cv-doc-intro">{t(ABOUT.intro)}</p>
            {blocks.map(b => (
              <section className="cv-section" key={b.key}>
                <h2>{b.title}</h2>
                {ABOUT.cv[b.key].map((e, i) => (
                  <div className="cv-section-entry" key={i}>
                    <div className="cv-section-year">{e.year}</div>
                    <div className="cv-section-body">
                      <h4>{emph(t(e.title))}</h4>
                      <p>{emph(t(e.role))}</p>
                    </div>
                    <div className="cv-section-place">{t(e.place)}</div>
                  </div>
                ))}
              </section>
            ))}
          </main>
        </div>

        <footer className="cv-doc-foot">
          <div>
            {SITE.cvPdf ? (
              <a
                className="btn"
                href={SITE.cvPdf}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <span>{lang === 'zh' ? '下载 PDF 简历' : 'Download PDF CV'}</span>
                <span className="arrow">↓</span>
              </a>
            ) : (
              <button className="btn" onClick={() => window.print()}>
                <span>{t(TC.printLabel)}</span>
                <span className="arrow">↓</span>
              </button>
            )}
          </div>
          <div className="cv-doc-stamp-line">
            <span>
              {t(SITE.nameFull)} · {t(SITE.location)}
            </span>
            <span>{t(SITE.nowDate)}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
