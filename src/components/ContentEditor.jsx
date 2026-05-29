import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../lang'
import { useData } from '../data-context'
import { pick } from '../data'
import { resizeImage, fileToDataUrl, dataUrlSizeKB } from '../utils'

// ════════════════════════════════════════════════════════════════════
// SCHEMAS — describe each section's editable structure
// type: 'str' | 'num' | 'text' | 'bi' | 'bi-text' | 'str-arr' | 'obj-arr' | 'obj' | 'raw'
// ════════════════════════════════════════════════════════════════════

const journeyItem = [
  { key: 'id',      type: 'num',        label: 'ID' },
  { key: 'year',    type: 'str',        label: '年份 Year' },
  { key: 'label',   type: 'bi',         label: '标签 Label' },
  { key: 'place',   type: 'bi',         label: '地点 Place' },
  { key: 'title',   type: 'bi',         label: '标题 Title（可用 *星号* 强调）' },
  { key: 'text',    type: 'bi-text',    label: '正文 Text' },
  { key: 'tags',    type: 'str-arr',    label: '标签 Tags' },
  { key: 'chapter', type: 'str',        label: '章节 Chapter (I/II/III/IV)' },
  { key: 'image',   type: 'file-image', subfolder: 'journey', label: '帧背景图（可选 · 影格按钮显示为图片背景）' },
]

const workItem = [
  { key: 'id',       type: 'str',     label: 'ID' },
  { key: 'title',    type: 'bi',      label: '标题 Title' },
  { key: 'subtitle', type: 'bi',      label: '副标题 Subtitle' },
  { key: 'medium',   type: 'str',     label: '媒介 Medium（要跟 Works.jsx 的 WORK_MEDIA 对得上）' },
  { key: 'role',     type: 'bi',      label: '角色 Role' },
  { key: 'year',     type: 'str',     label: '年份 Year' },
  { key: 'cover',    type: 'str',     label: 'CSS 封面 class（cover-1..4，作为图片缺失时的兜底）' },
  { key: 'coverImg', type: 'file-image', subfolder: 'works', label: '封面图片（点 📁 选本地图 → 一键写入 public/works/）' },
  { key: 'summary',  type: 'bi-text', label: '简介 Summary' },
  { key: 'tags',     type: 'str-arr', label: '标签 Tags' },
  { key: 'field',    type: 'obj',     label: '元信息 Field',
    fields: [
      { key: 'year',      type: 'str', label: '年' },
      { key: 'format',    type: 'bi',  label: '格式' },
      { key: 'role',      type: 'bi',  label: '角色' },
      { key: 'crew',      type: 'bi',  label: '团队' },
      { key: 'festivals', type: 'bi',  label: '展映' },
      { key: 'status',    type: 'bi',  label: '状态' },
    ]
  },
  { key: 'body', type: 'obj-arr', label: '正文段落 Body',
    titleFor: (b, i) => `段落 ${i + 1}`,
    itemSchema: { type: 'bi-text-bare' }  // each item is itself a bilingual string
  },
]

const bookItem = [
  { key: 'title',    type: 'bi',         label: '书名 Title' },
  { key: 'author',   type: 'str',        label: '作者 Author' },
  { key: 'year',     type: 'str',        label: '年份 Year' },
  { key: 'stars',    type: 'num',        label: '星级 Stars (1-5)' },
  { key: 'color',    type: 'str',        label: '封面背景色 #hex（图片缺失时显示）' },
  { key: 'text',     type: 'str',        label: '封面文字色 #hex' },
  { key: 'coverImg', type: 'file-image', subfolder: 'books', label: '封面图（可选 · 优先于色块）' },
  { key: 'note',     type: 'bi-text',    label: '书评 Note' },
]

const filmItem = [
  { key: 'title',    type: 'str',        label: '片名 Title' },
  { key: 'subtitle', type: 'str',        label: '原名 / 中文名' },
  { key: 'year',     type: 'str',        label: '年份 Year' },
  { key: 'director', type: 'str',        label: '导演 Director' },
  { key: 'coverImg', type: 'file-image', subfolder: 'films', label: '海报（可选）' },
  { key: 'note',     type: 'bi-text',    label: '影评 Note' },
]

const musicItem = [
  { key: 'track',     type: 'str',        label: '曲目 Track' },
  { key: 'artist',    type: 'str',        label: '艺人 Artist' },
  { key: 'album',     type: 'str',        label: '专辑 Album' },
  { key: 'duration',  type: 'str',        label: '时长 Duration' },
  { key: 'mood',      type: 'bi',         label: '心境 Mood' },
  { key: 'note',      type: 'bi-text',    label: '感受 Note' },
  { key: 'spotifyId', type: 'str',        label: 'Spotify ID（可选，填了能点击播放）' },
  { key: 'neteaseId', type: 'str',        label: '网易云 ID（可选）' },
  { key: 'audio',     type: 'file-audio', subfolder: 'audio', label: '本地音频（可选 · 选文件一键写入 public/audio/）' },
]

const readingLogUserItem = [
  { key: 'id',      type: 'str',        label: 'ID（自动生成；可不改）' },
  { key: 'date',    type: 'str',        label: '日期 Date（如 2026.05）' },
  { key: 'title',   type: 'bi',         label: '书名 Title' },
  { key: 'author',  type: 'str',        label: '作者 Author' },
  { key: 'stars',   type: 'num',        label: '星级 Stars (1-5)' },
  { key: 'status',  type: 'str',        label: '状态 Status (finished/reread/skimmed/abandoned)' },
  { key: 'cover',   type: 'file-image', subfolder: 'books', label: '封面图（可选）' },
  { key: 'excerpt', type: 'bi-text',    label: '笔记 / 感想' },
]

const photoItem = [
  { key: 'id',      type: 'str',        label: 'ID（短标识，如 h1, s2）' },
  { key: 'series',  type: 'str',        label: '系列 Series（要跟 PHOTO_SERIES 的 id 对得上）' },
  { key: 'caption', type: 'bi',         label: '说明 Caption' },
  { key: 'date',    type: 'str',        label: '日期 Date' },
  { key: 'camera',  type: 'str',        label: '相机/镜头' },
  { key: 'color',   type: 'str',        label: '占位色 #hex（图片缺失时显示）' },
  { key: 'image',   type: 'file-image', subfolder: 'photos', label: '照片本体（可选）' },
]

const travelItem = [
  { key: 'city',    type: 'bi',  label: '城市 City' },
  { key: 'country', type: 'bi',  label: '国家 Country' },
  { key: 'year',    type: 'str', label: '年份 Year（数字或字符串都行）' },
  { key: 'kind',    type: 'str', label: '类型 Kind (home/frequent/festival/trip)' },
  { key: 'lat',     type: 'num', label: '纬度 Lat（0=不在地图上显示）' },
  { key: 'lon',     type: 'num', label: '经度 Lon' },
  { key: 'note',    type: 'bi',  label: '备注 Note' },
]

const navItem = [
  { key: 'num',   type: 'str', label: '编号' },
  { key: 'id',    type: 'str', label: 'ID (锚点)' },
  { key: 'label', type: 'bi',  label: '主标签' },
  { key: 'en',    type: 'bi',  label: '副标签' },
]

const nowPlayingTrack = [
  { key: 'track',     type: 'bi',  label: '曲目（可双语）' },
  { key: 'artist',    type: 'bi',  label: '艺人（可双语）' },
  { key: 'spotifyId', type: 'str', label: 'Spotify ID' },
  { key: 'neteaseId', type: 'str', label: '网易云 ID' },
  { key: 'audio',     type: 'str', label: '本地音频路径' },
]

const moduleConfigFields = [
  { key: 'enabled', type: 'bool', label: 'enabled · 是否显示' },
  { key: 'nav',     type: 'bool', label: 'nav · 是否进入导航' },
  { key: 'order',   type: 'num',  label: 'order · 页面排序' },
  { key: 'label',   type: 'bi',   label: 'label · 导航名称' },
  { key: 'layout',  type: 'str',  label: 'layout · 布局类型（当前稳定值：default）' },
]

const moduleField = (key, label) => ({
  key,
  type: 'obj',
  label,
  fields: moduleConfigFields,
})

const MODULES_SCHEMA = [
  moduleField('about', 'About · 个人简介 + CV 入口'),
  moduleField('journey', 'Journey · 时间线 / 自传影格'),
  moduleField('works', 'Works · 作品集'),
  moduleField('library', 'Library · 书 / 影 / 音 / Reading Log'),
  moduleField('photography', 'Photography · 接触印相 + 灯箱'),
  moduleField('travel', 'Travel · 地图 + 城市列表'),
  moduleField('contact', 'Contact · 状态板 + 邮箱'),
  moduleField('colophon', 'Colophon · 落款 / 字体说明'),
  moduleField('cvButton', 'About sidebar · Full CV 按钮'),
  moduleField('nowPlaying', 'NowPlaying · 右下角播放器'),
]

