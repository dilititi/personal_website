import React, { useState } from 'react'
import { useData } from '../../data-context.jsx'
import { useLang } from '../../lang.jsx'
import { auditMessage, runSiteAudit } from './audit.js'

export default function AuditPanel() {
  const data = useData()
  const { lang } = useLang()
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')

  const run = async () => {
    setBusy(true)
    setFailure('')
    try {
      setReport(await runSiteAudit(data.resolvedData))
    } catch (error) {
      setFailure(error?.message || String(error))
    } finally {
      setBusy(false)
    }
  }

  const text =
    lang === 'zh'
      ? {
          intro: '检查结构、占位符、标题、链接、内联媒体和 public 资源路径。',
          run: '运行完整审计',
          rerun: '重新审计',
          running: '审计中…',
          clean: '未发现阻断发布的问题。',
          errors: '错误',
          warnings: '警告',
          assets: '媒体路径',
          mobile:
            '移动端布局需在生产构建后运行 npm run test:ui:preview；浏览器面板不把当前窗口尺寸当作可靠的溢出判定。',
        }
      : {
          intro:
            'Check structure, placeholders, titles, links, embedded media, and public asset paths.',
          run: 'Run full audit',
          rerun: 'Run again',
          running: 'Auditing…',
          clean: 'No publication-blocking issues found.',
          errors: 'Errors',
          warnings: 'Warnings',
          assets: 'Media paths',
          mobile:
            'Run npm run test:ui:preview after the production build for mobile layout coverage; this browser panel does not treat its current viewport as a reliable overflow test.',
        }

  return (
    <div className="ce-audit">
      <div className="ce-audit-intro">
        <p>{text.intro}</p>
        <button className="ce-btn" type="button" onClick={run} disabled={busy}>
          {busy ? text.running : report ? text.rerun : text.run}
        </button>
      </div>

      {failure && (
        <div className="ce-file-status ce-file-status-error" role="alert">
          {failure}
        </div>
      )}

      {report && (
        <div className="ce-audit-report" aria-live="polite">
          <div className="ce-audit-summary">
            <span className={report.errors.length ? 'has-errors' : 'is-clean'}>
              {text.errors}: {report.errors.length}
            </span>
            <span className={report.warnings.length ? 'has-warnings' : ''}>
              {text.warnings}: {report.warnings.length}
            </span>
            <span>
              {text.assets}: {report.assets?.checked || 0}
            </span>
          </div>

          {!report.errors.length && (
            <div className="ce-file-status ce-file-status-ok">{text.clean}</div>
          )}

          {!!report.items.length && (
            <ul className="ce-audit-list">
              {report.items.map((entry, index) => (
                <li key={`${entry.code}:${entry.path}:${index}`} className={`is-${entry.severity}`}>
                  <span className="ce-audit-severity">
                    {entry.severity === 'error' ? text.errors : text.warnings}
                  </span>
                  <code>{entry.path}</code>
                  <p>{auditMessage(entry, lang)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="ce-audit-mobile-note">{text.mobile}</p>
    </div>
  )
}
