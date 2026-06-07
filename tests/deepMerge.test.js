import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { deepMerge, isPlainObject } from '../src/lib/persist.js'

describe('deepMerge', () => {
  it('returns base when override is undefined', () => {
    assert.deepEqual(deepMerge({ a: 1 }, undefined), { a: 1 })
  })
  it('replaces arrays wholesale (does not merge)', () => {
    assert.deepEqual(deepMerge([1, 2, 3], [9]), [9])
  })
  it('keeps the base array when override is not an array', () => {
    assert.deepEqual(deepMerge([1, 2], { 0: 9 }), [1, 2])
  })
  it('deep-merges nested objects, override wins', () => {
    assert.deepEqual(deepMerge({ a: { x: 1, y: 2 }, b: 3 }, { a: { y: 20 } }), {
      a: { x: 1, y: 20 },
      b: 3,
    })
  })
  it('keeps base when override is a non-object on an object base', () => {
    assert.deepEqual(deepMerge({ a: 1 }, 5), { a: 1 })
  })
  it('returns override for primitives', () => {
    assert.equal(deepMerge(1, 2), 2)
  })
  it('does not mutate the base object', () => {
    const base = { a: { x: 1 } }
    deepMerge(base, { a: { y: 2 } })
    assert.deepEqual(base, { a: { x: 1 } })
  })
})

describe('isPlainObject', () => {
  it('is true for plain objects', () => {
    assert.equal(isPlainObject({}), true)
    assert.equal(isPlainObject(Object.create(null)), true)
  })
  it('is false for arrays', () => {
    assert.equal(isPlainObject([]), false)
  })
  it('is false for null and non-record object instances', () => {
    class Example {}
    assert.equal(isPlainObject(null), false)
    assert.equal(isPlainObject(new Date()), false)
    assert.equal(isPlainObject(new Map()), false)
    assert.equal(isPlainObject(new Example()), false)
  })
  it('replaces Date, Map, and class instances instead of merging them', () => {
    class Example {
      constructor(value) {
        this.value = value
      }
    }
    const date = new Date('2026-01-01T00:00:00.000Z')
    const nextDate = new Date('2027-01-01T00:00:00.000Z')
    assert.equal(deepMerge(date, nextDate), nextDate)

    const map = new Map([['a', 1]])
    const nextMap = new Map([['b', 2]])
    assert.equal(deepMerge(map, nextMap), nextMap)

    const instance = new Example(1)
    const nextInstance = new Example(2)
    assert.equal(deepMerge(instance, nextInstance), nextInstance)
  })
})
