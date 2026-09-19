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

// Source: 个人简历2026视频方向.docx. English text translates the supplied resume.
// Unspecified dates, media and personal details are intentionally empty.
// <<< EDITOR:CONTENT START >>>
export const SITE = {
  url: 'https://personal-website-x3u4.onrender.com',
  portrait: '',
  ogImage: '/resume-og.png',
  googleSiteVerification: '',
  name: {
    en: 'Xie Jingcheng',
    zh: '谢靖程',
  },
  nameRight: '',
  nameFull: {
    en: 'Xie Jingcheng',
    zh: '谢靖程',
  },
  glyph: '谢',
  cvPdf: '',
  tagline: {
    en: 'Zhejiang University undergraduate in Communication Studies, audiovisual track. Film and visual storytelling, AIGC image/video production and editing.',
    zh: '浙江大学传播学视听方向本科生。影视编导与视觉叙事、AIGC 图像 / 视频制作与剪辑。',
  },
  role: {
    en: 'Zhejiang University · Undergraduate in Communication Studies, audiovisual track',
    zh: '浙江大学 · 传播学视听方向本科生',
  },
  status: {
    en: 'Education',
    zh: '学历',
  },
  statusObject: {
    en: 'Undergraduate',
    zh: '本科在读',
  },
  location: '',
  timezone: '',
  email: 'jinchen9707@gmail.com',
  social: [
    {
      label: {
        en: 'Phone',
        zh: '手机',
      },
      handle: '18626858038',
      url: 'tel:18626858038',
    },
    {
      label: {
        en: 'Email',
        zh: '邮箱',
      },
      handle: 'jinchen9707@gmail.com',
      url: 'mailto:jinchen9707@gmail.com',
    },
  ],
  now: '',
  nowDate: '',
}

export const NAV = [
  {
    num: '00',
    id: 'home',
    label: {
      en: 'Home',
      zh: '首页',
    },
    en: {
      en: 'home',
      zh: '首页',
    },
  },
  {
    num: '01',
    id: 'about',
    label: {
      en: 'About',
      zh: '简介与经历',
    },
    en: {
      en: 'About',
      zh: '简介与经历',
    },
  },
  {
    num: '02',
    id: 'works',
    label: {
      en: 'Projects',
      zh: '项目',
    },
    en: {
      en: 'Projects',
      zh: '项目',
    },
  },
  {
    num: '03',
    id: 'contact',
    label: {
      en: 'Contact',
      zh: '联系',
    },
    en: {
      en: 'Contact',
      zh: '联系',
    },
  },
]

