# SPEC · 2.1 SEO / 可发现性

> 面向并行实现流的实施规格。格式遵循 `ENGINEERING.md`：改哪些文件 · 满足哪些不变量 · Definition of Done。
> 前置：Phase 1 已稳定（lint/test/build/format 全绿）。本 spec 不改动核心数据/风格层逻辑。
> 拆两步：**2.1a 元数据 ✅** + **2.1b 预渲染/SSG ✅**。两步保持独立验收面，便于以后分别回归。

## 0. 目标

让原本纯 CSR 的单页对**搜索引擎**和**社媒分享**可见：

- 可索引的 `<head>`：title / description / canonical / Open Graph / Twitter Card / theme-color / robots。
- `robots.txt` + `sitemap.xml`。
- 运行时 head 随**语言切换**同步（用户 + 会跑 JS 的爬虫）。

> 关键事实：社媒抓取器（微信/FB/Twitter/Telegram）**不执行 JS**，只认 HTML 里的静态标签。所以「构建期注入静态 head」是分享卡片能出现的前提，运行时 hook 只服务用户与 Google 这类会渲染 JS 的爬虫。

## 1. 新增数据 / 契约（单一事实源）

- **`SITE.url`** —— 站点规范根 URL（如 `https://chen.pages.dev`）。canonical / `og:url` / `og:image` 绝对化 / sitemap 都从它派生。
  - 加到 `src/data.js` 的 `SITE`：**默认空串 `''`（占位）**，注释「部署时填真实域名」。**目标是真实部署域名**；为空时所有绝对 URL 必须优雅降级（canonical / `og:url` / sitemap 省略或留空，**绝不输出 `undefined` 或裸值**），并在 build 时打印一条 warning 提醒填域名。
  - 同步加到 `src/components/editor/schema.js` 的 `SITE_SCHEMA`：`{ key: 'url', type: 'str', label: '站点 URL（canonical / OG / sitemap，部署时填真实域名）' }` —— **满足 INV-2（schema↔data 两侧同步）**。
- **`src/lib/seo.js`（新增，纯函数，SEO 文案的单一来源）**
  - `export function buildSeo(site, lang)` → `{ title, description, canonical, image, siteName, locale, localeAlternate }`。
    - `title`：`pick(site.name, lang)` + 站点副标题（取 `site.tagline` 截断，或 `site.role`）；给一个稳定模板，如 `${name} · ${shortTagline}`。
    - `description`：`pick(site.tagline, lang)`（纯文本，去掉 `*强调*` 星号）。
    - `image`：`site.url` 非空时绝对化 `site.url + site.portrait`，否则返回相对 `site.portrait` 或空。
    - `canonical`：`site.url`（空则省略，不要输出 `undefined`）。
    - `locale`：`en→'en_US'`、`zh→'zh_CN'`；`localeAlternate` 为另一种。
  - `export const SEO_DEFAULT_LANG = 'en'`（静态注入用的默认语言）。
  - 纯函数、不 import React；被引用时按 §ENGINEERING.4 带 `.js` 扩展名。

## 2. 改哪些文件（2.1a）

