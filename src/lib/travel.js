export const TRAVEL_THEME_IDS = [
  'botanical',
  'metropolitan',
  'garden',
  'archive',
  'neon',
  'terracotta',
  'harbor',
  'graphic',
  'craft',
  'rain',
  'chrome',
]

const CITY_THEME_MATCHERS = [
  { terms: ['hangzhou', '杭州'], theme: 'botanical' },
  { terms: ['shanghai', '上海'], theme: 'metropolitan' },
  { terms: ['suzhou', '苏州'], theme: 'garden' },
  { terms: ['beijing', '北京'], theme: 'archive' },
  { terms: ['chongqing', '重庆'], theme: 'neon' },
  { terms: ["xi'an", 'xian', '西安'], theme: 'terracotta' },
  { terms: ['hong kong', '香港'], theme: 'harbor' },
  { terms: ['tokyo', '东京'], theme: 'graphic' },
  { terms: ['kyoto', '京都'], theme: 'craft' },
  { terms: ['taipei', '台北'], theme: 'rain' },
  { terms: ['seoul', '首尔'], theme: 'chrome' },
]

function cityText(city) {
  if (typeof city === 'string') return city
  if (!city || typeof city !== 'object') return ''
  return [city.en, city.zh].filter(Boolean).join(' ')
}

export function resolveTravelTheme(point = {}) {
  if (TRAVEL_THEME_IDS.includes(point.theme)) return point.theme

  const city = cityText(point.city).toLowerCase()
  return (
    CITY_THEME_MATCHERS.find(entry => entry.terms.some(term => city.includes(term)))?.theme ||
    (point.kind === 'home' ? 'botanical' : 'graphic')
  )
}
