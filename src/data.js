// Helper: bilingual string
const L = (en, zh) => ({ en, zh })

// Picks string for current language with zh -> en fallback.
export function pick(v, lang) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && (v.en || v.zh)) {
    return v[lang] || v.zh || v.en || ''
  }
  // Defensive: never return a raw object. React can't render it safely.
  return typeof v === 'object' ? '' : String(v)
}

// <<< EDITOR:CONTENT START >>>
export const SITE = {
  url: 'https://personal-website-x3u4.onrender.com', // 生产域名：canonical / og:url / sitemap 的唯一来源
  portrait: '/picture/miles.jpg', // Landing / About 肖像
  ogImage: '/og-cover.jpg', // 1200x630 社交分享封面；与 portrait 分离，避免大卡裁切
  googleSiteVerification: '', // Search Console URL-prefix 验证 token；留空时不输出 meta
  name: L('CHEN', '陈'),
  nameRight: L('A.', '安'),
  nameFull: L('Chen A.', '陈安'),
  glyph: 'C',
  cvPdf: '', // optional /docs/cv.pdf — overrides print behavior
  tagline: L(
    'Film student in Hangzhou. A slow notebook of frames, sounds, and things I am still learning to see.',
    '电影方向的学生，在杭州。这是一本慢慢生长的笔记本——影像、声音，以及还在学着「看见」的事物。',
  ),
  role: L(
    'B.A. Communication Studies, Film & Visual/Audio Direction',
    '传播学・影视与视听方向 本科在读',
  ),
  status: L('Watching', '在看'),
  statusObject: L('Wim Wenders — Tokyo-Ga (1985)', '维姆・文德斯《寻找小津》（1985）'),
  location: L('Hangzhou, China', '中国杭州'),
  timezone: 'UTC+8',
  email: 'chen@frame.studio',
  social: [
    { label: L('Letterboxd', 'Letterboxd'), handle: '@chen_a', url: '#' },
    { label: L('Instagram', 'Instagram'), handle: '@chen.frames', url: '#' },
    { label: L('Are.na', 'Are.na'), handle: '/chen-a', url: '#' },
    { label: L('RED · 小红书', '小红书'), handle: '@小陈拍片', url: '#' },
    { label: L('Email', '邮箱'), handle: 'chen@frame.studio', url: 'mailto:chen@frame.studio' },
  ],
  now: L(
    "Mid-term: finishing a 12-min short shot in West Lake fog at 5am. Reading Tarkovsky's Sculpting in Time again — slower this time. Practicing field recording with a Zoom H5 every Tuesday.",
    '学期中：一部 12 分钟的短片快剪完了，是在西湖凌晨五点的雾里拍的。重读塔可夫斯基《雕刻时光》，比上次慢。每周二带 Zoom H5 去做实地录音。',
  ),
  nowDate: L('May 2026, Hangzhou', '2026 年 5 月，杭州'),
}

export const NAV = [
  { num: '00', id: 'home', label: L('Frame 00', '片头'), en: L('home', '首页') },
  { num: '01', id: 'about', label: L('About', '关于'), en: L('biography', '简介') },
  { num: '02', id: 'journey', label: L('Reel', '影格'), en: L('journey', '旅程') },
  { num: '03', id: 'works', label: L('Works', '作品集'), en: L('portfolio', '作品集') },
  { num: '04', id: 'library', label: L('Stacks', '私藏'), en: L('library', '书影音') },
  { num: '05', id: 'photography', label: L('Stills', '影像'), en: L('photography', '摄影') },
  { num: '06', id: 'travel', label: L('Atlas', '足迹'), en: L('travel', '去过的地方') },
  { num: '07', id: 'contact', label: L('Signal', '联络'), en: L('contact', '联系') },
]

export const ABOUT = {
  intro: L(
    "I'm Chen — a third-year student in Communication Studies, specialising in film and visual / audio direction. I make short films, mostly about the cities I have lived in, and write about images when I can't film them.",
    '我是陈安，传播学院影视与视听方向的大三学生。拍短片，多数关于我生活过的城市；拍不到的时候，就写——写关于影像的事。',
  ),
  paragraphs: [
    L(
      'I was born in Hangzhou and have never quite left — I went to school here, study here, and I suspect I will keep returning even after I leave. The West Lake is the first thing I learned to look at properly.',
      '我生在杭州，从未真正离开过——上学在这里，读书在这里，我猜即使将来走远，仍会一次次回来。西湖，是我学着「认真看」的第一样东西。',
    ),
    L(
      "My practice circles three things: long-take films, field recording, and the small essay-form. The films are slow; the recordings are quieter than the films; the essays try to explain why. I'm interested in cinema as a way of paying attention — not a way of telling stories.",
      '我的实践围绕三件事：长镜头的影片、实地录音、短篇影评。影片是慢的；录音比影片更安静；文字则试着解释这一切。我把电影当作一种「注意」的方式——而非讲故事的方式。',
    ),
    L(
      'Currently working on a 30-minute documentary about night taxi drivers in Hangzhou — a film I have been failing to finish for nine months. I am also reading too much Tarkovsky and too little Bresson.',
      '目前在做一部 30 分钟的纪录片，关于杭州夜班出租车司机——这片子我已经「拍不完」整整九个月。同时，塔可夫斯基读得太多，布列松读得太少。',
    ),
  ],
  cv: {
    edu: [
      {
        year: '2023 – present',
        title: L('B.A. Communication Studies', '传播学院本科'),
        role: L(
          'Film & Visual/Audio Direction · expected 2027',
          '影视与视听方向・预计 2027 年毕业',
        ),
        place: L('Hangzhou', '杭州'),
      },
      {
        year: '2020 – 2023',
        title: L('Hangzhou High School', '杭州某高中'),
        role: L('Art track · film club founder', '美术方向・电影社创办人'),
        place: L('Hangzhou', '杭州'),
      },
    ],
    work: [
      {
        year: '2025 – present',
        title: L('Camera assistant, *Mist Studio*', '雾工作室・摄影助理'),
        role: L(
          'Independent shorts, music videos, occasional commercials.',
          '独立短片、MV、偶尔的广告。',
        ),
        place: L('Hangzhou', '杭州'),
      },
      {
        year: '2024',
        title: L('Editor, *西湖回声* (campus newsletter)', '《西湖回声》校刊编辑'),
        role: L(
          'Edited the visual section. Designed three issues from scratch.',
          '负责视觉版面，独立设计了三期。',
        ),
        place: L('Campus', '校园'),
      },
    ],
    awards: [
      {
        year: '2025',
        title: L(
          'Student Selection · *Beijing Student Film Festival*',
          '北京大学生电影节・学生作品入围',
        ),
        role: L(
          'For *Tide* (5 min, b&w 16mm short).',
          '凭借短片《潮》入围（5 分钟，16 毫米黑白）。',
        ),
        place: L('Beijing', '北京'),
      },
      {
        year: '2024',
        title: L('Honourable Mention · *Hangzhou Youth Image Awards*', '杭州青年影像奖・特别提及'),
        role: L('Documentary category, for *Late Bus*.', '纪录片单元，作品《末班车》。'),
        place: L('Hangzhou', '杭州'),
      },
    ],
    skills: [
      {
        year: 'Camera',
        title: L('Sony FX3 · Bolex H16 (recently)', 'Sony FX3・Bolex H16（最近开始用）'),
        role: L('Prefer fixed long takes; resisting handheld.', '偏好固定长镜头；克制晃镜的冲动。'),
        place: '—',
      },
      {
        year: 'Sound',
        title: L('Zoom H5 · Sennheiser MKH-416', 'Zoom H5・森海塞尔 MKH-416'),
        role: L(
          'Field recording for ambience + ADR for fiction.',
          '环境实地录音，配虚构片段的 ADR。',
        ),
        place: '—',
      },
      {
        year: 'Edit',
        title: L('DaVinci Resolve · Pro Tools', '达芬奇 Resolve・Pro Tools'),
        role: L(
          'Cut on Resolve, mix in Pro Tools, never the other way.',
          'Resolve 剪，Pro Tools 混；从不调换。',
        ),
        place: '—',
      },
      {
        year: 'Design',
        title: L('InDesign · Figma · Glyphs', 'InDesign・Figma・Glyphs'),
        role: L(
          'For posters, zines, the occasional title sequence.',
          '海报、独立刊物、偶尔的片头字幕。',
        ),
        place: '—',
      },
    ],
  },
  stats: [
    { label: L('Shorts directed', '执导短片'), value: '*7*' },
    { label: L('Years filming', '拍摄年数'), value: '*4*' },
    { label: L('Languages', '语言'), value: L('*中文* · English', '*中文* · 英文') },
    {
      label: L('Status', '状态'),
      value: L('Student. *Open to assistant gigs*.', '在读・*开放摄影/录音助理合作*'),
    },
  ],
}

