// Helper: bilingual string
const L = (en, zh) => ({ en, zh })

// Picks string for current language with EN fallback.
export function pick(v, lang) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && (v.en || v.zh)) {
    return (lang === 'zh' && v.zh) ? v.zh : (v.en || v.zh || '')
  }
  return v
}

export const SITE = {
  name: L('Miles', '迈尔斯'),
  nameFull: L('Miles Morales', '迈尔斯·莫拉莱斯'),
  glyph: 'M',
  tagline: L(
    'High school student. Spider-Man. Trying to balance notebooks with web-slinging, graffiti with responsibility.',
    '高中生。蜘蛛侠。在笔记本和蜘蛛丝之间、涂鸦与责任之间找平衡。'
  ),
  role: L(
    'Student · Vigilante · Street Artist',
    '学生・守夜人・街头艺术家'
  ),
  status: L('Protecting', '守护中'),
  statusObject: L(
    'Brooklyn — it\'s home',
    '布鲁克林——我的家'
  ),
  location: L('Brooklyn, New York', '美国纽约布鲁克林'),
  timezone: 'UTC-5',
  email: 'miles@venom-protocol.net',
  social: [
    { label: L('Instagram', 'Instagram'), handle: '@miles.art', url: '#' },
    { label: L('SoundCloud', 'SoundCloud'), handle: '@miles.beats', url: '#' },
    { label: L('Tumblr', 'Tumblr'), handle: '/spider-thoughts', url: '#' },
    { label: L('Spotify', 'Spotify'), handle: 'Miles Vibes', url: '#' },
    { label: L('Email', '邮箱'), handle: 'miles@venom-protocol.net', url: 'mailto:miles@venom-protocol.net' },
  ],
  now: L(
    'Midnight patrol. Finishing an essay on American identity. New mural going up on Wythe Ave this weekend. Still learning what it means to be the Friendly Neighbourhood Spider-Man when the neighbourhood is also your home.',
    '午夜巡逻中。还有一篇关于美国身份认同的论文没交。周末在 Wythe 大街有新壁画要完成。仍在学着理解：当邻居也是你的家人时，做「友好邻居蜘蛛侠」意味着什么。'
  ),
  nowDate: L('Fall 2024, Brooklyn', '2024 年秋天，布鲁克林'),
}

export const NAV = [
  { num: '00', id: 'home',        label: L('Frame 00', '片头'),      en: L('home',        '首页') },
  { num: '01', id: 'about',       label: L('About',    '关于'),      en: L('biography',   '简介') },
  { num: '02', id: 'journey',     label: L('Timeline', '时间线'),    en: L('journey',     '旅程') },
  { num: '03', id: 'works',       label: L('Missions', '任务'),      en: L('portfolio',   '作品集') },
  { num: '04', id: 'library',     label: L('Stacks',   '私藏'),      en: L('library',     '书影音') },
  { num: '05', id: 'gallery',     label: L('Murals',   '壁画'),      en: L('gallery',     '艺术') },
  { num: '06', id: 'travel',      label: L('Universes', '宇宙'),     en: L('travel',      '宇宙') },
  { num: '07', id: 'contact',     label: L('Signal',   '联络'),      en: L('contact',     '联系') },
]