const SECTIONS = [
  // ─── 顶部：自动填充入口 + 模块开关 ───
  { key: '_IMPORT',     label: '🪄 自动填充 · Auto-fill', type: 'import',  group: '' },
  { key: 'MODULES',     label: '🎛 MODULES · 模块开关', type: 'object', schema: 'modules', group: '' },

  // ─── 基础设置（不属于某个章节）───
  { key: 'SITE',        label: 'SITE · 站点身份',     type: 'object', schema: 'site', group: '基础设置' },
  { key: 'TEXTS',       label: 'TEXTS · UI 文字',     type: 'raw', group: '基础设置',
    hint: '硬编码 UI 文字（章节标题、印章字、Contact 段落等）。结构较深，用 JSON 编辑。' },
  { key: 'NAV',         label: 'NAV · 章节导航',      type: 'array',   itemSchema: navItem,
    titleFor: (e, _, lang) => `${e.num} ${pick(e.label, lang)}`, group: '基础设置' },
  { key: 'NOW_PLAYING', label: 'NOW_PLAYING · 播放器歌单', type: 'now-playing', itemSchema: nowPlayingTrack, group: '基础设置' },

  // ─── 章节内容（按网页 01-06 顺序）───
  { key: 'ABOUT',       label: '01 关于 · About',     type: 'object',  schema: 'about', group: '章节内容' },
  { key: 'JOURNEY',     label: '02 时间线 · Journey', type: 'array',   itemSchema: journeyItem,
    titleFor: (e, _, lang) => `${e.year ?? '?'} · ${pick(e.label, lang)}`, group: '章节内容' },
  { key: 'WORKS',       label: '03 作品集 · Works',   type: 'array',   itemSchema: workItem,
    titleFor: (e, _, lang) => `${pick(e.title, lang) || '(无标题)'} (${e.year ?? '?'})`, group: '章节内容' },
  { key: 'BOOKS',       label: '04 私藏 · 书 Books',  type: 'array',   itemSchema: bookItem,
    titleFor: (e, _, lang) => `${pick(e.title, lang)} — ${e.author}`, group: '章节内容' },
  { key: 'USER_READING_LOG', label: '04 私藏 · 个人读书日志', type: 'array', itemSchema: readingLogUserItem,
    titleFor: (e, _, lang) => `${e.date || 'date'} · ${pick(e.title, lang) || '(无标题)'}`, group: '章节内容' },
  { key: 'FILMS',       label: '04 私藏 · 影 Films',  type: 'array',   itemSchema: filmItem,
    titleFor: (e) => `${e.title} (${e.year})`, group: '章节内容' },
  { key: 'MUSIC',       label: '04 私藏 · 音 Music',  type: 'array',   itemSchema: musicItem,
    titleFor: (e) => `${e.track} — ${e.artist}`, group: '章节内容' },
  { key: 'PHOTOS',      label: '05 摄影 · Photos',    type: 'photos',  itemSchema: photoItem,
    titleFor: (e, _, lang) => `${e.id} · ${pick(e.caption, lang)}`, group: '章节内容' },
  { key: 'TRAVEL',      label: '06 足迹 · Travel',    type: 'array',   itemSchema: travelItem,
    titleFor: (e, _, lang) => `${pick(e.city, lang)} (${e.year})`, group: '章节内容' },
]

const EXPORTABLE_SECTIONS = SECTIONS.filter(s => !s.key.startsWith('_'))

const SITE_SCHEMA = [
  { key: 'name',         type: 'bi',      label: '简称 Name（Frame 00 左侧大字 / 顶栏 / Colophon / CV）' },
  { key: 'nameRight',    type: 'bi',      label: '名字花押 Name (right)（Frame 00 右侧斜体红色那个字母 / 字）' },
  { key: 'nameFull',     type: 'bi',      label: '全名 Full name（用于 CV 标题）' },
  { key: 'glyph',        type: 'str',     label: '首字符 Glyph（暂未使用）' },
  { key: 'portrait',     type: 'file-image', subfolder: 'picture', label: '头像 Portrait（选本地图 → 写入 public/picture/）' },
  { key: 'cvPdf',        type: 'file-pdf',   subfolder: 'docs',    label: 'CV PDF（可选 · 填了 modal 里的"打印"按钮变成 PDF 下载链接）' },
  { key: 'tagline',      type: 'bi-text', label: '标语 Tagline' },
  { key: 'role',         type: 'bi',      label: '身份 Role（CV 子标题）' },
  { key: 'status',       type: 'bi',      label: '状态标签 Status' },
  { key: 'statusObject', type: 'bi',      label: '当前在做 Status object（Contact 状态栏）' },
  { key: 'location',     type: 'bi',      label: '位置 Location（Frame 00 城市 + 顶栏 + Contact）' },
  { key: 'timezone',     type: 'str',     label: '时区显示文本（如 UTC+8 · 仅 Contact 状态栏显示）' },
  { key: 'tzName',       type: 'str',     label: '时区 IANA 名（如 Asia/Shanghai / America/New_York · Frame 00 时钟用）' },
  { key: 'email',        type: 'str',     label: '邮箱 Email（Frame 00 + Contact + CV）' },
  { key: 'now',          type: 'bi-text', label: '正在做什么 Now（长段）' },
  { key: 'nowDate',      type: 'bi',      label: '更新时间标签 Now date' },
  { key: 'social',       type: 'obj-arr', label: '社交账号 Social',
    titleFor: (s) => (typeof s.label === 'object' ? s.label?.en : s.label) + ' · ' + s.handle,
    itemSchema: [
      { key: 'label',  type: 'bi',  label: '名称' },
      { key: 'handle', type: 'str', label: '账号' },
      { key: 'url',    type: 'str', label: '链接 URL' },
    ],
  },
]

const ABOUT_SCHEMA = [
  { key: 'intro',      type: 'bi-text', label: '首段（首字下沉）Intro' },
  { key: 'paragraphs', type: 'obj-arr', label: '后续段落 Paragraphs',
    titleFor: (_, i) => `段落 ${i + 1}`, itemSchema: { type: 'bi-text-bare' } },
  { key: 'stats',      type: 'obj-arr', label: '统计格 Stats',
    titleFor: (s) => (typeof s.label === 'object' ? s.label?.en : s.label),
    itemSchema: [
      { key: 'label', type: 'bi', label: '名称' },
      { key: 'value', type: 'bi', label: '值（可用 *星号* 高亮）' },
    ],
  },
  { key: 'cv', type: 'obj', label: '简历 CV',
    fields: [
      { key: 'edu',    type: 'obj-arr', label: '学历 Education', titleFor: (e) => e.year, itemSchema: cvSubItem() },
      { key: 'work',   type: 'obj-arr', label: '工作 Practice', titleFor: (e) => e.year, itemSchema: cvSubItem() },
      { key: 'awards', type: 'obj-arr', label: '奖项 Awards',   titleFor: (e) => e.year, itemSchema: cvSubItem() },
      { key: 'skills', type: 'obj-arr', label: '技能 Skills',   titleFor: (e) => e.year, itemSchema: cvSubItem() },
    ],
  },
]

function cvSubItem() {
  return [
    { key: 'year',  type: 'str', label: '年/分类' },
    { key: 'title', type: 'bi',  label: '标题' },
    { key: 'role',  type: 'bi',  label: '描述' },
    { key: 'place', type: 'bi',  label: '地点' },
  ]
}

// ════════════════════════════════════════════════════════════════════
// JS LITERAL FORMATTER — produces code that can be pasted into data.js
// ════════════════════════════════════════════════════════════════════
function jsLiteral(value, indent = '') {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return strLit(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((v) => indent + '  ' + jsLiteral(v, indent + '  '))
    return '[\n' + items.join(',\n') + '\n' + indent + ']'
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 2 && 'en' in value && 'zh' in value) {
      return `L(${strLit(value.en)}, ${strLit(value.zh)})`
    }
    if (keys.length === 0) return '{}'
    const items = keys.map((k) => indent + '  ' + safeKey(k) + ': ' + jsLiteral(value[k], indent + '  '))
    return '{\n' + items.join(',\n') + '\n' + indent + '}'
  }
  return String(value)
}

function strLit(s) {
  const v = s ?? ''
  // Single-quoted string with proper escapes
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'"
}

function safeKey(k) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : strLit(k)
}

function exportLine(name, value) {
  return `export const ${name} = ${jsLiteral(value)}`
}

function collectDataUrls(value, path = 'data') {
  const found = []
  const walk = (v, p) => {
    if (typeof v === 'string') {
      if (v.startsWith('data:')) found.push({ path: p, kb: dataUrlSizeKB(v) })
      return
    }
    if (Array.isArray(v)) {
      v.forEach((item, index) => walk(item, `${p}[${index}]`))
      return
    }
    if (v && typeof v === 'object') {
      Object.entries(v).forEach(([key, item]) => walk(item, `${p}.${key}`))
    }
  }
  walk(value, path)
  return found
}