export const ABOUT = {
  intro: {
    en: 'I am Xie Jingcheng, an undergraduate in Communication Studies on the audiovisual track at Zhejiang University. My training covers script analysis and writing, location scouting, character and scene design, storyboarding, cinematic composition, lighting and colour design, blocking and editing.',
    zh: '我是谢靖程，浙江大学传播学视听方向本科生，具备从剧本理解与创作、勘景取景、人物与场景设计、分镜设计、电影构图、光影与色彩设计、镜头调度到后期剪辑的完整视听创作基础。',
  },
  paragraphs: [
    {
      en: 'Alongside traditional filmmaking, I have independently learned ComfyUI, Blender, AI image/video generation and Python automation workflows. I turn text into shot plans and combine 3D scene previsualisation, generated imagery and traditional editing to produce videos.',
      zh: '在传统影视创作能力基础上，自学拓展了 ComfyUI、Blender、AI 图像/视频生成与 Python 自动化工作流，能够将文本内容转化为具体镜头方案，并结合 3D 场景预演、生成式影像与传统剪辑完成成片。',
    },
    {
      en: 'I have experience in overseas content operations and intercultural communication. On ByteDance’s GameTop overseas expansion project, I worked on creator outreach, content localisation and narrative adaptation for Singapore, Malaysia, Indonesia and the Philippines.',
      zh: '具备实际海外内容运营与跨文化传播经验，曾参与字节跳动 GameTop 游戏平台出海项目，负责新马、印尼及菲律宾市场的海外达人沟通、内容本地化及叙事调整。',
    },
  ],
  cv: {
    edu: [
      {
        year: '2023.09–至今',
        title: {
          en: 'Zhejiang University',
          zh: '浙江大学',
        },
        role: {
          en: 'Undergraduate · Communication Studies, audiovisual track',
          zh: '本科 · 传播学视听方向',
        },
        place: '',
      },
      {
        year: '',
        title: {
          en: 'Coursework',
          zh: '在校课程',
        },
        role: {
          en: 'Computational Communication (Excellent); Sound and New Media Communication (98); Contemporary Aesthetic Culture (95); Generative AI and Applications (94); Radio and Television Studies (95); Intercultural Management (90); Intercultural Communication (88); Digital Audio/Video Fundamentals and Production (80); Python Programming.',
          zh: '计算传播学（优秀）、声音与新媒体传播（98）、当代审美文化（95）、生成式人工智能与应用（94）、广播电视学（95）、跨文化管理（90）、跨文化传播（88）、数字音视频基础与制作（80）、Python 程序设计。',
        },
        place: '',
      },
    ],
    work: [
      {
        year: '2025.07–2025.09',
        title: {
          en: 'ByteDance · GameTop overseas expansion project',
          zh: '字节跳动｜GameTop 游戏平台出海项目',
        },
        role: {
          en: 'Market operations. Sourced and contacted creators on YouTube and Instagram, and coordinated partnerships through WhatsApp for Singapore/Malaysia, Indonesia and the Philippines, including English and Malay communication. During the launch phase, reached and engaged 200+ overseas creators and established effective partnership discussions with 20+. Adapted content, copy and narratives to local internet culture, platforms and audience expression.',
          zh: '市场运营。负责新加坡/马来西亚、印度尼西亚、菲律宾地区的海外达人拓展与内容运营，涉及英语及马来语沟通场景。在 YouTube、Instagram 筛选并联系内容创作者，通过 WhatsApp 推进合作。冷启动期间累计触达、对接 200+ 海外达人，成功建立有效合作沟通 20+ 人；根据地区网络文化、平台语境和用户表达习惯，参与内容本地化、文案优化与叙事适配。',
        },
        place: '',
      },
      {
        year: '2023.09–2025.09',
        title: {
          en: 'Zhejiang University Media Association',
          zh: '浙江大学传媒协会',
        },
        role: {
          en: 'Vice President; Head of Publicity. Organised association activities and development; distributed and collected surveys and summarised feedback. Managed new media operations, article writing, personnel organisation and members’ task progress.',
          zh: '副主席；宣传部部长。组织社团活动与发展，发放与回收社团调查问卷，汇总活动回馈数据。负责社团新媒体运营、推文撰稿管理、人事组织，并监督各干事任务进程。',
        },
        place: '',
      },
      {
        year: '',
        title: {
          en: 'Zhejiang Xiaoshan Hospital',
          zh: '浙江萧山医院',
        },
        role: {
          en: 'Foreign-language interpreter. Provided real-time oral interpretation for foreign nationals and translated contracts.',
          zh: '曾任外语翻译员，负责对外籍人士的口头实时表述与合同翻译。',
        },
        place: '',
      },
    ],
    awards: [
      {
        year: '',
        title: {
          en: 'Intercultural communication research paper',
          zh: '跨文化传播研究论文',
        },
        role: {
          en: 'Published in Communications in Humanities Research, ISSN 2753-7072. Studied cross-cultural online platform communication and migration, combining communication analysis with computational big-data methods to examine user behaviour, platform migration, content expression and communication adaptation.',
          zh: '发表于期刊 Communications in Humanities Research，ISSN：2753-7072。围绕跨文化网络平台传播与迁移现象开展研究，将传播学分析与大数据计算方法结合，关注不同文化语境中的用户行为、平台迁移、内容表达和传播适应。',
        },
        place: '',
      },
      {
        year: '',
        title: {
          en: 'NEOSCHOLAR research programme',
          zh: 'NEOSCHOLAR 拔尖计划',
        },
        role: {
          en: 'Research member · top 35% in the human–computer interaction project.',
          zh: '科研成员（人机交互项目前 35%）。',
        },
        place: '',
      },
    ],
    skills: [
      {
        year: '',
        title: {
          en: 'Film direction and visual storytelling',
          zh: '影视编导与视觉叙事',
        },
        role: {
          en: 'Script and character analysis; shot sizes, composition, camera placement and movement, blocking and editing logic; location scouting, character and scene design, lighting and colour. Systematic study of film history, audiovisual language and film theory.',
          zh: '剧本与人物分析，梳理人物关系、动机、剧情冲突及情绪变化并落地为镜头表达；熟悉景别、构图、机位、镜头运动、人物调度与镜头组接逻辑。具备勘景取景、人物与场景设计、光影、色彩及画面构成能力；具有较系统的电影史、视听语言与影视理论学习积累。',
        },
        place: '',
      },
      {
        year: '',
        title: {
          en: 'Editing and sound',
          zh: '剪辑与声音',
        },
        role: {
          en: 'Premiere Pro, CapCut and DaVinci Resolve: media organisation, editing, subtitles, sound effects, music and final delivery.',
          zh: '使用 Premiere Pro、剪映、DaVinci Resolve 完成素材整理、镜头组接、字幕、音效、配乐及成片输出。',
        },
        place: '',
      },
      {
        year: '',
        title: {
          en: 'AIGC models and workflows',
          zh: 'AIGC 图像 / 视频开源模型应用',
        },
        role: {
          en: 'Deploys, tests, modifies and combines established ComfyUI community workflows, mainly from RunningHub and ModelScope. Iterates on prompts, references, composition and shot design; selects generated material and uses editing to maintain character, scene and style consistency. LoRA training experience includes character image collection, automatic classification, manual selection and training tests.',
          zh: 'ComfyUI：部署、测试、修改和组合社区成熟工作流，主要使用 RunningHub 和 ModelScope 社区的工作流与模型。根据结果调整提示词、参考画面、构图与镜头设计，通过反复生成、素材筛选和后期剪辑处理人物、场景与视觉风格一致性。有 LoRA 训练经验，完成过角色图像数据采集、自动分类、人工筛选及训练测试流程。',
        },
        place: '',
      },
      {
        year: '',
        title: {
          en: 'Software and online resources',
          zh: '软件与互联网资源',
        },
        role: {
          en: 'Proficient with Feishu and Office, and experienced with PR, PS, IDM and Git. Familiar with acquiring and using online resources and with Chinese- and English-language platform cultures, including Discord, Reddit and YouTube.',
          zh: '熟练掌握飞书与 Office 类办公软件，具备 PR、PS、IDM、Git 等软件应用经验；熟悉互联网资源获取和使用流程，了解中文、英文网络生态与平台调性，使用 Discord、Reddit、YouTube 等平台。',
        },
        place: '',
      },
      {
        year: '',
        title: {
          en: 'Languages',
          zh: '语言能力',
        },
        role: {
          en: 'Standard Mandarin; passed CET-6; experience in spoken and written English with fluent oral communication. Basic Cantonese and Malay.',
          zh: '普通话标准；英语 CET-6 通过，具备英文口语及书面表达经验，可进行流利口头英语沟通；基本掌握粤语、马来语。',
        },
        place: '',
      },
    ],
  },
  stats: [],
}

