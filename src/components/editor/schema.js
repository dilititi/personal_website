import { pick } from '../../data.js'

const journeyItem = [
  { key: 'id', type: 'num', label: 'ID' },
  { key: 'year', type: 'str', label: '年份 Year' },
  { key: 'label', type: 'bi', label: '标签 Label' },
  { key: 'place', type: 'bi', label: '地点 Place' },
  { key: 'title', type: 'bi', label: '标题 Title（可用 *星号* 强调）' },
  { key: 'text', type: 'bi-text', label: '正文 Text' },
  { key: 'tags', type: 'str-arr', label: '标签 Tags' },
  { key: 'chapter', type: 'str', label: '章节 Chapter (I/II/III/IV)' },
  {
    key: 'image',
    type: 'file-image',
    subfolder: 'journey',
    label: '帧背景图（可选 · 影格按钮显示为图片背景）',
  },
]

const workItem = [
  { key: 'id', type: 'str', label: 'ID' },
  { key: 'title', type: 'bi', label: '标题 Title' },
  { key: 'subtitle', type: 'bi', label: '副标题 Subtitle' },
  { key: 'medium', type: 'str', label: '媒介 Medium（要跟 Works.jsx 的 WORK_MEDIA 对得上）' },
  { key: 'role', type: 'bi', label: '角色 Role' },
  { key: 'year', type: 'str', label: '年份 Year' },
  { key: 'cover', type: 'str', label: 'CSS 封面 class（cover-1..4，作为图片缺失时的兜底）' },
  {
    key: 'coverImg',
    type: 'file-image',
    subfolder: 'works',
    label: '封面图片（点 📁 选本地图 → 一键写入 public/works/）',
  },
  { key: 'summary', type: 'bi-text', label: '简介 Summary' },
  { key: 'tags', type: 'str-arr', label: '标签 Tags' },
  {
    key: 'field',
    type: 'obj',
    label: '元信息 Field',
    fields: [
      { key: 'year', type: 'str', label: '年' },
      { key: 'format', type: 'bi', label: '格式' },
      { key: 'role', type: 'bi', label: '角色' },
      { key: 'crew', type: 'bi', label: '团队' },
      { key: 'festivals', type: 'bi', label: '展映' },
      { key: 'status', type: 'bi', label: '状态' },
    ],
  },
  {
    key: 'body',
    type: 'obj-arr',
    label: '正文段落 Body',
    titleFor: (b, i) => `段落 ${i + 1}`,
    itemSchema: { type: 'bi-text-bare' }, // each item is itself a bilingual string
  },
]

const bookItem = [
  { key: 'title', type: 'bi', label: '书名 Title' },
  { key: 'author', type: 'str', label: '作者 Author' },
  { key: 'year', type: 'str', label: '年份 Year' },
  { key: 'stars', type: 'num', label: '星级 Stars (1-5)' },
  { key: 'color', type: 'str', label: '封面背景色 #hex（图片缺失时显示）' },
  { key: 'text', type: 'str', label: '封面文字色 #hex' },
  { key: 'coverImg', type: 'file-image', subfolder: 'books', label: '封面图（可选 · 优先于色块）' },
  { key: 'note', type: 'bi-text', label: '书评 Note' },
]

const filmItem = [
  { key: 'title', type: 'str', label: '片名 Title' },
  { key: 'subtitle', type: 'str', label: '原名 / 中文名' },
  { key: 'year', type: 'str', label: '年份 Year' },
  { key: 'director', type: 'str', label: '导演 Director' },
  { key: 'coverImg', type: 'file-image', subfolder: 'films', label: '海报（可选）' },
  { key: 'note', type: 'bi-text', label: '影评 Note' },
]

const musicItem = [
  { key: 'track', type: 'str', label: '曲目 Track' },
  { key: 'artist', type: 'str', label: '艺人 Artist' },
  { key: 'album', type: 'str', label: '专辑 Album' },
  { key: 'duration', type: 'str', label: '时长 Duration' },
  { key: 'mood', type: 'bi', label: '心境 Mood' },
  { key: 'note', type: 'bi-text', label: '感受 Note' },
  { key: 'spotifyId', type: 'str', label: 'Spotify ID（可选，填了能点击播放）' },
  { key: 'neteaseId', type: 'str', label: '网易云 ID（可选）' },
  {
    key: 'audio',
    type: 'file-audio',
    subfolder: 'audio',
    label: '本地音频（可选 · 选文件一键写入 public/audio/）',
  },
]