function exportWarning(sectionKey, value) {
  const section = EXPORTABLE_SECTIONS.find((s) => s.key === sectionKey)
  const validation = section ? validateSectionValue(section, value) : ''
  if (validation) return `Warning: ${validation}`
  const dataUrls = collectDataUrls(value, sectionKey)
  if (!dataUrls.length) return ''
  const total = dataUrls.reduce((sum, item) => sum + item.kb, 0)
  return `Warning: export contains ${dataUrls.length} embedded data URL(s), about ${total}KB. Prefer public file paths for long-term publishing.`
}

function validateSiteData(data) {
  const errors = []
  if (!data?.SITE?.name) errors.push('Missing SITE.name')
  if (!data?.MODULES || typeof data.MODULES !== 'object') errors.push('MODULES should be an object')
  if (!Array.isArray(data?.NAV)) errors.push('NAV should be an array')
  for (const section of EXPORTABLE_SECTIONS) {
    const err = validateSectionValue(section, data?.[section.key])
    if (err) errors.push(err)
  }
  return errors
}

function exportAllWarning(data) {
  const validation = validateSiteData(data)
  if (validation.length) return `Warning: ${validation[0]}`
  const warnings = EXPORTABLE_SECTIONS
    .map((section) => exportWarning(section.key, data[section.key]))
    .filter(Boolean)
  return warnings[0] || ''
}

// ════════════════════════════════════════════════════════════════════
// FIELD COMPONENTS
// ════════════════════════════════════════════════════════════════════

function StringField({ value, onChange, placeholder, multiline }) {
  if (multiline) {
    return <textarea
      className="ce-input ce-textarea"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
    />
  }
  return <input
    className="ce-input"
    type="text"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
  />
}

function NumberField({ value, onChange, placeholder }) {
  return <input
    className="ce-input"
    type="number"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    placeholder={placeholder}
  />
}

function BoolField({ value, onChange }) {
  const { lang } = useLang()
  const on = value !== false
  return (
    <label className="ce-bool">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className={`ce-bool-switch ${on ? 'on' : 'off'}`}>
        <span className="ce-bool-thumb"></span>
      </span>
      <span className="ce-bool-label">{on ? (lang === 'zh' ? '显示' : 'Visible') : (lang === 'zh' ? '隐藏' : 'Hidden')}</span>
    </label>
  )
}

function BilingualField({ value, onChange, multiline }) {
  const v = value && typeof value === 'object' ? value : { en: typeof value === 'string' ? value : '', zh: '' }
  const setEn = (en) => onChange({ ...v, en })
  const setZh = (zh) => onChange({ ...v, zh })
  return (
    <div className="ce-bi">
      <div>
        <span className="ce-bi-lbl">EN</span>
        <StringField value={v.en} onChange={setEn} multiline={multiline} placeholder="English..." />
      </div>
      <div>
        <span className="ce-bi-lbl">中文</span>
        <StringField value={v.zh} onChange={setZh} multiline={multiline} placeholder="中文..." />
      </div>
    </div>
  )
}

function StringArrayField({ value, onChange }) {
  const arr = Array.isArray(value) ? value : []
  const update = (i, v) => onChange(arr.map((x, k) => (k === i ? v : x)))
  const remove = (i) => onChange(arr.filter((_, k) => k !== i))
  const add = () => onChange([...arr, ''])
  return (
    <div className="ce-str-arr">
      {arr.map((s, i) => (
        <div key={i} className="ce-str-arr-row">
          <input className="ce-input" type="text" value={s} onChange={(e) => update(i, e.target.value)} />
          <button type="button" className="ce-icon-btn" onClick={() => remove(i)} aria-label="remove">×</button>
        </div>
      ))}
      <button type="button" className="ce-add-btn" onClick={add}>+ 添加</button>
    </div>
  )
}

function ObjectField({ value, onChange, fields }) {
  const v = value && typeof value === 'object' ? value : {}
  const setKey = (k, kv) => onChange({ ...v, [k]: kv })
  return (
    <div className="ce-obj">
      {fields.map((f) => (
        <FieldRow key={f.key} field={f} value={v[f.key]} onChange={(kv) => setKey(f.key, kv)} />
      ))}
    </div>
  )
}

