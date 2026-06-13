# PLAN · 网站改进规划

> 本文是 `miles.morales`（双语个人作品集**模板** + 站内 CMS）的分阶段改进路线图。
> 配套文档：`ENGINEERING.md`（工程契约 / 实现规则）、`CLAUDE.md`（架构说明）、`CODEBASE_ANALYSIS.html`（现状分析）、`PRODUCT-DIRECTION.md`（产品方向评估与优先级）。
> 读者：项目所有者 + AI 编码 Agent。每一项工作的「怎么改」以 `ENGINEERING.md` 为准。

## 当前进度（2026-06-13）

| 项目                      | 状态      | 当前证据 / 下一步                                                                                               |
| ------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| 1.1 Section 单一事实源    | ✅ 已完成 | `SECTION_KEYS` 已删除；编辑器清单来自 `EXPORTABLE_SECTIONS`，运行时数据由 `section-registry.js` 派生            |
| 1.2 Provider / 持久化去重 | ✅ 已完成 | `persist.js`、`modules.js` 已共享；StrictMode、失败写入、reset 语义有单测和 UI smoke                            |
| 1.3 测试 + CI             | ✅ 已完成 | Vitest 覆盖 27 个文件 / 135 项测试；CDP smoke 覆盖开发态与生产预渲染态                                          |
| 1.4 ESLint + Prettier     | ✅ 已完成 | `lint`、`format:check` 已进入 package scripts 与 CI                                                             |
| 1.5 迁移垫片退场策略      | ✅ 已确定 | 旧 key 只读迁移，成功进入统一状态后清理；代码标记 2026-12-31 后删除                                             |
| 2.1a SEO 元数据           | ✅ 已完成 | 静态/运行时 head、`SITE.url`、OG/Twitter、robots/sitemap 与 SEO 测试已落地                                      |
| 2.1b 预渲染 / SSG         | ✅ 已完成 | `/`、`/en/`、`/zh/` 静态正文、hydrate、hreflang 契约与 production CDP smoke 已落地                              |
| 2.2 编辑器懒加载          | ✅ 已完成 | `ContentEditor` / `StyleEditor` 使用 `React.lazy`；构建产出两个编辑器独立 chunk                                 |
| 首次载入滚动位置          | ✅ 已修复 | 无 hash 的载入 / 刷新禁用浏览器滚动恢复并回到 `landing-masthead`；浏览器 smoke 已覆盖                           |
| GitHub Actions            | ✅ 已完成 | `.github/workflows/ci.yml` 已执行 install → lint → test → build → check:dist → format                           |
| 2.4 部署上线              | 🟡 收尾中 | Render 已上线；独立 OG 图、缓存配置与 deploy checker 已落地，待部署后外部平台/GSC 验收                          |
| 3A.1 内容 / 风格发布      | 🟡 待外验 | GitHub Contents API、精确 export 替换、token 安全边界、贯通 mock 与编辑器发布 UI 已落地；待真实 PAT commit 验收 |
| 3A.2 生产媒体上传         | 🟡 待外验 | `FileField` 可在生产提交响应式媒体到仓库 `public/`；mock 已覆盖创建/冲突重试，待真实图片提交                    |
| 4.P0 空白起点             | ✅ 已完成 | W0-a：保留 `data.js` 示例；Start 可原子应用完整空白 overrides，身份字段不再泄漏 Chen 默认值                     |
| 4.P1 Goal Picker          | ✅ 已完成 | 四个目标复用既有内容/风格预设；内容、模块与风格同步应用，目标映射有纯函数单测                                   |
| 4.P2 部署前审计           | ✅ 已完成 | Audit 面板定位错误/警告；占位符和大体积媒体阻断发布；public 路径与 production smoke 继续复用                    |
| 4.UX1 首轮用户反馈        | ✅ 已收口 | 5 位用户反馈已转化为单页风格工作台、渐进引导、区块就地编辑、3 种结构模板与 3 套 Landing 构图                    |
| 4.UX2 主题动作 / 移动收放 | ✅ 已实现 | 5 种 motif、实时预览桥、3 套差异化 Landing 及可记忆的移动端局部展开已落地，待用户复测                           |

