import { describe, expect, it } from 'vitest'
import {
  getInlineQuickEditConfig,
  readQuickFieldValue,
  writeQuickFieldValue,
} from '../src/components/editor/inlineQuickEdit.js'

describe('inline quick editing', () => {
  it('updates one language without replacing the other language', () => {
    const field = getInlineQuickEditConfig('ABOUT').fields[0]
    const source = {
      about: {
        headerTitle: { en: 'Biography', zh: '自述' },
      },
    }

    const next = writeQuickFieldValue(source, field, 'zh', '新的自述')

    expect(next.about.headerTitle).toEqual({ en: 'Biography', zh: '新的自述' })
    expect(source.about.headerTitle.zh).toBe('自述')
    expect(readQuickFieldValue(next, field, 'zh')).toBe('新的自述')
  })

  it('updates nested array fields without mutating the source array', () => {
    const field = getInlineQuickEditConfig('WORKS').fields[2]
    const source = [{ title: { en: 'Work', zh: '作品' }, coverImg: '/old.jpg' }]

    const next = writeQuickFieldValue(source, field, 'en', '/new.jpg')

    expect(next[0].coverImg).toBe('/new.jpg')
    expect(source[0].coverImg).toBe('/old.jpg')
  })

  it('uses language-specific paths for non-bilingual legacy fields', () => {
    const field = getInlineQuickEditConfig('CONTACT').fields[1]
    const source = {
      contact: {
        statementEn: 'Hello',
        statementZh: '你好',
      },
    }

    const next = writeQuickFieldValue(source, field, 'zh', '欢迎联系')

    expect(next.contact.statementEn).toBe('Hello')
    expect(next.contact.statementZh).toBe('欢迎联系')
    expect(readQuickFieldValue(next, field, 'zh')).toBe('欢迎联系')
  })
})
