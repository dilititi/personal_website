# PLAN · 网站改进规划

> 本文是 `miles.morales`（双语个人作品集**模板** + 站内 CMS）的分阶段改进路线图。
> 配套文档：`ENGINEERING.md`（工程契约 / 实现规则）、`CLAUDE.md`（架构说明）、`CODEBASE_ANALYSIS.html`（现状分析）。
> 读者：项目所有者 + AI 编码 Agent。每一项工作的「怎么改」以 `ENGINEERING.md` 为准。

## 0. 现状基线（一句话）

一个 React 19 + Vite 8、纯静态、无后端的双语作品集模板：所有文案集中在 `src/data.js`，可通过站内 ContentEditor / StyleEditor 编辑（存 `localStorage`），靠「导出代码 → 粘回 `data.js` → git push」上线。优点是数据自持、零后端；代价是两代「可编辑化」机制叠加、若干靠人工维护的隐式契约、零测试。详见 `CODEBASE_ANALYSIS.html`。

## 1. 指导原则（取舍时回到这几条）

1. **静态优先、后端可选。** 默认产物必须是纯静态；任何需要服务端的能力都要能在静态构建里优雅降级（参考 `FileField` 在生产环境禁用上传的写法）。
2. **单一事实源。** 同一信息只允许有一个权威定义；禁止再引入第二份「section 列表」「序列化器」「合并函数」。
3. **契约即代码。** 现在靠注释/标签维护的跨文件约定（CSS 变量名、schema↔data、WORK_MEDIA、PHOTO_SERIES…）要逐步变成显式、可核验的约束。
4. **双语对等。** 任何面向访客的新文案都必须 `L(en, zh)` 双语；内部工具可中文优先。
5. **渐进增强、保持「模板」属性。** 改进要让别人 clone 后仍然好用；示例数据（Chen）与机制解耦。
6. **依赖克制。** 目前仅 React + Vite，无第三方 UI 库。新增依赖需在 PR/变更说明里给出理由。

## 2. 路线图总览

| 阶段    | 主题           | 目标                                                           | 关键收益               |
| ------- | -------------- | -------------------------------------------------------------- | ---------------------- |
| Phase 0 | 已完成（本轮） | 统一导出、接入 temperature/personality、修复生产上传、对齐文档 | 消除两处分叉与误导     |
| Phase 1 | 夯实地基       | 单一事实源、去重 provider、测试 + CI、清理迁移垫片、加 lint    | 让后续改动「安全」     |
| Phase 2 | 质量与可达     | 性能、SEO、无障碍                                              | 让站点「被看见、可用」 |
| Phase 3 | 真正的持久化   | 在不破坏静态属性的前提下解决「线上编辑不落盘」                 | 补上最大的现实缺口     |
| Phase 4 | 拓展产品       | 新章节/布局、主题分享、AI 填充增强、多语言                     | 模板的增长面           |

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

### 1.1 Section 单一事实源 〔分析项 #6〕

- 现状：`data-context.SECTION_KEYS` 与 `schema.EXPORTABLE_SECTIONS` 是两份手维护、当前恰好一致的列表；Phase 0 删 `exportResolvedData` 后 `SECTION_KEYS` 已无人使用。
- 做法：删除 `SECTION_KEYS`；运行时数据由 `createSectionRegistry(data.js exports)` 自动派生，编辑器导出清单由 `EXPORTABLE_SECTIONS` 派生。
- 验收：`DataProvider` 不再手写 `baseData/resolvedData` 键映射；新增/删除可编辑章节只需改 `schema.js` + `data.js`。

### 1.2 去重 provider / 持久化机制 〔#5〕

- 现状：`data-context` 与 `style-context` 各自重复实现深合并（`mergeSection` ≡ `mergeStyle`）和 `localStorage` 读写/`lastSaved`/首渲染跳过逻辑，且两者在「是否 memo」上不一致。
- 做法：抽出共享 `deepMerge(base, override)` 与 `useLocalStorageState`（封装 load/save/lastSaved/持久化快照）；两个 context 复用；给 `DataProvider` 的 `resolvedData` 与 `value` 补 `useMemo`（对齐 `StyleProvider`）。`resetAll` 为主名，保留 `resetData` 兼容别名。
- 验收：两套机制由同一份工具支撑；`DataProvider` 不再每次渲染重算全部合并。

### 1.3 测试 + CI 〔#7〕

- 现状：零测试 / lint / 格式化。最该测的恰是改动最频繁、最易出错的逻辑。
- 做法：先用零依赖的 **node:test** 覆盖纯函数：`deepMerge`、持久化读写、`normalizeModuleConfig`（布尔 → 对象向后兼容）、section registry、`export.js#jsLiteral` 往返、`validation.js` 关键分支。需要 DOM/component 测试时再评估 Vitest。GitHub Actions 顺序为 `install → lint → test → build → format:check`。
- 验收：CI 绿；核心逻辑有回归保护。

### 1.4 引入 lint / format