| 文件                                               | 改动                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/seo.js`                                   | **新增**：`buildSeo(site, lang)` + `SEO_DEFAULT_LANG`（见 §1）。                                                                                                                                                                                                                                                                            |
| `src/data.js`                                      | `SITE` 增加 `url` 字段（默认占位 + 注释）。                                                                                                                                                                                                                                                                                                 |
| `src/components/editor/schema.js`                  | `SITE_SCHEMA` 增加 `url`（`type: 'str'`），满足 INV-2。                                                                                                                                                                                                                                                                                     |
| `vite.config.js`                                   | **新增 `seoHtmlPlugin()`**：用 Vite 内置 `transformIndexHtml` 钩子，构建/dev 时从 `./src/data.js` + `./src/lib/seo.js` 取 `buildSeo(SITE, SEO_DEFAULT_LANG)`，替换 `<title>` 并注入 description/canonical/`og:*`/`twitter:*`/`theme-color`/`robots` 到 `<head>`。**零新依赖**（Vite 自带钩子；data.js 是纯 ESM，可在构建 Node 端 import）。 |
| `index.html`                                       | 保留最小静态兜底 title/description（插件会覆盖/补全）；font preconnect 保留；加 `<meta name="theme-color">` 兜底。可留一个注释锚点便于插件注入。                                                                                                                                                                                            |
| `src/lib/useDocumentHead.js`（或并入 `hooks.jsx`） | **新增** `useDocumentHead()`：挂载与 `lang` 变化时用 `buildSeo(SITE, lang)` **更新已存在的** `title` / `meta[name=description]` / `meta[property^=og:]`（查不到才创建一次，**不得重复 append**）；`guard typeof document`。在 `AppInner` 调用一次（读 `useData().SITE`、`useLang().lang`）。                                                |
| `public/robots.txt`                                | **新增**（静态）：allow all + `Sitemap:` 指向 `{SITE.url}/sitemap.xml`。若 URL 需派生，见下条由插件写出。                                                                                                                                                                                                                                   |
| `dist/sitemap.xml` + `dist/robots.txt`             | 由 `seoHtmlPlugin` 的 `generateBundle`/`closeBundle` 钩子在 build 时**从 `SITE.url` 派生写出**（单一来源）；单 URL 站点 sitemap 只列 `${SITE.url}/`。dev 期可省。                                                                                                                                                                           |

> hreflang：**本期不做**（已定：与 per-language URL 一并放到 2.1b）。本期只发 `og:locale` + `og:locale:alternate`（单 URL 合法）。

## 3. 满足 / 影响的不变量

- **INV-8 静态 / 无后端**：`seoHtmlPlugin` 只用构建期钩子，产物仍是纯静态 HTML，无运行时服务端。✅
- **INV-9 单一事实源**：title/description/OG/sitemap 全部经 `seo.js#buildSeo` 从 `data.js#SITE` 派生；**不在 `index.html` 再手抄一份站点文案**（仅留最小兜底）。✅
- **INV-2 schema↔data**：`SITE.url` 同时进 `data.js` 与 `schema.js`。
- **INV-4 双语**：运行时 head 随 `lang` 切；静态注入用 `SEO_DEFAULT_LANG`。
- **INV-7 数据读取**：`useDocumentHead` 经 `useData()`/`useLang()`，不直接 import `data.js` 内容。
- **原则 6 依赖克制**：2.1a **零新依赖**。
- **ENGINEERING §4 ESM 扩展名**：新文件相对 import 带 `.js`。

## 4. 测试（进 Vitest，勿破坏现有 35 项）

- `tests/seo.test.js`：
  - `buildSeo(SITE,'en')` / `('zh')` 的 `title`/`description` 取值正确、为字符串、已去 `*星号*`。
  - `image` 在 `SITE.url` 非空时为绝对 URL（`url + portrait`），为空时降级不抛错、不产生 `undefined`。
  - `locale`/`localeAlternate` 映射正确（en_US/zh_CN）。
  - `canonical` 在 `SITE.url` 为空时省略而非 `'undefined'`。
- （可选）对 `seoHtmlPlugin` 的 `transformIndexHtml` 输出做字符串断言：含 `og:title`、`og:description`、`twitter:card`。

## 5. 已定决策（本轮）

1. **canonical 域名**：`SITE.url` **目标为真实部署域名**；仓库默认提交空串 `''` 占位，部署时填真实域名。为空时 canonical / `og:url` / sitemap 优雅降级（省略，不输出 `undefined` 或裸值），build 打印 warning。
2. **hreflang / 语言 URL**：2.1a 不做；2.1b 已采用目录路由 `/en/`、`/zh/`，并在 `SITE.url` 非空时输出绝对 canonical 与 `en` / `zh` / `x-default` alternate。
3. **2.1b 预渲染工具**：**已选 `vite-prerender-plugin`**（构建期渲染、产物纯静态、相对轻量）。详见 §5b。

## 5b. 2.1b · 预渲染 / SSG（✅ 已实现）

> **兼容性结论（2026-06-07）**：`vite-prerender-plugin@0.5.13` 与 Vite 8 peer 范围兼容。语言 URL 采用 `/en/`、`/zh/`，不用查询参数；根路径 `/` 是默认英文入口。

### 并行实现流