export const JOURNEY = [
  {
    id: 1,
    year: 2004,
    label: L('Born', '出生'),
    place: L('Hangzhou', '杭州'),
    title: L('*A lake city.*', '*一座湖城。*'),
    text: L(
      "Born in Hangzhou. Three things from very early: a tape deck, a small black-and-white TV, and my grandfather's habit of walking around the West Lake every Sunday. I think this is the entire shape of me.",
      '生于杭州。很早的三样东西：一台磁带机、一台小小的黑白电视、外公每个周日绕西湖散步的习惯。我大概的形状，就是这三样东西。',
    ),
    tags: ['origin', '杭州'],
    chapter: 'I',
  },
  {
    id: 2,
    year: 2012,
    label: L('First camera', '第一台相机'),
    place: L('Hangzhou', '杭州'),
    title: L('*A used Canon 550D.*', '*一台二手的 Canon 550D。*'),
    text: L(
      "Aged 8. My uncle's old DSLR. I shot 4,000 frames in the first week — mostly of the cat. I have lost all of them, which is the first cinematic lesson: most footage is for nothing, and that's fine.",
      '八岁。叔叔的旧单反。第一周拍了四千张——大部分是猫。后来全都丢了。这是关于影像的第一课：大部分素材都没有用，这没关系。',
    ),
    tags: ['camera', 'early'],
    chapter: 'I',
  },
  {
    id: 3,
    year: 2017,
    label: L('Saw In the Mood for Love', '《花样年华》'),
    place: L('Cinema', '影院'),
    title: L('*The first film that broke me.*', '*第一次被电影击中。*'),
    text: L(
      'Aged 13, a re-release at a small art cinema. The noodle-shop scene. I left the theatre changed in some way I am still describing.',
      '十三岁，小放映厅的复映场。面摊那段。走出影院的时候，我有种被改写的感觉——这种感觉，至今还在描述。',
    ),
    tags: ['王家卫', 'epiphany'],
    chapter: 'II',
  },
  {
    id: 4,
    year: 2020,
    label: L('Film club', '电影社'),
    place: L('High school', '高中'),
    title: L('*Founded a high-school film club.*', '*创办了高中电影社。*'),
    text: L(
      'Seven of us. We watched one Tarkovsky a month and argued about it for the next four weeks. We made one short — about a girl who waits for a bus that never comes. It is bad. I love it.',
      '我们七个人。每月看一部塔可夫斯基，然后吵上四个礼拜。社团拍了一部短片——一个女孩等一辆永远不来的车。片子很差，我爱它。',
    ),
    tags: ['club', '学生时代'],
    chapter: 'II',
  },
  {
    id: 5,
    year: 2023,
    label: L('University', '大学'),
    place: L('Hangzhou', '杭州'),
    title: L('*Film & visual/audio direction.*', '*影视与视听方向。*'),
    text: L(
      "Got into the communication school I'd been aiming at. First-year curriculum was 70% theory and I almost left. Second year I got my hands on a Bolex and stayed.",
      '考进了一直想去的传播学院。大一七成是理论课，我差点退学。大二上手了 Bolex，留了下来。',
    ),
    tags: ['university', '学习'],
    chapter: 'III',
  },
  {
    id: 6,
    year: 2024,
    label: L('First festival', '首次入选'),
    place: L('Hangzhou', '杭州'),
    title: L('*Late Bus — first official screening.*', '*《末班车》——首次正式放映。*'),
    text: L(
      "A 9-minute documentary about night-shift bus drivers. Got into the Hangzhou Youth Image Awards. I sat in the back row and didn't breathe for the entire screening.",
      '九分钟的纪录片，关于夜班公交司机。入选了杭州青年影像奖。我坐在最后一排，整场没敢喘气。',
    ),
    tags: ['doc', 'first'],
    chapter: 'III',
  },
  {
    id: 7,
    year: 2025,
    label: L('16mm short', '16 毫米'),
    place: L('Beijing', '北京'),
    title: L('*Tide — black-and-white 16mm.*', '*《潮》——黑白 16 毫米。*'),
    text: L(
      'Five minutes, shot on actual film stock — terrifying and expensive. Took it to the Beijing Student Film Festival. The print was scratched in the third reel. It looked better that way.',
      '五分钟，真正的胶片——又贵又紧张。带去了北京大学生电影节。第三本胶片划了一道，反而更好看。',
    ),
    tags: ['16mm', 'festival'],
    chapter: 'III',
  },
  {
    id: 8,
    year: 2026,
    label: L('Now', '当下'),
    place: L('Hangzhou', '杭州'),
    title: L('*Night taxi project.*', '*夜班出租车项目。*'),
    text: L(
      "Currently the longest thing I've tried — a 30-minute documentary about the city's night taxi drivers. Nine months in, four months to go. Probably more.",
      '目前为止我尝试过最长的——一部 30 分钟的纪录片，关于这座城市的夜班出租车司机。已经九个月，剩四个月，可能更久。',
    ),
    tags: ['now', '在做'],
    chapter: 'IV',
  },
]