export const ABOUT = {
  intro: L(
    "I'm Miles — a sophomore at Brooklyn Visions Academy, part-time street artist, full-time Spider-Man. I came from this neighborhood, and I'm not leaving it. That means something.",
    '我是迈尔斯——布鲁克林愿景学院二年级学生，兼职街头艺术家，全职蜘蛛侠。我来自这个街区，也不会离开。这意味着什么。'
  ),
  paragraphs: [
    L(
      'My dad is a cop. My mom is a surgeon. I\'m somewhere in between—trying to do the right thing without always knowing what that is. The Venom symbiote gave me powers, but it took my parents\' trust to teach me responsibility.',
      '我爸爸是警察。我妈妈是外科医生。我在两者之间——努力做对的事，虽然不总是知道什么是对的。毒液共生体给了我力量，但我的父母的信任教会我责任。'
    ),
    L(
      'The mural on my street—that was my first real art. Then I became Spider-Man, and the art had to fit around the web-slinging. But I haven\'t stopped. Every piece is about where I come from. Every patrol is about protecting it.',
      '街上那幅壁画——那是我第一件真正的艺术作品。然后我成了蜘蛛侠，艺术要给蜘蛛丝让路。但我没有停止。每一件作品都讲述我的来处。每一次巡逻都是为了保护它。'
    ),
    L(
      'Some days I\'m just a kid with a sketchbook. Some days I\'m fighting off supervillains at 2 AM. Most days I\'m both, and nobody knows except Peter and the people who\'ve seen me drop from the sky.',
      '有些日子我只是个拿着素描本的孩子。有些日子我在凌晨2点和超级反派搏斗。大多数日子我两者都是，只有彼得和看到我从天而降的人知道。'
    ),
  ],
  cv: {
    edu: [
      { year: '2023 – present', title: L('Brooklyn Visions Academy', '布鲁克林愿景学院'), role: L('Sophomore · Debate Team · Art Club', '二年级学生・辩论队・艺术社'), place: L('Brooklyn', '布鲁克林') },
      { year: '2020 – 2023', title: L('PS 371', '公立第 371 小学'), role: L('Early interest in murals · Tech class', '壁画启蒙・科技课'), place: L('Brooklyn', '布鲁克林') },
    ],
    work: [
      { year: '2024 – present', title: L('Street Artist · Commission Work', '街头艺术家・委托作品'), role: L('Murals across Williamsburg and Bushwick. Mostly untraceable.', '遍布威廉斯堡和布什威克的壁画。多数无法追踪。'), place: L('Brooklyn', '布鲁克林') },
      { year: '2023 – present', title: L('Neighborhood Spider-Man', '邻居蜘蛛侠'), role: L('High-altitude crime prevention. Web design (literally).', '高空犯罪预防。网络设计（字面意思）。'), place: L('Brooklyn', '布鲁克林') },
      { year: '2023', title: L('Intern, Oscorp (briefly)', '奥斯卡公司实习（短期）'), role: L('Got the symbiote here. Complicated internship.', '在这里得到共生体。很复杂的实习经历。'), place: L('Manhattan', '曼哈顿') },
    ],
    awards: [
      { year: '2024', title: L('Community Art Recognition · Bushwick Street Fest', '社区艺术认可・布什威克街头节'), role: L('Best Emerging Mural Artist. (They don\'t know it\'s me.)', '最佳新兴壁画艺术家。（他们不知道是我。）'), place: L('Brooklyn', '布鲁克林') },
      { year: '2023', title: L('Debate Team · Regional Finals', '辩论队・地区决赛'), role: L('Arguing for access and equity — it\'s personal.', '辩论公共资源获取和公平——这很个人。'), place: L('New York', '纽约') },
    ],
    skills: [
      { year: 'Visual', title: L('Spray Paint · Stencil · Digital Illustration', '喷枪・版画・数字插图'), role: L('Fast sketches become walls. Walls become statements.', '快速草图变成墙。墙变成声明。'), place: '—' },
      { year: 'Physical', title: L('Web-Slinging · Parkour · Venom Control', '蜘蛛丝・跑酷・毒液控制'), role: L('Three years learning not to overuse the symbiote. Getting better.', '三年来学着不过度使用共生体。在进步。'), place: '—' },
      { year: 'Digital', title: L('Adobe Suite · Procreate · Coding (inherited)', 'Adobe 套件・Procreate・编程（继承来的）'), role: L('Dad\'s tech background. Mom\'s attention to detail. Both running through my fingers.', '爸爸的科技背景。妈妈的细节关注。两者都在我手指尖流转。'), place: '—' },
    ],
  },
  stats: [
    { label: L('Dimensions saved', '拯救的人'), value: '*countless*' },
    { label: L('Murals completed', '完成的壁画'), value: '*17*' },
    { label: L('Lives balanced', '平衡的生活'), value: L('*Student* · *Artist* · *Hero*', '*学生* ・ *艺术家* ・ *英雄*') },
    { label: L('Status', '状态'), value: L('Learning. Always learning.', '在学。永远在学。') },
  ],
}

