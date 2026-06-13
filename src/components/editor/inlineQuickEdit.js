const localized = (section, path, label, options = {}) => ({
  section,
  path,
  kind: 'localized',
  label,
  ...options,
})

const text = (section, path, label, options = {}) => ({
  section,
  path,
  kind: 'text',
  label,
  ...options,
})

export const INLINE_QUICK_EDIT_CONFIGS = {
  ABOUT: {
    label: { en: 'About', zh: '关于' },
    fields: [
      localized('TEXTS', ['about', 'headerTitle'], { en: 'Section title', zh: '章节标题' }),
      localized('ABOUT', ['intro'], { en: 'Introduction', zh: '简介正文' }, { multiline: true }),
      text('SITE', ['portrait'], { en: 'Portrait path', zh: '肖像路径' }, { image: true }),
    ],
  },
  JOURNEY: {
    label: { en: 'First journey frame', zh: '第一段旅程' },
    fields: [
      localized('JOURNEY', [0, 'title'], { en: 'Frame title', zh: '影格标题' }),
      localized('JOURNEY', [0, 'text'], { en: 'Frame text', zh: '影格正文' }, { multiline: true }),
      text(
        'JOURNEY',
        [0, 'image'],
        { en: 'Frame image path', zh: '影格图片路径' },
        { image: true },
      ),
    ],
  },
  WORKS: {
    label: { en: 'Featured work', zh: '首个作品' },
    fields: [
      localized('WORKS', [0, 'title'], { en: 'Project title', zh: '项目标题' }),
      localized(
        'WORKS',
        [0, 'summary'],
        { en: 'Project summary', zh: '项目简介' },
        { multiline: true },
      ),
      text(
        'WORKS',
        [0, 'coverImg'],
        { en: 'Cover image path', zh: '封面图片路径' },
        { image: true },
      ),
    ],
  },
  BOOKS: {
    label: { en: 'Featured book', zh: '首本藏书' },
    fields: [
      localized('BOOKS', [0, 'title'], { en: 'Book title', zh: '书名' }),
      localized('BOOKS', [0, 'note'], { en: 'Reading note', zh: '阅读笔记' }, { multiline: true }),
      text(
        'BOOKS',
        [0, 'coverImg'],
        { en: 'Cover image path', zh: '封面图片路径' },
        { image: true },
      ),
    ],
  },
  PHOTOS: {
    label: { en: 'Featured photograph', zh: '首张照片' },
    fields: [
      localized('PHOTOS', [0, 'caption'], { en: 'Photo caption', zh: '照片标题' }),
      text('PHOTOS', [0, 'camera'], { en: 'Camera / note', zh: '相机 / 说明' }),
      text('PHOTOS', [0, 'image'], { en: 'Photo path', zh: '照片路径' }, { image: true }),
    ],
  },
  TRAVEL: {
    label: { en: 'Featured place', zh: '首个地点' },
    fields: [
      localized('TRAVEL', [0, 'city'], { en: 'Place name', zh: '地点名称' }),
      localized('TRAVEL', [0, 'note'], { en: 'Place note', zh: '地点说明' }, { multiline: true }),
    ],
  },
  CONTACT: {
    label: { en: 'Contact', zh: '联络' },
    fields: [
      localized('TEXTS', ['contact', 'writeMeLabel'], { en: 'Call to action', zh: '行动按钮' }),
      {
        section: 'TEXTS',
        pathByLang: {
          en: ['contact', 'statementEn'],
          zh: ['contact', 'statementZh'],
        },
        kind: 'text',
        label: { en: 'Contact statement', zh: '联络说明' },
        multiline: true,
      },
    ],
  },
  COLOPHON: {
    label: { en: 'Colophon', zh: '落款' },
    fields: [
      localized(
        'TEXTS',
        ['colophon', 'signoff'],
        { en: 'Sign-off', zh: '结尾句' },
        { multiline: true },
      ),
      localized('TEXTS', ['colophon', 'fontsLine'], { en: 'Type note', zh: '字体说明' }),
    ],
  },
  NOW_PLAYING: {
    label: { en: 'Now playing', zh: '播放中' },
    fields: [
      text('NOW_PLAYING', ['spotify', 0, 'track'], { en: 'Track', zh: '曲目' }),
      text('NOW_PLAYING', ['spotify', 0, 'artist'], { en: 'Artist', zh: '艺人' }),
    ],
  },
}

export function getInlineQuickEditConfig(key) {
  return INLINE_QUICK_EDIT_CONFIGS[key] || null
}

export function resolveQuickFieldPath(field, lang) {
  return field.pathByLang?.[lang] || field.path || []
}

export function readQuickFieldValue(sectionValue, field, lang) {
  const path = resolveQuickFieldPath(field, lang)
  const value = path.reduce((current, key) => current?.[key], sectionValue)
  if (field.kind === 'localized' && value && typeof value === 'object') {
    return value[lang] || value.zh || value.en || ''
  }
  return value == null ? '' : String(value)
}

export function writeQuickFieldValue(sectionValue, field, lang, nextValue) {
  const path = resolveQuickFieldPath(field, lang)
  if (!path.length) return sectionValue

  const next =
    typeof structuredClone === 'function'
      ? structuredClone(sectionValue)
      : JSON.parse(JSON.stringify(sectionValue))
  let cursor = next

  path.slice(0, -1).forEach((key, index) => {
    if (cursor[key] == null) {
      cursor[key] = typeof path[index + 1] === 'number' ? [] : {}
    }
    cursor = cursor[key]
  })

  const leaf = path.at(-1)
  if (field.kind === 'localized') {
    const current = cursor[leaf]
    const localizedValue =
      current && typeof current === 'object' && !Array.isArray(current)
        ? { ...current }
        : { en: current || '', zh: current || '' }
    localizedValue[lang] = nextValue
    cursor[leaf] = localizedValue
  } else {
    cursor[leaf] = nextValue
  }

  return next
}