export const JOURNEY = []

export const WORKS = [
  {
    id: 'cold-dew',
    title: {
      en: 'Cold Dew',
      zh: '寒露',
    },
    subtitle: {
      en: '24 Solar Terms × Ancient Paintings',
      zh: '二十四节气 × 古画',
    },
    medium: 'visual',
    role: {
      en: 'AI visual production and editing',
      zh: 'AI 视觉制作与剪辑',
    },
    year: '',
    cover: '',
    coverImg: '',
    summary: {
      en: 'A Zhejiang University project with Professor Wang Kexin’s team and the university’s integrated media centre. Credited for AI visual production and editing; the finished video appeared on the Xuexi Qiangguo app’s trending list.',
      zh: '浙江大学校级项目，王可欣教授团队与浙江大学融媒体中心。署名 AI 视觉制作与剪辑，成片曾上学习强国 App 热门榜，作为官媒作品展示。',
    },
    body: [
      {
        en: 'Searched for and selected Chinese paintings matching the script’s situations and narrative imagery.',
        zh: '根据剧本情境和叙事意象，检索、筛选与故事语境匹配的中国古画素材。',
      },
      {
        en: 'Used Jimeng to animate static paintings and designed motion based on relationships between subjects, people and environments.',
        zh: '使用即梦将静态古画转化为动态影像，并根据画面主体、人物和环境关系设计运动效果。',
      },
      {
        en: 'Contributed to the overall edit, shot transitions and motion effects.',
        zh: '参与视频整体剪辑、镜头衔接及动效制作。',
      },
    ],
    tags: ['AIGC', '即梦'],
    field: {
      role: {
        en: 'AI visual production and editing',
        zh: 'AI 视觉制作与剪辑',
      },
      crew: {
        en: 'Professor Wang Kexin’s team · Zhejiang University integrated media centre',
        zh: '王可欣教授团队 · 浙江大学融媒体中心',
      },
    },
  },
  {
    id: 'choice',
    title: {
      en: 'Choice',
      zh: '抉择',
    },
    subtitle: {
      en: 'Independent narrative short · approx. 5 minutes',
      zh: '个人独立叙事短片 · 约 5 分钟',
    },
    medium: 'short',
    role: {
      en: 'Direction / screenplay / visuals / editing',
      zh: '编导 / 编剧 / 视觉 / 剪辑',
    },
    year: '',
    cover: '',
    coverImg: '',
    summary: {
      en: 'Independently completed an approximately five-minute AI campus narrative short, from script and character design to storyboards, image/video generation, material selection and editing.',
      zh: '一人独立完成约 5 分钟 AI 校园叙事短片，负责剧本、人物设定、场景选择、视觉设计、分镜、AI 图像/视频生成、素材筛选及后期成片。',
    },
    body: [
      {
        en: 'Designed scenes and shots around character relationships, conflict and emotional changes, using shot sizes, composition, character placement, eyelines and editing rhythm to tell the story.',
        zh: '根据人物关系、剧情冲突和情绪变化设计场景和镜头，通过景别、构图、人物位置、视线关系及镜头节奏完成叙事表达。',
      },
      {
        en: 'Used classic films as references, reorganising character settings, scenes, plots, dialogue and compositional relationships into a campus narrative.',
        zh: '将电影史中的部分经典影片作为创作参照，将其人物设定、场景、情节、台词及构图关系重新组织进校园叙事。',
      },
      {
        en: 'Generated visuals mainly with ComfyUI and Anima, adapting community workflows to individual shots. Used repeated generation, selection, Photoshop and editing to maintain visual continuity. Treated generative imagery as a directing tool, focusing on why each shot is designed and how it serves emotion and story information.',
        zh: '主要使用 ComfyUI + Anima 完成视觉生成，根据不同镜头需求调整社区工作流，通过多轮生成、筛选、PS 和后期剪辑维持视觉连贯性。将生成式影像作为导演与视觉创作工具，重点关注镜头设计如何服务人物情绪与剧情信息。',
      },
    ],
    tags: ['ComfyUI', 'Anima', 'PS'],
    field: {
      role: {
        en: 'Direction / screenplay / visuals / editing',
        zh: '编导 / 编剧 / 视觉 / 剪辑',
      },
      format: {
        en: 'Approx. 5 minutes',
        zh: '约 5 分钟',
      },
      crew: {
        en: 'Independent project',
        zh: '个人独立项目',
      },
    },
  },
  {
    id: 'blender-comfyui',
    title: {
      en: 'Blender × ComfyUI video workflow',
      zh: 'Blender × ComfyUI AI 视频工作流',
    },
    subtitle: {
      en: 'Independent project',
      zh: '独立项目',
    },
    medium: 'visual',
    role: {
      en: '3D visual design / AI video rendering',
      zh: '3D 视觉设计 / AI 视频渲染',
    },
    year: '',
    cover: '',
    coverImg: '',
    summary: {
      en: 'An experimental workflow from scene design, camera composition and lighting through structural references to AI video, using Blender scenes to constrain and previsualise generated imagery.',
      zh: '完成场景设计 → 摄影机与构图 → 光影控制 → 白模/结构参考 → ComfyUI → AI 视频的实验性工作流，以 Blender 场景作为视觉约束与预演工具。',
    },
    body: [
      {
        en: 'Independently modelled Blender scenes and created materials, lighting, cameras, animation and basic rigs.',
        zh: '独立完成 Blender 场景的建模、材质、灯光、摄像机、动画及基础骨骼制作。',
      },
      {
        en: 'Controlled space, object placement, camera angle and image structure in Blender before applying generative visual stylisation.',
        zh: '通过 Blender 预先控制场景空间、物体位置、摄影机角度及画面结构，再通过生成模型完成视觉风格化。',
      },
      {
        en: 'Explored how storyboarding, art direction and staging can enter generative video production, addressing uncertainty in spatial relationships, stable composition and shot control.',
        zh: '针对纯 AI 生成在空间关系、构图稳定性与镜头控制上的不确定性，探索传统影视中的分镜、美术设计和场面调度如何进入生成式视频制作流程。',
      },
    ],
    tags: ['Blender', 'ComfyUI'],
    field: {
      role: {
        en: '3D visual design / AI video rendering',
        zh: '3D 视觉设计 / AI 视频渲染',
      },
      crew: {
        en: 'Independent project',
        zh: '独立项目',
      },
    },
  },
  {
    id: 'content-automation',
    title: {
      en: 'AI content production automation',
      zh: 'AI 内容生产自动化工作流',
    },
    subtitle: {
      en: 'Independent experiment',
      zh: '独立实验',
    },
    medium: 'automation',
    role: {
      en: 'Python / LLM / DaVinci MCP',
      zh: 'Python / LLM / DaVinci MCP',
    },
    year: '',
    cover: '',
    coverImg: '',
    summary: {
      en: 'Built a workflow from LLM Wiki/information websites to automated scripts, AI voice, DaVinci MCP editing, manual fine editing and final output.',
      zh: '搭建 LLM Wiki / 信息网站 → 自动文稿 → AI 语音 → DaVinci MCP 自动剪辑 → 人工精剪 → 成片的自动化内容生产流程。',
    },
    body: [
      {
        en: 'Used agents and Python scripts to connect parts of production, reducing repetitive work in research organisation, writing and basic editing.',
        zh: '让 Agent 使用 Python 脚本连接部分生产环节，降低资料整理、文稿生产和基础剪辑中的重复劳动。',
      },
      {
        en: 'Applied automation mainly to standardised steps, retaining manual adjustment for plot, composition, rhythm and final visual decisions. Continued testing AI video, creative and automation tools according to project needs.',
        zh: '将自动化主要应用于标准化步骤，在剧情、构图、节奏和最终视觉判断环节保留人工调整。持续测试 AI 视频、AI 创作及自动化工具，并根据实际项目需求调整制作流程。',
      },
    ],
    tags: ['Python', 'LLM', 'DaVinci MCP'],
    field: {
      role: {
        en: 'Python / LLM / DaVinci MCP',
        zh: 'Python / LLM / DaVinci MCP',
      },
      crew: {
        en: 'Independent experiment',
        zh: '独立实验',
      },
    },
  },
]