> **2026-06-08 · Phase 2 收口于 `codex/perf-font-a1`**：该分支是 `codex/perf-images-a11y`（图片 B3 + 无障碍）的线性超集，再叠加字体 A1，因此合并进单一 PR，旧 PR 关闭。
>
> **CI 跨平台修复（本提交）**：`tests/seoPlugin.test.js` 原先硬编码 `'C:/repo/src/prerender.jsx'` 作为预渲染入口路径——它在 Windows 上是绝对路径（本地常绿），在 Linux 上却是**相对**路径，`resolve()` 会拼上 cwd，导致 `prerenderArtifactCleanupPlugin` 的入口匹配失败、不再删除 `prerender.js` / `server.edge.js`，于是只有 GitHub Actions（Linux）报红。已改为用 `path.resolve('src', …)` 生成随平台正确的绝对 `facadeModuleId`，与生产构建（`vite.config.js` 的 `resolve(process.cwd(), 'src/prerender.jsx')`）保持一致；**插件实现未改动**，仅修正测试夹具。

### 当前稳定边界

- 保留现有 `persist.js`、`section-registry.js` 与两个 context 的职责边界，不为已解决的问题再次重写底层。
- 保持 `useData()` / `useStyle()` 公共 API 稳定；兼容层按已记录的退场日期渐进清理。
- 继续坚持依赖克制；新增依赖必须服务于明确需求，并在变更说明中记录理由。

## 0. 现状基线（一句话）

一个 React 19 + Vite 8、纯静态、无后端的双语作品集模板：构建时预渲染 `/`、`/en/`、`/zh/` 的 Landing + About，浏览器再 hydrate 为完整 SPA；所有文案集中在 `src/data.js`，站内编辑结果先存浏览器草稿，可手动导出，也可通过 GitHub Contents API 提升为源码 commit。当前已具备共享持久化层、Vitest、开发/生产浏览器 smoke、SEO/SSG、lint/format、CI、编辑器按需加载、生产媒体提交、图片 B3、字体 A1 与无障碍修复；2026-06-08 移动端 Lighthouse 达到 Performance 98 / Accessibility 100 / Best Practices 96 / SEO 100 / CLS 0.001。详见 `CODEBASE_ANALYSIS.html`。

## 1. 指导原则（取舍时回到这几条）

1. **静态优先、后端可选。** 默认产物必须是纯静态；生产发布由浏览器直连 GitHub API，未配置 token 时优雅退化为手动导出与 public 路径输入。
2. **单一事实源。** 同一信息只允许有一个权威定义；禁止再引入第二份「section 列表」「序列化器」「合并函数」。
3. **契约即代码。** 现在靠注释/标签维护的跨文件约定（CSS 变量名、schema↔data、WORK_MEDIA、PHOTO_SERIES…）要逐步变成显式、可核验的约束。
4. **双语对等。** 任何面向访客的新文案都必须 `L(en, zh)` 双语；内部工具可中文优先。
5. **渐进增强、保持「模板」属性。** 改进要让别人 clone 后仍然好用；示例数据（Chen）与机制解耦。
6. **依赖克制。** 目前仅 React + Vite，无第三方 UI 库。新增依赖需在 PR/变更说明里给出理由。

## 2. 路线图总览

| 阶段    | 主题                   | 目标                                                           | 关键收益               |
| ------- | ---------------------- | -------------------------------------------------------------- | ---------------------- |
| Phase 0 | 已完成（本轮）         | 统一导出、接入 temperature/personality、修复生产上传、对齐文档 | 消除两处分叉与误导     |
| Phase 1 | 已完成当前稳定化目标   | 单一事实源、去重 provider、测试 + CI、迁移退场策略、lint       | 让后续改动「安全」     |
| Phase 2 | 已启动（SEO 已完成）   | 性能、SEO、无障碍                                              | 让站点「被看见、可用」 |
| Phase 3 | 3A.1 / 3A.2 已实现     | 浏览器草稿可提交到 GitHub，生产媒体可写入仓库                  | 待真实账号链路验收     |
| Phase 4 | P0–P2 + UX1/UX2 已实现 | 空白起点、目标预设、审计、结构模板、主题动作与移动收放         | 让模板 5 分钟可上手    |

