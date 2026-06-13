import React, { useEffect, useId, useState } from 'react'
import { useLang } from '../lang.jsx'
import { readMobileDisclosureState, writeMobileDisclosureState } from '../lib/disclosure.js'

export default function MobileDisclosure({
  children,
  className = '',
  collapsedHeight = 560,
  storageId = '',
  moreLabel,
  lessLabel,
}) {
  const { lang } = useLang()
  const contentId = useId()
  const [expanded, setExpanded] = useState(false)
  const [storageReady, setStorageReady] = useState(!storageId)

  useEffect(() => {
    if (!storageId) return
    setExpanded(readMobileDisclosureState(storageId))
    setStorageReady(true)
  }, [storageId])

  useEffect(() => {
    if (!storageId || !storageReady) return
    writeMobileDisclosureState(storageId, expanded)
  }, [expanded, storageId, storageReady])

  return (
    <div
      className={`mobile-disclosure ${expanded ? 'is-expanded' : ''} ${className}`.trim()}
      data-disclosure-id={storageId || undefined}
      style={{ '--mobile-collapse-height': `${collapsedHeight}px` }}
    >
      <div className="mobile-disclosure-content" id={contentId}>
        {children}
      </div>
      <button
        className="mobile-disclosure-toggle"
        type="button"
        aria-controls={contentId}
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
      >
        <span>
          {expanded
            ? lessLabel || (lang === 'zh' ? '收起' : 'Show less')
            : moreLabel || (lang === 'zh' ? '展开全部' : 'Show all')}
        </span>
        <em aria-hidden="true">{expanded ? '−' : '+'}</em>
      </button>
    </div>
  )
}