const readingLogUserItem = [
  { key: 'id', type: 'str', label: 'ID（自动生成；可不改）' },
  { key: 'date', type: 'str', label: '日期 Date（如 2026.05）' },
  { key: 'title', type: 'bi', label: '书名 Title' },
  { key: 'author', type: 'str', label: '作者 Author' },
  { key: 'stars', type: 'num', label: '星级 Stars (1-5)' },
  { key: 'status', type: 'str', label: '状态 Status (finished/reread/skimmed/abandoned)' },
  { key: 'cover', type: 'file-image', subfolder: 'books', label: '封面图（可选）' },
  { key: 'excerpt', type: 'bi-text', label: '笔记 / 感想' },
]

const photoItem = [
  { key: 'id', type: 'str', label: 'ID（短标识，如 h1, s2）' },
  { key: 'series', type: 'str', label: '系列 Series（要跟 PHOTO_SERIES 的 id 对得上）' },
  { key: 'caption', type: 'bi', label: '说明 Caption' },
  { key: 'date', type: 'str', label: '日期 Date' },
  { key: 'camera', type: 'str', label: '相机/镜头' },
  { key: 'color', type: 'str', label: '占位色 #hex（图片缺失时显示）' },
  { key: 'image', type: 'file-image', subfolder: 'photos', label: '照片本体（可选）' },
]

const travelItem = [
  { key: 'city', type: 'bi', label: '城市 City' },
  { key: 'country', type: 'bi', label: '国家 Country' },
  { key: 'year', type: 'str', label: '年份 Year（数字或字符串都行）' },
  { key: 'kind', type: 'str', label: '类型 Kind (home/frequent/festival/trip)' },
  { key: 'lat', type: 'num', label: '纬度 Lat（0=不在地图上显示）' },
  { key: 'lon', type: 'num', label: '经度 Lon' },
  { key: 'note', type: 'bi', label: '备注 Note' },
]

const navItem = [
  { key: 'num', type: 'str', label: '编号' },
  { key: 'id', type: 'str', label: 'ID (锚点)' },
  { key: 'label', type: 'bi', label: '主标签' },
  { key: 'en', type: 'bi', label: '副标签' },
]

const nowPlayingTrack = [
  { key: 'track', type: 'bi', label: '曲目（可双语）' },
  { key: 'artist', type: 'bi', label: '艺人（可双语）' },
  { key: 'spotifyId', type: 'str', label: 'Spotify ID' },
  { key: 'neteaseId', type: 'str', label: '网易云 ID' },
  { key: 'audio', type: 'str', label: '本地音频路径' },
]

export const MODULE_LAYOUT_OPTIONS = [
  { value: 'default', label: 'default · 默认布局' },
  { value: 'compact', label: 'compact · 紧凑信息密度' },
  { value: 'feature', label: 'feature · 强调首项 / 主视觉' },
]

export const moduleConfigFields = [
  { key: 'enabled', type: 'bool', label: 'enabled · 是否显示' },
  { key: 'nav', type: 'bool', label: 'nav · 是否进入导航' },
  { key: 'order', type: 'num', label: 'order · 页面排序' },
  { key: 'label', type: 'bi', label: 'label · 导航名称' },
  { key: 'layout', type: 'select', label: 'layout · 页面布局', options: MODULE_LAYOUT_OPTIONS },
]

const moduleField = (key, label) => ({
  key,
  type: 'obj',
  label,
  fields: moduleConfigFields,
})

