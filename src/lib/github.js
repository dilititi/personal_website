const API_ROOT = 'https://api.github.com'
const TOKEN_PATTERN = /\b(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]+)\b/

class GitHubApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
    this.data = data
  }
}

function encodePath(path) {
  return String(path || '')
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

export function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(String(value))
  let binary = ''
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

export function base64ToUtf8(value) {
  const binary = atob(String(value || '').replace(/\s/g, ''))
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function dataUrlBase64(value) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(value || ''))
  if (!match) throw new Error('Expected a base64 data URL')
  return { mimeType: match[1], content: match[2].replace(/\s/g, '') }
}

export function containsGitHubToken(value, token = '') {
  const text = String(value || '')
  return TOKEN_PATTERN.test(text) || (token && text.includes(token))
}

export function createGitHubClient({ token, owner, repo, fetchImpl = fetch }) {
  const cleanToken = String(token || '').trim()
  if (!cleanToken) throw new Error('GitHub token is required')
  if (!owner || !repo) throw new Error('GitHub owner and repository are required')

  const request = async (pathname, options = {}) => {
    const response = await fetchImpl(`${API_ROOT}${pathname}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${cleanToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.headers || {}),
      },
    })
    const text = await response.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }
    if (!response.ok) {
      throw new GitHubApiError(
        data?.message || `GitHub request failed with HTTP ${response.status}`,
        response.status,
        data,
      )
    }
    return data
  }

  const getRepository = () =>
    request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`)

  const getFileMetadata = async (path, branch = 'main') => {
    const data = await request(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
    )
    if (Array.isArray(data) || data?.type !== 'file') {
      throw new GitHubApiError(`Expected a file at ${path}`, 422, data)
    }
    return data
  }

  const getFile = async (path, branch = 'main') => {
    const data = await getFileMetadata(path, branch)
    if (data.encoding !== 'base64' || !data.content) {
      throw new GitHubApiError(`GitHub did not return base64 file content for ${path}`, 422, data)
    }
    return {
      path: data.path,
      sha: data.sha,
      content: base64ToUtf8(data.content),
      htmlUrl: data.html_url,
    }
  }

  const putFile = async ({ path, content, base64Content, sha, branch = 'main', message }) => {
    const encodedContent = base64Content === undefined ? utf8ToBase64(content ?? '') : base64Content
    const body = {
      message,
      content: encodedContent,
      branch,
      ...(sha ? { sha } : {}),
    }
    return request(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
  }

  const updateFile = async ({ path, branch = 'main', message, transform, retry = true }) => {
    const attempt = async canRetry => {
      const current = await getFile(path, branch)
      const nextContent = await transform(current.content)
      if (typeof nextContent !== 'string') {
        throw new Error('GitHub file transform must return a string')
      }
      if (nextContent === current.content) {
        return { unchanged: true, content: current.content, file: current }
      }
      if (containsGitHubToken(nextContent, cleanToken)) {
        throw new Error('Refusing to publish content containing a GitHub token')
      }
      try {
        const result = await putFile({
          path,
          content: nextContent,
          sha: current.sha,
          branch,
          message,
        })
        return {
          unchanged: false,
          commit: result.commit,
          content: result.content,
        }
      } catch (error) {
        if (canRetry && error instanceof GitHubApiError && error.status === 409) {
          return attempt(false)
        }
        throw error
      }
    }
    return attempt(retry)
  }

  const upsertBase64File = async ({
    path,
    base64Content,
    branch = 'main',
    message,
    retry = true,
  }) => {
    const attempt = async canRetry => {
      let sha
      try {
        sha = (await getFileMetadata(path, branch)).sha
      } catch (error) {
        if (!(error instanceof GitHubApiError) || error.status !== 404) throw error
      }
      try {
        const result = await putFile({ path, base64Content, sha, branch, message })
        return { commit: result.commit, content: result.content }
      } catch (error) {
        if (canRetry && error instanceof GitHubApiError && error.status === 409) {
          return attempt(false)
        }
        throw error
      }
    }
    return attempt(retry)
  }

  const validateRepository = async (branch = 'main') => {
    const repository = await getRepository()
    await request(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`,
    )
    return {
      fullName: repository.full_name,
      defaultBranch: repository.default_branch,
      private: repository.private,
      canPush: repository.permissions?.push === true,
      htmlUrl: repository.html_url,
    }
  }

  return {
    owner,
    repo,
    getFileMetadata,
    getFile,
    updateFile,
    upsertBase64File,
    validateRepository,
  }
}
