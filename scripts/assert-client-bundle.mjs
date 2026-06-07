import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FORBIDDEN_RENDERERS = /server\.browser|server\.edge|react-dom\/server/i

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(entry => {
      const path = resolve(directory, entry.name)
      return entry.isDirectory() ? listFiles(path) : [path]
    }),
  )
  return nested.flat()
}

export async function findForbiddenRendererReferences(directory) {
  const root = resolve(directory)
  const files = await listFiles(root)
  const matches = []

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    if (FORBIDDEN_RENDERERS.test(content)) {
      matches.push(file.slice(root.length + 1).replaceAll('\\', '/'))
    }
  }

  return matches
}

async function main() {
  const directory = resolve(process.argv[2] || 'dist')
  const matches = await findForbiddenRendererReferences(directory)

  if (matches.length) {
    console.error(
      [
        'Client bundle contains React server renderer references:',
        ...matches.map(file => `  - ${file}`),
        'Expected none of: server.browser, server.edge, react-dom/server',
      ].join('\n'),
    )
    process.exitCode = 1
    return
  }

  console.log('Client bundle audit passed: no React server renderer references found.')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`Client bundle audit failed: ${error.message}`)
    process.exitCode = 1
  })
}