export const JOURNEY = [
  { id: 1, year: 2006, label: L('Born', '出生'), place: L('Brooklyn', '布鲁克林'),
    title: L('*A kid. Nothing special yet.*', '*一个孩子。还没什么特别的。*'),
    text: L(
      'Born in Brooklyn, Sunset Park. My dad already dreaming of making captain. My mom already saving lives. I just wanted to draw.',
      '生于布鲁克林，日落公园。我爸爸已经梦想成为队长。我妈妈已经在拯救生命。我只是想画画。'
    ),
    tags: ['origin', 'Brooklyn'], chapter: 'I' },
  { id: 2, year: 2012, label: L('First Mural', '第一幅壁画'), place: L('Brooklyn', '布鲁克林'),
    title: L('*Aaron\'s wall.*', '*亚伦的墙。*'),
    text: L(
      'Age 6. My neighbor Aaron said I could paint his garage wall. Three days later it was a galaxy. He cried. I was hooked.',
      '六岁。邻居亚伦说我可以在他的车库墙上画画。三天后它变成了一个星系。他哭了。我成瘾了。'
    ),
    tags: ['art', 'early'], chapter: 'I' },
  { id: 3, year: 2018, label: L('Peter Parker', '彼得·帕克'), place: L('Oscorp', '奥斯卡'),
    title: L('*Met a strange guy at an internship interview.*', '*在实习面试上遇到了一个奇怪的人。*'),
    text: L(
      'Summer internship screening. He was there, asking weird questions. Didn\'t know then he was Spider-Man. Didn\'t know then that he\'d be my mentor.',
      '夏季实习筛选。他在那里，问奇怪的问题。不知道他是蜘蛛侠。不知道他会成为我的导师。'
    ),
    tags: ['mentor', 'meeting'], chapter: 'II' },
  { id: 4, year: 2023, label: L('The Venom Symbiote', '毒液共生体'), place: L('Oscorp', '奥斯卡'),
    title: L('*Power and cost.*', '*力量与代价。*'),
    text: L(
      'It chose me. Or maybe I walked into the wrong lab. The black suit—fast, strong, angry. For a week I thought I was invincible. Then I realized I was destructive. Peter helped me see the difference.',
      '它选择了我。或者也许我走进了错误的实验室。黑色战衣——快、强、愤怒。一周我以为我是无敌的。然后我意识到我是具有破坏性的。彼得帮我看清了差别。'
    ),
    tags: ['symbiote', 'turning-point'], chapter: 'II' },
  { id: 5, year: 2023, label: L('Spider-Man', '蜘蛛侠'), place: L('Brooklyn', '布鲁克林'),
    title: L('*The suit was already taken. I made my own.*', '*制服已经被占了。我做了自己的。*'),
    text: L(
      "I wasn't trying to be the next Spider-Man. I was trying to be the first Miles. But when you can save people, can you not? Brooklyn became my responsibility, and my responsibility became my identity.",
      '我没有试图成为下一个蜘蛛侠。我试图成为第一个迈尔斯。但当你能拯救人类时，你能不这样做吗？布鲁克林成了我的责任，我的责任成了我的身份。'
    ),
    tags: ['origin', 'hero'], chapter: 'III' },
  { id: 6, year: 2024, label: L('The Kingpin', '金并'), place: L('Everywhere', '到处'),
    title: L('*Fighting something bigger than myself.*', '*与比我自己更大的东西作斗争。*'),
    text: L(
      'When Wilson Fisk came, the whole city shook. I was just trying to protect my block. Had to learn fast what protecting a city means. Dad was there. Mom was there. I was terrified I\'d fail them.',
      '威尔逊·菲斯克来临时，整个城市都震动了。我只是想保护我的街区。必须快速学会保护一个城市意味着什么。爸爸在。妈妈在。我害怕我会辜负他们。'
    ),
    tags: ['now', '现在'], chapter: 'III' },
  { id: 7, year: 2024, label: L('Now', '现在'), place: L('Brooklyn', '布鲁克林'),
    title: L('*Sophomore, Artist, Spider-Man.*', '*二年级学生、艺术家、蜘蛛侠。*'),
    text: L(
      "Still figuring it out. Some nights I'm just a kid. Some nights I'm the only thing standing between home and disaster. Most nights I'm both. The mural gets painted. The homework gets done. The city gets protected. Not always in that order.",
      '仍在弄清楚。有些夜晚我只是一个孩子。有些夜晚我是唯一站在家和灾难之间的东西。大多数夜晚我两者都是。壁画被画上。功课完成。城市被保护。不总是按这个顺序。'
    ),
    tags: ['now', '在做'], chapter: 'IV' },
]