排序原则：地基、质量与发布链路已建立；Phase 4 已根据首轮 5 人反馈完成两轮 UX 收口。下一步先做任务制复测和 Phase 2/3 外部验收，再决定是否启动 Prompt Builder 等 P3+。

---

## Phase 0 · 已完成（本轮提交）

- **导出路径统一**：Copy / Copy All / 下载 `data.js` 现在都走 `export.js#exportLine`，输出一致的 `L('en','zh')`；删除 `data-context` 里基于 `JSON.stringify` 的分叉序列化器。
- **接入失效旋钮**：`color.temperature`（冷暖染色）、`typography.personality`（默认字体配对）已接入 `deriveStyleVars`；`culture/mood/anchors` 在编辑器里重标为「情绪板（描述性，不驱动渲染）」。
- **生产上传缺口（历史）**：Phase 0 先明确了 dev-only 边界；Phase 3A.2 已用浏览器 GitHub 提交填平该缺口。
- **文档对齐**：重写 `README.md`（编辑器优先工作流 + 真实文件树），修正 `CLAUDE.md`（移除 `exportResolvedData`、`compact/feature` 布局已实现、风格旋钮现状）。

> 验收：`npm run build` 通过 + 站内编辑器实测一遍即可视为 Phase 0 收尾。

---

## Phase 1 · 夯实地基（优先：代码健康 · 测试与 CI）

**目标**：把「改一处会静默拖坏另一处」的隐患降到最低，为后面所有阶段铺安全网。

### 1.1 Section 单一事实源 〔分析项 #6 · ✅ 已完成〕

- 实现：`SECTION_KEYS` 已删除；运行时数据由 `createSectionRegistry(data.js exports)` 自动派生，编辑器导出清单由 `EXPORTABLE_SECTIONS` 派生。
- 验收结果：`DataProvider` 不再手写 `baseData/resolvedData` 键映射；section registry 有独立测试。

### 1.2 去重 provider / 持久化机制 〔#5 · ✅ 已完成〕

- 现状：`data-context` 与 `style-context` 各自重复实现深合并（`mergeSection` ≡ `mergeStyle`）和 `localStorage` 读写/`lastSaved`/首渲染跳过逻辑，且两者在「是否 memo」上不一致。
- 做法：抽出共享 `deepMerge(base, override)` 与 `useLocalStorageState`（封装 load/save/lastSaved/持久化快照）；两个 context 复用；给 `DataProvider` 的 `resolvedData` 与 `value` 补 `useMemo`（对齐 `StyleProvider`）。全量重置 API 收敛为 `resetAll`。
- 验收：两套机制由同一份工具支撑；`DataProvider` 不再每次渲染重算全部合并。

### 1.3 测试 + CI 〔#7 · ✅ 已完成〕

- 实现：使用 **Vitest 4** 覆盖 `deepMerge`、持久化读写、`normalizeModuleConfig`（布尔 → 对象向后兼容）、section registry、`export.js#jsLiteral` 往返与 `validation.js` 关键分支；CDP smoke 独立验证浏览器主流程。
- 验收结果：23 个测试文件、113 项测试通过。GitHub Actions 顺序为 `install → lint → test → build → check:dist → format:check`。

### 1.4 引入 lint / format 〔✅ 已完成〕

- 实现：ESLint 9 + React Hooks / React Refresh 规则与 Prettier；`package.json` 提供 `lint`、`lint:fix`、`format`、`format:check`。
- 验收结果：`npm run lint`、`npm run format:check` 通过，且均已进入 CI。

### 1.5 清理迁移垫片 〔#8 · ✅ 已建立退场策略〕