| 流                  | 独占文件 / 责任                                                                                                                   | 交付与验收                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **2.1b-0 构建链路** | `package.json`、`package-lock.json`、`vite.config.js`、`src/prerender.jsx`                                                        | 接入插件并输出 3 页；构建后删除仅供 prerender 使用的入口与 React server renderer，浏览器资源仍保留编辑器懒加载 chunk              |
| **2.1b-1 首帧一致** | `App.jsx`、`main.jsx`、`lang.jsx`、`hooks.jsx`、两个 context、`np-context.jsx`、`Landing.jsx`、`NowPlaying.jsx`、`lib/persist.js` | SSR 首帧只渲染 Landing + 首个 section；时钟用稳定占位；内容/风格/播放器/位置在 mount 后恢复；浏览器对已有 HTML 使用 `hydrateRoot` |
| **2.1b-2 路由 SEO** | `lib/seo.js`、`lib/useDocumentHead.js`、SEO/prerender/lang 测试、`tests/ui-smoke.mjs`                                             | `/en/`、`/zh/` 分别输出对应语言；部署 URL 存在时输出 route canonical + hreflang；production CDP smoke 检查 hydration              |

这些流的写入范围刻意分离，可并行执行；合并顺序为 **b-1 → b-0 → b-2**，因为构建插件最后需要消费稳定的 SSR 入口和语言契约。

### 改哪些文件

| 文件 / 模块                                                                | 改动                                                                                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/prerender.jsx`                                                        | 独立构建期入口；用 `react-dom/server.edge` 渲染稳定首帧，并返回 route-localized head 与待生成语言路径。                                     |
| `src/main.jsx`                                                             | 仅保留浏览器入口；空 root 用 `createRoot`，预渲染 root 用 `hydrateRoot`；记录 recoverable hydration errors；无 hash 首载锁定 Landing 顶部。 |
| `App.jsx`                                                                  | 接收 `prerendered` / `initialLang`；SSR 与 hydration 首帧只输出 Landing + 首个启用 section，mount 后扩展完整页面。                          |
| `lang.jsx`、`hooks.jsx`                                                    | 路径语言优先；CSR 根路径继续恢复语言偏好；时钟 SSR 输出稳定占位，mount 后启动。                                                             |
| `lib/persist.js`、`data-context.jsx`、`style-context.jsx`                  | `loadOnMount` 延后本地覆盖恢复，避免默认数据与 localStorage 在 hydration 首帧分叉。                                                         |
| `np-context.jsx`、`components/NowPlaying.jsx`                              | 播放源与浮窗位置延后恢复。                                                                                                                  |
| `vite.config.js`                                                           | 生成 `/`、`/en/`、`/zh/`；`prerenderArtifactCleanupPlugin` 删除构建专用 chunk；sitemap 覆盖三条路径。                                       |
| `lib/seo.js`、`lib/useDocumentHead.js`                                     | 增加语言路由 canonical/hreflang 派生，运行时保持与当前路径一致且不重复节点。                                                                |
| `tests/prerender.test.js`、`tests/lang.test.js`、`tests/seoPlugin.test.js` | 覆盖 SSR 正文、语言初始化、语言 URL、构建资源清理及懒加载依赖保留。                                                                         |
| `tests/ui-smoke.mjs`、`package.json#test:ui:preview`                       | 同一套 CDP 主流程可运行在 dev 或 production preview；production 模式额外检查静态正文与 hydration errors。                                   |

### 满足 / 影响的不变量

- **INV-4 双语**：路径决定静态首帧语言；`/en/`、`/zh/` 的 HTML、title、description、locale 对齐。
- **INV-6 持久化**：本地覆盖只延后恢复，不更改 key、数据 shape 或公共 Provider API。
- **INV-8 静态 / 无后端**：`vite-prerender-plugin` 是 devDependency；产物仍是目录式静态 HTML，无 request-time SSR。
- **INV-9 单一事实源**：正文仍来自 `data.js` / Provider；SEO 文案与 URL 仍经 `seo.js` 派生。
- **INV-11 SEO**：根路径和语言路径的静态/运行时 head 一致；构建产物不携带 prerender/server renderer。

## 6. Definition of Done（2.1a）

- [x] `npm run lint && npm test && npm run build && npm run format:check` 全绿；10 个文件 / 49 项测试通过。
- [x] `dist/index.html` 的 `<head>` 含 SITE 派生的 title/description/`og:*`/`twitter:*`/theme-color/robots；`SITE.url` 非空时追加 canonical/`og:url`。
- [x] `dist/robots.txt`、`dist/sitemap.xml` 存在，URL 由 `SITE.url` 派生；空 URL 时不产生假地址。
- [x] 运行时切语言：`document.title` 与 `description`/`og:*` 同步更新，**无重复 meta 标签**。
- [x] 未引入任何**运行时**依赖；`SITE.url` 已进 `data.js` + `schema.js`；未违反 §3 任一 INV。
- [x] 本地移动端 Lighthouse SEO = 100。
- [ ] 真实 OG 调试器验证：等待部署者填写 `SITE.url`、portrait 并部署公开 URL 后执行。
- [x] 已同步 `CLAUDE.md`、`PLAN.md`、`ENGINEERING.md`、`README.md` 与 `CONTENT_GUIDE.md`。
- [x] 已按 ENGINEERING §8 写本文件下方变更记录。

