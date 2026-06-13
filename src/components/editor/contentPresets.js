export const FILE_IMAGE_TEMPLATES = {
  picture: [
    { label: '自然系肖像', path: '/picture/template-organic-portrait.svg' },
    { label: '放映室肖像', path: '/picture/template-film-portrait.svg' },
    { label: '数字档案肖像', path: '/picture/template-digital-portrait.svg' },
  ],
  journey: [
    { label: '自然路线', path: '/journey/template-organic-journey.svg' },
    { label: '胶片影格', path: '/journey/template-film-journey.svg' },
    { label: '数据节点', path: '/journey/template-digital-journey.svg' },
  ],
  works: [
    { label: '自然作品封面', path: '/works/template-organic-work.svg' },
    { label: '电影作品封面', path: '/works/template-film-work.svg' },
    { label: '数字作品封面', path: '/works/template-digital-work.svg' },
  ],
  books: [
    { label: '自然书封', path: '/books/template-organic-book.svg' },
    { label: '电影书封', path: '/books/template-film-book.svg' },
    { label: '数字书封', path: '/books/template-digital-book.svg' },
  ],
  films: [
    { label: '自然海报', path: '/films/template-organic-poster.svg' },
    { label: '放映室海报', path: '/films/template-film-poster.svg' },
    { label: '数字海报', path: '/films/template-digital-poster.svg' },
  ],
  photos: [
    { label: '森林照片', path: '/photos/template-organic-photo.svg' },
    { label: '夜色照片', path: '/photos/template-film-photo.svg' },
    { label: '屏幕照片', path: '/photos/template-digital-photo.svg' },
  ],
}

