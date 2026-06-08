import { describe, expect, it } from 'vitest'
import { contrastRatio, deriveStyleVars } from '../src/style-engine.js'
import { STYLE_PRESETS } from '../src/style.js'

describe('style preset contrast', () => {
  it.each(Object.entries(STYLE_PRESETS))(
    '%s keeps text tokens at WCAG AA contrast',
    (_, preset) => {
      const vars = deriveStyleVars(preset.style)
      const surfaces = [vars['--ink-void'], vars['--ink-deep']]
      const textTokens = [
        vars['--cream'],
        vars['--cream-soft'],
        vars['--cream-mute'],
        vars['--cream-faint'],
      ]

      textTokens.forEach(text => {
        surfaces.forEach(surface => {
          expect(contrastRatio(text, surface)).toBeGreaterThanOrEqual(4.5)
        })
      })
    },
  )
})