## 6b. Definition of Done（2.1b）

- [x] `npm run build` 自然退出并只预渲染 3 页：`/`、`/en/`、`/zh/`。
- [x] 三份 HTML 的 view-source 均含 `landing-masthead` 与 `#about` 正文；语言、title、description、OG locale 对齐。
- [x] `SITE.url` 非空时语言路由派生绝对 canonical 与 `en` / `zh` / `x-default`；为空时不输出假地址。
- [x] `hydrateRoot` 首帧与 SSR 一致；时钟、语言、内容/风格覆盖、播放器源和浮窗位置无 hydration mismatch。
- [x] `npm run test:ui` 与 `npm run test:ui:preview` 全绿；production smoke 覆盖三条静态路由和 recoverable hydration error。
- [x] `dist/assets` 保留 ContentEditor / StyleEditor 懒加载 chunk，且不残留 `prerender` / `server.edge` chunk。
- [x] 新依赖仅为 devDependency；生产产物纯静态，无运行时服务端。
- [x] 同机移动端 Lighthouse A/B：预渲染 Performance 61、SEO 100、FCP/LCP 5.6s；CSR 对照 Performance 58、SEO 100、FCP 7.0s、LCP 7.2s，无回退。
- [x] `CLAUDE.md`、`ENGINEERING.md`、`PLAN.md`、`README.md`、`CODEBASE_ANALYSIS.html` 已同步。

## 7. 边界（刻意不做）

- 不引运行时 SEO 库（react-helmet 等）；用原生 DOM + Vite 构建钩子。
- 不在 `index.html` 手抄 `SITE` 文案（避免第二事实源）。
- 不引入 React Router；语言路由只由静态目录 + `location.pathname` 决定。
- 不把 localStorage 用户覆盖写入构建期 HTML；静态产物只包含仓库默认内容。
- 不预渲染完整长页面；第一版只输出 Landing + 首个启用 section，完整页面在 hydration 后展开。
- 不引入 request-time SSR、serverless 函数或运行时 SEO 库。

## 8. 变更记录（ENGINEERING §8）

- **动机**：落实 Phase 2.1a，使 CSR 模板具备静态分享元数据、运行时双语 head 和搜索引擎发现资源。
- **文件**：新增 `seo.js`、`useDocumentHead.js`、SEO 单测与 `public/robots.txt`；同步 `SITE.url`/schema；在 `vite.config.js` 注入 head 并生成 robots/sitemap；更新架构与使用文档。
- **不变量**：新增 INV-11；满足 INV-2、INV-4、INV-7、INV-8、INV-9 与显式 ESM 扩展名约定。
- **验证**：当前全量 49 项 Vitest、build、format、CDP smoke 全绿；产物字符串断言通过；移动端 Lighthouse SEO 100。
- **边界**：仓库按模板策略保留 `SITE.url = ''`，因此真实 canonical/OG URL 与外部分享调试在部署配置后验证。

### 2.1b

- **动机**：让抓取器在不执行 JS 时仍能读取双语首屏正文，同时保持站内编辑、localStorage 覆盖与 SPA 交互。
- **文件**：新增独立 `prerender.jsx` 与 prerender/lang 测试；改造浏览器入口、App/provider 首帧、语言/时钟/播放器恢复；Vite 输出三条静态路由并清理构建专用 chunk；CDP smoke 增加 production preview 模式。
- **依赖理由**：`vite-prerender-plugin` 仅在 build 期调用项目自有 `prerender()`，不进入浏览器可达资源，产物仍可部署到任意静态托管。
- **不变量**：满足 INV-4、INV-6、INV-8、INV-9、INV-11；Provider 公共 API 与 localStorage key 均未改变。
- **验证**：49 项 Vitest、lint、build、dev CDP smoke、production CDP smoke 全绿；构建产物正文/路由/资源清单逐项检查通过；移动端 Lighthouse 相对 CSR 对照 Performance 58 → 61、SEO 100 → 100。
