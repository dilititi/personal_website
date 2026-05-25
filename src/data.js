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
  portrait: '/picture/miles.jpg',
  tagline: L(
    'Brooklyn kid. Half Black, half Puerto Rican. Spider-Man. Trying to balance algebra homework with web-slinging, sketchbooks with responsibility.',
    '布鲁克林的孩子。一半黑人血统，一半波多黎各血统。蜘蛛侠。在代数作业和蜘蛛丝之间、素描本和责任之间找平衡。'
  ),
  portrait: '/miles.jpg',
  role: L(
    'Student · Spider-Man · Sticker & Sketch Kid',
    '学生・蜘蛛侠・贴纸涂鸦少年'
  ),
  status: L('Patrolling', '巡逻中'),
  statusObject: L(
    'Brooklyn — my block, my responsibility',
    '布鲁克林——我的街区，我的责任'
  ),
  location: L('Brooklyn, New York', '美国纽约布鲁克林'),
  timezone: 'UTC-5',
  email: 'miles@bvacademy.edu',
  social: [
    { label: L('Instagram', 'Instagram'), handle: '@miles.sketch', url: '#' },
    { label: L('Discord', 'Discord'), handle: 'ganke_and_miles', url: '#' },
    { label: L('Tumblr', 'Tumblr'), handle: '/spider-thoughts', url: '#' },
    { label: L('Spotify', 'Spotify'), handle: 'Miles Vibes', url: '#' },
    { label: L('Email', '邮箱'), handle: 'miles@bvacademy.edu', url: 'mailto:miles@bvacademy.edu' },
  ],
  now: L(
    "Midterms next week. Dad still thinks Spider-Man's a menace — if only he knew. Working on a new sticker design for the block. Ganke's covering for me again. Trying not to think too hard about Uncle Aaron.",
    '下周期中考。爸爸还是觉得蜘蛛侠是个祸害——他要是知道就好了。在做一款新的街区贴纸。Ganke 又在帮我打掩护。努力不去想 Aaron 叔叔的事。'
  ),
  nowDate: L('Fall, Brooklyn', '秋天，布鲁克林'),
}

export const NAV = [
  { num: '00', id: 'home',        label: L('Frame 00', '片头'),      en: L('home',        '首页') },
  { num: '01', id: 'about',       label: L('About',    '关于'),      en: L('biography',   '简介') },
  { num: '02', id: 'journey',     label: L('Timeline', '时间线'),    en: L('journey',     '旅程') },
  { num: '03', id: 'works',       label: L('Missions', '任务'),      en: L('portfolio',   '作品集') },
  { num: '04', id: 'library',     label: L('Stacks',   '私藏'),      en: L('library',     '书影音') },
  { num: '05', id: 'gallery',     label: L('Stickers', '贴纸'),      en: L('gallery',     '艺术') },
  { num: '06', id: 'travel',      label: L('Universes', '宇宙'),     en: L('travel',      '宇宙') },
  { num: '07', id: 'contact',     label: L('Signal',   '联络'),      en: L('contact',     '联系') },
]

