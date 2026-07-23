import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { formatLocalTimestamp, timestampedJsonFilename } from '../src/components/editor/files.js'

describe('editor file helpers', () => {
  it('formats persisted timestamps for editor status text', () => {
    const value = new Date(2026, 6, 23, 9, 5).getTime()
    assert.equal(formatLocalTimestamp(value), '2026-07-23 09:05')
    assert.equal(formatLocalTimestamp(null), '')
  })

  it('creates filesystem-safe timestamped JSON names', () => {
    const now = new Date('2026-07-23T01:02:03.456Z')
    assert.equal(
      timestampedJsonFilename('content-backup', now),
      'content-backup-2026-07-23T01-02-03.json',
    )
  })
})
