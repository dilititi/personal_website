import { describe, expect, it } from 'vitest'
import { deriveStyleVars } from '../src/style-engine.js'
import { DEFAULT_STYLE, STYLE_PRESETS } from '../src/style.js'

const MOTIFS = new Set(['none', 'film', 'web', 'botanical', 'scanline'])

describe('style motion motifs', () => {
  it('defines a bounded default motion contract', () => {
    expect(MOTIFS.has(DEFAULT_STYLE.motion.motif)).toBe(true)
    expect(DEFAULT_STYLE.motion.scrollIntensity).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_STYLE.motion.scrollIntensity).toBeLessThanOrEqual(1)
    expect(typeof DEFAULT_STYLE.motion.ambient).toBe('boolean')
    expect(['none', 'subtle']).toContain(DEFAULT_STYLE.motion.interaction)
  })

  it.each(Object.entries(STYLE_PRESETS))('%s keeps a valid motif configuration', (_, preset) => {
    const motion = preset.style.motion
    expect(MOTIFS.has(motion.motif)).toBe(true)
    expect(motion.scrollIntensity).toBeGreaterThanOrEqual(0)
    expect(motion.scrollIntensity).toBeLessThanOrEqual(1)
  })

  it('exports motif intensity as a bounded CSS variable', () => {
    expect(deriveStyleVars(DEFAULT_STYLE)['--style-motif-intensity']).toBe('0.40')
    expect(
      deriveStyleVars({
        ...DEFAULT_STYLE,
        motion: { ...DEFAULT_STYLE.motion, scrollIntensity: 4 },
      })['--style-motif-intensity'],
    ).toBe('1.00')
  })
})