export const ABOUT = {
  intro: L(
    "I'm Miles — I won a charter school lottery and ended up at Brooklyn Visions Academy. My mom Rio is a nurse, my dad Jefferson is a cop, and one of them is going to figure out I'm Spider-Man before this year is over.",
    '我是迈尔斯——抽签抽中了 Brooklyn Visions Academy 特许学校。我妈妈 Rio 是护士，爸爸 Jefferson 是警察，他俩里总有一个会在这学年结束前发现我是蜘蛛侠。'
  ),
  paragraphs: [
    L(
      "I wasn't supposed to be Spider-Man. Peter Parker was. But a genetically-modified spider from Oscorp followed my Uncle Aaron home from a heist — he didn't know it, I didn't know it — and bit me on the hand while I was sitting on his couch. A week later, Peter died. The job needed someone.",
      "我本来不该当蜘蛛侠。彼得·帕克才是蜘蛛侠。但一只从 Oscorp 实验室出来的基因改造蜘蛛，跟着我 Aaron 叔叔从一次入室盗窃后回了家——他不知道，我也不知道——我坐在他沙发上的时候，它咬了我的手。一周后，彼得死了。这份工作总得有人接。"
    ),
    L(
      "My dad hates Spider-Man. Thinks vigilantes make the city worse. My mom thinks Spider-Man is cool. They argue about it at dinner. I sit there and eat my arroz con pollo and try not to laugh into my plate.",
      '我爸爸讨厌蜘蛛侠。觉得自警分子让城市更糟。我妈妈觉得蜘蛛侠很酷。他们在饭桌上吵这个。我就坐在那里吃我妈做的鸡肉饭，努力不让自己笑喷到盘子里。'
    ),
    L(
      "Only two people know who I am: Ganke Lee, my roommate at BVA, who figured it out in about forty seconds and now spends most of his time covering for me; and Peter — the other Peter, the older one, from another universe.Even though he's got stubble all over his face and a beer belly，but he's teaching me. Slowly. Patiently. He says I'll get there.",
      "只有两个人知道我的身份：Ganke Lee，我在 BVA 的室友，他大概用了四十秒就猜到了，现在主要工作是替我打掩护；还有彼得——另一个彼得，更年长的那个(指616B彼得・B・帕克)，来自另一个宇宙。虽然他满脸胡茬、挺着啤酒肚，但他在教我。慢慢地，耐心地。他说我会成长起来的。"
    ),
  ],
  cv: {
    edu: [
      { year: 'Present', title: L('Brooklyn Visions Academy', 'Brooklyn Visions Academy'), role: L('Charter school lottery winner · Boarding student · Ganke is my roommate', '抽签进入的特许学校・寄宿生・Ganke 是我室友'), place: L('Brooklyn', '布鲁克林') },
      { year: 'Before', title: L('PS 54, Brooklyn', '布鲁克林公立 54 小学'), role: L('Where I learned to draw on everything that wasn\'t paper.', '在这里学会了在一切非纸张的东西上画画。'), place: L('Brooklyn', '布鲁克林') },
    ],
    work: [
      { year: 'Present', title: L('Spider-Man', '蜘蛛侠'), role: L('Brooklyn beat. Peter Parker covers Queens and Manhattan. We trade notes.', '布鲁克林辖区。Queens 和 Manhattan 归彼得·帕克管。我们互通情报。'), place: L('Brooklyn', '布鲁克林') },
      { year: 'Weekends', title: L('Sticker & Tag Artist (anonymous)', '街头贴纸与涂鸦艺术家（匿名）'), role: L('Hand-drawn stickers on lamp posts and mailboxes. Signed with a spider. Nobody connects the dots.', '路灯柱和邮箱上的手绘贴纸。署名是一只蜘蛛。没人把线索拼起来。'), place: L('Brooklyn', '布鲁克林') },
    ],
    awards: [
      { year: 'Present', title: L('Saved Brooklyn (multiple times)', '拯救了布鲁克林（多次）'), role: L('Mostly Kangaroo. Sometimes worse. No medals. Dad would probably arrest me.', '大多是袋鼠那种小角色。有时更糟。没有奖牌。爸爸大概会逮捕我。'), place: L('Brooklyn', '布鲁克林') },
      { year: 'Before', title: L('Honor Roll · BVA', 'BVA 荣誉榜'), role: L('Before the spider bite. Grades have… slipped a little since.', '被咬之前的事。之后成绩……有点滑坡。'), place: L('Brooklyn', '布鲁克林') },
    ],
    skills: [
      { year: 'Powers', title: L('Wall-Crawling · Spider-Sense · Camouflage · Venom Blast', '飞檐走壁・蜘蛛感应・隐身・毒电击'), role: L('The camouflage and the bio-electric blast are mine alone — Peter doesn\'t have those. Still figuring them out.', '隐身和生物电击是我独有的——彼得没有。还在摸索。'), place: '—' },
      { year: 'Physical', title: L('Web-Slinging · Parkour', '蜘蛛丝・跑酷'), role: L('Peter taught me the basics. The rest I learned by hitting buildings.', '彼得教我基础。剩下的是撞着楼学的。'), place: '—' },
      { year: 'Real life', title: L('Drawing · Stickers · Algebra (reluctantly)', '画画・贴纸・代数（不情愿）'), role: L('Notebooks full of webs. Margins full of buildings. Math teachers are not impressed.', '笔记本里全是蛛网。页边全是楼。数学老师不太欣赏。'), place: '—' },
    ],
  },
  stats: [
    { label: L('People who know', '知情者'), value: '*2*' },
    { label: L('Years as Spider-Man', '当蜘蛛侠的年数'), value: '*~1*' },
    { label: L('Languages', '语言'), value: L('*English* · Spanish (mom\'s side)', '*英语* · 西班牙语（妈妈那边）') },
    { label: L('Status', '状态'), value: L('Trying. Mostly.', '在努力。大部分时候。') },
  ],
}

