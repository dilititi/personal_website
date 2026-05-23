import React, { useEffect } from 'react'
import { useLang } from '../lang'
import { SITE, ABOUT } from '../data'
import { emph } from '../hooks'

export default function CVModal({ open, onClose }) {
  const { lang, t } = useLang()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const blocks = [
    { key: 'edu',    title: lang === 'zh' ? '学历'       : 'Education' },
    { key: 'work',   title: lang === 'zh' ? '工作经历'   : 'Practice' },
    { key: 'awards', title: lang === 'zh' ? '奖项'       : 'Awards & screenings' },
    { key: 'skills', title: lang === 'zh' ? '技能 / 工具' : 'Tools & skills' },
  ]

  return (
    <div className={`cv-modal ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="cv-doc" onClick={(e) => e.stopPropagation()}>
        <button className="cv-close" onClick={onClose}>✕</button>

        <header className="cv-doc-head">
          <div>
            <div className="cv-eyebrow">{lang === 'zh' ? '简历 · CURRICULUM VITAE' : 'CURRICULUM VITAE · 简历'}</div>
            <h1>{t(SITE.nameFull)}</h1>
            <p className="cv-role">{t(SITE.role)}</p>
            <p className="cv-contact">
              {t(SITE.location)} · {SITE.timezone} · {SITE.email}
            </p>
          </div>
          <div className="cv-doc-seal">
            <div className="seal-stamp" style={{ transform: 'rotate(-3deg)' }}>陈</div>
            <span className="cv-doc-stamp">{lang === 'zh' ? '最后更新 ' : 'Last updated '}{t(SITE.nowDate)}</span>
          </div>
        </header>

        <div className="cv-doc-body">
          <aside className="cv-doc-side">
            <div>
              <h6>{lang === 'zh' ? '联系' : 'Contact'}</h6>
              <p>{SITE.email}</p>
              <p>{t(SITE.location)}</p>
            </div>
            <div>
              <h6>{lang === 'zh' ? '链接' : 'Links'}</h6>
              {SITE.social.map((s, i) => (
                <p key={i}>{t(s.label)} · {s.handle}</p>
              ))}
            </div>
            <div>
              <h6>{lang === 'zh' ? '语言' : 'Languages'}</h6>
              <p>{lang === 'zh' ? '中文（母语）' : 'Chinese (native)'}</p>
              <p>{lang === 'zh' ? '英文（流利）' : 'English (fluent)'}</p>
              <p>{lang === 'zh' ? '日文（阅读）' : 'Japanese (reading)'}</p>
            </div>
            <div>
              <h6>{lang === 'zh' ? '当前' : 'Currently'}</h6>
              <p>{lang === 'zh' ? '在读本科三年级' : 'Third-year BA student'}</p>
              <p>{lang === 'zh' ? '开放助理类合作' : 'Open to assistant gigs'}</p>
            </div>
          </aside>

          <main className="cv-doc-main">
            <p className="cv-doc-intro">{t(ABOUT.intro)}</p>
            {blocks.map((b) => (
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
            <button className="btn" onClick={() => window.print()}>
              <span>{lang === 'zh' ? '打印 / 存为 PDF' : 'Print / Save as PDF'}</span>
              <span className="arrow">↓</span>
            </button>
          </div>
          <div className="cv-doc-stamp-line">
            <span>{t(SITE.nameFull)} · {t(SITE.location)}</span>
            <span>{t(SITE.nowDate)}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
