import { describe, expect, it } from 'vitest'
import {
  MOBILE_DISCLOSURE_STORAGE_KEY,
  readMobileDisclosureState,
  writeMobileDisclosureState,
} from '../src/lib/disclosure.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }
}

describe('mobile disclosure persistence', () => {
  it('stores independent expanded states in one bounded key', () => {
    const storage = memoryStorage()

    expect(writeMobileDisclosureState('about-cv', true, storage)).toBe(true)
    expect(writeMobileDisclosureState('travel-destinations', true, storage)).toBe(true)
    expect(readMobileDisclosureState('about-cv', storage)).toBe(true)
    expect(readMobileDisclosureState('travel-destinations', storage)).toBe(true)

    expect(writeMobileDisclosureState('about-cv', false, storage)).toBe(true)
    expect(readMobileDisclosureState('about-cv', storage)).toBe(false)
    expect(readMobileDisclosureState('travel-destinations', storage)).toBe(true)
  })

  it('fails safely when browser storage is unavailable', () => {
    const storage = {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
      removeItem() {
        throw new Error('blocked')
      },
    }

    expect(readMobileDisclosureState('about-cv', storage)).toBe(false)
    expect(writeMobileDisclosureState('about-cv', true, storage)).toBe(false)
  })

  it('removes the shared key when every disclosure returns to its default state', () => {
    const storage = memoryStorage()
    writeMobileDisclosureState('about-cv', true, storage)
    writeMobileDisclosureState('about-cv', false, storage)

    expect(storage.getItem(MOBILE_DISCLOSURE_STORAGE_KEY)).toBeNull()
  })
})