export const BOOKS = []

export const FILMS = []

export const MUSIC = []

export const PHOTOS = []

export const PHOTO_SERIES = []

export const READING_LOG = []

export const USER_READING_LOG = []

export const NOW_PLAYING = {
  spotify: [],
  netease: [],
  html5: [],
}

export const TRAVEL = []

export const MODULES = {
  about: {
    enabled: true,
    nav: true,
    order: 1,
    label: {
      en: 'About',
      zh: '简介与经历',
    },
    layout: 'default',
  },
  journey: {
    enabled: false,
    nav: false,
    order: 2,
    label: {
      en: 'Journey',
      zh: '经历',
    },
    layout: 'default',
  },
  works: {
    enabled: true,
    nav: true,
    order: 3,
    label: {
      en: 'Projects',
      zh: '项目',
    },
    layout: 'default',
  },
  library: {
    enabled: false,
    nav: false,
    order: 4,
    label: {
      en: 'Library',
      zh: '书影音',
    },
    layout: 'default',
  },
  photography: {
    enabled: false,
    nav: false,
    order: 5,
    label: {
      en: 'Photography',
      zh: '摄影',
    },
    layout: 'default',
  },
  travel: {
    enabled: false,
    nav: false,
    order: 6,
    label: {
      en: 'Travel',
      zh: '足迹',
    },
    layout: 'default',
  },
  contact: {
    enabled: true,
    nav: true,
    order: 7,
    label: {
      en: 'Contact',
      zh: '联系',
    },
    layout: 'default',
  },
  colophon: {
    enabled: false,
    nav: false,
    order: 8,
    label: {
      en: 'Colophon',
      zh: '落款',
    },
    layout: 'default',
  },
  cvButton: {
    enabled: true,
    nav: false,
    order: 9,
    label: {
      en: 'CV',
      zh: '简历',
    },
    layout: 'default',
  },
  nowPlaying: {
    enabled: false,
    nav: false,
    order: 10,
    label: {
      en: 'Now playing',
      zh: '播放',
    },
    layout: 'default',
  },
}