export const WORKS = [
  {
    id: 'bushwick-mural',
    title: L('Bushwick Renaissance', '布什威克复兴'),
    subtitle: L('Wall art · 40ft × 60ft', '墙面艺术・40尺 × 60尺'),
    medium: 'mural',
    role: L('Artist', '艺术家'),
    year: '2024',
    cover: 'cover-1',
    summary: L(
      'A tribute to the neighborhood\'s immigrant communities and their resilience. Five colors. One wall. Hundreds of hours.',
      '致敬社区移民群体及其韧性的作品。五种颜色。一面墙。数百小时。'
    ),
    tags: ['mural', '街头艺术'],
    field: {
      year: '2024',
      format: L('Spray paint on brick · 40×60 ft', '砖墙喷漆・40×60 尺'),
      role: L('Artist, Designer', '艺术家、设计师'),
      crew: L('Solo + community volunteers', '独立完成・社区志愿者'),
      festivals: L('Bushwick Street Fest 2024', '布什威克街头节 2024'),
      status: L('Completed', '已完成'),
    },
    body: [
      L(
        "This wall was grey. It stayed grey for years. Then I realized it didn't have to be, and neither did the neighborhood. Started on a Tuesday, finished on a Thursday. By Friday, people were taking photos.",
        '这面墙是灰色的。多年来一直是灰色。然后我意识到它不必如此，社区也不必如此。周二开始，周四完成。到周五，人们开始拍照了。'
      ),
    ],
  },
  {
    id: 'spider-web-design',
    title: L('Web Design Protocol', '网络设计协议'),
    subtitle: L('Functional art · Algorithm', '功能艺术・算法'),
    medium: 'tech',
    role: L('Designer · Engineer', '设计师・工程师'),
    year: '2023',
    cover: 'cover-2',
    summary: L(
      'Biologically accurate web patterns optimized for swing dynamics and impact resistance. Applied organic geometry to synthetic polymers.',
      '生物学精确的网格图案，针对摇摆动力学和抗冲击性能进行了优化。将有机几何应用于合成聚合物。'
    ),
    tags: ['tech', '网络'],
    field: {
      year: '2023',
      format: L('Organic polymer · Patent pending', '有机聚合物・专利待定'),
      role: L('Designer, Engineer', '设计师、工程师'),
      crew: L('Solo research', '独立研究'),
      festivals: L('—', '—'),
      status: L('In use', '使用中'),
    },
    body: [
      L(
        'When you\'re the one shooting the web, you think about things others don\'t. Tensile strength. Wind resistance. The angle of the swing. Math becomes art becomes survival.',
        '当你是射网的人时，你会思考别人不会的东西。抗张强度。风阻。摇摆的角度。数学变成艺术变成生存。'
      ),
    ],
  },
  {
    id: 'community-defense',
    title: L('Kingpin Defense Initiative', '金并防御计划'),
    subtitle: L('Nighttime operation · Ongoing', '夜间行动・持续中'),
    medium: 'mission',
    role: L('Operative', '操作员'),
    year: '2024 –',
    cover: 'cover-3',
    summary: L(
      'Coordinated defense against organized crime in Brooklyn. Working with Peter Parker and local law enforcement to dismantle the Kingpin\'s network.',
      '针对布鲁克林有组织犯罪的协调防御。与彼得·帕克和本地执法部门合作，瓦解金并网络。'
    ),
    tags: ['mission', '守护'],
    field: {
      year: '2024 –',
      format: L('Active patrol · Daily', '主动巡逻・每日'),
      role: L('Spider-Man', '蜘蛛侠'),
      crew: L('Partnership with Peter Parker + NYPD', '与彼得·帕克和纽约警察局合作'),
      festivals: L('—', '—'),
      status: L('In progress', '进行中'),
    },
    body: [
      L(
        'Some nights it\'s broken windows. Some nights it\'s broken bones—other people\'s. Tonight it\'s just a man checking on his neighborhood, making sure people can sleep safe. That\'s the real mission.',
        '有些夜晚是破碎的窗户。有些夜晚是破碎的骨头——别人的。今晚只是一个人检查他的社区，确保人们能安全睡眠。这才是真正的任务。'
      ),
    ],
  },
]

