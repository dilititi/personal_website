import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { firstUploadTrackIndex } from '../src/np-context.jsx'

describe('firstUploadTrackIndex', () => {
  it('uses the resolved bundled playlist length', () => {
    const resolvedNowPlaying = { html5: [{}, {}, {}] }
    assert.equal(firstUploadTrackIndex(resolvedNowPlaying, [{ id: 'existing-upload' }]), 4)
  })

  it('handles missing playlists and uploads', () => {
    assert.equal(firstUploadTrackIndex({}, []), 0)
  })
})