export const AI_PROMPT = `我要填充一个个人网站模板的 JSON 内容。请基于我提供的信息,生成符合下面结构的 JSON。

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
    "ogImage": "/og-cover.jpg",
    "googleSiteVerification": "",
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
const B = (en, zh) => ({ en, zh })

const TEMPLATE_NAV = [
  {
    num: '00',
    id: 'home',
    label: B('Home', '首页'),
    en: B('home', '首页'),
  },
]

const TEMPLATE_PHOTO_SERIES = [
  { id: 'all', label: B('All', '全部') },
  { id: 'portraits', label: B('Portraits', '人像') },
  { id: 'walks', label: B('Walks', '散步') },
]

function createTemplateTexts({
  metaRole = B('<Your role>', '<你的身份>'),
  metaSchool = B('<Your field>', '<你的领域>'),
  wordA = B('<Your>', '<你的>'),
  wordB = B('<Portfolio statement>', '<作品集宣言>'),
  wordC = B('Based', '现居'),
  wordD = B('<Your city>', '<你的城市>'),
  sealChar = '<字>',
  langItems = [B('<Language>', '<语言>')],
  nowItems = [B('<Current status>', '<当前状态>')],
  contactEn = 'Write a short statement about the work or collaboration you welcome.',
  contactZh = '写一段你欢迎何种工作或合作的简短说明。',
  signoff = B(
    'A small archive of work, references, and ongoing questions.',
    '一个收纳作品、参考与持续问题的小档案。',
  ),
} = {}) {
  return {
    landing: {
      metaRole,
      metaSchool,
      metaEmailLbl: B('EMAIL ↗', '邮箱 ↗'),
      metaCity: B('CITY', '城市'),
      nameLeft: B('Name', '名字'),
      nameRight: B('N.', '字'),
      pillAboutLbl: B('About', '关于'),
      pillWorksLbl: B('Works', '作品'),
      pillLibraryLbl: B('Library', '私藏'),
      wordA,
      wordB,
      wordC,
      wordD,
    },
    about: {
      headerTitle: B('A short biography', '简短的自述'),
      headerSubTag: B('biography', '简介'),
      headerMeta: B('Read time · 3 min', '阅读约 3 分钟'),
      portraitTagL: B('[ portrait ]', '[ 肖像 ]'),
      portraitTagR: 'personal archive',
      fullCvLabel: B('Full CV / Curriculum', '查看完整简历'),
      sealChar,
      blockEdu: B('Education', '学历'),
      blockWork: B('Practice', '工作'),
      blockAwards: B('Awards', '奖项'),
      blockSkills: B('Tools', '技能'),
    },
    cvModal: {
      eyebrow: B('CURRICULUM VITAE', '个人简历'),
      sealChar,
      blockEdu: B('Education', '学历'),
      blockWork: B('Practice', '工作经历'),
      blockAwards: B('Awards & selections', '奖项与入选'),
      blockSkills: B('Tools & skills', '技能 / 工具'),
      contactLabel: B('Contact', '联系'),
      linksLabel: B('Links', '链接'),
      langsLabel: B('Languages', '语言'),
      nowLabel: B('Currently', '当前'),
      langItems,
      nowItems,
      printLabel: B('Print / Save as PDF', '打印 / 存为 PDF'),
      lastUpdated: B('Last updated ', '最后更新 '),
    },
    contact: {
      statementEn: contactEn,
      statementZh: contactZh,
      writeMeLabel: B('Write me', '写邮件'),
      secondaryLbl: B('Secondary link ↗', '其他链接 ↗'),
      secondaryUrl: '#',
    },
    colophon: {
      signoff,
      fontsLine: B(
        'Typography and colors are editable in Style.',
        '字体与色彩可在风格编辑器调整。',
      ),
      handCodedLine: B(
        'Static by default. No tracking. No cookies.',
        '默认纯静态。无追踪。无 cookie。',
      ),
    },
  }
}

const STARTER_TEXTS = createTemplateTexts()
const ORGANIC_TEXTS = createTemplateTexts({
  metaRole: B('CREATIVE TECHNOLOGIST', '创意技术'),
  metaSchool: B('FIELD NOTES · WEB · SOUND', '田野笔记 · 网页 · 声音'),
  wordA: B('Field', '田野'),
  wordB: B('Notes & Interfaces', '笔记与界面'),
  wordD: B('in Hangzhou', '杭州'),
  sealChar: '林',
  langItems: [B('Chinese (native)', '中文（母语）'), B('English (working)', '英文（工作语言）')],
  nowItems: [B('Building field archives', '正在制作田野档案')],
  contactEn: 'Open to thoughtful collaborations across web, image, sound, and field research.',
  contactZh: '欢迎网页、影像、声音与田野研究之间的认真合作。',
  signoff: B(
    'A field notebook for things that are still growing.',
    '一本写给仍在生长之物的田野笔记。',
  ),
})
const FILM_TEXTS = createTemplateTexts({
  metaRole: B('FILMMAKER · EDITOR', '影像创作 · 剪辑'),
  metaSchool: B('MOVING IMAGE ARCHIVE', '活动影像档案'),
  wordA: B('Moving', '活动'),
  wordB: B('Images & Edits', '影像与剪辑'),
  wordD: B('in Shanghai', '上海'),
  sealChar: '映',
  langItems: [B('Chinese (native)', '中文（母语）'), B('English (working)', '英文（工作语言）')],
  nowItems: [B('Editing a short film', '正在剪辑一部短片')],
  contactEn: 'Open to short-film, editing, title-design, and moving-image collaborations.',
  contactZh: '欢迎短片、剪辑、片头设计与活动影像合作。',
  signoff: B('A small screening room for work in progress.', '一间放映未完成作品的小房间。'),
})
const DIGITAL_TEXTS = createTemplateTexts({
  metaRole: B('FRONTEND · DATA DESIGN', '前端 · 数据设计'),
  metaSchool: B('WEB SYSTEMS ARCHIVE', '网页系统档案'),
  wordA: B('Code', '代码'),
  wordB: B('Interfaces & Data', '界面与数据'),
  wordD: B('Online', '线上'),
  sealChar: '节',
  langItems: [B('Chinese / English', '中文 / 英文')],
  nowItems: [B('Shipping editable web systems', '正在发布可编辑网页系统')],
  contactEn: 'Open to frontend systems, data interfaces, and design-engineering collaborations.',
  contactZh: '欢迎前端系统、数据界面与设计工程合作。',
  signoff: B(
    'An editable archive built from content, modules, and visual tokens.',
    '一个由内容、模块与视觉 token 组成的可编辑档案。',
  ),
})

export const STARTER_TEMPLATE = {
  SITE: {
    url: '',
    name: { en: '<Your name>', zh: '<你的名字>' },
    nameRight: { en: 'X.', zh: '字' },
    nameFull: { en: '<Your Full Name>', zh: '<你的全名>' },
    glyph: 'X',
    portrait: '',
    ogImage: '',
    googleSiteVerification: '',
    cvPdf: '',
    tagline: { en: '<One-line intro>', zh: '<一句话简介>' },
    role: { en: '<Your role>', zh: '<你的身份>' },
    status: { en: 'Reading', zh: '在读' },
    statusObject: { en: '<book/film/podcast>', zh: '<书名/片名等>' },
    location: { en: '<City, Country>', zh: '<城市, 国家>' },
    timezone: 'UTC+0',
    tzName: 'UTC',
    email: '<you@example.com>',
    now: { en: "<Longer 'now' paragraph>", zh: '<更长的「正在做什么」段落>' },
    nowDate: { en: 'Month Year, City', zh: '月份 年份, 城市' },
    social: [{ label: { en: 'GitHub', zh: 'GitHub' }, handle: '@user', url: '#' }],
  },
  ABOUT: {
    intro: { en: '<Open paragraph>', zh: '<开场段落>' },
    paragraphs: [{ en: '<Paragraph 2>', zh: '<第二段>' }],
    stats: [
      { label: { en: 'Works', zh: '作品' }, value: '*0*' },
      { label: { en: 'Years', zh: '年数' }, value: '*0*' },
      { label: { en: 'Languages', zh: '语言' }, value: { en: '*EN* · CN', zh: '*中* · 英' } },
      { label: { en: 'Status', zh: '状态' }, value: { en: '*Open to work*', zh: '*开放合作*' } },
    ],
    cv: { edu: [], work: [], awards: [], skills: [] },
  },
  JOURNEY: [
    {
      id: 1,
      year: '<Year>',
      label: { en: '<Label>', zh: '<标签>' },
      place: { en: '<Place>', zh: '<地点>' },
      title: { en: '*<Title>*', zh: '*<标题>*' },
      text: { en: '<Story>', zh: '<故事>' },
      tags: [],
      chapter: 'I',
      image: '',
    },
  ],
  WORKS: [
    {
      id: '<work-slug>',
      title: { en: '<Work title>', zh: '<作品名>' },
      subtitle: { en: '<Subtitle>', zh: '<副标题>' },
      medium: 'short',
      role: { en: '<Role>', zh: '<角色>' },
      year: '<Year>',
      cover: 'cover-1',
      coverImg: '',
      summary: { en: '<Brief summary>', zh: '<简介>' },
      tags: [],
      field: {
        year: '<Year>',
        format: { en: '<Format>', zh: '<格式>' },
        role: { en: '<Role>', zh: '<角色>' },
        crew: { en: '<Crew>', zh: '<团队>' },
        festivals: { en: '—', zh: '—' },
        status: { en: '<Status>', zh: '<状态>' },
      },
      body: [{ en: '<Details>', zh: '<详情>' }],
    },
  ],
  BOOKS: [
    {
      title: { en: '<Book title>', zh: '<书名>' },
      author: '<Author>',
      year: '<Year>',
      stars: 5,
      color: '#1a1814',
      text: '#e8dfcb',
      coverImg: '',
      note: { en: '<Note>', zh: '<短评>' },
    },
  ],
  USER_READING_LOG: [
    {
      id: 'r-1',
      date: '<YYYY.MM>',
      title: { en: '<Book title>', zh: '<书名>' },
      author: '<Author>',
      stars: 5,
      status: 'finished',
      cover: '',
      excerpt: { en: '<Thoughts>', zh: '<感想>' },
    },
  ],
  FILMS: [
    {
      title: '<Film title>',
      subtitle: '<原名/中译>',
      year: '<Year>',
      director: '<Director>',
      coverImg: '',
      note: { en: '<Note>', zh: '<短评>' },
    },
  ],
  MUSIC: [
    {
      track: '<Track>',
      artist: '<Artist>',
      album: '<Album>',
      duration: '0:00',
      mood: { en: '<Mood>', zh: '<心境>' },
      note: { en: '<Note>', zh: '<感受>' },
      spotifyId: '',
      neteaseId: '',
      audio: '',
    },
  ],
  PHOTO_SERIES: TEMPLATE_PHOTO_SERIES,
  PHOTOS: [],
  READING_LOG: [],
  TRAVEL: [
    {
      city: { en: '<City>', zh: '<城市>' },
      country: { en: '<Country>', zh: '<国家>' },
      year: '<Year>',
      kind: 'trip',
      lat: 0,
      lon: 0,
      note: { en: '<Note>', zh: '<备注>' },
    },
  ],
  NOW_PLAYING: {
    spotify: [],
    netease: [],
    html5: [],
  },
  NAV: TEMPLATE_NAV,
  MODULES: {
    about: {
      enabled: true,
      nav: true,
      order: 1,
      label: { en: 'About', zh: '关于' },
      layout: 'default',
    },
    journey: {
      enabled: true,
      nav: true,
      order: 2,
      label: { en: 'Reel', zh: '影格' },
      layout: 'default',
    },
    works: {
      enabled: true,
      nav: true,
      order: 3,
      label: { en: 'Works', zh: '作品集' },
      layout: 'default',
    },
    library: {
      enabled: true,
      nav: true,
      order: 4,
      label: { en: 'Stacks', zh: '私藏' },
      layout: 'default',
    },
    photography: {
      enabled: true,
      nav: true,
      order: 5,
      label: { en: 'Stills', zh: '影像' },
      layout: 'default',
    },
    travel: {
      enabled: true,
      nav: true,
      order: 6,
      label: { en: 'Atlas', zh: '足迹' },
      layout: 'default',
    },
    contact: {
      enabled: true,
      nav: true,
      order: 7,
      label: { en: 'Signal', zh: '联系' },
      layout: 'default',
    },
    colophon: {
      enabled: true,
      nav: false,
      order: 8,
      label: { en: 'Colophon', zh: '落款' },
      layout: 'default',
    },
    cvButton: {
      enabled: true,
      nav: false,
      order: 90,
      label: { en: 'Full CV', zh: '完整简历' },
      layout: 'default',
    },
    nowPlaying: {
      enabled: true,
      nav: false,
      order: 99,
      label: { en: 'Now Playing', zh: '播放中' },
      layout: 'default',
    },
  },
  TEXTS: STARTER_TEXTS,
}

const TEMPLATE_MODULES = {
  about: { enabled: true, nav: true, order: 1, label: B('About', '关于'), layout: 'default' },
  journey: { enabled: true, nav: true, order: 2, label: B('Reel', '影格'), layout: 'default' },
  works: { enabled: true, nav: true, order: 3, label: B('Works', '作品'), layout: 'default' },
  library: { enabled: true, nav: true, order: 4, label: B('Library', '私藏'), layout: 'default' },
  photography: {
    enabled: true,
    nav: true,
    order: 5,
    label: B('Stills', '影像'),
    layout: 'default',
  },
  travel: { enabled: true, nav: true, order: 6, label: B('Atlas', '足迹'), layout: 'default' },
  contact: { enabled: true, nav: true, order: 7, label: B('Contact', '联系'), layout: 'default' },
  colophon: {
    enabled: true,
    nav: false,
    order: 8,
    label: B('Colophon', '落款'),
    layout: 'default',
  },
  cvButton: {
    enabled: true,
    nav: false,
    order: 90,
    label: B('Full CV', '完整简历'),
    layout: 'default',
  },
  nowPlaying: {
    enabled: true,
    nav: false,
    order: 99,
    label: B('Now Playing', '播放中'),
    layout: 'default',
  },
}

export const FIELD_TEMPLATES = {
  SITE: [
    {
      id: 'site-organic',
      label: '自然系身份',
      value: {
        url: '',
        name: B('LIN', '林'),
        nameRight: B('M.', '木'),
        nameFull: B('Lin Mu', '林木'),
        glyph: 'L',
        portrait: '/picture/template-organic-portrait.svg',
        ogImage: '',
        googleSiteVerification: '',
        cvPdf: '',
        tagline: B(
          'A field notebook for web, image, and sound experiments.',
          '一本关于网页、影像与声音实验的田野笔记。',
        ),
        role: B('Creative technologist and visual researcher', '创意技术与视觉研究者'),
        status: B('Collecting', '正在采集'),
        statusObject: B('Leaf shadows and field notes', '叶影与田野笔记'),
        location: B('Hangzhou, China', '中国杭州'),
        timezone: 'UTC+8',
        tzName: 'Asia/Shanghai',
        email: 'hello@example.com',
        now: B(
          'Building a small archive of walks, sketches, and interface studies.',
          '正在整理一组关于散步、草图和界面研究的小档案。',
        ),
        nowDate: B('May 2026, Hangzhou', '2026 年 5 月，杭州'),
        social: [
          { label: B('GitHub', 'GitHub'), handle: '@yourname', url: '#' },
          {
            label: B('Email', '邮箱'),
            handle: 'hello@example.com',
            url: 'mailto:hello@example.com',
          },
        ],
      },
    },
    {
      id: 'site-digital',
      label: '数字档案身份',
      value: {
        url: '',
        name: B('NODE', '节点'),
        nameRight: B('N.', '点'),
        nameFull: B('Node Archive', '节点档案'),
        glyph: 'N',
        portrait: '/picture/template-digital-portrait.svg',
        ogImage: '',
        googleSiteVerification: '',
        cvPdf: '',
        tagline: B(
          'A structured portfolio for code, data, and interface experiments.',
          '一个用于代码、数据与界面实验的结构化作品集。',
        ),
        role: B('Frontend developer and data designer', '前端开发与数据设计'),
        status: B('Shipping', '正在发布'),
        statusObject: B('Editable portfolio systems', '可编辑作品集系统'),
        location: B('Online', '线上'),
        timezone: 'UTC+8',
        tzName: 'Asia/Shanghai',
        email: 'hello@example.com',
        now: B(
          'Separating content data, visual tokens, and module structure into cleaner layers.',
          '正在把内容数据、视觉 token 和模块结构拆成更清晰的层。',
        ),
        nowDate: B('May 2026', '2026 年 5 月'),
        social: [{ label: B('GitHub', 'GitHub'), handle: '@yourname', url: '#' }],
      },
    },
  ],
  ABOUT: [
    {
      id: 'about-creator',
      label: '创作者简介',
      value: {
        intro: B(
          'I make small digital systems that connect images, interfaces, and everyday observations.',
          '我制作连接影像、界面与日常观察的小型数字系统。',
        ),
        paragraphs: [
          B(
            'My work moves between visual research, frontend craft, and quiet interaction design.',
            '我的工作在视觉研究、前端制作与安静的交互设计之间移动。',
          ),
          B(
            'I like tools that feel personal without becoming decorative, and archives that invite people to wander.',
            '我喜欢有个人气质但不只停留在装饰的工具，也喜欢邀请人慢慢游走的档案。',
          ),
        ],
        stats: [
          { label: B('Projects', '项目'), value: '*8*' },
          {
            label: B('Mediums', '媒介'),
            value: B('*Web* · Image · Sound', '*网页* · 影像 · 声音'),
          },
          { label: B('Mode', '状态'), value: B('*Open to collaboration*', '*开放合作*') },
        ],
        cv: { edu: [], work: [], awards: [], skills: [] },
      },
    },
  ],
  JOURNEY: [
    {
      id: 'journey-field-note',
      label: '田野节点',
      value: {
        id: 1,
        year: '2026',
        label: B('Field note', '田野笔记'),
        place: B('A small route', '一条小路'),
        title: B('*A walk* became a method.', '*一次散步*变成了方法。'),
        text: B(
          'A short observation turned into a recurring way of collecting images, sounds, and interface ideas.',
          '一次短暂观察变成了一种反复采集影像、声音和界面想法的方法。',
        ),
        tags: ['walk', 'note'],
        chapter: 'I',
        image: '/journey/template-organic-journey.svg',
      },
    },
  ],
  WORKS: [
    {
      id: 'work-case-study',
      label: '作品案例',
      value: {
        id: 'new-work',
        title: B('New Work', '新作品'),
        subtitle: B('editable case study', '可编辑案例'),
        medium: 'design',
        role: B('Designer / Developer', '设计 / 开发'),
        year: '2026',
        cover: 'cover-1',
        coverImg: '/works/template-digital-work.svg',
        summary: B(
          'A concise project summary that explains the problem, approach, and result.',
          '一句说明问题、方法与结果的项目简介。',
        ),
        tags: ['React', 'Design'],
        field: {
          year: '2026',
          format: B('Web project', '网页项目'),
          role: B('Designer / Developer', '设计 / 开发'),
          crew: B('Solo', '独立'),
          festivals: B('Prototype', '原型'),
          status: B('In progress', '进行中'),
        },
        body: [
          B(
            'Use this paragraph to describe what changed, what you learned, and why the work matters.',
            '用这一段说明它改变了什么、你学到了什么，以及这个作品为什么重要。',
          ),
        ],
      },
    },
  ],
  BOOKS: [
    {
      id: 'book-note',
      label: '阅读笔记',
      value: {
        title: B('Book Title', '书名'),
        author: 'Author Name',
        year: '2026',
        stars: 5,
        color: '#1a1814',
        text: '#e8dfcb',
        coverImg: '/books/template-organic-book.svg',
        note: B(
          'One sentence about why this book stayed with you.',
          '一句话说明这本书为什么留下来。',
        ),
      },
    },
  ],
  FILMS: [
    {
      id: 'film-note',
      label: '观影片段',
      value: {
        title: 'Film Title',
        subtitle: 'Original / Chinese title',
        year: '2026',
        director: 'Director Name',
        coverImg: '/films/template-film-poster.svg',
        note: B(
          'A compact note about color, rhythm, or memory.',
          '一条关于色彩、节奏或记忆的短评。',
        ),
      },
    },
  ],
  MUSIC: [
    {
      id: 'music-note',
      label: '音乐条目',
      value: {
        track: 'Track name',
        artist: 'Artist',
        album: 'Album',
        duration: '3:30',
        mood: B('Quiet', '安静'),
        note: B(
          'A short note about when this track fits the page.',
          '一句说明这首歌适合页面里的哪个时刻。',
        ),
        spotifyId: '',
        neteaseId: '',
        audio: '',
      },
    },
  ],
  PHOTOS: [
    {
      id: 'photo-series-item',
      label: '照片系列条目',
      value: {
        id: 'p1',
        series: 'walks',
        caption: B('A placeholder image for a visual sequence.', '视觉序列中的一张占位图。'),
        date: '2026.05',
        camera: 'Template SVG',
        color: '#6f8f5f',
        image: '/photos/template-organic-photo.svg',
      },
    },
  ],
}

export const CONTENT_PRESETS = [
  {
    id: 'organic',
    label: '自然系 / Organic',
    description: '森林、手作、慢节奏创作者档案。会给 portrait 填入森林里的卡通人物肖像。',
    preview: '/picture/template-organic-portrait.svg',
    stylePreset: 'organic',
    data: {
      MODULES: TEMPLATE_MODULES,
      NAV: TEMPLATE_NAV,
      TEXTS: ORGANIC_TEXTS,
      SITE: {
        url: '',
        name: B('LIN', '林'),
        nameRight: B('M.', '木'),
        nameFull: B('Lin Mu', '林木'),
        glyph: 'L',
        portrait: '/picture/template-organic-portrait.svg',
        ogImage: '',
        googleSiteVerification: '',
        cvPdf: '',
        tagline: B(
          'A quiet field notebook for web, image, and sound experiments.',
          '一本关于网页、影像与声音实验的安静田野笔记。',
        ),
        role: B('Creative technologist and visual researcher', '创意技术与视觉研究者'),
        status: B('Collecting', '正在采集'),
        statusObject: B(
          'Leaf shadows, field notes, ambient recordings',
          '叶影、田野笔记与环境录音',
        ),
        location: B('Hangzhou, China', '中国杭州'),
        timezone: 'UTC+8',
        tzName: 'Asia/Shanghai',
        email: 'hello@forest-notes.site',
        now: B(
          'Building a small archive of walks, sketches, and interface studies. Most days begin with a notebook and end with a prototype.',
          '正在整理一组关于散步、草图和界面研究的小档案。多数日子从一本笔记开始，以一个原型结束。',
        ),
        nowDate: B('May 2026, Hangzhou', '2026 年 5 月，杭州'),
        social: [
          { label: B('GitHub', 'GitHub'), handle: '@forest-notes', url: '#' },
          { label: B('Instagram', 'Instagram'), handle: '@lin.field', url: '#' },
          {
            label: B('Email', '邮箱'),
            handle: 'hello@forest-notes.site',
            url: 'mailto:hello@forest-notes.site',
          },
        ],
      },
      ABOUT: {
        intro: B(
          'I make gentle digital tools for people who like walking, collecting, and noticing small changes in light.',
          '我制作温和的数字工具，给那些喜欢散步、收集、观察光线细小变化的人使用。',
        ),
        paragraphs: [
          B(
            'My work moves between interface design, nature writing, and small sound sketches. I care about systems that feel alive without becoming loud.',
            '我的工作在界面设计、自然书写和小型声音草图之间移动。我在意那些有生命感、但不吵闹的系统。',
          ),
          B(
            'This site is arranged like a field journal: projects, references, photographs, and routes all sit in the same notebook.',
            '这个网站像一本田野笔记：项目、参考、照片和路线被放在同一本册子里。',
          ),
        ],
        stats: [
          { label: B('Field notes', '田野笔记'), value: '*128*' },
          { label: B('Prototypes', '原型'), value: '*16*' },
          {
            label: B('Tools', '工具'),
            value: B('*React* · Figma · Audio', '*React* · Figma · 声音'),
          },
          {
            label: B('Status', '状态'),
            value: B('*Open to calm collaborations*', '*开放温和的合作*'),
          },
        ],
        cv: {
          edu: [
            {
              year: '2022 - 2026',
              title: B('Design research', '设计研究'),
              role: B('Interfaces, media, field methods', '界面、媒介与田野方法'),
              place: B('Hangzhou', '杭州'),
            },
          ],
          work: [
            {
              year: '2025',
              title: B('Independent web archive', '独立网页档案'),
              role: B('Design, frontend, writing', '设计、前端、写作'),
              place: B('Remote', '远程'),
            },
          ],
          awards: [
            {
              year: '2025',
              title: B('Student showcase', '学生作品展示'),
              role: B('Selected interface prototype', '入选界面原型'),
              place: B('Online', '线上'),
            },
          ],
          skills: [
            {
              year: 'Design',
              title: B('Figma / typography / systems', 'Figma / 字体 / 系统'),
              role: B('Quiet visual systems', '安静的视觉系统'),
              place: '-',
            },
            {
              year: 'Code',
              title: B('React / CSS / data', 'React / CSS / 数据'),
              role: B('Small maintainable tools', '小而可维护的工具'),
              place: '-',
            },
          ],
        },
      },
      JOURNEY: [
        {
          id: 1,
          year: '2022',
          label: B('First archive', '第一个档案'),
          place: B('Campus garden', '校园花园'),
          title: B('*Started* with a plant index.', '*从*一份植物索引开始。'),
          text: B(
            'A class project became a catalog of leaves, paths, and tiny interface ideas.',
            '一次课程作业变成了叶子、路径和小界面想法的目录。',
          ),
          tags: ['field', 'archive'],
          chapter: 'I',
          image: '/journey/template-organic-journey.svg',
        },
        {
          id: 2,
          year: '2024',
          label: B('Sound walks', '声音散步'),
          place: B('West Lake', '西湖'),
          title: B('*Listening* became a design method.', '*聆听*变成了一种设计方法。'),
          text: B(
            'I started recording short walks and using them as briefs for motion and layout.',
            '我开始录下短途散步，并把它们当作动态和版面的设计简报。',
          ),
          tags: ['sound', 'walk'],
          chapter: 'II',
          image: '/journey/template-organic-journey.svg',
        },
        {
          id: 3,
          year: '2026',
          label: B('Now', '当下'),
          place: B('Studio desk', '工作桌'),
          title: B('*A personal atlas* is forming.', '*一本个人地图集*正在成形。'),
          text: B(
            'The current work is a small portfolio generator that keeps content, style, and references editable.',
            '当前作品是一个小型作品集生成器，让内容、风格和参考都可以被编辑。',
          ),
          tags: ['web', 'system'],
          chapter: 'III',
          image: '/journey/template-organic-journey.svg',
        },
      ],
      WORKS: [
        {
          id: 'field-interface',
          title: B('Field Interface', '田野界面'),
          subtitle: B('web archive', '网页档案'),
          medium: 'design',
          role: B('Design / frontend', '设计 / 前端'),
          year: '2026',
          cover: 'cover-1',
          coverImg: '/works/template-organic-work.svg',
          summary: B(
            'A soft archive system for walks, notes, photos, and references.',
            '一个收纳散步、笔记、照片和参考的柔软档案系统。',
          ),
          tags: ['React', 'archive', 'nature'],
          field: {
            year: '2026',
            format: B('Responsive website', '响应式网站'),
            role: B('Designer and developer', '设计与开发'),
            crew: B('Solo', '独立完成'),
            festivals: B('Personal release', '个人发布'),
            status: B('Prototype', '原型'),
          },
          body: [
            B(
              'The system treats every project as a small specimen: title, context, method, and afterimage.',
              '这个系统把每个项目都当作一个小标本：标题、语境、方法和余像。',
            ),
          ],
        },
      ],
      BOOKS: [
        {
          title: B('The Poetics of Space', '空间诗学'),
          author: 'Gaston Bachelard',
          year: '2026',
          stars: 5,
          color: '#5f7355',
          text: '#f3ead6',
          coverImg: '/books/template-organic-book.svg',
          note: B('A reminder that rooms can think.', '提醒我房间也会思考。'),
        },
      ],
      FILMS: [
        {
          title: 'Still Walking',
          subtitle: '歩いても 歩いても',
          year: '2008',
          director: 'Hirokazu Kore-eda',
          coverImg: '/films/template-organic-poster.svg',
          note: B('Gentle structure, deep weather.', '温和的结构，很深的天气。'),
        },
      ],
      MUSIC: [
        {
          track: B('Forest Piano', '森林钢琴'),
          artist: B('Template Ensemble', '模板合奏'),
          album: 'Green Room',
          duration: '3:20',
          mood: B('Moss', '苔藓'),
          note: B('A soft placeholder track for quiet pages.', '适合安静页面的占位曲目。'),
          spotifyId: '',
          neteaseId: '',
          audio: '',
        },
      ],
      PHOTO_SERIES: TEMPLATE_PHOTO_SERIES,
      PHOTOS: [
        {
          id: 'organic-1',
          series: 'portraits',
          caption: B('Forest portrait placeholder', '森林肖像占位图'),
          date: '2026.05',
          camera: 'Template SVG',
          color: '#6f8a5f',
          image: '/photos/template-organic-photo.svg',
        },
      ],
      READING_LOG: [],
      USER_READING_LOG: [],
      TRAVEL: [
        {
          city: B('Hangzhou', '杭州'),
          country: B('China', '中国'),
          year: '2026',
          kind: 'home',
          lat: 30.25,
          lon: 120.16,
          note: B('Mist, lake, notebooks.', '雾、湖、笔记。'),
        },
        {
          city: B('Moganshan', '莫干山'),
          country: B('China', '中国'),
          year: '2025',
          kind: 'trip',
          lat: 30.61,
          lon: 119.87,
          note: B('Bamboo paths and field recordings.', '竹径与田野录音。'),
        },
        {
          city: B('Anji', '安吉'),
          country: B('China', '中国'),
          year: '2024',
          kind: 'trip',
          lat: 30.64,
          lon: 119.68,
          note: B('Green references for interface rhythm.', '给界面节奏的绿色参考。'),
        },
      ],
      NOW_PLAYING: { spotify: [], netease: [], html5: [] },
    },
  },
  {
    id: 'film',
    label: '放映室 / Film Room',
    description: '胶片、暗房、影像作品集。会填入电影感肖像和作品封面。',
    preview: '/picture/template-film-portrait.svg',
    stylePreset: 'film',
    data: {
      MODULES: TEMPLATE_MODULES,
      NAV: TEMPLATE_NAV,
      TEXTS: FILM_TEXTS,
      SITE: {
        url: '',
        name: B('REEL', '映'),
        nameRight: B('R.', '室'),
        nameFull: B('Reel Room', '放映室'),
        glyph: 'R',
        portrait: '/picture/template-film-portrait.svg',
        ogImage: '',
        googleSiteVerification: '',
        cvPdf: '',
        tagline: B(
          'A portfolio for moving images, edits, and late-night references.',
          '一个收纳活动影像、剪辑和深夜参考的作品集。',
        ),
        role: B('Filmmaker and visual editor', '影像创作者与视觉剪辑'),
        status: B('Editing', '正在剪辑'),
        statusObject: B('A short film timeline and a stack of stills', '一条短片时间线和一叠剧照'),
        location: B('Shanghai, China', '中国上海'),
        timezone: 'UTC+8',
        tzName: 'Asia/Shanghai',
        email: 'hello@reel-room.site',
        now: B(
          'Cutting a short film, rebuilding a credits sequence, and cataloging the references that keep returning.',
          '正在剪一部短片，重做一版片尾字幕，并整理那些反复出现的参考。',
        ),
        nowDate: B('May 2026, Shanghai', '2026 年 5 月，上海'),
        social: [{ label: B('Vimeo', 'Vimeo'), handle: '@reelroom', url: '#' }],
      },
      ABOUT: {
        intro: B(
          'I make short films, title cards, and visual essays about memory, rooms, and difficult light.',
          '我制作关于记忆、房间和困难光线的短片、字幕卡与视觉随笔。',
        ),
        paragraphs: [
          B(
            'The work is cinematic but small: one room, one face, one object held long enough to change.',
            '这些作品有电影感，但尺度很小：一个房间、一张脸、一个被凝视到发生变化的物件。',
          ),
        ],
        stats: [
          { label: B('Films', '影片'), value: '*9*' },
          { label: B('Cuts', '剪辑'), value: '*34*' },
          {
            label: B('Tools', '工具'),
            value: B('*DaVinci* · AE · Figma', '*DaVinci* · AE · Figma'),
          },
          { label: B('Status', '状态'), value: B('*Available for edits*', '*可接剪辑合作*') },
        ],
        cv: { edu: [], work: [], awards: [], skills: [] },
      },
      JOURNEY: [
        {
          id: 1,
          year: '2023',
          label: B('First screening', '第一次放映'),
          place: B('Black box', '黑匣子'),
          title: B('*A room* became a cinema.', '*一个房间*变成了影院。'),
          text: B(
            'A small screening changed how I thought about pacing and silence.',
            '一场小放映改变了我对节奏和沉默的理解。',
          ),
          tags: ['screening'],
          chapter: 'I',
          image: '/journey/template-film-journey.svg',
        },
        {
          id: 2,
          year: '2026',
          label: B('Now', '当下'),
          place: B('Edit bay', '剪辑室'),
          title: B('*The timeline* is the notebook.', '*时间线*就是笔记本。'),
          text: B(
            'Current work lives between edits, stills, and reference boards.',
            '当前作品存在于剪辑、剧照和参考板之间。',
          ),
          tags: ['edit'],
          chapter: 'II',
          image: '/journey/template-film-journey.svg',
        },
      ],
      WORKS: [
        {
          id: 'night-room',
          title: B('Night Room', '夜房间'),
          subtitle: B('short film', '短片'),
          medium: 'short',
          role: B('Director / editor', '导演 / 剪辑'),
          year: '2026',
          cover: 'cover-2',
          coverImg: '/works/template-film-work.svg',
          summary: B(
            'A short film about waiting for a call that never arrives.',
            '一部关于等待一个永远不会到来的电话的短片。',
          ),
          tags: ['short', 'edit'],
          field: {
            year: '2026',
            format: B('Digital short', '数字短片'),
            role: B('Director', '导演'),
            crew: B('Small crew', '小团队'),
            festivals: B('In progress', '制作中'),
            status: B('Editing', '剪辑中'),
          },
          body: [
            B(
              'The film uses one lamp and three cuts to make the room feel larger than it is.',
              '影片用一盏灯和三个剪辑点，让房间显得比实际更大。',
            ),
          ],
        },
      ],
      BOOKS: [
        {
          title: B('Sculpting in Time', '雕刻时光'),
          author: 'Andrei Tarkovsky',
          year: '2026',
          stars: 5,
          color: '#211b16',
          text: '#f5e6c8',
          coverImg: '/books/template-film-book.svg',
          note: B('Useful trouble.', '有用的麻烦。'),
        },
      ],
      FILMS: [
        {
          title: 'Paris, Texas',
          subtitle: 'Wim Wenders',
          year: '1984',
          director: 'Wim Wenders',
          coverImg: '/films/template-film-poster.svg',
          note: B('Color as distance.', '颜色作为距离。'),
        },
      ],
      MUSIC: [
        {
          track: B('Projector Hum', '放映机低鸣'),
          artist: B('Template Ensemble', '模板合奏'),
          album: 'Film Room',
          duration: '2:48',
          mood: B('Amber', '琥珀'),
          note: B('Warm noise for a dark page.', '适合暗色页面的暖噪声。'),
          spotifyId: '',
          neteaseId: '',
          audio: '',
        },
      ],
      PHOTO_SERIES: TEMPLATE_PHOTO_SERIES,
      PHOTOS: [
        {
          id: 'film-1',
          series: 'portraits',
          caption: B('Night room placeholder', '夜房间占位图'),
          date: '2026.05',
          camera: 'Template SVG',
          color: '#4f2b1d',
          image: '/photos/template-film-photo.svg',
        },
      ],
      READING_LOG: [],
      USER_READING_LOG: [],
      TRAVEL: [
        {
          city: B('Shanghai', '上海'),
          country: B('China', '中国'),
          year: '2026',
          kind: 'home',
          lat: 31.23,
          lon: 121.47,
          note: B('Screens, rain, late edits.', '银幕、雨、深夜剪辑。'),
        },
      ],
      NOW_PLAYING: { spotify: [], netease: [], html5: [] },
    },
  },
  {
    id: 'digital',
    label: '数字档案 / Digital Archive',
    description: '清晰、结构化、适合代码友好作品集和数据项目。',
    preview: '/picture/template-digital-portrait.svg',
    stylePreset: 'coldModern',
    data: {
      MODULES: TEMPLATE_MODULES,
      NAV: TEMPLATE_NAV,
      TEXTS: DIGITAL_TEXTS,
      SITE: {
        url: '',
        name: B('NODE', '节'),
        nameRight: B('N.', '点'),
        nameFull: B('Node Archive', '节点档案'),
        glyph: 'N',
        portrait: '/picture/template-digital-portrait.svg',
        ogImage: '',
        googleSiteVerification: '',
        cvPdf: '',
        tagline: B(
          'A structured portfolio for code, data, and interface experiments.',
          '一个用于代码、数据与界面实验的结构化作品集。',
        ),
        role: B('Frontend developer and data designer', '前端开发与数据设计'),
        status: B('Shipping', '正在发布'),
        statusObject: B(
          'A theme-token system and editable portfolio shell',
          '一套主题 token 系统和可编辑作品集外壳',
        ),
        location: B('Online', '线上'),
        timezone: 'UTC+8',
        tzName: 'Asia/Shanghai',
        email: 'hello@node-archive.dev',
        now: B(
          'Refactoring a personal site generator into cleaner content, module, and theme layers.',
          '正在把个人网站生成器重构为更清晰的内容层、模块层和主题层。',
        ),
        nowDate: B('May 2026', '2026 年 5 月'),
        social: [{ label: B('GitHub', 'GitHub'), handle: '@node-archive', url: '#' }],
      },
      ABOUT: {
        intro: B(
          'I build editable websites, small tools, and data interfaces with a bias for clear systems.',
          '我制作可编辑网站、小工具和数据界面，偏爱清楚的系统。',
        ),
        paragraphs: [
          B(
            'The goal is not more controls, but better defaults and safer ways to customize.',
            '目标不是更多控制项，而是更好的默认值和更安全的自定义方式。',
          ),
        ],
        stats: [
          { label: B('Components', '组件'), value: '*42*' },
          { label: B('Projects', '项目'), value: '*12*' },
          { label: B('Stack', '技术栈'), value: B('*React* · Vite · CSS', '*React* · Vite · CSS') },
          { label: B('Status', '状态'), value: B('*Open source minded*', '*偏开源思维*') },
        ],
        cv: { edu: [], work: [], awards: [], skills: [] },
      },
      JOURNEY: [
        {
          id: 1,
          year: '2024',
          label: B('First tool', '第一个工具'),
          place: B('Browser', '浏览器'),
          title: B('*A config* became an interface.', '*一份配置*变成了界面。'),
          text: B(
            'A small JSON editor started the habit of building tools around content.',
            '一个小型 JSON 编辑器让我开始围绕内容构建工具。',
          ),
          tags: ['tool'],
          chapter: 'I',
          image: '/journey/template-digital-journey.svg',
        },
        {
          id: 2,
          year: '2026',
          label: B('Now', '当下'),
          place: B('Localhost', '本地开发'),
          title: B('*Tokens* control the surface.', '*Token*控制界面表层。'),
          text: B(
            'Current work separates content data, visual tokens, and module structure.',
            '当前工作把内容数据、视觉 token 和模块结构分开。',
          ),
          tags: ['theme'],
          chapter: 'II',
          image: '/journey/template-digital-journey.svg',
        },
      ],
      WORKS: [
        {
          id: 'style-system',
          title: B('Style System', '风格系统'),
          subtitle: B('editable theme tokens', '可编辑主题 token'),
          medium: 'design',
          role: B('Frontend / system design', '前端 / 系统设计'),
          year: '2026',
          cover: 'cover-3',
          coverImg: '/works/template-digital-work.svg',
          summary: B(
            'A local-first theme editor for portfolio websites.',
            '一个本地优先的作品集主题编辑器。',
          ),
          tags: ['React', 'tokens'],
          field: {
            year: '2026',
            format: B('SPA', '单页应用'),
            role: B('Developer', '开发'),
            crew: B('Solo', '独立'),
            festivals: B('Template release', '模板发布'),
            status: B('Active', '进行中'),
          },
          body: [
            B(
              'The system maps friendly controls to CSS variables so the page changes immediately.',
              '系统把友好的控制项映射到 CSS 变量，让页面立即变化。',
            ),
          ],
        },
      ],
      BOOKS: [
        {
          title: B('Designing Data-Intensive Applications', '数据密集型应用系统设计'),
          author: 'Martin Kleppmann',
          year: '2026',
          stars: 5,
          color: '#d8e4ff',
          text: '#140f2d',
          coverImg: '/books/template-digital-book.svg',
          note: B('Systems thinking for calm interfaces.', '给安静界面的系统思维。'),
        },
      ],
      FILMS: [
        {
          title: 'Her',
          subtitle: 'Interface mood reference',
          year: '2013',
          director: 'Spike Jonze',
          coverImg: '/films/template-digital-poster.svg',
          note: B('A soft machine feeling.', '柔软的机器感。'),
        },
      ],
      MUSIC: [
        {
          track: B('Signal Path', '信号路径'),
          artist: B('Template Ensemble', '模板合奏'),
          album: 'Digital Archive',
          duration: '3:05',
          mood: B('Signal', '信号'),
          note: B('Clean pulse for structured pages.', '适合结构化页面的清晰脉冲。'),
          spotifyId: '',
          neteaseId: '',
          audio: '',
        },
      ],
      PHOTO_SERIES: TEMPLATE_PHOTO_SERIES,
      PHOTOS: [
        {
          id: 'digital-1',
          series: 'portraits',
          caption: B('Screen portrait placeholder', '屏幕肖像占位图'),
          date: '2026.05',
          camera: 'Template SVG',
          color: '#2563eb',
          image: '/photos/template-digital-photo.svg',
        },
      ],
      READING_LOG: [],
      USER_READING_LOG: [],
      TRAVEL: [
        {
          city: B('Online', '线上'),
          country: B('Network', '网络'),
          year: '2026',
          kind: 'home',
          lat: 30.25,
          lon: 120.16,
          note: B('Most routes begin in localhost.', '多数路线从 localhost 开始。'),
        },
      ],
      NOW_PLAYING: { spotify: [], netease: [], html5: [] },
    },
  },
]

// ════════════════════════════════════════════════════════════════════