export const BOOKS = [
  { title: L('Invisible Man', '看不见的人'), author: 'Ralph Ellison', year: '2024', stars: 5, color: '#1a0000', text: '#e8dfcb',
    note: L("Every page hits different when you're invisible in a different way.", '当你以另一种方式隐形时，每一页的感受都不同。') },
  { title: L('The Young Ones', '年轻人'), author: 'Julius Lester', year: '2024', stars: 4, color: '#001a00', text: '#e8dfcb',
    note: L("Poetry about being young and Black in America. It's my mirror.", '关于在美国做年轻黑人的诗歌。这是我的镜子。') },
  { title: L('Blueprint', '蓝图'), author: 'Kris Freeman', year: '2024', stars: 5, color: '#0a0a3a', text: '#e8dfcb',
    note: L('Understanding your neighborhood by understanding your own blocks.', '通过理解你自己的街区来理解你的邻居。') },
  { title: L('Monster', '怪物'), author: 'Walter Dean Myers', year: '2023', stars: 5, color: '#1a1a00', text: '#e8dfcb',
    note: L('A kid in the system. Too close to home. Read it three times.', '系统中的孩子。太接近现实。读了三遍。') },
  { title: L('The Fire Next Time', '下次大火'), author: 'James Baldwin', year: '2023', stars: 5, color: '#3a0a0a', text: '#e8dfcb',
    note: L('Baldwin on race and responsibility. Every word matters when your life does too.', '鲍德温论种族与责任。当你的生活也很重要时，每个词都很重要。') },
]

export const FILMS = [
  { title: 'Spider-Man: Across the Spider-Verse', subtitle: '', year: '2023', director: 'Shawn Levy · 肖恩·莱维',
    note: L('I know it\'s animated. I watched it twice. He got it right.', '我知道这是动画。我看了两遍。他说对了。') },
  { title: 'Moonlight', subtitle: '', year: '2016', director: 'Barry Jenkins',
    note: L('Three chapters. I watched it when I needed to understand who I was becoming.', '三个章节。我在需要理解自己变成什么时看的。') },
  { title: 'Everything Everywhere All at Once', subtitle: '', year: '2022', director: 'The Daniels',
    note: L('Multiverse. Doing your best. That\'s the whole thing right there.', '多元宇宙。尽你最好。就是这样。') },
  { title: 'Do the Right Thing', subtitle: '', year: '1989', director: 'Spike Lee',
    note: L('Brooklyn. Summer. The heat. The choice. This is my dad\'s favorite movie.', '布鲁克林。夏天。热度。选择。这是我爸爸最喜欢的电影。') },
  { title: 'The Godfather', subtitle: '', year: '1972', director: 'Francis Ford Coppola',
    note: L('My dad made me watch it. Kept saying "understand power, Miles." I\'m still learning.', '我爸爸让我看的。一直说「理解力量，迈尔斯」。我还在学。') },
]