export const WORKS = [
  {
    id: 'tide',
    title: L('Tide', '潮'),
    subtitle: L('5 min · 16mm b&w', '5 分钟・16 毫米黑白'),
    medium: 'short',
    role: L('Director · DP', '导演・摄影'),
    year: '2025',
    cover: 'cover-1',
    summary: L(
      'A wordless five-minute short about a girl and her grandmother spending one morning by the Qiantang river before the tidal bore arrives.',
      '一部无对白的五分钟短片：钱塘江观潮前的清晨，一个女孩与她的外婆。',
    ),
    tags: ['short', '16mm', '黑白'],
    field: {
      year: '2025',
      format: L('16mm b&w · 5 min', '16 毫米黑白・5 分钟'),
      role: L('Director, DP', '导演、摄影'),
      crew: L('4 — me, soundie, two grips', '4 人：我、录音、两位场务'),
      festivals: L('Beijing Student FF 2025', '北京大学生电影节 2025'),
      status: L('Selected', '入围'),
    },
    body: [
      L(
        "I'd never shot on film before. The decision to do so was mostly emotional — I'd been reading Tarkovsky for a year and felt that digital was lying to me. I rented a Bolex H16 from a graduate student for two days and used a single 400-foot roll.",
        '我此前没拍过胶片。这个决定多半出于情绪——我读了一年的塔可夫斯基，开始觉得数字是在骗我。从一位研究生那儿租来 Bolex H16，整整两天，只用了一卷四百英尺。',
      ),
      L(
        'Five minutes of finished film. The third reel was scratched during processing — a continuous vertical line running through the most emotional shot. I was angry for a week, then I realised it was the best thing in the film. I cut around nothing.',
        '成片五分钟。第三卷在洗片时划了——一道垂直的线，正好穿过最情绪化的那个镜头。我气了一个礼拜，后来反应过来，那是全片最好的东西。我什么也没遮，全留着。',
      ),
    ],
  },
  {
    id: 'late-bus',
    title: L('Late Bus', '末班车'),
    subtitle: L('9 min · documentary', '9 分钟・纪录片'),
    medium: 'doc',
    role: L('Director · Sound', '导演・录音'),
    year: '2024',
    cover: 'cover-2',
    summary: L(
      'Three weeks riding the last bus of the night with the same driver. A documentary about the people you meet at 23:47.',
      '连续三周，跟着同一位司机坐末班车。一部关于「23:47 你会遇到谁」的纪录片。',
    ),
    tags: ['doc', '纪录片'],
    field: {
      year: '2024',
      format: L('Digital · 9 min', '数字・9 分钟'),
      role: L('Director, Sound', '导演、录音'),
      crew: L('Solo', '独立完成'),
      festivals: L('Hangzhou Youth Image Awards 2024', '杭州青年影像奖 2024'),
      status: L('Honourable mention', '特别提及'),
    },
    body: [
      L(
        'I rode the 188 line every night for three weeks, sat in the same seat, kept the camera in my lap. The driver, Mr Wu, was 53 and had been driving the same route for 22 years. He told me he could hear the difference in the engine on rainy nights.',
        '我连着三周乘 188 路末班车，坐在同一个座位上，摄影机搁在腿上。司机吴师傅 53 岁，同一条线开了 22 年。他说，下雨天他能听出发动机的不同。',
      ),
    ],
  },
  {
    id: 'the-fog',
    title: L('Fog Without Edges', '无边的雾'),
    subtitle: L('12 min · in post', '12 分钟・后期中'),
    medium: 'short',
    role: L('Director', '导演'),
    year: '2026',
    cover: 'cover-3',
    summary: L(
      'A short shot at 5am in West Lake fog over four consecutive Sundays. Currently in post — a study in white, grey, and the patience of strangers.',
      '一部短片：连续四个周日，凌晨五点在西湖的雾里拍摄。后期中——一篇关于白、灰，以及陌生人之间耐心的研究。',
    ),
    tags: ['in-progress', '短片'],
    field: {
      year: '2026',
      format: L('Digital · 12 min', '数字・12 分钟'),
      role: L('Director', '导演'),
      crew: L('3', '3 人'),
      festivals: L('Pending', '暂未'),
      status: L('Post-production', '后期制作'),
    },
    body: [
      L(
        'The hardest film I have made. The fog only behaves correctly for about forty minutes a morning, and you cannot light it without breaking it.',
        '拍过最难的一部。雾只在每天清晨大约四十分钟里乖巧地配合，一打光就破了。',
      ),
    ],
  },
  {
    id: 'fielding',
    title: L('Fielding', '采集'),
    subtitle: L('ongoing · field recording archive', '持续中・实地录音档案'),
    medium: 'sound',
    role: L('Recordist', '录音'),
    year: '2024 –',
    cover: 'cover-4',
    summary: L(
      'An ongoing personal archive of field recordings made every Tuesday with a Zoom H5. Currently 73 entries, each a single take of a single place.',
      '一份持续的个人录音档案，每个周二用 Zoom H5 采集。目前 73 条，每条是一个地方的一个单独录音。',
    ),
    tags: ['sound', 'archive'],
    field: {
      year: '2024 –',
      format: L('Stereo, 24-bit', '立体声 24-bit'),
      role: L('Recordist', '录音'),
      crew: L('Solo', '独立'),
      festivals: L('—', '—'),
      status: L('73 entries', '73 条'),
    },
    body: [
      L(
        'Every Tuesday afternoon I go somewhere — usually walking distance — and record a single ten-minute take. No editing. I file each one with the date, place, weather, and one sentence about what I was thinking. It is the closest thing I keep to a diary.',
        '每个周二下午，我去某个地方——通常步行可达——录一段十分钟的单镜。不剪。每条按日期、地点、天气、还有「我当时在想什么」的一句话归档。这是我最接近日记的东西。',
      ),
    ],
  },
  {
    id: 'echoes-mv',
    title: L('Echoes', '回声'),
    subtitle: L('3 min · music video', '3 分钟・MV'),
    medium: 'mv',
    role: L('Director · Editor', '导演・剪辑'),
    year: '2024',
    cover: 'cover-2',
    summary: L(
      'A music video for the indie band 苇 — three minutes of one long take through the lanes behind the old paper mill, scored to a song about leaving and not.',
      '为独立乐队「苇」拍的 MV——三分钟的长镜头，穿过老纸厂背后的巷子，配着一首关于「走与不走」的歌。',
    ),
    tags: ['MV', 'long-take', 'indie'],
    field: {
      year: '2024',
      format: L('Digital · 3 min', '数字・3 分钟'),
      role: L('Director, Editor', '导演、剪辑'),
      crew: L('2 — me + AC', '2 人：我与摄影助理'),
      festivals: L('Online release · 380k views', '线上发布・38 万播放'),
      status: L('Released', '已上线'),
    },
    body: [
      L(
        'Single long take, single morning, four rehearsals before the camera rolled. The band wanted to play live; I made them mime. They forgave me when they saw the cut.',
        '单镜头，单一个清晨。开机前彩排了四遍。乐队想现场演奏，我让他们对口型。看到成片他们就原谅我了。',
      ),
    ],
  },
  {
    id: 'bsff-poster',
    title: L('BSFF Poster', 'BSFF 海报'),
    subtitle: L('print · 700×1000mm', '印刷・700×1000mm'),
    medium: 'visual',
    role: L('Designer', '设计'),
    year: '2025',
    cover: 'cover-1',
    summary: L(
      'Poster commissioned by the Beijing Student Film Festival for their 2025 student selection programme. One image, hand-set type, three Pantones.',
      '为北京大学生电影节 2025 学生作品单元设计的海报。一张图像、手工排字、三种 Pantone 专色。',
    ),
    tags: ['poster', 'print', 'type'],
    field: {
      year: '2025',
      format: L('Print · 700×1000mm', '印刷・700×1000mm'),
      role: L('Designer', '设计'),
      crew: L('Solo + 1 printer', '独立完成・配一位印工'),
      festivals: L('BSFF 2025 official poster', 'BSFF 2025 官方海报'),
      status: L('Printed', '已印刷'),
    },
    body: [
      L(
        "The brief asked for 'something cinematic.' I gave them a photograph of an empty cinema and set the entire programme title in Yu-Gothic Bold rotated 4°. The festival director said 'this is wrong in the right way.' I took it as a compliment.",
        '策展人要「电影感的设计」。我给了他们一张空空的电影厅照片，把整个单元名称用 Yu-Gothic Bold 旋转 4° 排版。节展总监说「错得很对」。我当作是夸奖。',
      ),
    ],
  },
  {
    id: 'titles',
    title: L('Spring Titles', '春日片头'),
    subtitle: L('title sequence · 60s', '片头序列・60 秒'),
    medium: 'visual',
    role: L('Designer · Editor', '设计・剪辑'),
    year: '2024',
    cover: 'cover-3',
    summary: L(
      "Opening title sequence for our school film club's 2024 showcase. Sixty seconds, twenty-three names, one slow zoom across hand-painted Chinese type.",
      '为校电影社 2024 年展映设计的片头。六十秒、二十三个名字、一段缓慢推近的手绘汉字镜头。',
    ),
    tags: ['title-sequence', 'type', 'motion'],
    field: {
      year: '2024',
      format: L('Digital · 60s', '数字・60 秒'),
      role: L('Designer, Editor', '设计、剪辑'),
      crew: L('Solo', '独立'),
      festivals: L('Club showcase', '社团展映'),
      status: L('Screened', '已放映'),
    },
    body: [
      L(
        'Twenty-three crew names hand-painted on rice paper, then photographed in sequence and assembled in After Effects with a single linear push. Total runtime: 60 seconds. Total making time: nine weeks.',
        '二十三位主创的名字，手写在宣纸上，逐张拍摄，然后在 After Effects 里以一条线性推镜串起来。成片：60 秒。制作时间：九周。',
      ),
    ],
  },
]

