import { CONTENT_PRESETS, STARTER_TEMPLATE } from './contentPresets.js'
import { resolveTemplateModules, SITE_TEMPLATE_PROFILES } from './siteTemplates.js'

export const GOAL_PRESETS = [
  {
    id: 'blank',
    label: '空白起点 / Blank',
    description: '清除示例身份，保留完整模块骨架和待替换占位符。',
    preview: '',
    contentPresetId: '',
    stylePreset: 'editorial',
  },
  ...SITE_TEMPLATE_PROFILES,
]

export function resolveGoalSelection(goalId) {
  const goal = GOAL_PRESETS.find(item => item.id === goalId)
  if (!goal) throw new Error(`Unknown goal: ${goalId}`)

  if (!goal.contentPresetId) {
    return {
      goal,
      content: cloneValue(STARTER_TEMPLATE),
      stylePreset: goal.stylePreset,
    }
  }

  const preset = CONTENT_PRESETS.find(item => item.id === goal.contentPresetId)
  if (!preset) {
    throw new Error(`Missing content preset for goal ${goal.id}: ${goal.contentPresetId}`)
  }

  const content = cloneValue(preset.data)
  content.MODULES = resolveTemplateModules(content.MODULES, goal.modules)

  return {
    goal,
    content,
    stylePreset: goal.stylePreset || preset.stylePreset,
  }
}

function cloneValue(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}
