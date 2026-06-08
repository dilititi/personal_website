# PLAN · 网站改进规划

> 本文是 `miles.morales`（双语个人作品集**模板** + 站内 CMS）的分阶段改进路线图。
> 配套文档：`ENGINEERING.md`（工程契约 / 实现规则）、`CLAUDE.md`（架构说明）、`CODEBASE_ANALYSIS.html`（现状分析）。
> 读者：项目所有者 + AI 编码 Agent。每一项工作的「怎么改」以 `ENGINEERING.md` 为准。

## 当前进度（2026-06-07）

| 项目                      | 状态      | 当前证据 / 下一步                                                                                    |
| ------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| 1.1 Section 单一事实源    | ✅ 已完成 | `SECTION_KEYS` 已删除；编辑器清单来自 `EXPORTABLE_SECTIONS`，运行时数据由 `section-registry.js` 派生 |
| 1.2 Provider / 持久化去重 | ✅ 已完成 | `persist.js`、`modules.js` 已共享；StrictMode、失败写入、reset 语义有单测和 UI smoke                 |
| 1.3 测试 + CI             | ✅ 已完成 | Vitest 覆盖 14 个文件 / 64 项测试；CDP smoke 覆盖开发态与生产预渲染态                                |
| 1.4 ESLint + Prettier     | ✅ 已完成 | `lint`、`format:check` 已进入 package scripts 与 CI                                                  |
| 1.5 迁移垫片退场策略      | ✅ 已确定 | 旧 key 只读迁移，成功进入统一状态后清理；代码标记 2026-12-31 后删除                                  |
| 2.1a SEO 元数据           | ✅ 已完成 | 静态/运行时 head、`SITE.url`、OG/Twitter、robots/sitemap 与 SEO 测试已落地                           |
| 2.1b 预渲染 / SSG         | ✅ 已完成 | `/`、`/en/`、`/zh/` 静态正文、hydrate、hreflang 契约与 production CDP smoke 已落地                   |
| 2.2 编辑器懒加载          | ✅ 已完成 | `ContentEditor` / `StyleEditor` 使用 `React.lazy`；构建产出两个编辑器独立 chunk                      |
| 首次载入滚动位置          | ✅ 已修复 | 无 hash 的载入 / 刷新禁用浏览器滚动恢复并回到 `landing-masthead`；浏览器 smoke 已覆盖                |
| GitHub Actions            | ✅ 已完成 | `.github/workflows/ci.yml` 已执行 install → lint → test → build → check:dist → format                |

### 当前稳定边界

- 保留现有 `persist.js`、`section-registry.js` 与两个 context 的职责边界，不为已解决的问题再次重写底层。
- 保持 `useData()` / `useStyle()` 公共 API 稳定；兼容层按已记录的退场日期渐进清理。
- 继续坚持依赖克制；新增依赖必须服务于明确需求，并在变更说明中记录理由。

## 0. 现状基线（一句话）

一个 React 19 + Vite 8、纯静态、无后端的双语作品集模板：构建时预渲染 `/`、`/en/`、`/zh/` 的 Landing + About，浏览器再 hydrate 为完整 SPA；所有文案集中在 `src/data.js`，站内编辑结果存 `localStorage`，靠「导出代码 → 粘回源码 → git push」上线。当前已具备共享持久化层、64 项 Vitest、开发/生产浏览器 smoke、SEO/SSG、lint/format、CI、编辑器按需加载、图片 B3、字体 A1 与首轮无障碍修复；下一步是移动端 Lighthouse 复测并决定是否需要 A2/B1。详见 `CODEBASE_ANALYSIS.html`。

## 1. 指导原则（取舍时回到这几条）

1. **静态优先、后端可选。** 默认产物必须是纯静态；任何需要服务端的能力都要能在静态构建里优雅降级（参考 `FileField` 在生产环境禁用上传的写法）。
2. **单一事实源。** 同一信息只允许有一个权威定义；禁止再引入第二份「section 列表」「序列化器」「合并函数」。
3. **契约即代码。** 现在靠注释/标签维护的跨文件约定（CSS 变量名、schema↔data、WORK_MEDIA、PHOTO_SERIES…）要逐步变成显式、可核验的约束。
4. **双语对等。** 任何面向访客的新文案都必须 `L(en, zh)` 双语；内部工具可中文优先。
5. **渐进增强、保持「模板」属性。** 改进要让别人 clone 后仍然好用；示例数据（Chen）与机制解耦。
6. **依赖克制。** 目前仅 React + Vite，无第三方 UI 库。新增依赖需在 PR/变更说明里给出理由。

## 2. 路线图总览