export const JOURNEY = [
  { id: 1, year: 'Y-13', label: L('Born', '出生'), place: L('Brooklyn', '布鲁克林'),
    title: L('*Brooklyn kid. Both sides of the family.*', '*布鲁克林的孩子。父母两边都是。*'),
    text: L(
      "Born in Brooklyn to Rio Morales — Puerto Rican, nurse, the warmth in the house — and Jefferson Davis — Black, cop, the rules in the house. I got my mom's last name. Long story.",
      '生于布鲁克林。妈妈 Rio Morales——波多黎各人，护士，是家里的暖意；爸爸 Jefferson Davis——黑人，警察，是家里的规矩。我跟妈妈姓。说来话长。'
    ),
    tags: ['origin', 'Brooklyn'], chapter: 'I' },
  { id: 2, year: 'Y-5', label: L('Uncle Aaron', 'Aaron 叔叔'), place: L('Brooklyn', '布鲁克林'),
    title: L('*The cool uncle Dad didn\'t want me visiting.*', '*那个爸爸不让我去找的「酷叔叔」。*'),
    text: L(
      "Uncle Aaron always had stories, a leather jacket, a fridge full of soda, and a brother — my dad — who didn't speak to him. I didn't know why for years. Turns out Aaron was the Prowler. Turns out family is complicated.",
      "Aaron 叔叔总有讲不完的故事、一件皮夹克、一冰箱汽水，还有一个——我爸爸——和他不说话的兄弟。我多年来都不知道为什么。后来才知道 Aaron 是潜行者（Prowler）。原来家家有本难念的经。"
    ),
    tags: ['family', 'foreshadow'], chapter: 'I' },
  { id: 3, year: 'Y-1', label: L('Lottery', '抽签'), place: L('Brooklyn', '布鲁克林'),
    title: L('*Won the BVA charter school lottery.*', '*抽中了 BVA 特许学校的名额。*'),
    text: L(
      "Mom cried. Dad couldn't stop grinning. I was terrified — I'd have to leave my friends and board at the new school. The night before classes started, I ran to Aaron's place to vent. Dad caught me there. They argued. Bad.",
      "妈妈哭了。爸爸笑得合不拢嘴。我吓坏了——要离开朋友们去新学校寄宿。开学前一晚，我跑去 Aaron 那儿吐槽。爸爸在那儿逮到我。他俩吵起来了，吵得很凶。"
    ),
    tags: ['school', 'lottery'], chapter: 'II' },
  { id: 4, year: 'Y-1', label: L('The bite', '被咬'), place: L("Aaron's apartment", 'Aaron 的公寓'),
    title: L('*A spider in the wrong bag.*', '*跑错包里的一只蜘蛛。*'),
    text: L(
      "While Dad and Aaron were yelling, I sat on the couch. A spider crawled out of Aaron's duffel bag and bit my hand. I passed out. Foamed at the mouth. Aaron had stolen it from Oscorp the week before — specimen 42, genetically altered. He had no idea what he was carrying. Neither did I.",
      "爸爸和 Aaron 在吵的时候，我坐在沙发上。一只蜘蛛从 Aaron 的行李袋里爬出来，咬了我的手。我晕过去了。嘴里冒泡沫。Aaron 上周从 Oscorp 偷出来的——42 号样本，基因改造蜘蛛。他不知道自己带回来了什么。我也不知道。"
    ),
    tags: ['origin', 'spider'], chapter: 'II' },
  { id: 5, year: 'Y-1', label: L('Powers', '能力'), place: L('Brooklyn', '布鲁克林'),
    title: L('*Invisible. Then sticking. Then everything.*', '*先是隐身。然后能黏墙。然后是一切。*'),
    text: L(
      "First thing I did was turn invisible by accident hiding from Dad. Then I stuck to a wall. Then my hand crackled with something blue that knocked Ganke off a chair. He looked at me and said, 'Dude. You're Spider-Man.' That's how I found out.",
      "我做的第一件事是为了躲爸爸不小心隐身了。然后我黏在了墙上。然后我的手噼里啪啦冒出一道蓝光，把 Ganke 从椅子上震下去了。他看着我说：「老兄，你是蜘蛛侠。」我就这么知道了。"
    ),
    tags: ['powers', 'ganke'], chapter: 'II' },
  { id: 6, year: 'Y0', label: L('Peter dies', '彼得之死'), place: L('Queens', '皇后区'),
    title: L('*The original Spider-Man died. The job was open.*', '*原版蜘蛛侠死了。这份工作空了出来。*'),
    text: L(
      "I watched the news with Ganke. The Green Goblin killed Peter Parker in front of his own family. I went to the funeral in a Halloween Spider-Man costume because I didn't have a suit yet. Gwen Stacy saw me. She told me off. She was right. I made my own suit after that — black and red.",
      "我和 Ganke 一起看新闻。绿魔在彼得·帕克自己家人面前杀了他。我穿着万圣节蜘蛛侠服装去了葬礼，因为我还没有自己的战衣。Gwen Stacy 看见了我。她把我骂了一顿。她说得对。之后我做了自己的战衣——黑红配色。"
    ),
    tags: ['peter', 'inheritance'], chapter: 'III' },
  { id: 7, year: 'Y0', label: L('Uncle Aaron, again', '再次遇见叔叔'), place: L('Brooklyn rooftop', '布鲁克林屋顶'),
    title: L('*The Prowler knew. He\'d always known.*', '*潜行者知道。他一直都知道。*'),
    text: L(
      "He figured out I was Spider-Man before I figured out he was the Prowler. He wanted me to be his protégé — wanted us to run Brooklyn together. I said no. We fought. I'm not ready to write down how that ended.",
      "他比我更早知道我是蜘蛛侠——比我知道他是潜行者还早。他想让我当他的徒弟，想我们一起接管布鲁克林。我拒绝了。我们打了一架。那一架怎么收场的，我还没准备好写下来。"
    ),
    tags: ['aaron', 'loss'], chapter: 'III' },
  { id: 8, year: 'Y+1', label: L('Now', '现在'), place: L('Brooklyn', '布鲁克林'),
    title: L('*Sophomore. Spider-Man. Still here.*', '*二年级生。蜘蛛侠。还在。*'),
    text: L(
      "Junior year of high school. Sleeping four hours a night. Failing chemistry. Ganke's tired. Mom suspects something. Dad still thinks Spider-Man's the problem. Brooklyn's still standing, mostly. So am I.",
      "高中三年级。每晚睡四小时。化学要挂科。Ganke 累坏了。妈妈起疑心了。爸爸还是觉得蜘蛛侠是问题所在。布鲁克林大体还立着。我也还立着。"
    ),
    tags: ['now', '在做'], chapter: 'IV' },
]

