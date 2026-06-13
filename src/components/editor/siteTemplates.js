export const SITE_TEMPLATE_PROFILES = [
  {
    id: 'minimal-portfolio',
    label: '极简作品集 / Minimal Portfolio',
    description: '只保留简介、作品与联系，突出项目本身。',
    type: 'portfolio',
    preview: '/picture/template-digital-portrait.svg',
    contentPresetId: 'digital',
    stylePreset: 'minimalPortfolio',
    modules: {
      order: ['about', 'works', 'contact', 'colophon', 'cvButton'],
      nav: ['about', 'works', 'contact'],
      layouts: { about: 'compact', works: 'feature', contact: 'compact' },
    },
  },
  {
    id: 'personal-journal',
    label: '个人博客 / Personal Journal',
    description: '以经历、阅读、摄影和旅行构成持续更新的个人手记。',
    type: 'journal',
    preview: '/picture/template-organic-portrait.svg',
    contentPresetId: 'organic',
    stylePreset: 'personalJournal',
    modules: {
      order: [
        'about',
        'journey',
        'library',
        'photography',
        'travel',
        'works',
        'contact',
        'colophon',
        'nowPlaying',
        'cvButton',
      ],
      nav: ['about', 'journey', 'library', 'photography', 'travel', 'contact'],
      layouts: {
        journey: 'feature',
        library: 'feature',
        photography: 'feature',
        works: 'compact',
      },
    },
  },
  {
    id: 'gradient-studio',
    label: '渐变工作室 / Gradient Studio',
    description: '高对比色彩、实验排版与重点项目，适合数字创作。',
    type: 'studio',
    preview: '/picture/template-digital-portrait.svg',
    contentPresetId: 'digital',
    stylePreset: 'gradientStudio',
    modules: {
      order: ['works', 'about', 'photography', 'nowPlaying', 'contact', 'colophon', 'cvButton'],
      nav: ['works', 'about', 'photography', 'contact'],
      layouts: { works: 'feature', about: 'feature', photography: 'feature' },
    },
  },
]

export function resolveTemplateModules(baseModules, profile = {}) {
  const source = cloneValue(baseModules || {})
  const ordered = Array.isArray(profile.order) ? profile.order : Object.keys(source)
  const enabled = new Set(ordered)
  const nav = new Set(Array.isArray(profile.nav) ? profile.nav : ordered)
  const layouts = profile.layouts || {}
  const orderById = new Map(ordered.map((id, index) => [id, (index + 1) * 10]))

  return Object.fromEntries(
    Object.entries(source).map(([id, config]) => {
      const sourceOrder = Number(config.order)
      return [
        id,
        {
          ...config,
          enabled: enabled.has(id),
          nav: enabled.has(id) && nav.has(id),
          order: orderById.get(id) ?? (Number.isFinite(sourceOrder) ? sourceOrder : 999),
          layout: layouts[id] || config.layout || 'default',
        },
      ]
    }),
  )
}

function cloneValue(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}
