export const GITHUB_TOKEN_KEY = 'chen.github.token'
export const GITHUB_CONFIG_KEY = 'chen.github.config'

export const DEFAULT_PUBLISH_CONFIG = Object.freeze({
  owner: 'dilititi',
  repo: 'personal_website',
  branch: 'main',
})

function storageAvailable(name) {
  try {
    return typeof window !== 'undefined' ? window[name] : null
  } catch {
    return null
  }
}

function readStorage(name, key) {
  try {
    return storageAvailable(name)?.getItem(key) || ''
  } catch {
    return ''
  }
}

function removeStorage(name, key) {
  try {
    storageAvailable(name)?.removeItem(key)
  } catch {
    // Storage clearing is best-effort in privacy modes.
  }
}

function cleanSegment(value) {
  return String(value || '').trim()
}

export function normalizePublishConfig(value = {}) {
  return {
    owner: cleanSegment(value.owner) || DEFAULT_PUBLISH_CONFIG.owner,
    repo: cleanSegment(value.repo) || DEFAULT_PUBLISH_CONFIG.repo,
    branch: cleanSegment(value.branch) || DEFAULT_PUBLISH_CONFIG.branch,
  }
}

export function validatePublishConfig(value) {
  const config = normalizePublishConfig(value)
  if (!/^[A-Za-z0-9_.-]+$/.test(config.owner)) return 'Invalid GitHub owner'
  if (!/^[A-Za-z0-9_.-]+$/.test(config.repo)) return 'Invalid GitHub repository'
  const hasControlCharacter = [...config.branch].some(char => {
    const code = char.charCodeAt(0)
    return code < 32 || code === 127
  })
  const invalidBranch =
    !config.branch ||
    hasControlCharacter ||
    config.branch.startsWith('-') ||
    config.branch.startsWith('/') ||
    config.branch.endsWith('/') ||
    config.branch.endsWith('.') ||
    config.branch.includes('..') ||
    config.branch.includes('//') ||
    config.branch.includes('@{') ||
    /[ ~^:?*[\\]/.test(config.branch) ||
    config.branch.split('/').some(part => part.startsWith('.') || part.endsWith('.lock'))
  if (invalidBranch) return 'Invalid Git branch'
  return ''
}

export function readPublishConfig() {
  try {
    const raw = readStorage('localStorage', GITHUB_CONFIG_KEY)
    return normalizePublishConfig(raw ? JSON.parse(raw) : {})
  } catch {
    return { ...DEFAULT_PUBLISH_CONFIG }
  }
}

export function savePublishConfig(value) {
  const config = normalizePublishConfig(value)
  const error = validatePublishConfig(config)
  if (error) throw new Error(error)
  try {
    storageAvailable('localStorage')?.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config))
  } catch {
    // Publishing can continue with the in-memory config when storage is unavailable.
  }
  return config
}

export function readGitHubToken() {
  return (
    readStorage('sessionStorage', GITHUB_TOKEN_KEY) || readStorage('localStorage', GITHUB_TOKEN_KEY)
  )
}

export function isGitHubTokenRemembered() {
  return Boolean(readStorage('localStorage', GITHUB_TOKEN_KEY))
}

export function saveGitHubToken(token, { remember = false } = {}) {
  const cleanToken = String(token || '').trim()
  if (!cleanToken) throw new Error('GitHub token is required')
  const targetName = remember ? 'localStorage' : 'sessionStorage'
  const target = storageAvailable(targetName)

  removeStorage('sessionStorage', GITHUB_TOKEN_KEY)
  removeStorage('localStorage', GITHUB_TOKEN_KEY)
  try {
    target?.setItem(GITHUB_TOKEN_KEY, cleanToken)
  } catch {
    // The caller still holds the token in component state for this publish attempt.
  }
  return cleanToken
}

export function clearGitHubToken() {
  removeStorage('sessionStorage', GITHUB_TOKEN_KEY)
  removeStorage('localStorage', GITHUB_TOKEN_KEY)
}