export const WORKS = [
  {
    id: 'first-suit',
    title: L('The Black-and-Red Suit', '黑红战衣'),
    subtitle: L('Self-designed · Replacing the Halloween costume', '自己设计・替代万圣节服装'),
    medium: 'design',
    role: L('Designer · Wearer', '设计・穿着'),
    year: 'Y0',
    cover: 'cover-1',
    summary: L(
      "Designed in the dorm room after Peter's funeral. Black base, red web pattern, white eyes. Ganke pinned the early sketches to the wall. The first version had way too many spikes — Ganke talked me down.",
      "彼得的葬礼之后，在宿舍里设计的。黑色为底，红色蛛网，白色眼睛。Ganke 把早期草稿钉在墙上。第一版有太多尖刺——Ganke 把我劝下来了。"
    ),
    tags: ['suit', 'design'],
    field: {
      year: 'Y0',
      format: L('Fabric, found materials, very basic tailoring', '布料、找来的材料、非常基础的裁剪'),
      role: L('Designer, Tailor (badly)', '设计、（蹩脚的）裁缝'),
      crew: L('Ganke (creative consultant)', 'Ganke（创意顾问）'),
      festivals: L('—', '—'),
      status: L('In active use', '正在使用'),
    },
    body: [
      L(
        "Gwen Stacy told me wearing Peter's old suit was disrespectful. She was right. The black-and-red was an attempt at saying: same job, different person. Different powers, too — Peter never had the camo or the venom blast. The colors are mine.",
        "Gwen Stacy 说我穿彼得的旧战衣是不尊重。她说得对。黑红配色是我想说的：同一份工作，不同的人。能力也不一样——彼得没有隐身和毒电击。颜色是我的。"
      ),
    ],
  },
  {
    id: 'kangaroo-fight',
    title: L('First Real Fight: Kangaroo', '第一次真正出手：袋鼠'),
    subtitle: L('Brooklyn streets · 4 minutes', '布鲁克林街头・4 分钟'),
    medium: 'mission',
    role: L('Spider-Man (debut)', '蜘蛛侠（首战）'),
    year: 'Y0',
    cover: 'cover-2',
    summary: L(
      "My first super-villain. He was robbing a bodega. I was wearing the Halloween costume. It went better than it had any right to.",
      "我遇到的第一个超级反派。他正在抢一家便利店。我还穿着万圣节服装。结果比一切预期都好。"
    ),
    tags: ['mission', 'first'],
    field: {
      year: 'Y0',
      format: L('Live action · Brooklyn pavement', '实战・布鲁克林街道'),
      role: L('Spider-Man', '蜘蛛侠'),
      crew: L('Solo (Ganke watching the security cam feed at home)', '单兵作战（Ganke 在家看监控直播）'),
      festivals: L('—', '—'),
      status: L('Won, accidentally', '意外赢了'),
    },
    body: [
      L(
        "I webbed his feet together by accident. He fell into a fire hydrant. The bodega owner gave me a Snapple. Best day of my life until I got home and Ganke had compiled a 12-slide PowerPoint on what I'd done wrong.",
        "我不小心用蛛丝把他的脚黏在了一起。他摔进了消防栓。便利店老板请了我一瓶 Snapple。是我人生最好的一天——直到我回到家，Ganke 已经做了一个 12 页的 PPT 讲我犯了哪些错。"
      ),
    ],
  },
  {
    id: 'spider-stickers',
    title: L('The Spider Stickers', '蜘蛛贴纸'),
    subtitle: L('Hand-drawn · Brooklyn-wide', '手绘・遍布布鲁克林'),
    medium: 'sticker',
    role: L('Artist (anonymous)', '匿名艺术家'),
    year: 'Y-2 –',
    cover: 'cover-3',
    summary: L(
      "I've been drawing stickers since I was eleven. Now they're on lamp posts and mailboxes all over Brooklyn. The signature is a tiny spider. Nobody connects the dots.",
      "我从十一岁就开始画贴纸。现在它们在布鲁克林到处的路灯柱和邮箱上。签名是一只小蜘蛛。没人把线索拼起来。"
    ),
    tags: ['art', 'sticker'],
    field: {
      year: 'Y-2 –',
      format: L('Marker, sticker paper, sometimes spray paint', '马克笔、贴纸纸、有时是喷漆'),
      role: L('Artist', '艺术家'),
      crew: L('Solo', '独立'),
      festivals: L('—', '—'),
      status: L('Ongoing, always', '持续中，永远') ,
    },
    body: [
      L(
        "Dad once arrested someone for tagging. I sat at the dinner table and didn't say a word. The stickers are how I exist in the city when I can't be Spider-Man and don't want to be Miles. Just a shape on a wall. Just a spider.",
        "爸爸有次抓了一个涂鸦的人。我坐在饭桌上一句话都没说。当我不能当蜘蛛侠、也不想当迈尔斯的时候，贴纸是我存在于这座城市的方式。只是墙上的一个图形。只是一只蜘蛛。"
      ),
    ],
  },
]