export const TEXTS = {
  landing: {
    metaRole: {
      en: 'FILM & VISUAL STORYTELLING',
      zh: '影视编导与视觉叙事',
    },
    metaSchool: {
      en: 'ZHEJIANG UNIVERSITY',
      zh: '浙江大学',
    },
    metaEmailLbl: {
      en: 'EMAIL',
      zh: '邮箱',
    },
    metaCity: '',
    nameLeft: {
      en: 'Xie Jingcheng',
      zh: '谢靖程',
    },
    nameRight: '',
    pillAboutLbl: {
      en: 'About',
      zh: '简介与经历',
    },
    pillWorksLbl: {
      en: 'Projects',
      zh: '项目',
    },
    pillLibraryLbl: {
      en: 'Library',
      zh: '书影音',
    },
    wordA: {
      en: 'Film',
      zh: '影视',
    },
    wordB: {
      en: 'Visual storytelling',
      zh: '视觉叙事',
    },
    wordC: {
      en: 'AIGC',
      zh: 'AIGC',
    },
    wordD: {
      en: 'Video production',
      zh: '视频创作',
    },
  },
  about: {
    headerTitle: {
      en: 'Profile and experience',
      zh: '个人简介与经历',
    },
    headerSubTag: {
      en: 'About',
      zh: '简介',
    },
    headerMeta: '',
    portraitTagL: '',
    portraitTagR: '',
    fullCvLabel: {
      en: 'View CV',
      zh: '查看简历',
    },
    sealChar: '谢',
    blockEdu: {
      en: 'Education',
      zh: '教育背景',
    },
    blockWork: {
      en: 'Internship and campus experience',
      zh: '实习与校园经历',
    },
    blockAwards: {
      en: 'Research and honours',
      zh: '学术研究与在校奖项',
    },
    blockSkills: {
      en: 'Skills',
      zh: '技能',
    },
  },
  cvModal: {
    eyebrow: {
      en: 'CURRICULUM VITAE',
      zh: '个人简历',
    },
    sealChar: '谢',
    blockEdu: {
      en: 'Education',
      zh: '教育背景',
    },
    blockWork: {
      en: 'Internship and campus experience',
      zh: '实习与校园经历',
    },
    blockAwards: {
      en: 'Research and honours',
      zh: '学术研究与在校奖项',
    },
    blockSkills: {
      en: 'Skills',
      zh: '技能',
    },
    contactLabel: {
      en: 'Contact',
      zh: '联系',
    },
    linksLabel: {
      en: 'Contact details',
      zh: '联系方式',
    },
    langsLabel: {
      en: 'Languages',
      zh: '语言',
    },
    nowLabel: {
      en: 'Education',
      zh: '学历',
    },
    langItems: [
      {
        en: 'Mandarin; English (CET-6)',
        zh: '普通话；英语（CET-6）',
      },
      {
        en: 'Basic Cantonese and Malay',
        zh: '基本掌握粤语、马来语',
      },
    ],
    nowItems: [
      {
        en: 'Zhejiang University · Undergraduate in Communication Studies, audiovisual track',
        zh: '浙江大学 · 传播学视听方向本科生',
      },
    ],
    printLabel: {
      en: 'Print / Save as PDF',
      zh: '打印 / 存为 PDF',
    },
    lastUpdated: '',
  },
  contact: {
    statementEn: 'Xie Jingcheng',
    statementZh: '谢靖程',
    writeMeLabel: {
      en: 'Email',
      zh: '邮箱',
    },
    secondaryLbl: {
      en: 'Phone · 18626858038',
      zh: '手机 · 18626858038',
    },
    secondaryUrl: 'tel:18626858038',
  },
  colophon: {
    signoff: '',
    fontsLine: '',
    handCodedLine: '',
  },
}
// <<< EDITOR:CONTENT END >>>
