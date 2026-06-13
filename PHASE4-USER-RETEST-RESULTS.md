# Phase 4 · 首轮用户反馈结论

> 日期：2026-06-13
> 样本：5 位用户的定性反馈
> 限制：本轮没有完整记录 T0–T5 的用时、提示次数和完成状态，因此只能用于发现问题，不能判定 Phase 4 已通过任务制复测门槛。

## 结论

当前产品的功能完整度已经高于视觉辨识度。用户主要问题不是“缺少更多参数”，而是：

1. 已有布局规则在居中和移动端场景下没有一致生效。
2. Portfolio 筛选存在真实功能缺陷。
3. 默认模块过多，Journey 对普通个人网站不是普适内容。
4. Travel 有交互，但城市之间缺乏视觉差异，切换收益不足。
5. 首页和全站缺少可辨识的主题动作或视觉主旋律。

这轮优先修正可用性和结构，不直接加入高成本动画库、随机装饰或常驻互动角色。

## 已处理

### P0 · Portfolio 筛选空白

- 原因：筛选后只有一个作品，但两列网格仍保留空白第二列。
- 修复：单项结果横跨完整网格，并增加空结果状态。
- 自动化：production UI smoke 会切换到 Docs，断言唯一作品填满网格。

### P1 · 章节工具栏与标题对齐不一致

- 原因：居中模式只作用于 `.section-header`，没有作用于 Works、Library、Photography 的筛选工具栏。
- 修复：筛选、收藏分类和摄影工具栏统一使用内容最大宽度，并跟随对齐模式。
- 实测：三个章节的标题中心与工具栏中心偏差均小于 1px。

### P1 · 移动端过窄和横向溢出

- 原因：Style runtime 的双栏规则加载在响应式规则之后，390px 下 About 仍保留两栏，页面内容宽度达到 625px。
- 修复：1024px 以下强制 About/Contact 单栏；移动端分类栏改为横向滚动；章节标题和元信息改为纵向排列。
- 自动化：production UI smoke 在 390×844 下断言单栏且页面没有横向溢出。

### P1 · Journey 默认展示

- 默认 `MODULES.journey` 改为关闭且不进入导航。
- 模块仍保留在 ContentEditor 中，可由用户自行开启。
- Personal Journal 模板仍会启用 Journey，适合成长记录、毕业季和家庭记录等情境。

### P1 · Travel 城市视觉同质化

- 竖直文字列表改为两列城市卡片。
- 新增 11 个可编辑城市主题：
  `botanical`、`metropolitan`、`garden`、`archive`、`neon`、`terracotta`、`harbor`、`graphic`、`craft`、`rain`、`chrome`。
- 默认数据中杭州为植物主题、上海为现代都市主题；其余城市也有不同视觉语言。
- `theme` 已进入 ContentEditor schema、空白模板、内容预设和 AI 填充格式。

## 暂不直接接受

### 常驻“小怪兽”互动

不把固定角色硬编码进所有主题。它会：

- 抢占个人作品的视觉主角位置。
- 在极简、档案和专业作品集主题中显得突兀。
- 增加移动端遮挡、无障碍和 reduced-motion 处理成本。

更合适的方向是可关闭的 `Theme Motif`：角色、蛛丝、胶片划痕、叶片、扫描线都属于主题资产，由预设决定，不成为所有网站的默认功能。

### 立即引入 GSAP 或重型滚动动画

当前反馈证明了需要更强的动态辨识度，但没有证明必须使用 GSAP。先用 CSS、SVG path 和轻量 scroll progress 做一个主题动作原型；只有时间线、视差编排和章节叙事复杂到 CSS 难以维护时再引入动画库。

### 所有移动端模块默认折叠

默认折叠会降低内容发现率，也可能让访客误以为模块为空。下一轮应测试：

- 只折叠次级长列表，而不是整个 section。
- About CV、Library 列表、Travel destinations 分别提供“展开全部”。
- 首屏和 Works 始终保持展开。
- 折叠按钮具备 `aria-expanded`，并尊重用户上次选择。

## 已实现：Phase 4 UX2 · 主题动作与移动收放

### 1. Motion Tokens 与主题动作层

现有 `motion` 维度已增加：

```js
{
  motif: "none | web | film | botanical | scanline",
  scrollIntensity: 0.4,
  ambient: true,
  interaction: "subtle"
}
```

- `StyleProvider` 会把 motif、环境动画和交互模式同步到页面 dataset，并通过 CSS variables 写入动作强度。
- `StyleEditor` 已提供 motif、滚动强度、环境动画和交互模式控件。
- `PreviewFrame` 通过受限同源消息把完整 style 传给真实 App；切换 motif 或 Landing 不再只更新 CSS 变量。
- 所有动作支持关闭、移动端降级和 `prefers-reduced-motion`。

### 2. 主题动作原型

- **Web**：边缘轨迹随滚动移动，并提供可点击的短促反馈，不遮挡正文。
- **Film**：帧线、片头标记和轻微曝光变化形成连续的胶片语言。
- **Botanical**：叶片轮廓与呼吸式纹理提供低刺激环境动作。
- **Scanline**：扫描线与定位标记服务数字档案和实验界面。
- **None**：完全关闭主题 motif。

本轮使用 CSS、轻量 scroll progress 和少量 React 状态完成，没有引入 GSAP、粒子库或常驻角色系统。

### 3. 首页结构差异

三套首页不再只更换颜色：

- **Minimal Portfolio**：首屏直接展示前三个项目，项目标题和作品入口优先。
- **Personal Journal**：增加当前记录，日期和短句优先。
- **Gradient Studio**：增加媒介与创作领域 chips，实验排版和数字作品身份优先。

Minimal、Personal Journal、Gradient Studio 均已分别通过桌面与 390×844 移动端截图审查；Personal Journal 的浅色纸张模式已改为使用主题文本 token，避免白字落在浅色背景上。

### 4. 移动端渐进展开

- About CV、Library 当前分类和 Travel destinations 已使用统一的局部展开控件。
- 首屏和 Works 保持展开；桌面端不折叠。
- 控件具备 `aria-expanded`、`aria-controls` 和 44px 触摸目标。
- 展开状态按模块写入单一 `chen.ui.mobileDisclosures`，刷新后恢复；存储不可用时安全退化为当前会话状态。
- 390×844 下无横向溢出，折叠与展开状态已通过浏览器 smoke。

下一步仍需进行 3 人移动端任务测试。通过标准：

- 无横向溢出。
- 找到“展开全部”不超过 10 秒。
- 折叠后页面总高度显著下降。
- 不影响锚点导航和浏览器查找。

## 下一轮验证

继续使用 [`PHASE4-USER-RETEST.md`](./PHASE4-USER-RETEST.md)，但必须记录任务状态、用时和提示次数。下一轮重点观察：

1. Portfolio 筛选是否仍被理解为空白或加载失败。
2. 移动端是否仍被描述为“太窄”。
3. Journey 关闭后，用户是否更容易理解网站结构。
4. 城市卡片切换是否产生足够的视觉差异。
5. motif 是否增强主题辨识度，还是分散了对作品本身的注意力。
6. About、Library、Travel 的展开入口是否容易发现，且没有造成“内容缺失”的误解。
