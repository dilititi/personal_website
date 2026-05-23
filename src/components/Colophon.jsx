import React from 'react'
import { useLang } from '../lang'
import { SITE } from '../data'

export default function Colophon() {
  const { lang, t } = useLang()
  return (
    <footer className="colophon">
      <div className="colophon-grid">
        <div>
          <h6>{lang === 'zh' ? '最后说一句' : 'One last thing'}</h6>
          <p className="signoff">
            {lang === 'zh' ? (
              <>这不是作品集，是一座园子。<br /><em style={{ color: 'var(--cream-mute)' }}>等什么东西长出来了，再来看。</em></>
            ) : (
              <>A garden, not a portfolio. <br /><em style={{ color: 'var(--cream-mute)' }}>Come back when something has grown.</em></>
            )}
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
          <p>{lang === 'zh' ? 'Lora、Manrope、思源黑/宋体设计排版。' : 'Set in Lora, Manrope & Noto.'}</p>
          <p>{lang === 'zh' ? '纯手写代码。无追踪。无 cookie。' : 'Hand-coded. No tracking. No cookies.'}</p>
        </div>
        <div>
          <h6>{lang === 'zh' ? '最近一次修整' : 'Last tended'}</h6>
          <p>{t(SITE.nowDate)}</p>
          <p>v.2 · 2026 {lang === 'zh' ? '版' : 'edition'}</p>
        </div>
      </div>
      <div className="stamp">
        <span>© Chen MMXXVI · {lang === 'zh' ? '一切文字图像均属个人' : 'all words & frames mine · all errors mine too'}</span>
        <span>↑ {lang === 'zh' ? '回到顶部' : 'back to top'}</span>
      </div>
    </footer>
  )
}