- 现状：`Library.jsx`/`Photography.jsx` 只读旧的 `chen.readingLog.userEntries` / `chen.photos.userEntries` 并迁入统一内容状态，不再向旧 key 写数据。
- 已完成：两个垫片都标记在 **2026-12-31 后移除**；阅读日志在确认已有统一状态后删除旧 key，摄影迁移后删除旧 key。
- 后续：到期后删除常量与两个迁移 effect，并更新 `CLAUDE.md` / `ENGINEERING.md` 的旧 key 清单。

**Phase 1 退出标准**：CI（lint + test + build + check:dist + format）绿；不存在第二份 section 列表/序列化器/合并函数；`ENGINEERING.md` 的不变量全部成立。

---

## Phase 2 · 质量与可达（优先：性能 · SEO · 无障碍）

**目标**：一个作品集的价值在于「被看见、看得舒服、谁都能用」。SEO/SSG 已建立，后续集中改善性能与无障碍。

### 2.1 SEO / 可发现性

完整实施与验收合同见 [`SPEC-2.1-SEO.md`](./SPEC-2.1-SEO.md)，本节只维护阶段状态，避免重复规格漂移。

- **2.1a · 元数据与发现资源 ✅**：构建期/运行时 head、`SITE.url`、Open Graph / Twitter Card、`robots.txt`、`sitemap.xml`；零运行时依赖。
- **2.1b · 预渲染 / SSG ✅**：`vite-prerender-plugin` 输出 `/`、`/en/`、`/zh/` 的 Landing + About；路径决定首帧语言，浏览器 hydrate 后恢复内容/风格/播放器本地状态；构建后清除 prerender-only chunk。
- **退出结果**：两步均满足代码侧 Definition of Done；生产 `SITE.url` 已配置，独立 OG 图与缓存规则仍待新版部署和外部平台验收。

### 2.2 性能

完整实施与验收合同见 [`SPEC-2.2-PERF.md`](./SPEC-2.2-PERF.md)（2.2 性能 + 2.3 无障碍合并），本节只维护阶段状态与默认路线。

- ✅ **编辑器已移出主包**：`ContentEditor` / `StyleEditor` 走 `React.lazy`；约 70 kB / 24 kB 独立 chunk，主 JS 由约 427 kB 降至约 317 kB（未压缩）。
- ✅ **图片 B3 已完成**：访客图片具备显式尺寸、懒加载/异步解码，portrait 作为首个内容图使用高优先级；编辑器上传可生成 `480/960/1440/1800` 响应式图片族，旧路径保持兼容。
- ✅ **字体 A1 已完成**：删除重复字体 `@import`，按实际使用精简字重，以 preload + `noscript` 加载 Google Fonts 样式表，并用 `size-adjust` / ascent / descent / line-gap 度量匹配本地 fallback。
- ✅ **移动端 Lighthouse 已达标（2026-06-08）**：Performance 98、Accessibility 100、Best Practices 96、SEO 100、CLS 0.001；FCP 1.8s、LCP 1.9s、TBT 110ms。
- **路线结论**：图片 **B3** + a11y + 字体 **A1** 已达到目标，暂不引入 **A2（自动子集字体）/ B1（AVIF/WebP 管线）**；A2/B1 保留为未来真实内容量或线上指标回退时的升级选项，继续排除 A2′ / B2。

### 2.3 无障碍（a11y，并入 2.2 一起做）

实施与验收见 [`SPEC-2.2-PERF.md`](./SPEC-2.2-PERF.md) §3 / §8；与性能并行。

- ✅ 模态具备 `role="dialog"` + `aria-modal` + 焦点陷阱/关闭归位；`:focus-visible`、图片 `alt`、全部风格预设正文 token ≥ 4.5:1 已由代码与测试覆盖。
- ✅ `prefers-reduced-motion` 现在覆盖 reveal、CursorSpotlight 与平滑滚动，production CDP smoke 验证系统 reduce 优先。

### 2.4 部署上线（让 SEO 真正生效）〔已上线 2026-06-08〕

完整 runbook 与验收见 [`SPEC-2.4-DEPLOY.md`](./SPEC-2.4-DEPLOY.md)。