export const BOOKS = [
  {
    title: L('Sculpting in Time', '雕刻时光'),
    author: 'Andrei Tarkovsky',
    year: '2025',
    stars: 5,
    color: '#2a1a14',
    text: '#e8dfcb',
    note: L(
      "The bible I'm currently arguing with. Read it twice. Will read it again.",
      '我目前在「吵架」中的那本书。读了两遍。会再读一遍。',
    ),
  },
  {
    title: L('Notes on the Cinematograph', '电影手记'),
    author: 'Robert Bresson',
    year: '2025',
    stars: 5,
    color: '#0e0f13',
    text: '#d44a3a',
    note: L(
      "A book of 100 sentences. Each one is a small bomb. I keep it by my desk and open it when I'm lost.",
      '一百句话，每一句都是小炸弹。放在书桌边，迷路时翻开。',
    ),
  },
  {
    title: L('On Photography', '论摄影'),
    author: 'Susan Sontag',
    year: '2024',
    stars: 5,
    color: '#1a1814',
    text: '#e8dfcb',
    note: L(
      'The case against taking pictures, made by someone who clearly loved looking at them. Honest the whole way through.',
      '一本反对「拍照」的书，作者显然热爱「看照片」。从头到尾都诚实。',
    ),
  },
  {
    title: L('In Praise of Shadows', '阴翳礼赞'),
    author: "Tanizaki Jun'ichiro",
    year: '2024',
    stars: 5,
    color: '#26201a',
    text: '#e8dfcb',
    note: L(
      'A short essay about why East Asian aesthetics hate overhead lighting. I think about it on every set.',
      '一篇短文，关于「为什么东亚审美讨厌顶光」。每一次进场都在想。',
    ),
  },
  {
    title: L('The Lonely City', '孤独的城市'),
    author: 'Olivia Laing',
    year: '2024',
    stars: 4,
    color: '#1a2228',
    text: '#e8dfcb',
    note: L(
      'Read on the bus between Hangzhou and Shanghai. Cried at Edward Hopper, which I did not see coming.',
      '在杭州去上海的公交车上读完。读到霍珀那段哭了——没想到自己会。',
    ),
  },
  {
    title: L('West Lake Dream', '西湖梦寻'),
    author: 'Zhang Dai · 张岱',
    year: '2023',
    stars: 5,
    color: '#1a261e',
    text: '#e8dfcb',
    note: L(
      "A 17th-century writer's memory of a lake I walk around every Sunday. It hasn't changed as much as you'd think.",
      '一位十七世纪的人，回忆我每周日仍在散步的湖。变化没有想象的那么大。',
    ),
  },
  {
    title: L('The Cinema Book', '电影理论读本'),
    author: 'Pam Cook (ed.)',
    year: '2024',
    stars: 4,
    color: '#0e1424',
    text: '#e8dfcb',
    note: L(
      "Heavy. A doorstop. Useful when I need to pretend I know what 'apparatus theory' means.",
      '厚得像门挡。当我想假装懂「装置理论」时，很有用。',
    ),
  },
  {
    title: L('The Art of Looking Sideways', '侧目而视'),
    author: 'Alan Fletcher',
    year: '2024',
    stars: 5,
    color: '#241a1a',
    text: '#e8dfcb',
    note: L(
      'A 1,000-page chaos in the best way. Open it at random. Always interesting.',
      '一千页最好的混乱。随便翻开都有意思。',
    ),
  },
  {
    title: L('Camera Lucida', '明室'),
    author: 'Roland Barthes',
    year: '2024',
    stars: 5,
    color: '#0e0f13',
    text: '#e8dfcb',
    note: L(
      "The 'punctum' is the most useful idea I have ever stolen. I use it without crediting Barthes weekly.",
      '「刺点」是我偷过最有用的概念。每周都在用，从不署名。',
    ),
  },
  {
    title: L('The Tao of Pooh', '小熊维尼的道'),
    author: 'Benjamin Hoff',
    year: '2023',
    stars: 4,
    color: '#262214',
    text: '#e8dfcb',
    note: L(
      'Read at 12 and at 22. The 22-year-old understood it less. A good sign, I think.',
      '十二岁读和二十二岁读。后者反而读得更糊涂。我觉得是好事。',
    ),
  },
]