export const MODULES_SCHEMA = [
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

export const SECTIONS = [
  // ─── 顶部：自动填充入口 + 模块开关 ───
  { key: '_IMPORT', label: '🪄 自动填充 · Auto-fill', type: 'import', group: '' },
  { key: 'MODULES', label: '🎛 MODULES · 模块开关', type: 'object', schema: 'modules', group: '' },

  // ─── 基础设置（不属于某个章节）───
  { key: 'SITE', label: 'SITE · 站点身份', type: 'object', schema: 'site', group: '基础设置' },
  {
    key: 'TEXTS',
    label: 'TEXTS · UI 文字',
    type: 'raw',
    group: '基础设置',
    hint: '硬编码 UI 文字（章节标题、印章字、Contact 段落等）。结构较深，用 JSON 编辑。',
  },
  {
    key: 'NAV',
    label: 'NAV · 章节导航',
    type: 'array',
    itemSchema: navItem,
    titleFor: (e, _, lang) => `${e.num} ${pick(e.label, lang)}`,
    group: '基础设置',
  },
  {
    key: 'NOW_PLAYING',
    label: 'NOW_PLAYING · 播放器歌单',
    type: 'now-playing',
    itemSchema: nowPlayingTrack,
    group: '基础设置',
  },

  // ─── 章节内容（按网页 01-06 顺序）───
  { key: 'ABOUT', label: '01 关于 · About', type: 'object', schema: 'about', group: '章节内容' },
  {
    key: 'JOURNEY',
    label: '02 时间线 · Journey',
    type: 'array',
    itemSchema: journeyItem,
    titleFor: (e, _, lang) => `${e.year ?? '?'} · ${pick(e.label, lang)}`,
    group: '章节内容',
  },
  {
    key: 'WORKS',
    label: '03 作品集 · Works',
    type: 'array',
    itemSchema: workItem,
    titleFor: (e, _, lang) => `${pick(e.title, lang) || '(无标题)'} (${e.year ?? '?'})`,
    group: '章节内容',
  },
  {
    key: 'BOOKS',
    label: '04 私藏 · 书 Books',
    type: 'array',
    itemSchema: bookItem,
    titleFor: (e, _, lang) => `${pick(e.title, lang)} — ${e.author}`,
    group: '章节内容',
  },
  {
    key: 'USER_READING_LOG',
    label: '04 私藏 · 个人读书日志',
    type: 'array',
    itemSchema: readingLogUserItem,
    titleFor: (e, _, lang) => `${e.date || 'date'} · ${pick(e.title, lang) || '(无标题)'}`,
    group: '章节内容',
  },
  {
    key: 'FILMS',
    label: '04 私藏 · 影 Films',
    type: 'array',
    itemSchema: filmItem,
    titleFor: e => `${e.title} (${e.year})`,
    group: '章节内容',
  },
  {
    key: 'MUSIC',
    label: '04 私藏 · 音 Music',
    type: 'array',
    itemSchema: musicItem,
    titleFor: e => `${e.track} — ${e.artist}`,
    group: '章节内容',
  },
  {
    key: 'PHOTOS',
    label: '05 摄影 · Photos',
    type: 'photos',
    itemSchema: photoItem,
    titleFor: (e, _, lang) => `${e.id} · ${pick(e.caption, lang)}`,
    group: '章节内容',
  },
  {
    key: 'TRAVEL',
    label: '06 足迹 · Travel',
    type: 'array',
    itemSchema: travelItem,
    titleFor: (e, _, lang) => `${pick(e.city, lang)} (${e.year})`,
    group: '章节内容',
  },
]

export const EXPORTABLE_SECTIONS = SECTIONS.filter(s => !s.key.startsWith('_'))

export const SITE_SCHEMA = [
  {
    key: 'url',
    type: 'str',
    label: '站点 URL（canonical / OG / sitemap，部署时填真实域名）',
  },
  { key: 'name', type: 'bi', label: '简称 Name（Frame 00 左侧大字 / 顶栏 / Colophon / CV）' },
  {
    key: 'nameRight',
    type: 'bi',
    label: '名字花押 Name (right)（Frame 00 右侧斜体红色那个字母 / 字）',
  },
  { key: 'nameFull', type: 'bi', label: '全名 Full name（用于 CV 标题）' },
  { key: 'glyph', type: 'str', label: '首字符 Glyph（暂未使用）' },
  {
    key: 'portrait',
    type: 'file-image',
    subfolder: 'picture',
    label: '头像 Portrait（选本地图 → 写入 public/picture/）',
  },
  {
    key: 'ogImage',
    type: 'file-image',
    subfolder: 'picture',
    label: '社交分享图 OG image（建议 1200×630；与头像分开）',
  },
  {
    key: 'googleSiteVerification',
    type: 'str',
    label: 'Google Search Console 验证 token（只填 content 值）',
  },
  {
    key: 'cvPdf',
    type: 'file-pdf',
    subfolder: 'docs',
    label: 'CV PDF（可选 · 填了 modal 里的"打印"按钮变成 PDF 下载链接）',
  },
  { key: 'tagline', type: 'bi-text', label: '标语 Tagline' },
  { key: 'role', type: 'bi', label: '身份 Role（CV 子标题）' },
  { key: 'status', type: 'bi', label: '状态标签 Status' },
  { key: 'statusObject', type: 'bi', label: '当前在做 Status object（Contact 状态栏）' },
  { key: 'location', type: 'bi', label: '位置 Location（Frame 00 城市 + 顶栏 + Contact）' },
  { key: 'timezone', type: 'str', label: '时区显示文本（如 UTC+8 · 仅 Contact 状态栏显示）' },
  {
    key: 'tzName',
    type: 'str',
    label: '时区 IANA 名（如 Asia/Shanghai / America/New_York · Frame 00 时钟用）',
  },
  { key: 'email', type: 'str', label: '邮箱 Email（Frame 00 + Contact + CV）' },
  { key: 'now', type: 'bi-text', label: '正在做什么 Now（长段）' },
  { key: 'nowDate', type: 'bi', label: '更新时间标签 Now date' },
  {
    key: 'social',
    type: 'obj-arr',
    label: '社交账号 Social',
    titleFor: s => (typeof s.label === 'object' ? s.label?.en : s.label) + ' · ' + s.handle,
    itemSchema: [
      { key: 'label', type: 'bi', label: '名称' },
      { key: 'handle', type: 'str', label: '账号' },
      { key: 'url', type: 'str', label: '链接 URL' },
    ],
  },
]

export const ABOUT_SCHEMA = [
  { key: 'intro', type: 'bi-text', label: '首段（首字下沉）Intro' },
  {
    key: 'paragraphs',
    type: 'obj-arr',
    label: '后续段落 Paragraphs',
    titleFor: (_, i) => `段落 ${i + 1}`,
    itemSchema: { type: 'bi-text-bare' },
  },
  {
    key: 'stats',
    type: 'obj-arr',
    label: '统计格 Stats',
    titleFor: s => (typeof s.label === 'object' ? s.label?.en : s.label),
    itemSchema: [
      { key: 'label', type: 'bi', label: '名称' },
      { key: 'value', type: 'bi', label: '值（可用 *星号* 高亮）' },
    ],
  },
  {
    key: 'cv',
    type: 'obj',
    label: '简历 CV',
    fields: [
      {
        key: 'edu',
        type: 'obj-arr',
        label: '学历 Education',
        titleFor: e => e.year,
        itemSchema: cvSubItem(),
      },
      {
        key: 'work',
        type: 'obj-arr',
        label: '工作 Practice',
        titleFor: e => e.year,
        itemSchema: cvSubItem(),
      },
      {
        key: 'awards',
        type: 'obj-arr',
        label: '奖项 Awards',
        titleFor: e => e.year,
        itemSchema: cvSubItem(),
      },
      {
        key: 'skills',
        type: 'obj-arr',
        label: '技能 Skills',
        titleFor: e => e.year,
        itemSchema: cvSubItem(),
      },
    ],
  },
]

function cvSubItem() {
  return [
    { key: 'year', type: 'str', label: '年/分类' },
    { key: 'title', type: 'bi', label: '标题' },
    { key: 'role', type: 'bi', label: '描述' },
    { key: 'place', type: 'bi', label: '地点' },
  ]
}

// ════════════════════════════════════════════════════════════════════
// JS LITERAL FORMATTER — produces code that can be pasted into data.js
// ════════════════════════════════════════════════════════════════════
