import React from 'react'
import { useLang } from '../lang'
import { SITE } from '../data'

export default function Contact() {
  const { lang, t } = useLang()
  return (
    <section id="contact" style={{ minHeight: 'auto' }}>
      <div className="section-header">
        <div>
          <div className="section-num">07 / {lang === 'zh' ? '联络' : 'Signal'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '把信号发出去' : 'Send a signal'}
            <em>{lang === 'zh' ? 'contact' : '联络'}</em>
          </h2>
        </div>
        <div className="section-meta">{lang === 'zh' ? '通常一周内回复' : 'Replies within a week'}</div>
      </div>

      <div className="contact-grid">
        <div>
          <p style={{
            fontFamily: lang === 'zh' ? 'var(--font-zh-serif)' : 'var(--font-serif)',
            fontSize: 'clamp(26px, 3.2vw, 42px)',
            lineHeight: 1.4,
            color: 'var(--cream)',
            maxWidth: 720,
          }}>
            {lang === 'zh' ? (
              <>
                目前开放<em style={{ color: 'var(--ember)', fontStyle: 'normal', fontWeight: 500 }}>摄影 / 录音助理</em>合作，
                也欢迎短片创作、独立刊物视觉、片头字幕设计的邀约。<br />
                <span style={{ color: 'var(--cream-mute)' }}>我回信慢，但通常值得。</span>
              </>
            ) : (
              <>
                I'm <em style={{ color: 'var(--ember)', fontStyle: 'italic' }}>open</em> to camera/sound assistant gigs, short-film collaborations, and the occasional title-design commission. <br />
                <span style={{ color: 'var(--cream-mute)', fontStyle: 'italic' }}>I reply slowly. Usually worth the wait.</span>
              </>
            )}
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <a className="btn" href={`mailto:${SITE.email}`}>
              <span>{lang === 'zh' ? '写邮件' : 'Write me'} · {SITE.email}</span>
              <span className="arrow">↗</span>
            </a>
            <a className="btn ghost" href="#">
              <span>Letterboxd ↗</span>
            </a>
          </div>
        </div>

        <div className="contact-status-box">
          <h6>{lang === 'zh' ? '当前状态 · LIVE' : 'STATUS · LIVE'}</h6>
          <table>
            <tbody>
              {[
                [lang === 'zh' ? '位置' : 'Location',  t(SITE.location), 'var(--cream)'],
                [lang === 'zh' ? '时区' : 'Time',      SITE.timezone, 'var(--cream-soft)'],
                [lang === 'zh' ? '状态' : 'Status',    lang === 'zh' ? '在读・开放合作' : 'Student · open', 'var(--ember)'],
                [lang === 'zh' ? '在看' : 'Watching',  t(SITE.statusObject), 'var(--cream-soft)'],
                [lang === 'zh' ? '在听' : 'Listening', 'Eno · Music for Airports', 'var(--cream-soft)'],
                [lang === 'zh' ? '在读' : 'Reading',   'Tarkovsky · Sculpting in Time', 'var(--cream-soft)'],
              ].map(([k, v, c]) => (
                <tr key={k}>
                  <td className="status-key">{k}</td>
                  <td className="status-val" style={{ color: c }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