export const FILMS = [
  {
    title: 'In the Mood for Love',
    subtitle: '花樣年華',
    year: '2000',
    director: 'Wong Kar-wai · 王家卫',
    coverImg: '/films/template-film-poster.svg',
    note: L(
      'The film I would watch every year for the rest of my life if asked to choose only one. The noodle scene is everything.',
      '如果只能选一部反复看，就是这部。面摊那一段就是全部。',
    ),
  },
  {
    title: 'Stalker',
    subtitle: 'Сталкер',
    year: '1979',
    director: 'Andrei Tarkovsky · 塔可夫斯基',
    coverImg: '/films/template-organic-poster.svg',
    note: L(
      "Three men walk slowly toward a room. The pace re-set my entire idea of what 'long' could mean.",
      '三个男人慢慢走向一个房间。它彻底重置了我对「慢」的定义。',
    ),
  },
  {
    title: 'Tokyo Story',
    subtitle: '東京物語',
    year: '1953',
    director: 'Yasujirō Ozu · 小津安二郎',
    coverImg: '/films/template-digital-poster.svg',
    note: L(
      "Ozu's tatami shots are the source code of my style. Static, low, patient. I am still trying to earn the right to use them.",
      '小津的榻榻米机位是我风格的源代码——静止、低、耐心。我还在努力配得上它。',
    ),
  },
  {
    title: 'Drive My Car',
    subtitle: 'ドライブ・マイ・カー',
    year: '2021',
    director: 'Ryūsuke Hamaguchi · 滨口龙介',
    coverImg: '/films/template-film-poster.svg',
    note: L(
      'Three hours that move like one. Proof that talking can be cinematic, if you mean it.',
      '三小时仿佛一小时。它证明：只要你是认真的，对话也能是电影。',
    ),
  },
  {
    title: 'Spring in a Small Town',
    subtitle: '小城之春',
    year: '1948',
    director: 'Fei Mu · 费穆',
    coverImg: '/films/template-organic-poster.svg',
    note: L(
      "The first Chinese film I watched twice. The voiceover is doing things in 1948 that Western cinema didn't manage until the 1960s.",
      '我看了两遍的第一部华语片。1948 年的画外音，做到了西方电影直到 1960 年代才做到的事。',
    ),
  },
  {
    title: 'Tokyo-Ga',
    year: '1985',
    director: 'Wim Wenders · 文德斯',
    coverImg: '/films/template-digital-poster.svg',
    note: L(
      'Wenders looking for Ozu in 1980s Tokyo and finding mostly pachinko parlours. A film about loss masquerading as a documentary.',
      '文德斯在 1980 年代的东京寻找小津，找到的多是弹珠房。一部假装成纪录片的「关于失去」的电影。',
    ),
  },
  {
    title: 'Daughters of the Dust',
    year: '1991',
    director: 'Julie Dash',
    coverImg: '/films/template-film-poster.svg',
    note: L(
      "Every frame is a painting. Beyoncé's Lemonade owes it everything. I owe it a lot too.",
      '每一格都是画。碧昂丝的《Lemonade》欠它一切。我欠它也多。',
    ),
  },
  {
    title: 'Yi Yi',
    subtitle: '一一',
    year: '2000',
    director: 'Edward Yang · 杨德昌',
    coverImg: '/films/template-organic-poster.svg',
    note: L(
      "Three hours of a family in Taipei. The eight-year-old who photographs the backs of people's heads is me.",
      '三小时台北一家人的故事。那个总拍人后脑勺的八岁小孩——就是我。',
    ),
  },
]

