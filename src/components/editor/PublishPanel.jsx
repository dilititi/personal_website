import React, { useState } from 'react'
import { createGitHubClient } from '../../lib/github.js'
import {
  clearGitHubToken,
  isGitHubTokenRemembered,
  normalizePublishConfig,
  readGitHubToken,
  readPublishConfig,
  saveGitHubToken,
  savePublishConfig,
  validatePublishConfig,
} from '../../lib/publish-config.js'

export default function PublishPanel({ lang, kind, onPublish, onClose, publishDisabled = false }) {
  const [token, setToken] = useState(readGitHubToken)
  const [remember, setRemember] = useState(isGitHubTokenRemembered)
  const [config, setConfig] = useState(readPublishConfig)
  const [busy, setBusy] = useState('')
  const [status, setStatus] = useState(null)

  const text =
    lang === 'zh'
      ? {
          title: '发布到 GitHub',
          token: '细粒度 PAT',
          owner: 'Owner',
          repo: 'Repository',
          branch: 'Branch',
          remember: '记住 token（写入 localStorage）',
          risk: '默认只在当前标签页保存。长期记住 token 会增加 XSS 风险；请仅授予本仓库 Contents 读写权限。',
          verify: '验证连接',
          publish: kind === 'style' ? '发布风格' : '发布内容',
          verifying: '验证中…',
          publishing: '提交中…',
          clear: '清除 token',
          close: '收起',
          disabled:
            kind === 'style'
              ? '当前风格与代码默认值相同，无需发布。'
              : '当前没有需要发布的内容变化。',
        }
      : {
          title: 'Publish to GitHub',
          token: 'Fine-grained PAT',
          owner: 'Owner',
          repo: 'Repository',
          branch: 'Branch',
          remember: 'Remember token in localStorage',
          risk: 'The token stays in this tab by default. Remembering it increases XSS exposure; grant only Contents read/write access to this repository.',
          verify: 'Verify',
          publish: kind === 'style' ? 'Publish style' : 'Publish content',
          verifying: 'Verifying…',
          publishing: 'Publishing…',
          clear: 'Clear token',
          close: 'Collapse',
          disabled:
            kind === 'style'
              ? 'The current style matches the code default.'
              : 'There are no content changes to publish.',
        }

  const updateConfig = (key, value) => setConfig(current => ({ ...current, [key]: value }))

  const verifiedClient = async () => {
    const normalizedConfig = normalizePublishConfig(config)
    const configError = validatePublishConfig(normalizedConfig)
    if (configError) throw new Error(configError)
    const cleanToken = String(token || '').trim()
    if (!cleanToken)
      throw new Error(lang === 'zh' ? '请先填写 GitHub token' : 'Enter a GitHub token')

    const client = createGitHubClient({
      token: cleanToken,
      owner: normalizedConfig.owner,
      repo: normalizedConfig.repo,
    })
    const repository = await client.validateRepository(normalizedConfig.branch)
    if (!repository.canPush) {
      throw new Error(
        lang === 'zh'
          ? '该 token 没有仓库写入权限；请授予 Contents: Read and write'
          : 'This token cannot push to the repository. Grant Contents: Read and write.',
      )
    }
    const savedConfig = savePublishConfig(normalizedConfig)
    saveGitHubToken(cleanToken, { remember })
    setConfig(savedConfig)
    return { client, config: savedConfig, repository }
  }

  const verify = async () => {
    setBusy('verify')
    setStatus(null)
    try {
      const { repository, config: savedConfig } = await verifiedClient()
      setStatus({
        type: 'success',
        message:
          lang === 'zh'
            ? `连接成功：${repository.fullName} · ${savedConfig.branch}`
            : `Connected: ${repository.fullName} · ${savedConfig.branch}`,
      })
    } catch (error) {
      setStatus({ type: 'error', message: error?.message || String(error) })
    } finally {
      setBusy('')
    }
  }

  const publish = async () => {
    setBusy('publish')
    setStatus(null)
    try {
      const { client, config: savedConfig, repository } = await verifiedClient()
      const confirmed = window.confirm(
        lang === 'zh'
          ? `将直接提交到 ${repository.fullName}@${savedConfig.branch}，继续吗？`
          : `Commit directly to ${repository.fullName}@${savedConfig.branch}?`,
      )
      if (!confirmed) return
      const result = await onPublish({ github: client, config: savedConfig })
      const commitUrl = result?.commit?.html_url || ''
      setStatus({
        type: 'success',
        message: result?.unchanged
          ? lang === 'zh'
            ? '没有需要提交的变化。'
            : 'No source changes to commit.'
          : lang === 'zh'
            ? '已提交。Render 将开始重新部署。'
            : 'Committed. Render should start a new deployment.',
        commitUrl,
      })
    } catch (error) {
      setStatus({ type: 'error', message: error?.message || String(error) })
    } finally {
      setBusy('')
    }
  }

  const clear = () => {
    clearGitHubToken()
    setToken('')
    setRemember(false)
    setStatus({
      type: 'success',
      message: lang === 'zh' ? '已从浏览器清除 token。' : 'Token cleared from this browser.',
    })
  }

  return (
    <section className="ce-publish-panel" aria-label={text.title}>
      <div className="ce-publish-head">
        <div>
          <strong>{text.title}</strong>
          <span>
            {config.owner}/{config.repo}@{config.branch}
          </span>
        </div>
        <button className="ce-icon-btn" type="button" onClick={onClose}>
          {text.close}
        </button>
      </div>

      <div className="ce-publish-grid">
        <label className="ce-publish-token">
          <span>{text.token}</span>
          <input
            className="ce-input"
            type="password"
            value={token}
            onChange={event => setToken(event.target.value)}
            autoComplete="off"
            spellCheck="false"
            placeholder="github_pat_…"
          />
        </label>
        <label>
          <span>{text.owner}</span>
          <input
            className="ce-input"
            value={config.owner}
            onChange={event => updateConfig('owner', event.target.value)}
          />
        </label>
        <label>
          <span>{text.repo}</span>
          <input
            className="ce-input"
            value={config.repo}
            onChange={event => updateConfig('repo', event.target.value)}
          />
        </label>
        <label>
          <span>{text.branch}</span>
          <input
            className="ce-input"
            value={config.branch}
            onChange={event => updateConfig('branch', event.target.value)}
          />
        </label>
      </div>

      <label className="ce-publish-remember">
        <input
          type="checkbox"
          checked={remember}
          onChange={event => setRemember(event.target.checked)}
        />
        <span>{text.remember}</span>
      </label>
      <p className="ce-publish-risk">{text.risk}</p>
      {publishDisabled && text.disabled && <p className="ce-publish-note">{text.disabled}</p>}

      {status && (
        <div className={`ce-publish-status is-${status.type}`} role="status">
          <span>{status.message}</span>
          {status.commitUrl && (
            <a href={status.commitUrl} target="_blank" rel="noreferrer">
              {lang === 'zh' ? '查看 commit' : 'View commit'}
            </a>
          )}
        </div>
      )}

      <div className="ce-publish-actions">
        <button className="ce-btn ce-btn-ghost" type="button" onClick={clear} disabled={!!busy}>
          {text.clear}
        </button>
        <button className="ce-btn ce-btn-ghost" type="button" onClick={verify} disabled={!!busy}>
          {busy === 'verify' ? text.verifying : text.verify}
        </button>
        <button
          className="ce-btn"
          type="button"
          onClick={publish}
          disabled={!!busy || publishDisabled}
        >
          {busy === 'publish' ? text.publishing : text.publish}
        </button>
      </div>
    </section>
  )
}