export const BOOKS = [
  { title: L('Invisible Man', '看不见的人'), author: 'Ralph Ellison', year: 'Y0', stars: 5, color: '#1a0000', text: '#e8dfcb',
    note: L("Read for English class. Hit different when one of your literal powers is invisibility.", '英语课上读的。当你字面意义上的能力之一就是隐身时，读起来感受完全不同。') },
  { title: L('Monster', '怪物'), author: 'Walter Dean Myers', year: 'Y-1', stars: 5, color: '#1a1a00', text: '#e8dfcb',
    note: L('A Black kid in the courtroom telling his own story. Read it twice. Underlined too much.', '一个黑人少年在法庭上讲自己的故事。读了两遍。划了太多线。') },
  { title: L('The Brief Wondrous Life of Oscar Wao', '奥斯卡·瓦奥短暂而奇妙的一生'), author: 'Junot Díaz', year: 'Y0', stars: 4, color: '#001a00', text: '#e8dfcb',
    note: L("Mom gave it to me. Dominican, not Puerto Rican, but the Spanglish hits home.", '妈妈给我的。是多米尼加而不是波多黎各，但那种英语和西语夹杂的感觉特别熟悉。') },
  { title: L('The Hate U Give', '黑暗中的星光'), author: 'Angie Thomas', year: 'Y-1', stars: 5, color: '#3a0a0a', text: '#e8dfcb',
    note: L("Hard to read when your dad's a cop. Harder not to.", '当你爸爸是警察时，读这本书很难。不读更难。') },
  { title: L("Subway Art", '地铁艺术'), author: 'Martha Cooper & Henry Chalfant', year: 'Y-2', stars: 5, color: '#1a1a3a', text: '#e8dfcb',
    note: L("80s NYC graffiti, photographed before it got buffed. My bible for tags. Hidden under the bed.", '八十年代纽约涂鸦——被刷掉之前拍下来的。我的涂鸦圣经。藏在床底下。') },
]

