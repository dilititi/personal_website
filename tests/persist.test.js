import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clearPersistedValue,
  persistenceSnapshot,
  readJSON,
  readTimestamp,
  writePersistedValue,
} from '../src/lib/persist.js'

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries))
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null
  }

  setItem(key, value) {
    this.values.set(key, String(value))
  }

  removeItem(key) {
    this.values.delete(key)
  }
}

describe('persistent storage helpers', () => {
  it('falls back for missing or invalid JSON', () => {
    const storage = new MemoryStorage({ broken: '{not json' })
    assert.deepEqual(readJSON('missing', { ok: true }, storage), { ok: true })
    assert.deepEqual(readJSON('broken', { ok: true }, storage), { ok: true })
  })

  it('reads only positive finite timestamps', () => {
    const storage = new MemoryStorage({
      valid: '1234',
      negative: '-1',
      invalid: 'nope',
    })
    assert.equal(readTimestamp('valid', storage), 1234)
    assert.equal(readTimestamp('negative', storage), null)
    assert.equal(readTimestamp('invalid', storage), null)
  })

  it('writes a value and records the successful save timestamp', () => {
    const storage = new MemoryStorage()
    const result = writePersistedValue({
      storage,
      key: 'content',
      lastSavedKey: 'saved',
      value: { name: 'Chen' },
      now: () => 1234,
    })

    assert.equal(result.ok, true)
    assert.equal(result.lastSaved, 1234)
    assert.equal(storage.getItem('content'), '{"name":"Chen"}')
    assert.equal(storage.getItem('saved'), '1234')
  })

  it('removes default values but still records a successful state change', () => {
    const storage = new MemoryStorage({ content: '{"old":true}', saved: '100' })
    const result = writePersistedValue({
      storage,
      key: 'content',
      lastSavedKey: 'saved',
      value: {},
      isDefault: value => Object.keys(value).length === 0,
      now: () => 200,
    })

    assert.equal(result.ok, true)
    assert.equal(storage.getItem('content'), null)
    assert.equal(storage.getItem('saved'), '200')
    assert.equal(result.snapshot, persistenceSnapshot({}, { isDefault: () => true }))
  })

  it('does not update the timestamp when the data write fails', () => {
    const storage = new MemoryStorage({ saved: '100' })
    storage.setItem = () => {
      const error = new Error('quota reached')
      error.name = 'QuotaExceededError'
      throw error
    }

    const result = writePersistedValue({
      storage,
      key: 'content',
      lastSavedKey: 'saved',
      value: { large: true },
      quotaHint: 'Use public media paths.',
      now: () => 200,
    })

    assert.equal(result.ok, false)
    assert.match(result.error, /storage is full/i)
    assert.match(result.error, /public media paths/i)
    assert.equal(storage.getItem('saved'), '100')
  })

  it('clears both the persisted value and its timestamp on reset', () => {
    const storage = new MemoryStorage({ content: '{"name":"Chen"}', saved: '1234' })
    const result = clearPersistedValue({
      storage,
      key: 'content',
      lastSavedKey: 'saved',
    })

    assert.equal(result.ok, true)
    assert.equal(storage.getItem('content'), null)
    assert.equal(storage.getItem('saved'), null)
  })
})