- ✅ **已上线**：<https://personal-website-x3u4.onrender.com>（Render **Static Site**，`base='/'` 根域）；三条预渲染路由、canonical、hreflang、robots 与 sitemap 已在线核对。
- ✅ **仓库侧已完成**：`SITE.ogImage` 与 `portrait` 分离；原创 `public/og-cover.jpg` 为 1200×630；补齐社交图片尺寸/alt；`render.yaml` 固化缓存规则；`npm run check:deploy` 模拟四类 bot 并检查线上缓存。
- ⏳ **待新版部署**：既有 Render 服务若非 Blueprint 管理，需在 Dashboard 同步 `render.yaml` 的 Headers，重新部署后让 `npm run check:deploy` 严格模式通过。
- ⏳ **账号侧待验收**：Facebook / X / LinkedIn 重新抓取；Search Console URL-prefix 验证并提交 sitemap。验证 token 可填 `SITE.googleSiteVerification`。
- **关键约束**：保持 `base='/'`；避免 GitHub Pages 项目站子路径（会打断 `data.js` 里的 `/picture` 等绝对媒体路径，见 spec §4）。

**Phase 2 退出标准**：质量项 ✅ 已满足（Lighthouse 全达标、编辑器不拖累首屏）；**「被看见」以 2.4 部署上线为最终前提**。

---

## Phase 3 · 真正的持久化（优先：持久化 / 后端）

> **实现方向：路径 A1 · 浏览器内 GitHub Contents API。** 完整契约与验收状态见 [`SPEC-3-PERSIST.md`](./SPEC-3-PERSIST.md)。

### 3A.1 内容与风格发布 〔代码完成，待外部验收〕

- 内容编辑器和风格编辑器共用 `PublishPanel`：配置 owner / repository / branch，验证 fine-grained PAT 后直接提交。
- `src/data.js` / `src/style.js` 由哨兵界定发布区域；发布器只替换发生变化的 export 声明，不重生成整个文件。
- token 默认 sessionStorage，只有显式“记住”才 localStorage；存储不可用时退化为面板内存态。
- 发布前校验 resolved data、public 资源、大体积 data URL 与 token 泄漏；409 冲突重取 SHA 后只重试一次。
- 未配置 token 时，Copy、下载、localStorage 草稿与正常浏览保持原行为。

### 3A.2 生产媒体上传 〔代码完成，待外部验收〕

- dev 继续走 `/api/upload` 写本地 `public/`。
- prod 使用同一 GitHub 配置提交到 `public/{subfolder}/`；响应式图片仍由浏览器生成。
- 没有 token 时不报全站错误，保留手填 public 路径。

### 3A.3 / 3A.4 〔可选，未实现〕

- 分支 + PR + CI 模式：只有真实使用表明直接 main 风险不可接受时再做。
- GitHub App / OAuth 登录式 UX：需要极小 token-exchange 服务，当前不引入。

**退出标准**：本地质量门全绿后，用所有者 fine-grained PAT 完成一次文案 commit、一次生产图片提交，并确认 Render 自动部署后的线上结果。外部提交未完成前状态保持“待外验”，不虚报完成。

---

## Phase 4 · 模板上手（P0–P2 + UX1/UX2 已实现）

> 实施合同见 [`SPEC-4-TEMPLATE.md`](./SPEC-4-TEMPLATE.md)，优先级与理由见 [`PRODUCT-DIRECTION.md`](./PRODUCT-DIRECTION.md)。首轮已收集 5 位用户反馈；证据优先指向编辑器简化、引导、结构差异和首页质量，而不是立即接 AI。