export const MUSIC = [
  {
    track: 'Music for Airports 1/1',
    artist: 'Brian Eno',
    album: 'Music for Airports',
    duration: '17:38',
    mood: L('Edit', '剪辑'),
    note: L(
      'The album I edit to. Every time. Without exception.',
      '我剪片时一定在听的一张。无一例外。',
    ),
  },
  {
    track: 'Una Mattina',
    artist: 'Ludovico Einaudi',
    album: 'Una Mattina',
    duration: '3:53',
    mood: L('Morning', '清晨'),
    note: L(
      'The morning I shoot exteriors, this is on the AirPods.',
      '拍外景的清晨，这首会在耳机里。',
    ),
  },
  {
    track: "Yumeji's Theme",
    artist: 'Shigeru Umebayashi',
    album: 'ITMFL OST',
    duration: '2:41',
    mood: L('Lovers', '凝望'),
    note: L(
      "If you don't get goosebumps, we cannot be friends.",
      '如果你听这首没有起鸡皮疙瘩，我们做不成朋友。',
    ),
  },
  {
    track: 'Solaris — Ocean',
    artist: 'Eduard Artemyev',
    album: 'Solaris OST',
    duration: '9:04',
    mood: L('Drift', '漂浮'),
    note: L('The score I want to deserve, eventually.', '总有一天，我希望能配得上的一段配乐。'),
  },
  {
    track: 'Discreet Music',
    artist: 'Brian Eno',
    album: 'Discreet Music',
    duration: '30:36',
    mood: L('Write', '写作'),
    note: L(
      "Half an hour. I write while it plays and I don't notice the time.",
      '三十分钟。它放着的时候我写字，从不觉察时间。',
    ),
  },
  {
    track: '在那遥远的地方',
    artist: 'Wang Luobin · 王洛宾',
    album: 'Folk',
    duration: '3:18',
    mood: L('Folk', '民歌'),
    note: L(
      'My grandfather used to whistle this. I learned it through him before I ever heard the original.',
      '外公以前会哼这首。我先从他那里学会，才听到原版。',
    ),
  },
  {
    track: 'Last Day of Summer',
    artist: 'Hauschka',
    album: 'Foreign Landscapes',
    duration: '3:42',
    mood: L('Memory', '记忆'),
    note: L(
      'Prepared piano. It sounds the way old photographs feel.',
      '钢琴里塞了东西。听起来像老照片的感觉。',
    ),
  },
  {
    track: 'Spiegel im Spiegel',
    artist: 'Arvo Pärt',
    album: 'Alina',
    duration: '8:24',
    mood: L('Stillness', '静止'),
    note: L(
      'I put this on when I need to think clearly. It does the work for me.',
      '当我需要把事情想清楚时，会放这首。它替我把活儿干了。',
    ),
  },
]

export const PHOTOS = [
  {
    id: 'h1',
    series: 'walks',
    caption: L('West Lake, before dawn', '西湖，破晓前'),
    date: '2026.03.14',
    camera: 'FX3 · 35mm',
    color: '#1a2228',
  },
  {
    id: 'h2',
    series: 'walks',
    caption: L('Tea district, rain', '茶区，雨'),
    date: '2026.02.07',
    camera: 'FX3 · 50mm',
    color: '#1f261a',
  },
  {
    id: 'h3',
    series: 'walks',
    caption: L('Off the 188 bus', '下了 188 路'),
    date: '2025.11.22',
    camera: 'FX3 · 28mm',
    color: '#241a1a',
  },
  {
    id: 'h4',
    series: 'walks',
    caption: L('Bridge over canal', '运河桥上'),
    date: '2025.10.04',
    camera: 'FX3 · 50mm',
    color: '#181a22',
  },
  {
    id: 'h5',
    series: 'walks',
    caption: L('Hefang street, dusk', '河坊街，黄昏'),
    date: '2025.09.18',
    camera: 'Bolex 16mm',
    color: '#2a1f1a',
  },
  {
    id: 's1',
    series: 'stills',
    caption: L('Tide — frame 14', '《潮》——第 14 帧'),
    date: '2025.06',
    camera: 'Bolex H16',
    color: '#0e0f13',
  },
  {
    id: 's2',
    series: 'stills',
    caption: L('Tide — frame 47', '《潮》——第 47 帧'),
    date: '2025.06',
    camera: 'Bolex H16',
    color: '#14161b',
  },
  {
    id: 's3',
    series: 'stills',
    caption: L('Late Bus — Mr Wu', '《末班车》——吴师傅'),
    date: '2024.10',
    camera: 'FX3',
    color: '#1a1814',
  },
  {
    id: 's4',
    series: 'stills',
    caption: L('Late Bus — 23:47', '《末班车》——23:47'),
    date: '2024.10',
    camera: 'FX3',
    color: '#1c1f25',
  },
  {
    id: 'p1',
    series: 'portraits',
    caption: L('Mei, after the wrap', '小美，杀青后'),
    date: '2025.07.02',
    camera: 'FX3 · 85mm',
    color: '#26201a',
  },
  {
    id: 'p2',
    series: 'portraits',
    caption: L('Bo at the editing desk', '小波，剪辑桌'),
    date: '2025.04.19',
    camera: 'FX3 · 50mm',
    color: '#1a261e',
  },
  {
    id: 'p3',
    series: 'portraits',
    caption: L('Self, mirror', '自摄，镜中'),
    date: '2024.12.31',
    camera: 'FX3 · 35mm',
    color: '#0e1424',
  },
  {
    id: 't1',
    series: 'studies',
    caption: L('Light through linen', '亚麻布上的光'),
    date: '2025.05.20',
    camera: 'FX3',
    color: '#241a14',
  },
  {
    id: 't2',
    series: 'studies',
    caption: L('Concrete and rain', '水泥与雨'),
    date: '2025.04.11',
    camera: 'FX3',
    color: '#181a1f',
  },
  {
    id: 't3',
    series: 'studies',
    caption: L('Onions', '洋葱'),
    date: '2025.03.02',
    camera: 'FX3 · macro',
    color: '#221a14',
  },
  {
    id: 't4',
    series: 'studies',
    caption: L('Three apples', '三只苹果'),
    date: '2024.11.16',
    camera: 'FX3 · macro',
    color: '#2a1f1a',
  },
]

export const PHOTO_SERIES = [
  { id: 'all', label: L('All', '全部') },
  { id: 'walks', label: L('Hangzhou Walks', '杭州散步') },
  { id: 'stills', label: L('Film Stills', '电影剧照') },
  { id: 'portraits', label: L('Portraits', '人像') },
  { id: 'studies', label: L('Studies', '习作') },
]