export const MUSIC = [
  { track: 'Sunflower', artist: 'Post Malone & Swae Lee', album: 'Spidey Soundtrack (2018)', duration: 208, mood: L('Swing', '摇摆'), note: L('Web-slinging anthem. Obviously.', '蜘蛛丝摇摆歌曲。显然。') },
  { track: 'Alright', artist: 'Kendrick Lamar', album: 'To Pimp a Butterfly', duration: 231, mood: L('Hope', '希望'), note: L('Listening to this makes me believe Brooklyn can be saved.', '听这个让我相信布鲁克林可以被拯救。') },
  { track: 'New God Flow', artist: 'Kanye West ft. Pusha T', album: 'Watch the Throne', duration: 233, mood: L('Power', '力量'), note: L('When the suit is on and the city is waiting.', '当制服穿上，城市在等待时。') },
  { track: 'King\'s Dead', artist: 'JAY-Z, Kendrick Lamar, Future, Donald Glover', album: 'Black Panther: The Album', duration: 200, mood: L('War', '战争'), note: L('When Kingpin made it personal.', '当金并变得个人化时。') },
  { track: 'Mask Off', artist: 'Future', album: 'FUTURE', duration: 240, mood: L('Chase', '追逐'), note: L('Fast roof runs. Faster heartbeat.', '快速屋顶奔跑。更快的心跳。') },
]

export const TRAVEL = [
  { city: L('Brooklyn', '布鲁克林'), country: L('New York', '纽约'), year: 2006, kind: 'home', lat: 40.65, lon: -73.94, note: L('home — always', '家——永远') },
  { city: L('Manhattan', '曼哈顿'), country: L('New York', '纽约'), year: 2023, kind: 'frequent', lat: 40.78, lon: -73.97, note: L('where Oscorp is', '奥斯卡所在地') },
  { city: L('Queens', '皇后区'), country: L('New York', '纽约'), year: 2023, kind: 'frequent', lat: 40.74, lon: -73.82, note: L('Peter\'s neighborhood', '彼得的邻居') },
  { city: L('The Multiverse', '多元宇宙'), country: L('Everywhere', '到处'), year: 2024, kind: 'trip', lat: 0, lon: 0, note: L('Sometimes when we swing too fast.', '有时候当我们摇摆太快时。') },
]

export const PHOTOS = [
  { id: 'h1', series: 'murals', caption: L('Williamsburg, golden hour', '威廉斯堡，金色时刻'), date: '2024.09.15', camera: 'iPhone 15 Pro', color: '#6b2c1a' },
  { id: 'h2', series: 'murals', caption: L('Bushwick wall, in progress', '布什威克墙，进行中'), date: '2024.08.12', camera: 'iPhone 15 Pro', color: '#1a3a2c' },
  { id: 's1', series: 'moments', caption: L('Rooftop at dawn', '屋顶的黎明'), date: '2024.07.03', camera: 'Web cam', color: '#1a1a2c' },
  { id: 's2', series: 'moments', caption: L('Father and son', '父亲和儿子'), date: '2024.06.21', camera: 'Phone', color: '#2c1a0a' },
  { id: 't1', series: 'studies', caption: L('Spray can reflections', '喷枪反射'), date: '2024.09.01', camera: 'Sketch', color: '#0a0a0a' },
]

export const PHOTO_SERIES = [
  { id: 'all', label: L('All', '全部') },
  { id: 'murals', label: L('Street Murals', '街头壁画') },
  { id: 'moments', label: L('Moments', '时刻') },
  { id: 'studies', label: L('Studies', '习作') },
]

export const READING_LOG = []

export const NOW_PLAYING = [
  {
    track: L('Sunflower', '向日葵'),
    artist: L('Post Malone & Swae Lee', '波斯特·马龙 & 斯韦·李'),
    album: L('Spider-Man: Into the Spider-Verse', '蜘蛛侠：平行宇宙'),
    cover: '',
    source: 'Spotify',
    url: '#',
    position: 'bottom-left',   // 必须保留，组件就是读的这个属性
    since: L('Last played: 2 hours ago', '上次播放：2小时前'),
  }
]