- ✅ **模板上手 P0–P2**：Start 可选择完整空白起点或三个目标；`goals.js` 原子写入 content overrides 并复用 `applyPreset`；Audit 面板与 GitHub 发布共用结构化阻断规则。
- ✅ **反馈驱动 UX1**：StyleEditor 改为“左侧参数 + 右侧完整站点预览”的单页工作台；基础参数一次展开一组，高级质感/光影/深度折叠；页面区块提供 Content/Style 就地入口。
- ✅ **结构与首页差异**：`siteTemplates.js` 提供 Minimal Portfolio、Personal Journal、Gradient Studio，分别控制模块显示/导航/顺序/layout 与 Landing 构图；结构模板保留用户内容。
- ✅ **主题动作 UX2**：`motion` 增加 motif、滚动强度、环境动画和交互模式；提供 Film、Web、Botanical、Scanline、None 五种主题动作，并完整支持 reduced motion。StyleEditor 通过同源预览消息把完整 style 注入真实 App iframe，React 驱动的 motif 和 Landing 构图也会即时更新。
- ✅ **移动渐进展开 UX2**：About CV、Library 和 Travel 在移动端折叠次级长内容，首屏与 Works 保持展开；统一控件具备无障碍状态、稳定触摸目标，并通过 `chen.ui.mobileDisclosures` 记忆用户展开选择。
- **主题分享 / 市场**：`exportStyle()` 已能导出 `STYLE`；把它产品化为可分享/导入的主题文件，甚至一个画廊。
- **AI 填充增强**：把分散的 prompt/preset 统一；支持分章节增量填充、图片建议、把「情绪板（mood/anchors）」真正喂给 AI 生成初始风格（`ReferencePanel` 已为此留好数据）。
- **新章节 / 布局**：把 `compact`/`feature` 之外的布局体系化；新增如「时间线变体」「画廊」等模块（走 `MODULES` + `schema` + 组件三件套）。
- **多语言**：当前 `L(en, zh)` 是两语硬编码；评估推广到 N 语言（影响 `pick`、schema、编辑器、导出器——属于较大重构，列为候选）。
- **任务制复测**：首轮 5 人定性反馈及处理结论见 [`PHASE4-USER-RETEST-RESULTS.md`](./PHASE4-USER-RETEST-RESULTS.md)；下一轮继续按 [`PHASE4-USER-RETEST.md`](./PHASE4-USER-RETEST.md) 记录完成率、耗时、提示次数与错误路径。

---

## 3. 优先级与排序（影响 × 成本）

1. **已完成的地基**：1.1 单一事实源、1.2 provider 去重、1.3 Vitest + CI、1.4 lint/format、2.2 编辑器懒加载。
2. **已完成的性能阶段**：图片 B3、字体 A1、a11y 与移动端 Lighthouse 验收。
3. **当前收口**：Phase 2.4 部署外验、Phase 3A.1 / 3A.2 真实 GitHub commit 与生产图片验收。
4. **产品验证**：首轮 5 人观感反馈已完成；下一步做任务制复测。其余探索项按证据排序，3A.3 PR 模式不预做。

## 4. 风险与权衡

- **引后端 = 破坏静态气质**：Phase 3 必须坚持「未配置即纯静态降级」，否则模板对 clone 者变重。
- **SSG 复杂度**：已用独立 `prerender.jsx`、首帧稳定值和 production CDP smoke 控制水合风险；以后新增首屏动态数据时必须同步扩展该契约。
- **范围蔓延**：Phase 4 诱人但别在地基（Phase 1）稳之前投入。
- **过早进入 P3**：已有反馈优先要求简化与差异化；在任务制复测证明主流程顺畅前，不增加 Prompt Builder、AI API、组件市场或后端。
- **多语言重构**：收益高但触面广，非必要不早做。

## 5. 成功指标

- CI：`lint + test + build + check:dist + format` 常绿；核心逻辑（合并/规范化/持久化/导出）有测试覆盖。
- 质量：Lighthouse 性能 ≥ 90（移动）、SEO ≥ 95、a11y ≥ 95。
- 健康度：无第二份「事实源」；`ENGINEERING.md` 不变量零违反；新增 `localStorage` 键都登记在 `CLAUDE.md`。
- 现实缺口：线上编辑可持久化（Phase 3 落地）。

## 6. 本轮完成与下一步

本轮已完成：