export const READING_LOG = [
  {
    date: '2026.05',
    title: L('Sculpting in Time', '雕刻时光'),
    author: 'Andrei Tarkovsky',
    stars: 5,
    status: 'reread',
  },
  {
    date: '2026.04',
    title: L('Notes on the Cinematograph', '电影手记'),
    author: 'Robert Bresson',
    stars: 5,
    status: 'finished',
  },
  {
    date: '2026.03',
    title: L('The Lonely City', '孤独的城市'),
    author: 'Olivia Laing',
    stars: 4,
    status: 'finished',
  },
  {
    date: '2026.02',
    title: L('West Lake Dream', '西湖梦寻'),
    author: 'Zhang Dai · 张岱',
    stars: 5,
    status: 'finished',
  },
  {
    date: '2026.01',
    title: L('Camera Lucida', '明室'),
    author: 'Roland Barthes',
    stars: 5,
    status: 'reread',
  },
  {
    date: '2025.12',
    title: L('On Photography', '论摄影'),
    author: 'Susan Sontag',
    stars: 5,
    status: 'finished',
  },
  {
    date: '2025.11',
    title: L('In Praise of Shadows', '阴翳礼赞'),
    author: "Tanizaki Jun'ichiro",
    stars: 5,
    status: 'finished',
  },
  {
    date: '2025.10',
    title: L('The Cinema Book', '电影理论读本'),
    author: 'Pam Cook (ed.)',
    stars: 4,
    status: 'skimmed',
  },
  {
    date: '2025.09',
    title: L('The Art of Looking Sideways', '侧目而视'),
    author: 'Alan Fletcher',
    stars: 5,
    status: 'finished',
  },
  {
    date: '2025.08',
    title: L('Everything is Cinema', '一切皆电影'),
    author: 'Richard Brody',
    stars: 4,
    status: 'finished',
  },
  {
    date: '2025.07',
    title: L('Ways of Seeing', '观看之道'),
    author: 'John Berger',
    stars: 5,
    status: 'reread',
  },
  {
    date: '2025.06',
    title: L('The Films in My Life', '我生命中的电影'),
    author: 'François Truffaut',
    stars: 4,
    status: 'finished',
  },
  {
    date: '2025.05',
    title: L('Bird by Bird', '一鸟接着一鸟'),
    author: 'Anne Lamott',
    stars: 4,
    status: 'finished',
  },
  {
    date: '2025.04',
    title: L('Long Way Home', '远途归家'),
    author: 'Saroo Brierley',
    stars: 3,
    status: 'abandoned',
  },
  {
    date: '2025.03',
    title: L('How to Take Smart Notes', '卡片笔记法'),
    author: 'Sönke Ahrens',
    stars: 4,
    status: 'finished',
  },
  {
    date: '2025.02',
    title: L('Mythologies', '神话学'),
    author: 'Roland Barthes',
    stars: 5,
    status: 'finished',
  },
  {
    date: '2025.01',
    title: L('The Tao of Pooh', '小熊维尼的道'),
    author: 'Benjamin Hoff',
    stars: 4,
    status: 'reread',
  },
  {
    date: '2024.12',
    title: L('In the Cut', '在剪辑之中'),
    author: 'Walter Murch',
    stars: 5,
    status: 'finished',
  },
  {
    date: '2024.11',
    title: L("The Five C's", '摄影五要'),
    author: 'Joseph Mascelli',
    stars: 4,
    status: 'finished',
  },
  {
    date: '2024.10',
    title: L('Sicily', '西西里'),
    author: 'John Keahey',
    stars: 3,
    status: 'finished',
  },
  {
    date: '2024.09',
    title: L('Letters to a Young Poet', '给青年诗人的信'),
    author: 'Rilke',
    stars: 5,
    status: 'finished',
  },
  {
    date: '2024.08',
    title: L('The Cinema Effect', '电影的效果'),
    author: 'Sean Cubitt',
    stars: 3,
    status: 'skimmed',
  },
  {
    date: '2024.07',
    title: L('Bluets', '蓝色物语'),
    author: 'Maggie Nelson',
    stars: 5,
    status: 'finished',
  },
  {
    date: '2024.06',
    title: L('Tokyo Year Zero', '东京零年'),
    author: 'David Peace',
    stars: 4,
    status: 'finished',
  },
]

export const USER_READING_LOG = []

export const NOW_PLAYING = {
  spotify: [
    { spotifyId: '3qe9zUyfdYBs1QwTwujMHU', track: 'Avril 14th', artist: 'Aphex Twin' },
    { spotifyId: '2GdcESg4xC7s9TJQbHFGwM', track: 'Spiegel im Spiegel', artist: 'Arvo Pärt' },
  ],
  netease: [
    { neteaseId: '17405713', track: L('Avril 14th', 'Avril 14th'), artist: 'Aphex Twin' },
    { neteaseId: '4875306', track: 'Spiegel im Spiegel', artist: 'Arvo Pärt' },
  ],
  html5: [
    // Optional pre-bundled tracks (place file in public/audio/, reference as '/audio/xxx.mp3').
    // Users can also upload files at runtime — those appear here too.
  ],
}

