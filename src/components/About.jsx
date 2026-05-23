import React from 'react'
import { useLang } from '../lang'
import { ABOUT, SITE } from '../data'
import { emph, Stars } from '../hooks'

export default function About({ onOpenCV }) {
  const { lang, t } = useLang()
  const cv = ABOUT.cv
  const blocks = [
    { key: 'edu',    title: lang === 'zh' ? '学历'    : 'Education' },
    { key: 'work',   title: lang === 'zh' ? '工作'    : 'Practice'  },
    { key: 'awards', title: lang === 'zh' ? '奖项'    : 'Awards'    },
    { key: 'skills', title: lang === 'zh' ? '技能'    : 'Tools'     },
  ]

  return (
    <section id="about">
      <div className="section-header" data-reveal>
        <div>
          <div className="section-num">01 / {lang === 'zh' ? '关于' : 'About'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '简短的自述' : 'A short biography'}
            <em>{lang === 'zh' ? 'biography' : '简介'}</em>
          </h2>
        </div>
        <div className="section-meta">{lang === 'zh' ? '阅读约 3 分钟' : 'Read time · 3 min'}</div>
      </div>

      <div className="about-grid">
        <aside className="about-sidebar">
          <div>
            <div className="portrait"></div>
            <div className="portrait-tag">
              <span>[ {lang === 'zh' ? '自拍 · 2025' : 'self, 2025'} ]</span>
              <span>35mm · TX-400</span>
            </div>
          </div>

          <div className="about-stats">
            {ABOUT.stats.map((s, i) => (
              <div className="stat" key={i}>
                <h6>{t(s.label)}</h6>
                <p>{emph(t(s.value))}</p>
              </div>
            ))}
          </div>

          <button className="btn" onClick={onOpenCV} style={{ justifyContent: 'space-between', width: '100%' }}>
            <span>{lang === 'zh' ? '查看完整简历' : 'Full CV / Curriculum'}</span>
            <span className="arrow">↗</span>
          </button>

          <div className="seal-stamp" title="陈">陈</div>
        </aside>

        <div className="about-body" data-reveal>
          <p className="about-intro">{t(ABOUT.intro)}</p>
          <div className="about-prose">
            {ABOUT.paragraphs.map((p, i) => <p key={i}>{emph(t(p))}</p>)}
          </div>

          {blocks.map((b) => (
            <div className="cv-block" key={b.key}>
              <h4>{b.title}</h4>
              {cv[b.key].map((e, i) => (
                <div className="cv-entry" key={i}>
                  <span className="year">{e.year}</span>
                  <div className="body">
                    <h5>{emph(t(e.title))}</h5>
                    <p>{emph(t(e.role))}</p>
                  </div>
                  <span className="place">{t(e.place)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
