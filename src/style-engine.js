const FONT_STACKS = {
  serif: '"Lora", "Noto Serif SC", "Source Han Serif SC", Georgia, serif',
  sans: '"Manrope", "Noto Sans SC", "PingFang SC", -apple-system, sans-serif',
  mono: '"IBM Plex Mono", "SF Mono", monospace',
}

const EASINGS = {
  easeOut: {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
  easeInOut: {
    out: 'cubic-bezier(0.33, 1, 0.68, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
  sharp: {
    out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    inOut: 'cubic-bezier(0.76, 0, 0.24, 1)',
  },
}

function clamp(value, min = 0, max = 1) {
  const n = Number(value)
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function normalizeHex(hex, fallback = '#000000') {
  if (typeof hex !== 'string') return fallback
  const raw = hex.trim().replace('#', '')
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split('').map((c) => c + c).join('')}`.toLowerCase()
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`.toLowerCase()
  return fallback
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex)
  const raw = normalized.slice(1)
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function mixHex(a, b, amount) {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  const t = clamp(amount)
  return rgbToHex({
    r: x.r + (y.r - x.r) * t,
    g: x.g + (y.g - x.g) * t,
    b: x.b + (y.b - x.b) * t,
  })
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha).toFixed(2)})`
}

export function deriveStyleVars(style) {
  const color = style?.color || {}
  const design = style?.design || {}
  const typography = style?.typography || {}
  const space = style?.space || {}
  const motion = style?.motion || {}
  const texture = style?.texture || {}
  const light = style?.light || {}
  const depth = style?.depth || {}

  const background = normalizeHex(color.background, '#ebe2c8')
  const surface = normalizeHex(color.surface, '#e0d6ba')
  const text = normalizeHex(color.text, '#1a1814')
  const muted = normalizeHex(color.muted, '#5e574b')
  const primary = normalizeHex(color.primary, '#3a7a82')
  const secondary = normalizeHex(color.secondary, '#b8924a')
  const contrast = clamp(color.contrast ?? 0.72)
  const saturation = clamp(color.saturation ?? 0.55)
  const designSpacing = clamp(design.spacing ?? 0.5)
  const designHierarchy = clamp(design.hierarchy ?? 0.62)
  const designContrast = clamp(design.contrast ?? 0.66)
  const designProportion = clamp(design.proportion ?? 0.5)
  const effectiveContrast = clamp(contrast + (designContrast - 0.5) * 0.32)
  const spacingMultiplier = 0.76 + designSpacing * 0.72

  const displayFont = FONT_STACKS[typography.display] || FONT_STACKS.serif
  const bodyFont = FONT_STACKS[typography.body] || FONT_STACKS.sans
  const scale = clamp(typography.scale ?? 1.333, 1.1, 1.7)
  const effectiveTypeScale = clamp(scale * (0.92 + designHierarchy * 0.16), 1.08, 1.86)
  const tracking = clamp(typography.tracking ?? 0, -30, 60)

  const density = clamp(space.density ?? 0.45)
  const sectionGap = clamp(space.sectionGap ?? 96, 64, 140)
  const cardGap = clamp(space.cardGap ?? 20, 10, 36)
  const radius = clamp(space.radius ?? 6, 0, 24)

  const easing = EASINGS[motion.easing] || EASINGS.easeOut
  const duration = clamp(motion.duration ?? 280, 80, 800)
  const grain = clamp(texture.grain ?? 0.09, 0, 0.32)
  const imageSaturation = clamp(texture.imageSaturation ?? 1, 0.4, 1.8)
  const imageContrast = clamp(texture.imageContrast ?? 1, 0.7, 1.5)
  const imageBrightness = clamp(texture.imageBrightness ?? 1, 0.7, 1.3)
  const shadowDepth = clamp(light.shadowDepth ?? 0.28)
  const shadowSoftness = clamp(light.shadowSoftness ?? 0.58)
  const highlight = clamp(light.highlight ?? 0.18)
  const blur = clamp(depth.blur ?? 0, 0, 16)
  const glass = clamp(depth.glass ?? 0.08)
  const parallax = clamp(depth.parallax ?? 0.12)
  const sectionY = Math.round(sectionGap * (1.45 - density * 0.45) * spacingMultiplier)
  const sectionX = Math.round(80 * (1.15 - density * 0.25) * (0.88 + designSpacing * 0.28))
  const headerGap = Math.round(sectionGap * (0.85 - density * 0.5) * spacingMultiplier)
  const cardGapValue = Math.round(cardGap * (0.8 + designSpacing * 0.5))
  const imageSatValue = Number(((0.75 + saturation * 0.8) * imageSaturation).toFixed(3))
  const imageContrastValue = Number(((0.86 + effectiveContrast * 0.26) * imageContrast).toFixed(3))
  const imageBrightnessValue = Number(imageBrightness.toFixed(3))
  const hierarchyScale = Number((0.82 + designHierarchy * 0.48).toFixed(3))
  const contentMax = Math.round(1040 + designProportion * 260)
  const sidebarFr = Number((0.72 + designProportion * 0.32).toFixed(2))
  const mainFr = Number((1.18 + designProportion * 0.5).toFixed(2))
  const mediaAspect = Number((1.2 + designProportion * 0.85).toFixed(3))
  const cardMinHeight = Math.round(320 + designProportion * 140)
  const cardShadowY = Math.round(8 + shadowDepth * 34)
  const cardShadowBlur = Math.round(16 + shadowSoftness * 56)
  const cardShadowSpread = Math.round(-1 - shadowDepth * 6)
  const softShadowY = Math.round(4 + shadowDepth * 18)
  const softShadowBlur = Math.round(12 + shadowSoftness * 34)
  const modalShadowY = Math.round(28 + shadowDepth * 36)
  const modalShadowBlur = Math.round(70 + shadowSoftness * 54)
  const shadowAlpha = 0.05 + shadowDepth * 0.23
  const softShadowAlpha = 0.04 + shadowDepth * 0.12
  const modalShadowAlpha = 0.16 + shadowDepth * 0.22
  const highlightAlpha = 0.03 + highlight * 0.16
  const glassBlur = Math.round(glass * 18 + blur * 0.45)
  const glassAlpha = 0.02 + glass * 0.2

  return {
    '--ink-void': background,
    '--ink-deep': surface,
    '--ink-soft': mixHex(surface, text, 0.06 + effectiveContrast * 0.04),
    '--ink-line': mixHex(surface, text, 0.12 + effectiveContrast * 0.1),
    '--ink-haze': mixHex(surface, text, 0.22 + effectiveContrast * 0.14),
    '--cream': text,
    '--cream-soft': mixHex(text, background, 0.18),
    '--cream-mute': muted,
    '--cream-faint': mixHex(muted, background, 0.38),
    '--ember': primary,
    '--ember-hot': mixHex(primary, text, 0.08),
    '--ember-glow': rgba(primary, 0.12 + saturation * 0.14),
    '--moss': secondary,
    '--moss-glow': rgba(secondary, 0.12 + saturation * 0.12),
    '--rust': mixHex(primary, '#c44a2a', 0.45),
    '--font-serif': displayFont,
    '--font-sans': bodyFont,
    '--font-mono': FONT_STACKS.mono,
    '--font-zh-serif': '"Noto Serif SC", "Source Han Serif SC", serif',
    '--font-zh-sans': '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    '--ease-out': easing.out,
    '--ease-in-out': easing.inOut,
    '--style-motion-duration': `${Math.round(duration)}ms`,
    '--style-grain-opacity': grain.toFixed(2),
    '--style-shadow-card': `0 ${cardShadowY}px ${cardShadowBlur}px ${cardShadowSpread}px ${rgba('#000000', shadowAlpha)}, inset 0 1px 0 ${rgba('#ffffff', highlightAlpha)}`,
    '--style-shadow-soft': `0 ${softShadowY}px ${softShadowBlur}px ${rgba('#000000', softShadowAlpha)}`,
    '--style-shadow-modal': `0 ${modalShadowY}px ${modalShadowBlur}px ${rgba('#000000', modalShadowAlpha)}, inset 0 1px 0 ${rgba('#ffffff', highlightAlpha)}`,
    '--style-highlight-color': rgba('#ffffff', highlightAlpha),
    '--style-highlight-opacity': highlightAlpha.toFixed(2),
    '--style-glass-blur': `${glassBlur}px`,
    '--style-glass-alpha': glassAlpha.toFixed(2),
    '--style-depth-blur': `${Math.round(blur)}px`,
    '--style-parallax-shift': `${Math.round(parallax * 20)}px`,
    '--style-radius': `${Math.round(radius)}px`,
    '--style-design-spacing': designSpacing.toFixed(2),
    '--style-design-hierarchy': designHierarchy.toFixed(2),
    '--style-design-contrast': designContrast.toFixed(2),
    '--style-design-proportion': designProportion.toFixed(2),
    '--style-hierarchy-scale': String(hierarchyScale),
    '--style-rule-weight': `${Math.max(1, Math.round(1 + designContrast * 2))}px`,
    '--style-media-aspect': String(mediaAspect),
    '--style-content-max': `${contentMax}px`,
    '--style-sidebar-fr': `${sidebarFr}fr`,
    '--style-main-fr': `${mainFr}fr`,
    '--style-card-min-height': `${cardMinHeight}px`,
    '--style-section-y': `${sectionY}px`,
    '--style-section-x': `${sectionX}px`,
    '--style-section-gap': `${Math.max(28, headerGap)}px`,
    '--style-card-gap': `${cardGapValue}px`,
    '--style-type-scale': String(effectiveTypeScale),
    '--style-body-tracking': `${tracking / 1000}em`,
    '--style-display-tracking': `${(tracking - 16) / 1000}em`,
    '--style-image-saturation': String(imageSatValue),
    '--style-image-contrast': String(imageContrastValue),
    '--style-image-brightness': String(imageBrightnessValue),
    '--style-image-filter': `saturate(${imageSatValue}) contrast(${imageContrastValue}) brightness(${imageBrightnessValue})`,
  }
}