export const TRAVEL = [
  {
    city: L('Hangzhou', '杭州'),
    country: L('China', '中国'),
    year: 2004,
    kind: 'home',
    theme: 'botanical',
    lat: 30.27,
    lon: 120.15,
    note: L('home — every day', '家——每一天'),
  },
  {
    city: L('Shanghai', '上海'),
    country: L('China', '中国'),
    year: 2014,
    kind: 'frequent',
    theme: 'metropolitan',
    lat: 31.23,
    lon: 121.47,
    note: L('hour by train', '高铁一小时'),
  },
  {
    city: L('Suzhou', '苏州'),
    country: L('China', '中国'),
    year: 2022,
    kind: 'frequent',
    theme: 'garden',
    lat: 31.3,
    lon: 120.59,
    note: L('garden walks', '逛园林'),
  },
  {
    city: L('Beijing', '北京'),
    country: L('China', '中国'),
    year: 2025,
    kind: 'festival',
    theme: 'archive',
    lat: 39.9,
    lon: 116.41,
    note: L('BSFF screening', '电影节放映'),
  },
  {
    city: L('Chongqing', '重庆'),
    country: L('China', '中国'),
    year: 2023,
    kind: 'trip',
    theme: 'neon',
    lat: 29.56,
    lon: 106.55,
    note: L('the fog city', '雾都'),
  },
  {
    city: L("Xi'an", '西安'),
    country: L('China', '中国'),
    year: 2024,
    kind: 'trip',
    theme: 'terracotta',
    lat: 34.34,
    lon: 108.94,
    note: L('a week alone', '独自一周'),
  },
  {
    city: L('Hong Kong', '香港'),
    country: L('HKSAR', '香港'),
    year: 2023,
    kind: 'trip',
    theme: 'harbor',
    lat: 22.32,
    lon: 114.17,
    note: L('Wong Kar-wai pilgrimage', '王家卫朝圣'),
  },
  {
    city: L('Tokyo', '东京'),
    country: L('Japan', '日本'),
    year: 2023,
    kind: 'trip',
    theme: 'graphic',
    lat: 35.68,
    lon: 139.69,
    note: L('two weeks · summer', '两周・夏天'),
  },
  {
    city: L('Kyoto', '京都'),
    country: L('Japan', '日本'),
    year: 2023,
    kind: 'trip',
    theme: 'craft',
    lat: 35.01,
    lon: 135.77,
    note: L("Ozu's grave", '小津之墓'),
  },
  {
    city: L('Taipei', '台北'),
    country: L('Taiwan', '台湾'),
    year: 2024,
    kind: 'trip',
    theme: 'rain',
    lat: 25.03,
    lon: 121.56,
    note: L('Yang & Hou', '杨德昌、侯孝贤'),
  },
  {
    city: L('Seoul', '首尔'),
    country: L('Korea', '韩国'),
    year: 2025,
    kind: 'trip',
    theme: 'chrome',
    lat: 37.57,
    lon: 126.98,
    note: L('five days · winter', '五天・冬'),
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// TEXTS — all hardcoded user-facing strings, now data-driven.
// Edit through the in-site ContentEditor or here directly.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// MODULES — per-section structure controls. Legacy true/false overrides are
// still accepted by DataProvider and are normalized into this object shape.
// ─────────────────────────────────────────────────────────────────────────────
export const MODULES = {
  about: { enabled: true, nav: true, order: 1, label: L('About', '关于'), layout: 'default' },
  journey: { enabled: false, nav: false, order: 2, label: L('Reel', '影格'), layout: 'default' },
  works: { enabled: true, nav: true, order: 3, label: L('Works', '作品集'), layout: 'default' },
  library: { enabled: true, nav: true, order: 4, label: L('Stacks', '私藏'), layout: 'default' },
  photography: {
    enabled: true,
    nav: true,
    order: 5,
    label: L('Stills', '影像'),
    layout: 'default',
  },
  travel: { enabled: true, nav: true, order: 6, label: L('Atlas', '足迹'), layout: 'default' },
  contact: { enabled: true, nav: true, order: 7, label: L('Signal', '联系'), layout: 'default' },
  colophon: {
    enabled: true,
    nav: false,
    order: 8,
    label: L('Colophon', '落款'),
    layout: 'default',
  },
  cvButton: {
    enabled: true,
    nav: false,
    order: 90,
    label: L('Full CV', '完整简历'),
    layout: 'default',
  },
  nowPlaying: {
    enabled: true,
    nav: false,
    order: 99,
    label: L('Now Playing', '播放中'),
    layout: 'default',
  },
}

export const TEXTS = {
  landing: {
    metaRole: L('FILM STUDENT · DIRECTOR', '影视方向 · 学生导演'),
    metaSchool: L('COMMUNICATION STUDIES', '传播学院 · 在读'),
    metaEmailLbl: L('EMAIL ↗', '邮箱 ↗'),
    metaCity: L('HANGZHOU', '杭州'),
    nameLeft: L('Chen', '陈'),
    nameRight: L('A.', '安'),
    pillAboutLbl: L('About', '关于'),
    pillWorksLbl: L('Works', '作品'),
    pillLibraryLbl: L('Library', '私藏'),
    wordA: L('Film', '电影'),
    wordB: L('Student & Director', '学生与导演'),
    wordC: L('Based', '现居'),
    wordD: L('in Hangzhou', '杭州'),
  },
  about: {
    headerTitle: L('A short biography', '简短的自述'),
    headerSubTag: L('biography', '简介'),
    headerMeta: L('Read time · 3 min', '阅读约 3 分钟'),
    portraitTagL: L('[ self, 2025 ]', '[ 自拍 · 2025 ]'),
    portraitTagR: '35mm · TX-400',
    fullCvLabel: L('Full CV / Curriculum', '查看完整简历'),
    sealChar: '陈',
    blockEdu: L('Education', '学历'),
    blockWork: L('Practice', '工作'),
    blockAwards: L('Awards', '奖项'),
    blockSkills: L('Tools', '技能'),
  },
  cvModal: {
    eyebrow: L('CURRICULUM VITAE · 简历', '简历 · CURRICULUM VITAE'),
    sealChar: '陈',
    blockEdu: L('Education', '学历'),
    blockWork: L('Practice', '工作经历'),
    blockAwards: L('Awards & screenings', '奖项'),
    blockSkills: L('Tools & skills', '技能 / 工具'),
    contactLabel: L('Contact', '联系'),
    linksLabel: L('Links', '链接'),
    langsLabel: L('Languages', '语言'),
    nowLabel: L('Currently', '当前'),
    langItems: [
      L('Chinese (native)', '中文（母语）'),
      L('English (fluent)', '英文（流利）'),
      L('Japanese (reading)', '日文（阅读）'),
    ],
    nowItems: [
      L('Third-year BA student', '在读本科三年级'),
      L('Open to assistant gigs', '开放助理类合作'),
    ],
    printLabel: L('Print / Save as PDF', '打印 / 存为 PDF'),
    lastUpdated: L('Last updated ', '最后更新 '),
  },
  contact: {
    statementEn:
      "I'm <em>open</em> to camera/sound assistant gigs, short-film collaborations, and the occasional title-design commission. \nI reply slowly. Usually worth the wait.",
    statementZh:
      '目前开放<em>摄影 / 录音助理</em>合作，也欢迎短片创作、独立刊物视觉、片头字幕设计的邀约。\n我回信慢，但通常值得。',
    writeMeLabel: L('Write me', '写邮件'),
    secondaryLbl: L('Letterboxd ↗', 'Letterboxd ↗'),
    secondaryUrl: '#',
  },
  colophon: {
    signoff: L(
      'A garden, not a portfolio.\nCome back when something has grown.',
      '这不是作品集，是一座园子。\n等什么东西长出来了，再来看。',
    ),
    fontsLine: L('Set in Lora, Manrope & Noto.', 'Lora、Manrope、思源黑/宋体设计排版。'),
    handCodedLine: L('Hand-coded. No tracking. No cookies.', '纯手写代码。无追踪。无 cookie。'),
  },
}
// <<< EDITOR:CONTENT END >>>
