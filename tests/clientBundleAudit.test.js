import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'vitest'
import { findForbiddenRendererReferences } from '../scripts/assert-client-bundle.mjs'

const temporaryDirectories = []

async function createBundle() {
  const directory = await mkdtemp(join(tmpdir(), 'chen-client-bundle-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true })),
  )
})

describe('client bundle audit', () => {
  it('accepts a browser-only build', async () => {
    const directory = await createBundle()
    await writeFile(join(directory, 'index.js'), 'console.log("browser bundle")')

    assert.deepEqual(await findForbiddenRendererReferences(directory), [])
  })

  it('reports React server renderer references in nested assets', async () => {
    const directory = await createBundle()
    const assets = join(directory, 'assets')
    await mkdir(assets)
    await writeFile(join(assets, 'server.js'), 'import "react-dom/server.edge"')

    assert.deepEqual(await findForbiddenRendererReferences(directory), ['assets/server.js'])
  })
})