- 做法：ESLint（react-hooks 规则尤其重要——能抓到 `DataProvider` 那类 memo/依赖问题）+ Prettier；`package.json` 加 `lint`/`format` 脚本，纳入 CI。
- 验收：`npm run lint` 通过；CI 拦截风格/明显错误。

### 1.5 清理迁移垫片 〔#8〕

- 现状：`Library.jsx`/`Photography.jsx` 仍在读（并删）旧的 `chen.readingLog.userEntries` / `chen.photos.userEntries`。
- 做法：保留到一个明确的截止日期并加注释；之后移除。或现在就移除（如果确认没有遗留用户数据）。
- 验收：垫片要么带「移除目标日期」的注释，要么删除。

**Phase 1 退出标准**：CI（lint + test + build + format）绿；不存在第二份 section 列表/序列化器/合并函数；`ENGINEERING.md` 的不变量全部成立。

---

## Phase 2 · 质量与可达（优先：性能 · SEO · 无障碍）

**目标**：一个作品集的价值在于「被看见、看得舒服、谁都能用」。当前是纯客户端渲染单页，这三项都有明显空间。

### 2.1 SEO / 可发现性

- 客户端渲染单页对爬虫不友好、首屏无内容。建议给静态构建加**预渲染 / SSG**：用 `vite-plugin-ssg`/`react-snap` 之类在 build 时把首屏 HTML 落盘。
- 每个章节/页面输出 `<title>`、`meta description`、Open Graph / Twitter Card；双语站点加 `hreflang` 替代链接（en/zh）。
- 生成 `sitemap.xml` 与 `robots.txt`。
- 验收：`view-source` 能看到首屏文案；分享链接有预览卡片；Lighthouse SEO ≥ 95。

### 2.2 性能

- **把编辑器移出主包**：`ContentEditor`/`StyleEditor`/`editor/*` 对访客无用，却可能进首包。用 `React.lazy` + 动态 import 按需加载（仅在点开编辑器时拉取）。
- 图片：在 `resizeImage` 基础上加响应式 `srcset`/`sizes`、`loading="lazy"`、AVIF/WebP 输出；首屏图 `fetchpriority`。
- 字体：`font-display: swap`、子集化中文字体（思源/Noto 体积大）、`preconnect`。
- 验收：Lighthouse 性能 ≥ 90（移动端）；首包不含编辑器代码。

### 2.3 无障碍（a11y）

- 模态焦点管理（`WorkModal`/`CVModal`/灯箱）：进入聚焦、`Esc` 关闭（已部分有）、焦点陷阱、关闭后焦点归位。
- 键盘可达：所有可点元素可 Tab 到、有可见 focus ring。
- 颜色对比：风格引擎已有 `contrast` 旋钮——可加一个开发期校验，对 `text`/`background` 组合做 WCAG AA 检查并在 StyleEditor 里提示。
- `prefers-reduced-motion`：`motion.mode` 应尊重系统「减少动态」。
- 验收：Lighthouse a11y ≥ 95；键盘可完成全站浏览。

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

1. **先做**（高影响/低成本，且降低后续风险）：1.1 单一事实源、1.4 lint、1.3 测试+CI、2.2 把编辑器懒加载。
2. **接着**（高影响/中成本）：1.2 去重 provider、2.1 SEO/预渲染、2.3 a11y。
3. **重投入**（高影响/高成本，需决策）：Phase 3 持久化（先定路径 A/B/C）。
4. **随时探索**：Phase 4 各项。

## 4. 风险与权衡

- **引后端 = 破坏静态气质**：Phase 3 必须坚持「未配置即纯静态降级」，否则模板对 clone 者变重。
- **SSG 复杂度**：预渲染会引入 build 复杂性与潜在的「水合不匹配」；先用最小方案（只预渲染首屏）验证。
- **范围蔓延**：Phase 4 诱人但别在地基（Phase 1）稳之前投入。
- **多语言重构**：收益高但触面广，非必要不早做。

## 5. 成功指标

- CI：`build + test + lint` 常绿；核心逻辑（合并/规范化/迁移/导出）有测试覆盖。
- 质量：Lighthouse 性能 ≥ 90（移动）、SEO ≥ 95、a11y ≥ 95。
- 健康度：无第二份「事实源」；`ENGINEERING.md` 不变量零违反；新增 `localStorage` 键都登记在 `CLAUDE.md`。
- 现实缺口：线上编辑可持久化（Phase 3 落地）。

## 6. 立即可做的下一步（建议顺序）

1. 删除 `SECTION_KEYS`，从 `EXPORTABLE_SECTIONS` 派生（1.1）。
2. 加 ESLint + Prettier + `lint` 脚本（1.4）。
3. 接 Vitest，先测 `export.js#jsLiteral` 往返与 `normalizeModuleConfig`（1.3）。
4. 把 `ContentEditor`/`StyleEditor` 改成 `React.lazy` 懒加载（2.2）。
5. 加一个 GitHub Actions 工作流跑 install/build/test/lint。

> 每一步的具体「改哪些文件、满足哪些不变量、Definition of Done」见 `ENGINEERING.md`。