export const FILMS = [
  { title: 'Spider-Man: Into the Spider-Verse', subtitle: '蜘蛛侠：平行宇宙', year: '2018', director: 'Bob Persichetti, Peter Ramsey, Rodney Rothman',
    note: L("Weird seeing a movie about you. Almost everything is wrong. Some things are exactly right.", '看一部关于自己的电影感觉很怪。几乎一切都是错的。某些东西又精准得吓人。') },
  { title: 'Spider-Man: Across the Spider-Verse', subtitle: '蜘蛛侠：纵横宇宙', year: '2023', director: 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson',
    note: L("Even weirder. Won't say more. They got the part about Dad right.", '更怪。多余的不说了。爸爸那部分他们拍对了。') },
  { title: 'Do the Right Thing', subtitle: '为所应为', year: '1989', director: 'Spike Lee',
    note: L("Dad's favorite movie. He paused it every five minutes to explain. I get it now. Took me until I was thirteen.", '爸爸最爱的电影。他每五分钟暂停一次解释。我现在懂了。直到十三岁才懂。') },
  { title: 'Moonlight', subtitle: '月光男孩', year: '2016', director: 'Barry Jenkins',
    note: L("Three chapters of being a Black kid trying to figure out who he is. I watched it the week Uncle Aaron found out.", '一个黑人男孩弄清自己是谁的三个章节。Aaron 叔叔发现真相的那一周，我看的这部。') },
  { title: 'Crooklyn', subtitle: '布鲁克林轶事', year: '1994', director: 'Spike Lee',
    note: L("Brooklyn, the seventies. Mom made me watch this with her. She cried at the soundtrack the whole time.", '七十年代的布鲁克林。妈妈让我陪她看。她整场都因为配乐在哭。') },
]

export const MUSIC = [
  { track: 'Sunflower', artist: 'Post Malone & Swae Lee', album: 'Spider-Verse Soundtrack', duration: 158, mood: L('Swing', '摆荡'), note: L("They wrote it about me. Or for me. Or because of me. I don't know how this works.", '这首歌是写我的。或写给我的。或因为我才有的。多重宇宙的事我搞不清。') },
  { track: 'Alright', artist: 'Kendrick Lamar', album: 'To Pimp a Butterfly', duration: 219, mood: L('Hope', '希望'), note: L("Listening to this on the train at 2 AM after a long patrol.", '长时间巡逻后凌晨两点在地铁上听这个。') },
  { track: "Hum Along (feat. Wendell Pierce)", artist: 'Childish Gambino', album: 'STN MTN / Kauai', duration: 245, mood: L('Memory', '记忆'), note: L("Uncle Aaron played Gambino in his car. Can't listen without thinking of him.", 'Aaron 叔叔在车里放过 Gambino。听这个就会想起他。') },
  { track: 'Como La Flor', artist: 'Selena', album: 'Entre a Mi Mundo', duration: 184, mood: L('Home', '家'), note: L("Mom plays this on Sundays. The whole apartment smells like sofrito.", '妈妈周日放这个。整个公寓飘着 sofrito 酱的香气。') },
  { track: "What's My Name?", artist: 'DMX', album: '...And Then There Was X', duration: 235, mood: L('Boost', '提神'), note: L("Suit-up music. Don't tell Ganke I admitted this.", '换战衣的时候听的。别告诉 Ganke 我承认了。') },
]

