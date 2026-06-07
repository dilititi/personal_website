import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { jsLiteral, exportLine } from '../src/components/editor/export.js'

const L = (en, zh) => ({ en, zh })
// Evaluate generated code with L() in scope, mirroring src/data.js.
const evalLiteral = code => new Function('L', `return (${code})`)(L)

describe('export.js jsLiteral round-trip', () => {
  it('emits L() for a bilingual { en, zh } pair', () => {
    const value = L('Hello', '你好')
    assert.equal(jsLiteral(value), "L('Hello', '你好')")
    assert.deepEqual(evalLiteral(jsLiteral(value)), value)
  })
  it('round-trips nested structures', () => {
    const value = { title: L('A', '甲'), tags: ['x', 'y'], n: 3, ok: true, nothing: null }
    assert.deepEqual(evalLiteral(jsLiteral(value)), value)
  })
  it('escapes quotes and newlines', () => {
    const value = { s: 'it\'s\n"quoted"' }
    assert.deepEqual(evalLiteral(jsLiteral(value)), value)
  })
  it('exportLine wraps a section in `export const`', () => {
    assert.equal(exportLine('SITE', { a: 1 }), 'export const SITE = {\n  a: 1\n}')
  })
})