// ─── FileField: pick → preview → write to project's public/{subfolder}/ ───
// In production this endpoint doesn't exist — users edit content during local dev only.
function FileField({ value, onChange, subfolder = 'picture', accept = 'image/*', isAudio = false }) {
  const [picking, setPicking] = useState(false)
  const [filename, setFilename] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')   // '' | 'ok' | 'missing' | 'error'
  const [statusMsg, setStatusMsg] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const fileRef = useRef(null)

  // Verify whether the current path actually points to an existing file in public/
  const checkPath = async (p) => {
    if (!p) { setStatus(''); setStatusMsg(''); return }
    try {
      const r = await fetch(p, { method: 'HEAD' })
      if (r.ok) { setStatus('ok'); setStatusMsg('文件存在') }
      else { setStatus('missing'); setStatusMsg(`未找到（${r.status}）`) }
    } catch {
      setStatus('missing'); setStatusMsg('未找到')
    }
  }

  // When path text changes, debounce-check existence
  useEffect(() => {
    const id = setTimeout(() => checkPath(value), 250)
    return () => clearTimeout(id)
  }, [value])

  const onPick = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setPendingFile(f)
    setFilename(sanitizeFilename(f.name))
    setFileSize(f.size)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f))
    } else {
      setPreviewUrl('')
    }
  }

  const saveToPublic = async () => {
    if (!pendingFile || !filename) return
    setBusy(true)
    const isImage = pendingFile.type.startsWith('image/')
    setStatusMsg(isImage ? '压缩 + 上传中...' : '上传中...')
    try {
      // Auto-resize images (long edge 1800px, JPEG 0.85). Audio/PDF go through as-is.
      const dataUrl = isImage
        ? await resizeImage(pendingFile, 1800, 0.85)
        : await fileToDataUrl(pendingFile)
      // Force .jpg extension on resized JPEGs to match what canvas produced.
      let finalFilename = filename
      if (isImage && dataUrl.startsWith('data:image/jpeg') && !/\.(jpe?g)$/i.test(filename)) {
        finalFilename = filename.replace(/\.[^.]+$/, '') + '.jpg'
      }
      const r = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subfolder, filename: finalFilename, dataUrl }),
      })
      const json = await r.json()
      if (!r.ok || !json.ok) {
        setStatus('error')
        setStatusMsg(`上传失败：${json.error || r.statusText}`)
        setBusy(false)
        return
      }
      onChange(json.path)
      setStatus('ok')
      setStatusMsg(`✓ 已保存到 public${json.path}（${(json.size / 1024).toFixed(1)} KB）`)
      // Clear staged file
      setPendingFile(null)
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl('') }
      setFilename('')
      setFileSize(0)
    } catch (e) {
      setStatus('error')
      setStatusMsg(`错误：${e.message}（确认 dev server 正在运行；生产构建里此功能无效）`)
    }
    setBusy(false)
  }

  return (
    <div className="ce-file">
      <div className="ce-file-row">
        <input
          className="ce-input"
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`/${subfolder}/example.${isAudio ? 'mp3' : 'jpg'}`}
        />
        <button type="button" className="ce-icon-btn" onClick={() => fileRef.current?.click()} title="选择文件">📁</button>
        <input ref={fileRef} type="file" accept={accept} onChange={onPick} style={{ display: 'none' }} />
      </div>
      {status && (
        <div className={`ce-file-status ce-file-status-${status}`}>
          {status === 'ok' ? '✓' : status === 'missing' ? '⚠' : '✗'} {statusMsg}
        </div>
      )}
      {pendingFile && (
        <div className="ce-file-stage">
          <div className="ce-file-stage-info">
            <strong>{pendingFile.name}</strong> · {(fileSize / 1024).toFixed(1)} KB
            <span className="ce-file-target">→ public/{subfolder}/<input
              type="text"
              className="ce-input ce-file-name-input"
              value={filename}
              onChange={(e) => setFilename(sanitizeFilename(e.target.value))}
            /></span>
          </div>
          {previewUrl && !isAudio && (
            <img className="ce-file-preview" src={previewUrl} alt="" />
          )}
          <div className="ce-file-stage-actions">
            <button type="button" className="ce-btn ce-btn-ghost" onClick={() => {
              if (previewUrl) URL.revokeObjectURL(previewUrl)
              setPendingFile(null); setPreviewUrl(''); setFilename(''); setFileSize(0)
            }}>取消</button>
            <button type="button" className="ce-btn" onClick={saveToPublic} disabled={busy || !filename}>
              {busy ? '保存中...' : `💾 写入 public/${subfolder}/`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function sanitizeFilename(name) {
  // Replace non-ASCII and unsafe chars with -, collapse multiple, strip leading/trailing -
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'file'
}

// fileToDataUrl, resizeImage imported from ../utils

function ObjectArrayField({ value, onChange, itemSchema, titleFor, groupBy, groupLabels }) {
  const { lang } = useLang()
  const arr = Array.isArray(value) ? value : []
  const [expanded, setExpanded] = useState({})

  const update = (i, v) => onChange(arr.map((x, k) => (k === i ? v : x)))
  const remove = (i) => {
    if (!window.confirm('删除这一项？')) return
    onChange(arr.filter((_, k) => k !== i))
    setExpanded((e) => { const n = { ...e }; delete n[i]; return n })
  }
  const add = (presetGroup) => {
    const empty = createEmpty(itemSchema)
    if (groupBy && presetGroup !== undefined) empty[groupBy] = presetGroup
    onChange([...arr, empty])
    setExpanded((e) => ({ ...e, [arr.length]: true }))
  }
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    const next = arr.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  // Render a single card (extracted so it works for both flat and grouped layouts).
  const renderCard = (item, i) => {
    const title = titleFor ? titleFor(item, i, lang) : `Item ${i + 1}`
    const isOpen = expanded[i]
    return (
      <div key={i} className={`ce-arr-card ${isOpen ? 'open' : ''}`}>
        <div className="ce-arr-card-head">
          <button type="button" className="ce-arr-card-toggle" onClick={() => setExpanded((e) => ({ ...e, [i]: !e[i] }))}>
            <span className="ce-arr-card-chevron">{isOpen ? '▼' : '▶'}</span>
            <span className="ce-arr-card-title">{title || '(empty)'}</span>
          </button>
          <div className="ce-arr-card-actions">
            {!groupBy && (
              <>
                <button type="button" className="ce-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} title="上移">↑</button>
                <button type="button" className="ce-icon-btn" onClick={() => move(i, +1)} disabled={i === arr.length - 1} title="下移">↓</button>
              </>
            )}
            <button type="button" className="ce-icon-btn ce-danger" onClick={() => remove(i)} title="删除">×</button>
          </div>
        </div>
        {isOpen && (
          <div className="ce-arr-card-body">
            {Array.isArray(itemSchema)
              ? itemSchema.map((f) => (
                  <FieldRow key={f.key} field={f} value={item?.[f.key]}
                    onChange={(kv) => update(i, { ...item, [f.key]: kv })} />
                ))
              : (
                <SingleItemEditor schema={itemSchema} value={item} onChange={(v) => update(i, v)} />
              )}
          </div>
        )}
      </div>
    )
  }

  // ── Grouped layout (e.g. PHOTOS by series) ──
  if (groupBy) {
    const groups = {}
    const orderedKeys = []
    arr.forEach((item, idx) => {
      const k = item?.[groupBy] ?? '(未分类)'
      if (!groups[k]) { groups[k] = []; orderedKeys.push(k) }
      groups[k].push({ item, idx })
    })
    // Also include groupLabels keys that have no items (so user can see empty groups)
    if (groupLabels) {
      Object.keys(groupLabels).forEach(k => { if (!groups[k]) { groups[k] = []; orderedKeys.push(k) } })
    }
    return (
      <div className="ce-arr ce-arr-grouped">
        {orderedKeys.map(gk => (
          <div key={gk} className="ce-arr-group">
            <div className="ce-arr-group-head">
              <span className="ce-arr-group-name">{groupLabels?.[gk] || gk}</span>
              <span className="ce-arr-group-count">{groups[gk].length} 项</span>
              <button type="button" className="ce-add-btn ce-add-inline" onClick={() => add(gk)}>+ 新增到此组</button>
            </div>
            {groups[gk].length === 0 && (
              <div className="ce-arr-group-empty">空。点上方按钮新增一项。</div>
            )}
            {groups[gk].map(({ item, idx }) => renderCard(item, idx))}
          </div>
        ))}
      </div>
    )
  }

  // ── Flat layout (default) ──
  return (
    <div className="ce-arr">
      {arr.map((item, i) => renderCard(item, i))}
      <button type="button" className="ce-add-btn ce-add-arr" onClick={() => add()}>+ 新增一项</button>
    </div>
  )
}

function SingleItemEditor({ schema, value, onChange }) {
  const fakeField = { ...schema, key: '_', label: '' }
  return <FieldRow field={fakeField} value={value} onChange={onChange} hideLabel />
}

// Generic field row — picks the right input component for the field type.
// IMPORTANT: don't wrap the switch in an inline component like `<Body />` —
// that creates a new component identity every render and unmounts inputs,
// which makes any focused input lose focus after every keystroke. Use a
// plain function call instead so React just sees JSX, not a new component.
function FieldRow({ field, value, onChange, hideLabel }) {
  let body
  switch (field.type) {
    case 'str':         body = <StringField value={value} onChange={onChange} placeholder={field.placeholder} />; break
    case 'text':        body = <StringField value={value} onChange={onChange} multiline placeholder={field.placeholder} />; break
    case 'num':         body = <NumberField value={value} onChange={onChange} placeholder={field.placeholder} />; break
    case 'bi':          body = <BilingualField value={value} onChange={onChange} />; break
    case 'bi-text':
    case 'bi-text-bare':body = <BilingualField value={value} onChange={onChange} multiline />; break
    case 'str-arr':     body = <StringArrayField value={value} onChange={onChange} />; break
    case 'obj':         body = <ObjectField value={value} onChange={onChange} fields={field.fields} />; break
    case 'obj-arr':     body = <ObjectArrayField value={value} onChange={onChange} itemSchema={field.itemSchema} titleFor={field.titleFor} />; break
    case 'file-image':  body = <FileField value={value} onChange={onChange} subfolder={field.subfolder || 'picture'} accept="image/*" />; break
    case 'file-audio':  body = <FileField value={value} onChange={onChange} subfolder={field.subfolder || 'audio'} accept="audio/*" isAudio />; break
    case 'file-pdf':    body = <FileField value={value} onChange={onChange} subfolder={field.subfolder || 'docs'} accept="application/pdf" isAudio />; break
    case 'bool':        body = <BoolField value={value} onChange={onChange} />; break
    default:            body = <code className="ce-unsupported">未支持的字段类型: {field.type}</code>
  }
  return (
    <div className={`ce-field ce-field-${field.type}`}>
      {!hideLabel && <label className="ce-field-label">{field.label || field.key}</label>}
      <div className="ce-field-input">{body}</div>
    </div>
  )
}

// Create an empty value matching a schema (for "+ add new")
function createEmpty(schema) {
  if (!Array.isArray(schema)) {
    // Single-field item — return empty value for that type
    if (schema?.type === 'bi' || schema?.type === 'bi-text' || schema?.type === 'bi-text-bare') return { en: '', zh: '' }
    if (schema?.type === 'num') return 0
    if (schema?.type === 'bool') return true
    return ''
  }
  const obj = {}
  for (const f of schema) {
    if (f.type === 'bi' || f.type === 'bi-text') obj[f.key] = { en: '', zh: '' }
    else if (f.type === 'num') obj[f.key] = 0
    else if (f.type === 'bool') obj[f.key] = true
    else if (f.type === 'str-arr') obj[f.key] = []
    else if (f.type === 'obj-arr') obj[f.key] = []
    else if (f.type === 'obj') obj[f.key] = createEmpty(f.fields)
    else obj[f.key] = ''
  }
  return obj
}

// ════════════════════════════════════════════════════════════════════
// JSON RAW EDITOR — for sections too complex for schema (TEXTS)
// ════════════════════════════════════════════════════════════════════
function JsonEditor({ value, onChange }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [err, setErr] = useState('')

  useEffect(() => {
    setText(JSON.stringify(value, null, 2))
  }, [value])

  const tryParse = (s) => {
    try {
      const parsed = JSON.parse(s)
      setErr('')
      onChange(parsed)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="ce-json">
      <textarea
        className="ce-input ce-json-textarea"
        value={text}
        onChange={(e) => { setText(e.target.value); tryParse(e.target.value) }}
        spellCheck={false}
      />
      {err && <div className="ce-json-err">JSON 错误：{err}</div>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// SECTION EDITORS
// ════════════════════════════════════════════════════════════════════

function isRecord(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

function validateImportData(parsed) {
  const known = new Set(EXPORTABLE_SECTIONS.map(s => s.key))
  const topKeys = Object.keys(parsed)
  const unknown = topKeys.filter(k => /^[A-Z][A-Z_]*$/.test(k) && !known.has(k))
  if (unknown.length) {
    return { valid: false, error: `未知章节: ${unknown.join(', ')}` }
  }

  const sections = topKeys.filter(k => known.has(k))
  if (sections.length === 0) {
    return { valid: false, error: '没有找到可识别的顶层章节键(应该是 SITE / ABOUT 等大写名)' }
  }

  for (const key of sections) {
    const section = EXPORTABLE_SECTIONS.find(s => s.key === key)
    const err = validateSectionValue(section, parsed[key])
    if (err) return { valid: false, error: err }
  }

  return { valid: true, data: parsed, sections }
}

function validateSectionValue(section, value) {
  if (!section) return '未知章节'
  if (section.type === 'raw') {
    return isRecord(value) ? '' : `${section.key} 必须是对象`
  }
  if (section.key === 'SITE') return validateFields(SITE_SCHEMA, value, 'SITE')
  if (section.key === 'MODULES') return validateModulesValue(value)
  if (section.key === 'ABOUT') return validateFields(ABOUT_SCHEMA, value, 'ABOUT')
  if (section.type === 'now-playing') {
    if (!isRecord(value)) return 'NOW_PLAYING 必须是对象'
    for (const src of ['spotify', 'netease', 'html5']) {
      if (value[src] !== undefined && !Array.isArray(value[src])) {
        return `NOW_PLAYING.${src} 必须是数组`
      }
    }
    return ''
  }
  if (section.type === 'array' || section.type === 'photos') {
    if (!Array.isArray(value)) return `${section.key} 必须是数组`
    for (let i = 0; i < value.length; i += 1) {
      const err = validateArrayItem(section.itemSchema, value[i], `${section.key}[${i}]`)
      if (err) return err
    }
  }
  return ''
}

function validateArrayItem(schema, value, path) {
  if (Array.isArray(schema)) return validateFields(schema, value, path)
  return validateFieldValue(schema, value, path)
}

function validateModulesValue(value) {
  if (!isRecord(value)) return 'MODULES 必须是对象'
  for (const [key, moduleValue] of Object.entries(value)) {
    if (typeof moduleValue === 'boolean') continue
    if (!isRecord(moduleValue)) return `MODULES.${key} 必须是 true/false 或模块配置对象`
    const err = validateFields(moduleConfigFields, moduleValue, `MODULES.${key}`)
    if (err) return err
  }
  return ''
}

function validateFields(fields, value, path) {
  if (!isRecord(value)) return `${path} 必须是对象`
  for (const field of fields) {
    if (!(field.key in value)) continue
    const err = validateFieldValue(field, value[field.key], `${path}.${field.key}`)
    if (err) return err
  }
  return ''
}

function validateFieldValue(field, value, path) {
  if (value === undefined || value === null) return ''
  switch (field.type) {
    case 'str':
    case 'text':
    case 'file-image':
    case 'file-audio':
    case 'file-pdf':
      return (typeof value === 'string' || typeof value === 'number') ? '' : `${path} 必须是字符串`
    case 'num':
      return (typeof value === 'number' || (typeof value === 'string' && (value === '' || !Number.isNaN(Number(value))))) ? '' : `${path} 必须是数字`
    case 'bool':
      return typeof value === 'boolean' ? '' : `${path} 必须是 true/false`
    case 'bi':
    case 'bi-text':
    case 'bi-text-bare':
      return (typeof value === 'string' || (isRecord(value) && ('en' in value || 'zh' in value))) ? '' : `${path} 必须是字符串或 { en, zh }`
    case 'str-arr':
      return Array.isArray(value) ? '' : `${path} 必须是字符串数组`
    case 'obj':
      return validateFields(field.fields || [], value, path)
    case 'obj-arr':
      if (!Array.isArray(value)) return `${path} 必须是数组`
      for (let i = 0; i < value.length; i += 1) {
        const err = validateArrayItem(field.itemSchema, value[i], `${path}[${i}]`)
        if (err) return err
      }
      return ''
    default:
      return ''
  }
}

// ════════════════════════════════════════════════════════════════════
// AI PROMPT TEMPLATE — embedded in editor for one-click copy
// ════════════════════════════════════════════════════════════════════
const AI_PROMPT = `我要填充一个个人网站模板的 JSON 内容。请基于我提供的信息,生成符合下面结构的 JSON。

【输出要求】
- 严格的 JSON 格式（可解析,不带注释,不带 markdown 代码块包裹）
- 所有标"双语"的字段必须用 { "en": "...", "zh": "..." } 结构
- 单语字段(如 author/email/url/year/color)直接是字符串
- title 类字段可以用 *星号* 包裹一个词做斜体强调,比如 { "en": "*Tide* — short film", "zh": "*潮* — 短片" }
- 缺失信息合理虚构,保持人格一致
- 直接输出 JSON,不要任何解释文字

【网站需要的数据结构】

\`\`\`json
{
  "SITE": {
    "name": { "en": "...", "zh": "..." },
    "nameRight": { "en": "A.", "zh": "安" },
    "nameFull": { "en": "...", "zh": "..." },
    "portrait": "/picture/me.jpg",
    "cvPdf": "",
    "tagline": { "en": "...", "zh": "..." },
    "role": { "en": "...", "zh": "..." },
    "status": { "en": "Reading", "zh": "在读" },
    "statusObject": { "en": "Book title", "zh": "书名" },
    "location": { "en": "City, Country", "zh": "城市, 国家" },
    "timezone": "UTC+8",
    "tzName": "Asia/Shanghai",
    "email": "you@example.com",
    "now": { "en": "longer 'now' paragraph (3-5 sentences)", "zh": "更长的「正在做什么」段落(3-5 句)" },
    "nowDate": { "en": "Month Year, City", "zh": "年月,城市" },
    "social": [
      { "label": { "en": "GitHub", "zh": "GitHub" }, "handle": "@user", "url": "https://github.com/user" }
    ]
  },

  "ABOUT": {
    "intro": { "en": "first-paragraph self-introduction(2-3 sentences,首字下沉)", "zh": "..." },
    "paragraphs": [
      { "en": "second paragraph", "zh": "..." },
      { "en": "third paragraph", "zh": "..." }
    ],
    "stats": [
      { "label": { "en": "Works", "zh": "作品" }, "value": "*7*" },
      { "label": { "en": "Years", "zh": "年数" }, "value": "*4*" },
      { "label": { "en": "Languages", "zh": "语言" }, "value": { "en": "*EN* · CN", "zh": "*中* · 英" } },
      { "label": { "en": "Status", "zh": "状态" }, "value": { "en": "Student. *Open to gigs*", "zh": "学生. *开放合作*" } }
    ],
    "cv": {
      "edu":    [ { "year": "2023 – now", "title": { "en": "...", "zh": "..." }, "role": { "en": "...", "zh": "..." }, "place": { "en": "City", "zh": "城市" } } ],
      "work":   [ /* same shape */ ],
      "awards": [ /* same shape */ ],
      "skills": [ /* same shape — year 字段填 'Camera' / 'Sound' / etc 作为分类标签 */ ]
    }
  },

  "JOURNEY": [
    {
      "id": 1, "year": 2004,
      "label": { "en": "Born", "zh": "出生" },
      "place": { "en": "City", "zh": "城市" },
      "title": { "en": "*A short evocative title*", "zh": "*简短的小标题*" },
      "text":  { "en": "narrative 2-3 sentences", "zh": "..." },
      "tags":  ["tag1", "tag2"],
      "chapter": "I",
      "image": ""
    }
    // 共 8 个节点,按时间顺序 chapter 标 'I' / 'II' / 'III' / 'IV' 分四章
  ],

  "WORKS": [
    {
      "id": "work-slug",
      "title":    { "en": "...", "zh": "..." },
      "subtitle": { "en": "5 min · 16mm", "zh": "5 分钟 · 16 毫米" },
      "medium": "short",
      "role":     { "en": "Director", "zh": "导演" },
      "year": "2025",
      "cover": "cover-1",
      "coverImg": "",
      "summary":  { "en": "1-2 sentence brief", "zh": "..." },
      "tags": ["tag"],
      "field": {
        "year": "2025",
        "format":    { "en": "Digital · 5min", "zh": "..." },
        "role":      { "en": "Director, DP", "zh": "..." },
        "crew":      { "en": "Solo", "zh": "..." },
        "festivals": { "en": "—", "zh": "—" },
        "status":    { "en": "In post", "zh": "后期中" }
      },
      "body": [
        { "en": "1-2 paragraph of details", "zh": "..." }
      ]
    }
  ],

  "BOOKS": [
    { "title": { "en": "Book title", "zh": "中文译名" }, "author": "Author Name", "year": "2025", "stars": 5, "color": "#1a1814", "text": "#e8dfcb", "coverImg": "", "note": { "en": "1-2 sentence personal note", "zh": "..." } }
  ],

  "USER_READING_LOG": [
    { "id": "r-1", "date": "2026.05", "title": { "en": "Book title", "zh": "中文译名" }, "author": "Author Name", "stars": 5, "status": "finished", "cover": "", "excerpt": { "en": "personal reading note", "zh": "个人读书笔记" } }
  ],

  "FILMS": [
    { "title": "Film title", "subtitle": "原名/中译", "year": "1979", "director": "Director Name", "coverImg": "", "note": { "en": "...", "zh": "..." } }
  ],

  "MUSIC": [
    { "track": "Track name", "artist": "Artist", "album": "Album", "duration": "4:21", "mood": { "en": "Quiet", "zh": "静" }, "note": { "en": "...", "zh": "..." }, "spotifyId": "", "neteaseId": "", "audio": "" }
  ],

  "PHOTOS": [
    { "id": "h1", "series": "walks", "caption": { "en": "...", "zh": "..." }, "date": "2026.03", "camera": "FX3 · 35mm", "color": "#1a2228", "image": "" }
  ],

  "TRAVEL": [
    { "city": { "en": "Hangzhou", "zh": "杭州" }, "country": { "en": "China", "zh": "中国" }, "year": 2004, "kind": "home", "lat": 30.27, "lon": 120.15, "note": { "en": "...", "zh": "..." } }
  ],

  "MODULES": {
    "about": { "enabled": true, "nav": true, "order": 1, "label": { "en": "About", "zh": "关于" }, "layout": "default" },
    "journey": { "enabled": true, "nav": true, "order": 2, "label": { "en": "Reel", "zh": "影格" }, "layout": "default" },
    "works": { "enabled": true, "nav": true, "order": 3, "label": { "en": "Works", "zh": "作品集" }, "layout": "default" },
    "library": { "enabled": true, "nav": true, "order": 4, "label": { "en": "Stacks", "zh": "私藏" }, "layout": "default" },
    "photography": { "enabled": true, "nav": true, "order": 5, "label": { "en": "Stills", "zh": "影像" }, "layout": "default" },
    "travel": { "enabled": true, "nav": true, "order": 6, "label": { "en": "Atlas", "zh": "足迹" }, "layout": "default" },
    "contact": { "enabled": true, "nav": true, "order": 7, "label": { "en": "Signal", "zh": "联系" }, "layout": "default" },
    "colophon": { "enabled": true, "nav": false, "order": 8, "label": { "en": "Colophon", "zh": "落款" }, "layout": "default" },
    "cvButton": { "enabled": true, "nav": false, "order": 90, "label": { "en": "Full CV", "zh": "完整简历" }, "layout": "default" },
    "nowPlaying": { "enabled": true, "nav": false, "order": 99, "label": { "en": "Now Playing", "zh": "播放中" }, "layout": "default" }
  }
}
\`\`\`

【我的信息】

姓名:
身份/职业:
所在城市:
邮箱:
社交账号(GitHub/Instagram/微博等):

简介(2-3 句话,我是谁,我做什么):

教育经历:

工作/实践经历:

获奖/作品入选(可选):

技能/工具栈:

我目前最重要的作品(2-3 个,每个标题 + 简介 + 媒介):

我最近在读/看/听(各 1-2 个):

我去过哪些城市:

【生成数量参考】
- ABOUT.paragraphs: 2-3 段
- ABOUT.cv.edu: 1-2 条
- ABOUT.cv.work: 1-3 条
- ABOUT.cv.awards: 0-3 条
- ABOUT.cv.skills: 3-5 条
- JOURNEY: 8 个节点(必须 8 个)
- WORKS: 2-5 件
- BOOKS / FILMS / MUSIC: 各 5-8 条
- TRAVEL: 4-10 座城市
- PHOTOS: 0(后续手动上传)
- TEXTS: 不用生成,保持模板默认

直接输出 JSON,不要任何额外文字。`

// ════════════════════════════════════════════════════════════════════
// STARTER TEMPLATE — empty but structurally complete; downloadable
// ════════════════════════════════════════════════════════════════════
const STARTER_TEMPLATE = {
  SITE: {
    name: { en: "<Your name>", zh: "<你的名字>" },
    nameRight: { en: "X.", zh: "字" },
    nameFull: { en: "<Your Full Name>", zh: "<你的全名>" },
    portrait: "",
    cvPdf: "",
    tagline: { en: "<One-line intro>", zh: "<一句话简介>" },
    role: { en: "<Your role>", zh: "<你的身份>" },
    status: { en: "Reading", zh: "在读" },
    statusObject: { en: "<book/film/podcast>", zh: "<书名/片名等>" },
    location: { en: "<City, Country>", zh: "<城市, 国家>" },
    timezone: "UTC+0",
    tzName: "UTC",
    email: "<you@example.com>",
    now: { en: "<Longer 'now' paragraph>", zh: "<更长的「正在做什么」段落>" },
    nowDate: { en: "Month Year, City", zh: "月份 年份, 城市" },
    social: [
      { label: { en: "GitHub", zh: "GitHub" }, handle: "@user", url: "#" }
    ]
  },
  ABOUT: {
    intro: { en: "<Open paragraph>", zh: "<开场段落>" },
    paragraphs: [
      { en: "<Paragraph 2>", zh: "<第二段>" }
    ],
    stats: [
      { label: { en: "Works", zh: "作品" }, value: "*0*" },
      { label: { en: "Years", zh: "年数" }, value: "*0*" },
      { label: { en: "Languages", zh: "语言" }, value: { en: "*EN* · CN", zh: "*中* · 英" } },
      { label: { en: "Status", zh: "状态" }, value: { en: "*Open to work*", zh: "*开放合作*" } }
    ],
    cv: { edu: [], work: [], awards: [], skills: [] }
  },
  JOURNEY: [
    {
      id: 1,
      year: "<Year>",
      label: { en: "<Label>", zh: "<标签>" },
      place: { en: "<Place>", zh: "<地点>" },
      title: { en: "*<Title>*", zh: "*<标题>*" },
      text: { en: "<Story>", zh: "<故事>" },
      tags: [],
      chapter: "I",
      image: ""
    }
  ],
  WORKS: [
    {
      id: "<work-slug>",
      title: { en: "<Work title>", zh: "<作品名>" },
      subtitle: { en: "<Subtitle>", zh: "<副标题>" },
      medium: "short",
      role: { en: "<Role>", zh: "<角色>" },
      year: "<Year>",
      cover: "cover-1",
      coverImg: "",
      summary: { en: "<Brief summary>", zh: "<简介>" },
      tags: [],
      field: {
        year: "<Year>",
        format: { en: "<Format>", zh: "<格式>" },
        role: { en: "<Role>", zh: "<角色>" },
        crew: { en: "<Crew>", zh: "<团队>" },
        festivals: { en: "—", zh: "—" },
        status: { en: "<Status>", zh: "<状态>" }
      },
      body: [
        { en: "<Details>", zh: "<详情>" }
      ]
    }
  ],
  BOOKS: [
    { title: { en: "<Book title>", zh: "<书名>" }, author: "<Author>", year: "<Year>", stars: 5, color: "#1a1814", text: "#e8dfcb", coverImg: "", note: { en: "<Note>", zh: "<短评>" } }
  ],
  USER_READING_LOG: [
    { id: "r-1", date: "<YYYY.MM>", title: { en: "<Book title>", zh: "<书名>" }, author: "<Author>", stars: 5, status: "finished", cover: "", excerpt: { en: "<Thoughts>", zh: "<感想>" } }
  ],
  FILMS: [
    { title: "<Film title>", subtitle: "<原名/中译>", year: "<Year>", director: "<Director>", coverImg: "", note: { en: "<Note>", zh: "<短评>" } }
  ],
  MUSIC: [
    { track: "<Track>", artist: "<Artist>", album: "<Album>", duration: "0:00", mood: { en: "<Mood>", zh: "<心境>" }, note: { en: "<Note>", zh: "<感受>" }, spotifyId: "", neteaseId: "", audio: "" }
  ],
  PHOTOS: [],
  TRAVEL: [
    { city: { en: "<City>", zh: "<城市>" }, country: { en: "<Country>", zh: "<国家>" }, year: "<Year>", kind: "trip", lat: 0, lon: 0, note: { en: "<Note>", zh: "<备注>" } }
  ],
  NOW_PLAYING: {
    spotify: [],
    netease: [],
    html5: []
  },
  NAV: [
    { num: "00", id: "home", label: { en: "Frame 00", zh: "片头" }, en: { en: "home", zh: "首页" } },
    { num: "01", id: "about", label: { en: "About", zh: "关于" }, en: { en: "biography", zh: "简介" } }
  ],
  MODULES: {
    about: { enabled: true, nav: true, order: 1, label: { en: "About", zh: "关于" }, layout: "default" },
    journey: { enabled: true, nav: true, order: 2, label: { en: "Reel", zh: "影格" }, layout: "default" },
    works: { enabled: true, nav: true, order: 3, label: { en: "Works", zh: "作品集" }, layout: "default" },
    library: { enabled: true, nav: true, order: 4, label: { en: "Stacks", zh: "私藏" }, layout: "default" },
    photography: { enabled: true, nav: true, order: 5, label: { en: "Stills", zh: "影像" }, layout: "default" },
    travel: { enabled: true, nav: true, order: 6, label: { en: "Atlas", zh: "足迹" }, layout: "default" },
    contact: { enabled: true, nav: true, order: 7, label: { en: "Signal", zh: "联系" }, layout: "default" },
    colophon: { enabled: true, nav: false, order: 8, label: { en: "Colophon", zh: "落款" }, layout: "default" },
    cvButton: { enabled: true, nav: false, order: 90, label: { en: "Full CV", zh: "完整简历" }, layout: "default" },
    nowPlaying: { enabled: true, nav: false, order: 99, label: { en: "Now Playing", zh: "播放中" }, layout: "default" }
  },
  TEXTS: {}
}

// ════════════════════════════════════════════════════════════════════
// IMPORT PANEL — paste AI-generated JSON, validate, apply to site
// ════════════════════════════════════════════════════════════════════
function ImportPanel() {
  const { lang } = useLang()
  const data = useData()
  const [jsonText, setJsonText] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [promptCopied, setPromptCopied] = useState(false)
  const [applied, setApplied] = useState('')
  const fileRef = useRef(null)

  const handleParse = (text) => {
    if (!text.trim()) {
      setParseResult(null)
      return
    }
    try {
      // Strip common markdown code-block fencing AI sometimes adds
      let cleaned = text.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      const parsed = JSON.parse(cleaned)
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        setParseResult({ valid: false, error: 'JSON 必须是对象,顶层有 SITE / ABOUT 等键' })
        return
      }
      setParseResult(validateImportData(parsed))
    } catch (e) {
      setParseResult({ valid: false, error: e.message })
    }
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      setJsonText(text)
      handleParse(text)
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  const handleApply = () => {
    if (!parseResult?.valid) return
    const sections = parseResult.sections
    if (!window.confirm(`将覆盖以下 ${sections.length} 个章节:\n\n${sections.join(', ')}\n\n继续?(原有数据会被覆盖,但可在每个章节的"↺ 重置本章"按钮里恢复到代码默认值)`)) return
    sections.forEach(key => {
      data.setSection(key, parseResult.data[key])
    })
    setApplied(`✓ 已应用 ${sections.length} 个章节: ${sections.join(' · ')}`)
    setJsonText('')
    setParseResult(null)
    setTimeout(() => setApplied(''), 5000)
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT).then(() => {
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2500)
    })
  }

  const downloadStarter = () => {
    const blob = new Blob([JSON.stringify(STARTER_TEMPLATE, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'starter.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="ce-import">
      <div className="ce-import-intro">
        <p>用自然语言描述你自己,AI 帮你填好整个网站的全部数据 —— 这是模板最有意思的功能。</p>
      </div>

      <div className="ce-import-step">
        <h4>① 复制 AI 提示词</h4>
        <p>提示词内置了整个网站需要的 JSON 结构,AI 拿到就知道每个字段填什么。</p>
        <button className="ce-btn" onClick={copyPrompt}>
          {promptCopied ? '✓ 已复制到剪贴板' : '📋 复制 AI 提示词'}
        </button>
      </div>

      <div className="ce-import-step">
        <h4>② 打开任意大语言模型,粘贴 + 填好你的信息</h4>
        <p>推荐: <strong>ChatGPT</strong> · <strong>Claude</strong> · <strong>豆包</strong> · <strong>智谱 GLM</strong> · <strong>Kimi</strong> · <strong>通义千问</strong></p>
        <p style={{ color: 'var(--cream-mute)' }}>提示词的「我的信息」部分需要你填——姓名、职业、城市、教育经历、作品、爱好等。填得越具体,AI 写得越像你。</p>
      </div>

      <div className="ce-import-step">
        <h4>③ 把 AI 返回的 JSON 粘到这里</h4>
        <textarea
          className="ce-input ce-import-textarea"
          value={jsonText}
          onChange={(e) => { setJsonText(e.target.value); handleParse(e.target.value) }}
          placeholder={'粘贴 JSON,例如:\n{\n  "SITE": { "name": { "en": "...", "zh": "..." }, ... },\n  "ABOUT": { ... },\n  ...\n}'}
          spellCheck={false}
          rows={10}
        />
        <div className="ce-import-actions">
          <button type="button" className="ce-btn ce-btn-ghost" onClick={() => fileRef.current?.click()}>
            📁 或者上传 .json 文件
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} style={{ display: 'none' }} />
          <button type="button" className="ce-btn ce-btn-ghost" onClick={downloadStarter}>
            📥 下载空白模板
          </button>
        </div>
      </div>

      {parseResult && (
        <div className="ce-import-step">
          <h4>④ 校验结果</h4>
          {parseResult.valid ? (
            <>
              <div className="ce-file-status ce-file-status-ok">
                ✓ JSON 格式合法 · 检测到 {parseResult.sections.length} 个章节
              </div>
              <ul className="ce-import-sections">
                {parseResult.sections.map(s => <li key={s}>{s}</li>)}
              </ul>
              <button className="ce-btn" onClick={handleApply} style={{ marginTop: 8 }}>
                ✓ 应用到网站(覆盖现有内容)
              </button>
            </>
          ) : (
            <div className="ce-file-status ce-file-status-error">
              ✗ {parseResult.error}
            </div>
          )}
        </div>
      )}

      {applied && (
        <div className="ce-import-applied">
          {applied}
        </div>
      )}

      <div className="ce-import-step ce-import-help">
        <h4>查阅完整字段文档</h4>
        <p>项目根目录的 <code>CONTENT_GUIDE.md</code> 详列所有字段、双语规则、图片要求、AI 提示词使用方法。</p>
      </div>
    </div>
  )
}

function SectionEditor({ section, value, onChange }) {
  const data = useData()
  const { lang } = useLang()

  if (section.type === 'import') {
    return <ImportPanel />
  }
  if (section.key === 'SITE') {
    return <ObjectField value={value} onChange={onChange} fields={SITE_SCHEMA} />
  }
  if (section.key === 'MODULES') {
    return <ObjectField value={value} onChange={onChange} fields={MODULES_SCHEMA} />
  }
  if (section.key === 'ABOUT') {
    return <ObjectField value={value} onChange={onChange} fields={ABOUT_SCHEMA} />
  }
  if (section.type === 'photos') {
    // Group by `series`, using labels from PHOTO_SERIES data.
    const seriesLabels = {}
    ;(data.PHOTO_SERIES || []).forEach(s => {
      if (s.id !== 'all') seriesLabels[s.id] = pick(s.label, lang)
    })
    return (
      <ObjectArrayField
        value={value}
        onChange={onChange}
        itemSchema={section.itemSchema}
        titleFor={section.titleFor}
        groupBy="series"
        groupLabels={seriesLabels}
      />
    )
  }
  if (section.type === 'array') {
    return (
      <ObjectArrayField
        value={value}
        onChange={onChange}
        itemSchema={section.itemSchema}
        titleFor={section.titleFor}
      />
    )
  }
  if (section.type === 'now-playing') {
    const v = value || { spotify: [], netease: [], html5: [] }
    return (
      <div className="ce-np-editor">
        {['spotify', 'netease', 'html5'].map((src) => (
          <div key={src} className="ce-np-group">
            <h4 className="ce-np-group-title">{src.toUpperCase()}</h4>
            <ObjectArrayField
              value={v[src] || []}
              onChange={(arr) => onChange({ ...v, [src]: arr })}
              itemSchema={section.itemSchema}
              titleFor={(e) => (typeof e.track === 'object' ? e.track?.en : e.track) || '(empty)'}
            />
          </div>
        ))}
      </div>
    )
  }
  if (section.type === 'raw') {
    return (
      <>
        {section.hint && <p className="ce-hint">{section.hint}</p>}
        <JsonEditor value={value} onChange={onChange} />
      </>
    )
  }
  return <p>未实现的章节类型：{section.type}</p>
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function ContentEditor({ open, onClose }) {
  const { lang } = useLang()
  const data = useData()
  const [activeKey, setActiveKey] = useState('SITE')
  // Local working copy — only commits to context when user clicks Save
  const [workingValue, setWorkingValue] = useState(null)
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState('')
  // Display mode: 'modal' (full-screen overlay) or 'side' (right side panel, site stays visible)
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('chen.ce.mode') === 'side' ? 'side' : 'modal' } catch { return 'modal' }
  })
  // Side-panel width (in px). User can drag the left edge to resize.
  const [sideWidth, setSideWidth] = useState(() => {
    try { return Number(localStorage.getItem('chen.ce.sideWidth')) || 520 } catch { return 520 }
  })
  // Auto-save toggle: if on, edits commit to context on every change (live preview)
  const [autoSave, setAutoSave] = useState(() => {
    // Default ON — edits commit to live preview automatically. Users can turn off.
    try {
      const v = localStorage.getItem('chen.ce.autosave')
      return v === null ? true : v === '1'
    } catch { return true }
  })

  useEffect(() => { try { localStorage.setItem('chen.ce.mode', mode) } catch {} }, [mode])
  useEffect(() => { try { localStorage.setItem('chen.ce.autosave', autoSave ? '1' : '0') } catch {} }, [autoSave])
  useEffect(() => { try { localStorage.setItem('chen.ce.sideWidth', String(sideWidth)) } catch {} }, [sideWidth])

  // Drag the left edge of the side panel to resize.
  const onResizeStart = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = sideWidth
    const onMove = (ev) => {
      // Side panel grows when user drags LEFT (toward content), so width = startW + (startX - currentX)
      const next = Math.max(360, Math.min(window.innerWidth - 100, startW + (startX - ev.clientX)))
      setSideWidth(next)
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Sync working value when section changes
  useEffect(() => {
    if (!open) return
    // Special section keys (starting with _) don't have data to clone.
    if (activeKey.startsWith('_')) {
      setWorkingValue(null)
      setShowCode(false)
      return
    }
    setWorkingValue(deepClone(data[activeKey]))
    setShowCode(false)
  }, [activeKey, open])

  // Auto-save: when workingValue changes, push to context (debounced).
  // Skip for special _ sections (no underlying data).
  useEffect(() => {
    if (!autoSave || workingValue == null || activeKey.startsWith('_')) return
    const id = setTimeout(() => {
      data.setSection(activeKey, workingValue)
    }, 400)
    return () => clearTimeout(id)
  }, [workingValue, autoSave, activeKey])

  // On tab change OR close, flush any pending auto-save edits so they're not lost
  // mid-debounce. Uses a ref so the cleanup sees the latest values.
  const flushRef = useRef({ autoSave, workingValue, activeKey })
  useEffect(() => { flushRef.current = { autoSave, workingValue, activeKey } })
  useEffect(() => {
    return () => {
      const { autoSave: a, workingValue: wv, activeKey: ak } = flushRef.current
      if (a && wv != null) data.setSection(ak, wv)
    }
  }, [activeKey, open])
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Body scroll lock — only in modal mode
  useEffect(() => {
    if (!open) return
    if (mode === 'modal') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, mode, onClose])

  if (!open) return null

  const section = SECTIONS.find(s => s.key === activeKey)
  const isOverridden = data.isOverridden(activeKey)
  const isSpecial = activeKey.startsWith('_')

  const handleSave = () => {
    data.setSection(activeKey, workingValue)
    flash(setCopied, '✓ 已保存到浏览器（实时生效）')
  }
  const handleReset = () => {
    if (!window.confirm(`重置 ${activeKey} 到代码默认值？localStorage 里的编辑会丢失。`)) return
    data.resetSection(activeKey)
    setWorkingValue(deepClone(data.defaults[activeKey]))
    flash(setCopied, '↺ 已重置到代码默认值')
  }
  const handleResetAll = () => {
    if (!window.confirm('重置全部内容到代码默认值？localStorage 里的所有内容编辑都会丢失。')) return
    data.resetData()
    setWorkingValue(activeKey.startsWith('_') ? null : deepClone(data.defaults[activeKey]))
    flash(setCopied, '↺ 已清空全部本地内容覆盖')
  }
  const handleCopy = () => {
    const code = exportLine(activeKey, workingValue)
    const warning = exportWarning(activeKey, workingValue)
    navigator.clipboard.writeText(code).then(() => {
      flash(setCopied, warning ? `✓ 已复制代码到剪贴板 · ${warning}` : '✓ 已复制代码到剪贴板')
    }, () => {
      flash(setCopied, '✗ 复制失败，请手动选中下方代码块')
    })
  }
  const handleCopyAll = () => {
    const blob = data.exportResolvedData
      ? data.exportResolvedData()
      : EXPORTABLE_SECTIONS.map(s => exportLine(s.key, data[s.key])).join('\n\n')
    const warning = exportAllWarning(data)
    navigator.clipboard.writeText(blob).then(() => {
      flash(setCopied, warning ? `✓ 已复制全部 export 到剪贴板 · ${warning}` : '✓ 已复制全部 export 到剪贴板')
    })
  }

  return (
    <div
      className={`ce-overlay mode-${mode}`}
      style={mode === 'side' ? { width: sideWidth } : undefined}
    >
      <div className="ce-shell">
        {mode === 'side' && (
          <div
            className="ce-resize-handle"
            onPointerDown={onResizeStart}
            title="拖动调整宽度"
          />
        )}
        <header className="ce-header">
          <div className="ce-title">
            <span className="ce-title-main">{lang === 'zh' ? '内容编辑器' : 'Content Editor'}</span>
            <span className="ce-title-sub">
              {mode === 'side'
                ? (lang === 'zh' ? '侧栏模式 · 左侧主站可实时预览' : 'Side mode · live preview on the left')
                : (lang === 'zh' ? '保存到浏览器即时生效；复制代码粘贴到 data.js 永久保存' : 'Save → live preview · copy code → paste into data.js to persist')}
            </span>
          </div>
          <div className="ce-header-actions">
            <label className="ce-autosave" title={lang === 'zh' ? '改完自动保存到浏览器' : 'Auto-save edits to browser'}>
              <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
              <span>{lang === 'zh' ? '自动保存' : 'Auto-save'}</span>
            </label>
            <button
              className="ce-mode-toggle"
              onClick={() => setMode(m => m === 'modal' ? 'side' : 'modal')}
              title={lang === 'zh' ? '切换布局模式' : 'Toggle layout'}
            >
              {mode === 'modal' ? '⊟ ' + (lang === 'zh' ? '侧栏' : 'Side') : '⊞ ' + (lang === 'zh' ? '全屏' : 'Modal')}
            </button>
            <button className="ce-btn ce-btn-ghost" onClick={handleCopyAll} title="复制所有 export">📋 {lang === 'zh' ? '全部' : 'All'}</button>
            <button className="ce-close" onClick={onClose} aria-label="close">✕</button>
          </div>
        </header>

        <div className="ce-body">
          <nav className="ce-tabs" aria-label="sections">
            {SECTIONS.map((s, i) => {
              const prevGroup = i > 0 ? SECTIONS[i - 1].group : null
              const showGroupHeader = s.group && s.group !== prevGroup
              return (
                <React.Fragment key={s.key}>
                  {showGroupHeader && <div className="ce-tab-group">{s.group}</div>}
                  <button
                    className={`ce-tab ${activeKey === s.key ? 'act' : ''}`}
                    onClick={() => setActiveKey(s.key)}
                  >
                    <span className="ce-tab-label">{s.label}</span>
                    {data.isOverridden(s.key) && <span className="ce-tab-dot" title="已被本地编辑过">●</span>}
                  </button>
                </React.Fragment>
              )
            })}
          </nav>

          <main className="ce-main">
            <div className="ce-main-head">
              <h3 className="ce-section-title">{section.label}</h3>
              {!isSpecial && isOverridden && <span className="ce-tag">本地编辑中</span>}
            </div>

            {isSpecial ? (
              <div className="ce-section-body">
                <SectionEditor section={section} value={null} onChange={() => {}} />
              </div>
            ) : workingValue !== null && (
              <div className="ce-section-body">
                <SectionEditor section={section} value={workingValue} onChange={setWorkingValue} />
              </div>
            )}

            {!isSpecial && showCode && (
              <div className="ce-code-block">
                <div className="ce-code-head">
                  <span>{activeKey} 导出代码 — 复制到 data.js</span>
                  <button className="ce-btn ce-btn-ghost" onClick={handleCopy}>📋 复制</button>
                </div>
                <pre className="ce-code"><code>{exportLine(activeKey, workingValue)}</code></pre>
              </div>
            )}
          </main>
        </div>

        <footer className="ce-footer">
          <div className={`ce-footer-msg ${data.storageError ? 'ce-footer-error' : ''}`}>{data.storageError || copied}</div>
          <div className="ce-footer-actions">
            {!isSpecial && (
              <>
                <button className="ce-btn ce-btn-ghost" onClick={handleReset} disabled={!isOverridden}>↺ 重置本章</button>
                <button className="ce-btn ce-btn-ghost" onClick={handleResetAll} disabled={!Object.keys(data.userOverrides || {}).length}>↺ 重置全部</button>
                <button className="ce-btn ce-btn-ghost" onClick={() => setShowCode(s => !s)}>
                  {showCode ? '隐藏代码' : '< />  查看代码'}
                </button>
                <button className="ce-btn" onClick={handleSave}>💾 保存到浏览器</button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

function deepClone(v) {
  return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v))
}

function flash(setter, msg) {
  setter(msg)
  setTimeout(() => setter(''), 2400)
}
