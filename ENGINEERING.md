# ENGINEERING.md · 工程契约

> 本文是改动本仓库时的**约束性契约**，面向任何人——尤其是 **AI 编码 Agent**（Claude Code / Cowork）。
> 分工：`CLAUDE.md` 讲**架构是什么**；本文讲**改动必须遵守什么**；`PLAN.md` 讲**往哪改**。
> 任何变更都必须满足 [§6 Definition of Done](#6-definition-of-done)。若与 `CLAUDE.md` 冲突，以本文 + 代码现状为准，并在同一次改动里更新 `CLAUDE.md`。

## 0. Agent 工作流程（每次改动）

1. **先读** `CLAUDE.md`（架构）+ 本文相关章节。
2. 改动前用 `Grep` 确认你要碰的符号/变量还有哪些引用（很多契约是跨文件的，见 §1）。
3. 改完**必须** `npm run build` 通过；有测试后 `npm test` 必须绿。
4. 若动到架构/契约/`localStorage` 键/CSS 变量，**同一次**更新 `CLAUDE.md`（及必要时 `PLAN.md`）。
5. 按 §8 写变更说明。

> 沙箱/环境跑不起来时，不能跳过验证：至少逐文件复读改动区域，确认无悬空引用、无语法错误，并在交付说明里标注「未经 build 验证」。

---

## 1. 不变量 / Invariants

这些是「改一处必须同步另一处，否则静默出错」的契约。**违反任一条即缺陷。**

### INV-1 · CSS 变量契约

`src/style-engine.js#deriveStyleVars` 返回对象的**键名**（`--ink-void`、`--style-shadow-card`、`--style-image-filter`…）是整个 `src/styles/*` 消费的公共接口。

- ❌ 不得重命名/删除任何 `--*` 键，除非同时 grep 更新所有 CSS 用法。
- ✅ **新增**键是安全的。
- ⚠️ 这些名字是历史遗留（`--ink-void` 实为浅色背景、`--cream` 实为深色文字）。**保留名字、不要"修正"它们**。

### INV-2 · schema ↔ data 契约

任何「可编辑字段」必须**同时**存在于 `src/components/editor/schema.js` 和 `src/data.js` 的对应默认值里。

- 只改一边 = 缺陷（编辑器与数据会静默漂移）。
- 新增字段：先在 `schema.js` 的对应 itemSchema 里声明类型，再在 `data.js` 给出默认值；`validation.js` 若需要也要覆盖。

### INV-3 · Section registry 与编辑器清单

运行时数据 registry 由 `lib/section-registry.js#createSectionRegistry(data.js exports)` 自动派生；编辑器可导出章节的唯一权威是 `schema.js#EXPORTABLE_SECTIONS`。

- ❌ 不得再引入第二份硬编码章节枚举。
- `DataProvider` 不得手写 `baseData/resolvedData` 键映射；新增大写数据 export 会自动进入运行时 registry。
- 编辑器、校验和代码导出需要章节列表时，从 `EXPORTABLE_SECTIONS.map(s => s.key)` 派生。

### INV-4 · 双语契约

所有面向访客的文案是 `{ en, zh }`（由 `data.js#L(en, zh)` 生成）。

- 渲染一律经 `pick(value, lang)` 或 `useLang().t(value)`。
- ❌ 绝不直接渲染裸 `{en,zh}` 对象；`pick` 也绝不能返回对象（React 无法渲染）。
- 新增面向访客文案必须双语；缺一种语言时由 `pick` 走 zh → en → '' 兜底。

### INV-5 · 跨引用契约（值必须对得上）

- `WORKS[].medium` 应是 `Works.jsx#WORK_MEDIA_LABELS` 的键；未命中时由 `mediaLabel()` 兜底为人类可读标签（**允许降级，但新增媒介类型时应补 map**）。
- `PHOTOS[].series` 必须匹配某个 `PHOTO_SERIES[].id`。
- `MUSIC[].spotifyId/neteaseId/audio` 与 `NOW_PLAYING` 的来源字段决定可播放性（见 `np-context.jsx#playTrack` 的来源推断）。

### INV-6 · localStorage 命名空间

所有键以 `chen.*` 命名，且**全部访问包 try/catch**（隐私模式/禁用存储要安全降级）。

- 新增键必须登记到 `CLAUDE.md`。
- 现有键（勿与之冲突）：`chen.content.overrides`、`chen.content.lastSaved`、`chen.style.overrides`、`chen.style.lastSaved`、`chen.lang`、`chen.np.source`、`chen.ce.{mode,sideWidth,autosave}`、`chen.se.{mode,sideWidth}`、`chen.content.preImport`；遗留待清理：`chen.readingLog.userEntries`、`chen.photos.userEntries`。

### INV-7 · Provider 链与数据读取

Provider 顺序固定：`LangProvider → DataProvider → StyleProvider → NowPlayingProvider`（`App.jsx`）。

- 组件**只经 hooks**（`useData/useStyle/useLang/useNP`）读数据；❌ 不得在组件里直接 `import { X } from './data'`（`pick`/`L` 等纯函数除外）。

### INV-8 · 静态 / 无后端不变量

生产构建必须保持**纯静态**。唯一的服务端代码是 `vite.config.js` 里**仅 dev** 的 `/api/upload`。

- 任何需要服务端的能力必须：① 在静态构建里优雅降级，② 用 `import.meta.env.DEV`/`PROD` 或功能旗标判定。
- 参照范式：`FileField` 在 `!import.meta.env.DEV` 时禁用上传并提示。

### INV-9 · 持久化即草稿；data.js 是事实源

站内编辑只存 `localStorage`，**不是权威**。权威是 `src/data.js` / `src/style.js`。

- 「导出代码」的唯一序列化器是 `export.js#exportLine`（输出 `L(en,zh)`）。❌ 不得再写第二个序列化器或合并函数。

### INV-10 · 风格配置消费边界

`deriveStyleVars` 是**唯一**把风格配置变成 CSS 变量的地方；`style-context` 仅额外把 `motion.mode`、`design.alignment` 写成 body dataset。

- 已接入并影响渲染：`design/color/typography/space/motion/texture/light/depth` + `color.temperature` + `typography.personality`。
- **描述性元数据（情绪板），不驱动渲染**：`culture`、`mood`、`anchors`。要让它们生效需先做设计决策并更新本条 + `CLAUDE.md`。

---

## 2. 模块边界与依赖方向

| 层     | 目录/文件                                                     | 职责                                               | 允许依赖                    |
| ------ | ------------------------------------------------------------- | -------------------------------------------------- | --------------------------- |
| 数据层 | `data.js`, `data-context.jsx`                                 | 内容事实源 + override 合并                         | 不依赖 `components/*`       |
| 风格层 | `style.js`, `style-engine.js`, `style-context.jsx`            | 风格配置 → CSS 变量                                | 不依赖 `components/*`       |
| 区块   | `components/*.jsx`（About/Works…）                            | 渲染各章节                                         | 经 hooks 读数据；不互相耦合 |
| 编辑器 | `components/editor/*`, `ContentEditor`, `StyleEditor`         | 站内 CMS                                           | 可依赖数据/风格层           |
| 工具   | `hooks.jsx`, `utils.js`, `lang.jsx`, `np-context.jsx`         | 通用能力                                           | 纯/低耦合                   |
| 共享库 | `lib/persist.js`, `lib/modules.js`, `lib/section-registry.js` | 持久化 / 深合并 / 模块规范化 / 运行时数据 registry | 仅 `persist.js` 依赖 React  |

**方向规则**：数据层/风格层是底座，**不得**反向依赖 `components/editor/*`。编辑器可以依赖底座。区块之间不直接互相 import。

---

## 3. 数据契约（关键 shape）

```js
// 双语字符串
L(en, zh) -> { en: string, zh: string }

// 模块配置（MODULES[id]）—— 经 normalizeModuleConfig 规范化；旧的布尔值仍兼容
{ enabled: boolean, nav: boolean, order: number, label: {en,zh}, layout: 'default'|'compact'|'feature' }

// 章节 item 的字段类型由 schema.js 声明：
// 'str' | 'num' | 'bool' | 'bi' | 'bi-text' | 'bi-text-bare'
// 'str-arr' | 'obj' | 'obj-arr' | 'select'
// 'file-image' | 'file-audio' | 'file-pdf'（后三者 dev 期可上传，prod 退化为路径输入）

// 风格配置（DEFAULT_STYLE）顶层键：
// design, color, typography, space, motion, texture, light, depth  —— 驱动渲染
// culture, mood, anchors                                          —— 描述性，不驱动渲染
```

新增字段类型 → 必须在 `editor/fields/*` 提供渲染、在 `validation.js#validateFieldValue` 提供校验、在 `export.js#jsLiteral` 能正确序列化。

---

## 4. 编码约定

- **函数组件 + hooks**；避免类组件。
- **防御式渲染（强制）**：任何来自可编辑数据的值都要可空——用 `?.`、`|| 兜底`、图片 `onError` 隐藏、占位色/占位文案。数据可能被用户写成半成品。
- **`*星号*` 强调**：`title/intro/text/value` 类字段渲染要经 `hooks.jsx#emph`。
- **样式经变量**：组件内尽量不写魔法颜色；新视觉走 `deriveStyleVars` 的变量（见 INV-1、INV-10）。
- **副作用清理**：`addEventListener`、`IntersectionObserver`、`URL.createObjectURL`、`setInterval` 等都要在卸载时清理（参考 `hooks.jsx`、`np-context.jsx`）。
- **依赖克制**：默认只用 React + Vite；新增依赖需在变更说明给理由，优先零依赖实现。
- **i18n 文案**：面向访客双语；内部编辑器工具可中文优先（与现有风格一致）。

---

## 5. 变更配方（按场景的 checklist）

### 加一个「可编辑字段」

1. `schema.js`：在对应 itemSchema 加字段（含 `type`、`label`）。
2. `data.js`：给所有相关条目补默认值（双语字段用 `L`）。
3. 渲染该字段的区块组件：消费时做防御式兜底。
4. 如需校验：`validation.js`。
5. 自检：编辑器能编辑、Copy 导出的代码能 round-trip。〔满足 INV-2、INV-4〕

### 加一个章节 / 模块

1. `schema.js`：`SECTIONS` 加条目 + `MODULES_SCHEMA` 加 `moduleField`。
2. `data.js`：`MODULES` 加配置（`{enabled,nav,order,label,layout}`）+ 该章节默认数据。
3. `components/`：新建区块组件，应用 `data-layout={layout}`。
4. `App.jsx`：在 `sections` 数组注册。
5. `styles/sections.css`：按需加 `section#id[data-layout=…]` 规则。
6. `contentPresets.js`：如要进 AI 填充/预设，补模板。〔满足 INV-3、INV-7〕

### 加一个风格旋钮

1. `style.js#DEFAULT_STYLE` + 各 preset 给默认值。
2. `style-engine.js#deriveStyleVars`：消费它，产出/影响某个 `--*` 变量。
3. `styles/*`：消费该变量。
4. `StyleEditor.jsx`：加控件（`RangeControl`/`SelectControl`…）。
5. 若**不**驱动渲染（纯元数据）：放进「情绪板」语义并在 UI 标注，更新 INV-10。〔满足 INV-1、INV-10〕

### 加一个 CSS 变量

- 只在 `deriveStyleVars` 新增键 + 在 `styles/*` 消费。❌ 不重命名既有键（INV-1）。

### 加一个 localStorage 键

- 用 `chen.*`，包 try/catch，登记到 `CLAUDE.md`（INV-6）。

---

## 6. Definition of Done

一次改动「完成」当且仅当：

- [ ] `npm run build` 通过（环境不可用时：逐文件复读改动区，标注「未 build 验证」）。
- [ ] 有测试后 `npm test`、`npm run lint` 绿。
- [ ] 未违反 §1 任一不变量。
- [ ] 任何跨文件契约（schema↔data、CSS 变量、section 列表、cross-ref）两侧都已同步。
- [ ] 新增面向访客文案是双语；做了防御式渲染。
- [ ] 新增 `localStorage` 键已登记；新增依赖有理由。
- [ ] 动了架构/契约时已同步更新 `CLAUDE.md`（及必要时 `PLAN.md`）。
- [ ] 没有引入第二份「事实源」（序列化器/合并函数/section 列表）。
- [ ] 写了 §8 变更说明。

---

## 7. 禁止事项（反模式）

- ❌ 再加一个序列化器 / 深合并 / section 列表（用既有的：`export.js#exportLine`、共享 `deepMerge`、运行时 `createSectionRegistry`、编辑器 `EXPORTABLE_SECTIONS`）。
- ❌ 重命名/删除 `deriveStyleVars` 的 `--*` 键。
- ❌ 直接渲染裸 `{en,zh}`；让 `pick` 返回对象。
- ❌ 在生产构建路径里引入后端依赖（服务端能力必须旗标化 + 优雅降级）。
- ❌ 在组件里直接 `import` `data.js` 的内容数据（经 hooks）。
- ❌ 随手加第三方依赖（尤其 UI 库）。
- ❌ 把 `culture/mood/anchors` 当作渲染输入而不先做设计决策。

---

## 8. 变更说明约定

每次改动附一段简短说明，含：**动机**（关联 `PLAN.md` 阶段/分析项）、**改了哪些文件、为什么**、**满足/影响哪些不变量**、**验证方式**（build/test，或「未验证 + 原因」）、**是否更新了 `CLAUDE.md`/`PLAN.md`**。

---

## 附:本契约与文档的关系

- `CLAUDE.md` —— 架构事实（是什么、在哪）。
- `ENGINEERING.md`（本文）—— 改动规则（必须遵守什么）。
- `PLAN.md` —— 方向与排序（往哪改、先后）。
- `CODEBASE_ANALYSIS.html` —— 现状诊断（为什么有这些规则）。
