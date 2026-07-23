export const MODULE_MANIFEST = [
  {
    id: 'about',
    editorKey: 'ABOUT',
    quickKey: 'ABOUT',
    editorLabel: 'About · 个人简介 + CV 入口',
    page: true,
  },
  {
    id: 'journey',
    editorKey: 'JOURNEY',
    quickKey: 'JOURNEY',
    editorLabel: 'Journey · 时间线 / 自传影格',
    page: true,
  },
  {
    id: 'works',
    editorKey: 'WORKS',
    quickKey: 'WORKS',
    editorLabel: 'Works · 作品集',
    page: true,
  },
  {
    id: 'library',
    editorKey: 'BOOKS',
    quickKey: 'BOOKS',
    editorLabel: 'Library · 书 / 影 / 音 / Reading Log',
    page: true,
  },
  {
    id: 'photography',
    editorKey: 'PHOTOS',
    quickKey: 'PHOTOS',
    editorLabel: 'Photography · 接触印相 + 灯箱',
    page: true,
  },
  {
    id: 'travel',
    editorKey: 'TRAVEL',
    quickKey: 'TRAVEL',
    editorLabel: 'Travel · 地图 + 城市列表',
    page: true,
  },
  {
    id: 'contact',
    editorKey: 'TEXTS',
    quickKey: 'CONTACT',
    editorLabel: 'Contact · 状态板 + 邮箱',
    page: true,
  },
  {
    id: 'colophon',
    editorKey: 'TEXTS',
    quickKey: 'COLOPHON',
    editorLabel: 'Colophon · 落款 / 字体说明',
    page: true,
  },
  {
    id: 'cvButton',
    editorLabel: 'About sidebar · Full CV 按钮',
    page: false,
  },
  {
    id: 'nowPlaying',
    editorKey: 'NOW_PLAYING',
    quickKey: 'NOW_PLAYING',
    editorLabel: 'NowPlaying · 右下角播放器',
    page: true,
  },
]

export const PAGE_MODULE_MANIFEST = MODULE_MANIFEST.filter(module => module.page)
export const MODULE_IDS = new Set(MODULE_MANIFEST.map(module => module.id))