| 阶段    | 主题                 | 目标                                                           | 关键收益               |
| ------- | -------------------- | -------------------------------------------------------------- | ---------------------- |
| Phase 0 | 已完成（本轮）       | 统一导出、接入 temperature/personality、修复生产上传、对齐文档 | 消除两处分叉与误导     |
| Phase 1 | 已完成当前稳定化目标 | 单一事实源、去重 provider、测试 + CI、迁移退场策略、lint       | 让后续改动「安全」     |
| Phase 2 | 已启动（SEO 已完成） | 性能、SEO、无障碍                                              | 让站点「被看见、可用」 |
| Phase 3 | 真正的持久化         | 在不破坏静态属性的前提下解决「线上编辑不落盘」                 | 补上最大的现实缺口     |
| Phase 4 | 拓展产品             | 新章节/布局、主题分享、AI 填充增强、多语言                     | 模板的增长面           |

排序原则：**先把地基（Phase 1）做扎实**，因为它降低后面每一步的回归风险；Phase 2/3 可并行启动，按你对「曝光」vs「持久化」的偏好取舍；Phase 4 是探索性、随时可插队的增长项。

---

## Phase 0 · 已完成（本轮提交）

- **导出路径统一**：Copy / Copy All / 下载 `data.js` 现在都走 `export.js#exportLine`，输出一致的 `L('en','zh')`；删除 `data-context` 里基于 `JSON.stringify` 的分叉序列化器。
- **接入失效旋钮**：`color.temperature`（冷暖染色）、`typography.personality`（默认字体配对）已接入 `deriveStyleVars`；`culture/mood/anchors` 在编辑器里重标为「情绪板（描述性，不驱动渲染）」。
- **生产上传缺口**：`FileField` 在 `!import.meta.env.DEV` 时禁用上传并提示；`CONTENT_GUIDE.md` 补充说明。
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
- 做法：抽出共享 `deepMerge(base, override)` 与 `useLocalStorageState`（封装 load/save/lastSaved/持久化快照）；两个 context 复用；给 `DataProvider` 的 `resolvedData` 与 `value` 补 `useMemo`（对齐 `StyleProvider`）。`resetAll` 为主名，保留 `resetData` 兼容别名。
- 验收：两套机制由同一份工具支撑；`DataProvider` 不再每次渲染重算全部合并。

### 1.3 测试 + CI 〔#7 · ✅ 已完成〕

- 实现：使用 **Vitest 4** 覆盖 `deepMerge`、持久化读写、`normalizeModuleConfig`（布尔 → 对象向后兼容）、section registry、`export.js#jsLiteral` 往返与 `validation.js` 关键分支；CDP smoke 独立验证浏览器主流程。
- 验收结果：14 个测试文件、64 项测试通过。GitHub Actions 顺序为 `install → lint → test → build → check:dist → format:check`。

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
- **退出结果**：两步均满足规格 Definition of Done；真实 OG 调试器仍需部署者填写 `SITE.url` 后外部验证。

### 2.2 性能

完整实施与验收合同见 [`SPEC-2.2-PERF.md`](./SPEC-2.2-PERF.md)（2.2 性能 + 2.3 无障碍合并），本节只维护阶段状态与默认路线。

- ✅ **编辑器已移出主包**：`ContentEditor` / `StyleEditor` 走 `React.lazy`；约 70 kB / 24 kB 独立 chunk，主 JS 由约 427 kB 降至约 317 kB（未压缩）。
- ✅ **图片 B3 已完成**：访客图片具备显式尺寸、懒加载/异步解码，portrait 作为首个内容图使用高优先级；编辑器上传可生成 `480/960/1440/1800` 响应式图片族，旧路径保持兼容。
- ✅ **字体 A1 已完成**：删除重复字体 `@import`，按实际使用精简字重，以 preload + `noscript` 加载 Google Fonts 样式表，并用 `size-adjust` / ascent / descent / line-gap 度量匹配本地 fallback。
- 移动端 Lighthouse 基线：预渲染 Performance 61（CSR 对照 58）、SEO 100；FCP/LCP 7.0s/7.2s → 5.6s/5.6s，离目标 90 仍有距离。
- **默认路线（已定）**：图片 **B3** + a11y + 字体 **A1** 已完成；现在量一次 Lighthouse。**仅当仍 < 90** 才升级到模板友好且带构建期依赖的 **A2（自动子集字体）/ B1（AVIF/WebP 管线）**；**排除 A2′ / B2**（手工方案，破模板属性）。
- 剩余验收：移动端 Performance ≥ 90、CLS < 0.1。