export const TRAVEL = [
  { city: L('Brooklyn', '布鲁克林'), country: L('NYC', '纽约市'), year: 'home', kind: 'home', lat: 40.65, lon: -73.94, note: L('home — my block', '家——我的街区') },
  { city: L('Queens', '皇后区'), country: L('NYC', '纽约市'), year: 'visit', kind: 'frequent', lat: 40.74, lon: -73.82, note: L("where Peter Parker grew up", '彼得·帕克长大的地方') },
  { city: L('Manhattan', '曼哈顿'), country: L('NYC', '纽约市'), year: 'patrol', kind: 'patrol', lat: 40.78, lon: -73.97, note: L('Oscorp is here. So is trouble.', 'Oscorp 在这里。麻烦也在这里。') },
  { city: L('Puerto Rico', '波多黎各'), country: L('USA', '美国'), year: 'family', kind: 'family', lat: 18.22, lon: -66.59, note: L("Mom's family. Haven't been in years.", '妈妈的家人。好多年没回去了。') },
  { city: L('Earth-616', '主世界'), country: L('Another universe', '另一个宇宙'), year: '?', kind: 'trip', lat: 0, lon: 0, note: L("Where the other Peter Parker lives. Visited once. Long story.", '另一个彼得·帕克住的地方。去过一次。说来话长。') },
  { city: L('Earth-1610', '终极宇宙'), country: L('Home universe', '本宇宙'), year: 'always', kind: 'home', lat: 0, lon: 0, note: L("My home dimension. Officially.", '我的本源宇宙。官方认定。') },
]

export const PHOTOS = [
  { id: 'h1', series: 'stickers', caption: L('Stickered lamp post, Sunset Park', '日落公园路灯，贴满贴纸'), date: 'autumn', camera: L('Phone', '手机'), color: '#6b2c1a' },
  { id: 'h2', series: 'stickers', caption: L('Spider tag, F train platform', 'F 线月台的蜘蛛涂鸦'), date: 'summer', camera: L('Phone', '手机'), color: '#1a3a2c' },
  { id: 's1', series: 'moments', caption: L('Williamsburg rooftop, before patrol', '威廉斯堡屋顶，巡逻前'), date: 'late', camera: L('Phone', '手机'), color: '#1a1a2c' },
  { id: 's2', series: 'moments', caption: L("Dad's NYPD jacket on the chair", '椅子上爸爸的 NYPD 制服'), date: 'morning', camera: L('Phone', '手机'), color: '#2c1a0a' },
  { id: 's3', series: 'moments', caption: L("Ganke's side of the dorm", 'Ganke 那半边宿舍'), date: '—', camera: L('Phone', '手机'), color: '#2a201a' },
  { id: 't1', series: 'sketches', caption: L('Spider notebook, page 47', '蜘蛛笔记本第 47 页'), date: '—', camera: L('Sketch', '草图'), color: '#0a0a0a' },
  { id: 't2', series: 'sketches', caption: L('Suit design, v3', '战衣设计第 3 稿'), date: '—', camera: L('Sketch', '草图'), color: '#1a0a0a' },
]

export const PHOTO_SERIES = [
  { id: 'all', label: L('All', '全部') },
  { id: 'stickers', label: L('Stickers & Tags', '贴纸与涂鸦') },
  { id: 'moments', label: L('Moments', '时刻') },
  { id: 'sketches', label: L('Sketchbook', '速写本') },
]

export const READING_LOG = []

export const NOW_PLAYING = {
  spotify: [
    { spotifyId: '3qe9zUyfdYBs1QwTwujMHU', track: 'Avril 14th', artist: 'Aphex Twin' },
    { spotifyId: '2GdcESg4xC7s9TJQbHFGwM', track: 'Spiegel im Spiegel', artist: 'Arvo Pärt' },
    // 想加多少首加多少首
  ],
  netease: [
    { neteaseId: '17405713', track: L('Avril 14th', 'Avril 14th'), artist: 'Aphex Twin' },
    { neteaseId: '4875306',  track: 'Spiegel im Spiegel', artist: 'Arvo Pärt' },
  ],
  html5: [
    // 想内置歌曲就放在这里（音频文件放进 public/audio/）
    // { audio: '/audio/example.mp3', track: 'Example', artist: 'Me' },
    // 留空也行 —— 用户点"上传"按钮就能添加
  ],
}

