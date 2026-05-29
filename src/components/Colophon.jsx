import React from 'react'
import { useLang } from '../lang'
import { useData } from '../data-context'

export default function Colophon() {
  const { lang, t } = useLang()
  const { SITE, TEXTS } = useData()
  const TX = TEXTS.colophon
  const signoff = t(TX.signoff) || ''
  const [sig1, sig2 = ''] = signoff.split('\n')

  return (
    <footer className="colophon">
      <div className="colophon-grid">
        <div>
          <h6>{lang === 'zh' ? '最后说一句' : 'One last thing'}</h6>
          <p className="signoff">
            {sig1}<br />
            {sig2 && <em style={{ color: 'var(--cream-mute)' }}>{sig2}</em>}
          </p>
        </div>
        <div>
          <h6>{lang === 'zh' ? '别处' : 'Elsewhere'}</h6>
          {SITE.social.map((s, i) => (
            <a key={i} href={s.url}>{t(s.label)} · {s.handle}</a>
          ))}
        </div>
        <div>
          <h6>{lang === 'zh' ? '版本说明' : 'Colophon'}</h6>
          <p>{t(TX.fontsLine)}</p>
          <p>{t(TX.handCodedLine)}</p>
        </div>
        <div>
          <h6>{lang === 'zh' ? '最近一次修整' : 'Last tended'}</h6>
          <p>{t(SITE.nowDate)}</p>
          <p>v.2 · 2026 {lang === 'zh' ? '版' : 'edition'}</p>
        </div>
      </div>
      <div className="stamp">
        <span>© {t(SITE.name)} MMXXVI · {lang === 'zh' ? '一切文字图像均属个人' : 'all words & frames mine · all errors mine too'}</span>
        <span>↑ {lang === 'zh' ? '回到顶部' : 'back to top'}</span>
      </div>
    </footer>
  )
}