### 2.3 无障碍（a11y，并入 2.2 一起做）

实施与验收见 [`SPEC-2.2-PERF.md`](./SPEC-2.2-PERF.md) §3 / §8；与性能并行。

- ✅ 模态具备 `role="dialog"` + `aria-modal` + 焦点陷阱/关闭归位；`:focus-visible`、图片 `alt`、全部风格预设正文 token ≥ 4.5:1 已由代码与测试覆盖。
- ✅ `prefers-reduced-motion` 现在覆盖 reveal、CursorSpotlight 与平滑滚动，production CDP smoke 验证系统 reduce 优先。

**Phase 2 退出标准**：三项 Lighthouse 达标；编辑器不再拖累访客首屏。

---

## Phase 3 · 真正的持久化（优先：持久化 / 后端）

**目标**：补上最大的现实缺口——**线上编辑不落盘**（编辑只在 `localStorage`，清缓存即丢；上传仅 dev 可用）。关键约束：**不破坏「静态、无后端、数据进 git」的核心气质**。

三条可选路径（按是否引入服务端排序）：

- **A. 强化「promote-to-code」流（推荐，最贴合现有气质）**
  - 浏览器内通过 **GitHub OAuth + GitHub API** 直接把导出的 `data.js`/`style.js` 提交成一个 commit / PR；`localStorage` 退化为草稿。
  - 仍是静态站点，零长期后端；用户数据继续活在自己的 git 仓库里。
  - 上传也可同法落到仓库 `public/`，顺带解决 Phase 0 标注的「上传仅 dev」。
- **B. 可选轻后端（功能旗标）**
  - 一个 serverless 函数 + KV/对象存储，仅当配置了环境变量时启用；未配置则完全静态、走路径 A/手动流。
  - 适合想要「真正在线编辑保存」的部署者。
- **C. 本地优先 / 自托管**
  - IndexedDB 草稿 + 导入导出；或提供一个可选的极简自托管写盘服务（把 dev 的 `/api/upload` 思路产品化）。

**建议**：以 **A** 为主线（最契合模板定位），把 **B** 作为「高级部署者」的可选项；**C** 作为离线增强。无论哪条，都要保持「未配置 → 纯静态降级」。

**验收**：在线编辑能产生一次可追溯的持久化（commit 或写库）；未配置后端时行为与今天一致、无报错。

---

## Phase 4 · 拓展产品（探索性、可插队）

- **主题分享 / 市场**：`exportStyle()` 已能导出 `STYLE`；把它产品化为可分享/导入的主题文件，甚至一个画廊。
- **AI 填充增强**：把分散的 prompt/preset 统一；支持分章节增量填充、图片建议、把「情绪板（mood/anchors）」真正喂给 AI 生成初始风格（`ReferencePanel` 已为此留好数据）。
- **新章节 / 布局**：把 `compact`/`feature` 之外的布局体系化；新增如「时间线变体」「画廊」等模块（走 `MODULES` + `schema` + 组件三件套）。
- **多语言**：当前 `L(en, zh)` 是两语硬编码；评估推广到 N 语言（影响 `pick`、schema、编辑器、导出器——属于较大重构，列为候选）。
- **模板上手**：首次启动向导、空白模板与示例数据的更清晰切换。

---

## 3. 优先级与排序（影响 × 成本）

1. **已完成的地基**：1.1 单一事实源、1.2 provider 去重、1.3 Vitest + CI、1.4 lint/format、2.2 编辑器懒加载。
2. **接着**（高影响/中成本）：字体 A1，然后重测移动端 Lighthouse；按结果决定 A2/B1。
3. **重投入**（高影响/高成本，需决策）：Phase 3 持久化（先定路径 A/B/C）。
4. **随时探索**：Phase 4 各项。

## 4. 风险与权衡

- **引后端 = 破坏静态气质**：Phase 3 必须坚持「未配置即纯静态降级」，否则模板对 clone 者变重。
- **SSG 复杂度**：已用独立 `prerender.jsx`、首帧稳定值和 production CDP smoke 控制水合风险；以后新增首屏动态数据时必须同步扩展该契约。
- **范围蔓延**：Phase 4 诱人但别在地基（Phase 1）稳之前投入。
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

下一步建议顺序：

1. 运行移动端 Lighthouse，记录 Performance / a11y / BP / SEO / CLS。
2. 仅在 Performance < 90 时评估 A2 自动字体子集与 B1 构建期现代图片。
3. 2026-12-31 后删除两个旧 localStorage 迁移垫片。

> 每一步的具体「改哪些文件、满足哪些不变量、Definition of Done」见 `ENGINEERING.md`。
