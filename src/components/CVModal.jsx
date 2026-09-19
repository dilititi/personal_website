import React, { useRef } from 'react'
import { useLang } from '../lang.jsx'
import { useData } from '../data-context.jsx'
import { useFocusTrap } from '../hooks.jsx'

export default function CVModal({ open, onClose }) {
  const { lang, t } = useLang()
  const { SITE, TEXTS } = useData()
  const dialogRef = useRef(null)
  const title = t(TEXTS.cvModal.eyebrow)

  useFocusTrap({ active: open, containerRef: dialogRef, onClose })

  if (!open) return null

  return (
    <div className="cv-modal open" onClick={onClose}>
      <div
        ref={dialogRef}
        className="cv-doc cv-pdf-doc"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-dialog-title"
        tabIndex="-1"
        onClick={event => event.stopPropagation()}
      >
        <button
          className="cv-close"
          onClick={onClose}
          aria-label={lang === 'zh' ? '关闭简历' : 'Close CV'}
        >
          ✕
        </button>
        <div className="cv-pdf-toolbar">
          <h1 id="cv-dialog-title">{title}</h1>
          {SITE.cvPdf && (
            <a className="btn" href={SITE.cvPdf} target="_blank" rel="noopener noreferrer" download>
              <span>{lang === 'zh' ? '下载简历 PDF' : 'Download CV PDF'}</span>
              <span className="arrow">↓</span>
            </a>
          )}
        </div>
        {SITE.cvPdf ? (
          <iframe className="cv-pdf-frame" src={SITE.cvPdf} title={title} />
        ) : (
          <p className="cv-pdf-missing">
            {lang === 'zh' ? '简历文件尚未上传。' : 'The CV file has not been uploaded yet.'}
          </p>
        )}
      </div>
    </div>
  )
}
