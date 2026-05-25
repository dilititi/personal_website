import React from 'react'
import { useLang } from '../lang'
import { SITE } from '../data'
import { useClock, formatTime } from '../hooks'

export default function Landing({ onJump }) {
  const { lang } = useLang()
  const now = useClock()

  return (
    <section id="home" className="landing landing-masthead">
      <div className="landing-bg"></div>

      <div className="mh-content">
        <div className="mh-name">
          <div className="mh-name-l">
            {lang === 'zh' ? '蜘蛛侠' : 'Across the'}
          </div>
          <div className="mh-name-r">
            {lang === 'zh' ? <i>纵横宇宙</i> : <i>  Spiderverse</i>}
          </div>
        </div>

        <div className="mh-rule"></div>

        <div className="mh-meta">
          <span className="mh-meta-c">
            {lang === 'zh' ? '9 年级 · 蜘蛛侠' : 'Freshman · Spiderman'}
          </span>
          <span className="mh-meta-c">
            {lang === 'zh' ? '布鲁克林愿景学院· 在读' : 'Brooklyn Visions Academy'}
          </span>
          <a className="mh-meta-c link" href={`mailto:${SITE.email}`}>
            {lang === 'zh' ? '邮箱 ↗' : 'EMAIL ↗'}
          </a>
          <span className="mh-meta-c right">
            {lang === 'zh' ? '纽约' : 'New York'} {formatTime(now)}
          </span>
        </div>

        <div className="mh-statement">
          <div className="mh-row">
            <button className="mh-pill pill-about" onClick={() => onJump('about')}>
              <span>{lang === 'zh' ? '关于' : 'About'}</span>
              <em>01</em>
            </button>
            <span className="mh-word">{lang === 'zh' ? ' 迈尔斯・莫拉莱斯' : 'Miles Morales'}</span>
            <button className="mh-pill pill-works" onClick={() => onJump('works')}>
              <span>{lang === 'zh' ? '作品' : 'Works'}</span>
              <em>02</em>
            </button>
          </div>

          <div className="mh-rule"></div>

          <div className="mh-row mh-row-mid">
            <span className="mh-word mh-word-full">
              {lang === 'zh' ? '蜘蛛侠' : 'Spider-Man'}
            </span>
          </div>

          <div className="mh-rule"></div>

          <div className="mh-row">
            <span className="mh-word">{lang === 'zh' ? '现居' : 'Based'}</span>
            <button className="mh-pill pill-library" onClick={() => onJump('library')}>
              <span>{lang === 'zh' ? '私藏' : 'Library'}</span>
              <em>03</em>
            </button>
            <span className="mh-word">{lang === 'zh' ? '杭州' : 'in Hangzhou'}</span>
          </div>

          <div className="mh-rule"></div>
        </div>
      </div>
    </section>
  )
}
