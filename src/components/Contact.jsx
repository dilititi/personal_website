import React from 'react'
import { useLang } from '../lang.jsx'
import { useData } from '../data-context.jsx'

// Render a TEXTS.contact statement, with <em>...</em> preserved as React <em>.
function emTags(str) {
  if (!str) return null
  const parts = String(str).split(/(<em>[^<]+<\/em>)/g)
  return parts.map((p, i) => {
    const m = /^<em>(.+)<\/em>$/.exec(p)
    if (m) return <em key={i}>{m[1]}</em>
    return <React.Fragment key={i}>{p}</React.Fragment>
  })
}

export default function Contact({ layout = 'default' }) {
  const { lang, t } = useLang()
  const { SITE, TEXTS } = useData()
  const TC = TEXTS.contact

  const statement = lang === 'zh' ? TC.statementZh : TC.statementEn

  return (
    <section id="contact" data-layout={layout} style={{ minHeight: 'auto' }}>
      <div className="section-header">
        <div>
          <div className="section-num">07 / {lang === 'zh' ? '联络' : 'Signal'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '把信号发出去' : 'Send a signal'}
            <em>{lang === 'zh' ? 'contact' : '联络'}</em>
          </h2>
        </div>
        <div className="section-meta">
          {lang === 'zh' ? '通常一周内回复' : 'Replies within a week'}
        </div>
      </div>

      <div className="contact-grid">
        <div>
          <p
            style={{
              fontFamily: lang === 'zh' ? 'var(--font-zh-serif)' : 'var(--font-serif)',
              fontSize: 'clamp(26px, 3.2vw, 42px)',
              lineHeight: 1.4,
              color: 'var(--cream)',
              maxWidth: 720,
              whiteSpace: 'pre-line',
            }}
          >
            {emTags(statement)}
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <a className="btn" href={`mailto:${SITE.email}`}>
              <span>
                {t(TC.writeMeLabel)} · {SITE.email}
              </span>
              <span className="arrow">↗</span>
            </a>
            <a className="btn ghost" href={TC.secondaryUrl || '#'}>
              <span>{t(TC.secondaryLbl)}</span>
            </a>
          </div>
        </div>

        <div className="contact-status-box">
          <h6>{lang === 'zh' ? '当前状态 · LIVE' : 'STATUS · LIVE'}</h6>
          <table>
            <tbody>
              {[
                [lang === 'zh' ? '位置' : 'Location', t(SITE.location), 'var(--cream)'],
                [lang === 'zh' ? '时区' : 'Time', SITE.timezone, 'var(--cream-soft)'],
                [
                  lang === 'zh' ? '状态' : 'Status',
                  lang === 'zh' ? '在读・开放合作' : 'Student · open',
                  'var(--ember)',
                ],
                [lang === 'zh' ? '在看' : 'Watching', t(SITE.statusObject), 'var(--cream-soft)'],
              ].map(([k, v, c]) => (
                <tr key={k}>
                  <td className="status-key">{k}</td>
                  <td className="status-val" style={{ color: c }}>
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