1. ✅ 删除 `SECTION_KEYS`，编辑器章节从 `EXPORTABLE_SECTIONS` 派生，运行时数据从 section registry 派生（1.1）。
2. ✅ ESLint + Prettier + scripts + CI 门禁（1.4）。
3. ✅ 接入 Vitest，覆盖 `export.js#jsLiteral`、`normalizeModuleConfig` 及其余核心纯函数（1.3）。
4. ✅ `ContentEditor` / `StyleEditor` 使用 `React.lazy` 按需加载（2.2）。
5. ✅ GitHub Actions 执行 install / lint / test / build / format。
6. ✅ 修复普通载入自动落在 About / Journey 接缝的问题；无显式 hash 时始终从 Landing 顶部开始。
7. ✅ section registry 契约测试、显式 ESM 扩展名、`isDirty` 保存状态与迁移垫片退场日期全部落地。
8. ✅ Phase 2.1a/2.1b：双语 SEO head、发现资源、三条静态路由、首屏预渲染与无错误 hydration。
9. ✅ Phase 3A.1/3A.2 代码：GitHub 发布、精确 export 替换、token/storage 安全边界和生产媒体提交已落地并有单测。
10. ✅ Phase 4 P0–P2：完整空白起点、目标预设原子应用、部署前 Audit 面板与发布阻断已落地。
11. ✅ Phase 4 UX1：首轮 5 人反馈已落实为单页 Style 工作台、引导路径、就地编辑、结构模板和新 Landing。
12. ✅ Phase 4 UX2：主题 motif、差异化首页内容、移动端局部展开和对应自动化回归已落地。

下一步建议顺序：

1. **完成 Phase 2.4 外部验收**：部署独立 OG 图和缓存规则，跑 `check:deploy`，刷新三家社交平台卡片，完成 Search Console 验证与 sitemap 提交。
2. **Phase 3 外部验收**：用最小权限 PAT 提交一处测试文案和一张测试图片，确认 GitHub diff、Render 重建与线上资源。
3. **Phase 4 任务制复测**：执行 [`PHASE4-USER-RETEST.md`](./PHASE4-USER-RETEST.md)，覆盖 5 人、3 种模板和至少 2 位移动端用户；重点验证 motif 辨识度与移动端展开入口。
4. 根据复测证据决定是否启动 P3 Prompt Builder；不预做 iframe、后端代理或任意组件生成。
5. 保留当前 Lighthouse 基线；指标低于门槛时再评估 A2/B1。
6. 2026-12-31 后删除两个旧 localStorage 迁移垫片。

> 每一步的具体「改哪些文件、满足哪些不变量、Definition of Done」见 `ENGINEERING.md`。

## 7. 已知问题（待处理 / Known issues）

### KI-1 · 打开瞬间的微移（低优先，已降级但未根除）

- **现象**：首次打开时能观察到**一瞬间**的位置移动——主界面载入、内容编辑器、样式编辑器三处都有。一次性、发生在「刚打开」那一帧，不影响后续使用。
- **诊断**：
  - **编辑器**：底部「实时预览」iframe 在**加载完成那一刻被站内某元素抢了焦点**，浏览器为显示获焦元素把 iframe 滚进视野，从而拽动 `.ce-main`。已做的缓解（`PreviewFrame` 在 `onFocus` 同步把面板还原到用户位置、去掉预览 URL 的 `#hash`、iframe `tabIndex=-1`、`.ce-main` 加 `overflow-anchor:none`）把它压成「一瞬」，但没有从源头消除焦点抢夺。
  - **主界面**：初始滚动守卫（`c412367`：`index.html` 内联脚本 + `main.jsx` settle）在字体/app 就绪后把滚动归零，首帧可见为一次轻微位移。
- **影响**：低。一次性、仅在打开时、不影响可用性。
- **下一步（重启时）**：在出现跳动后于控制台取 `document.activeElement` 定位**预览里到底是谁在 load 后 `focus()`**（疑似某个嵌入元素 / 站点自身的 load 后聚焦），在 `previewSurface=1` 模式下禁用该聚焦，从源头根除；同时复审主界面守卫的时序（是否可缩短/改为不可见的方式）。
- **相关文件**：`src/components/editor/PreviewFrame.jsx`、`src/components/ContentEditor.jsx`、`src/styles/editors.css`、`index.html`、`src/main.jsx`、`src/App.jsx`。
