# SPEC 2.4 · 部署与 SEO 上线（Deploy & Go-Live）

> 配套文档：`PLAN.md` §2.1 / `SPEC-2.1-SEO.md`（SEO 规格）/ `ENGINEERING.md`（工程契约）。
> 状态：**已上线，收尾验收中**（2026-06-11 更新）。读者：项目所有者 + AI 编码 Agent。
> 一句话目标：让 Render 上的三条预渲染路由、发现资源、社交卡片与搜索站点验证形成一条可重复检查的上线链路。

---

## 1. 背景与目标

**现状（已核对源码与线上）**：

- 站点已部署到 <https://personal-website-x3u4.onrender.com>，`SITE.url` 已填写。
- `/`、`/en/`、`/zh/` 均返回预渲染 HTML；canonical、`og:url`、hreflang、robots 与 sitemap 已在线生效。
- `SITE.ogImage` 已与页面 `portrait` 拆分，社交封面使用原创的 `public/og-cover.jpg`（1200×630）。
- `render.yaml` 已登记生产缓存规则；当前 Dashboard 管理的既有服务仍需同步规则并重新部署后，用 `npm run check:deploy` 验证。
- Search Console 验证 token 已有 `SITE.googleSiteVerification` 接口，但获取 token、验证 URL-prefix 资源和提交 sitemap 必须由站点所有者账号完成。

**剩余目标**：让缓存头在线生效；部署独立 OG 图并刷新社交平台缓存；完成 Search Console 所有权验证和 sitemap 提交。

**非目标**：不引入任何后端（在线编辑落盘是 Phase 3）；不替换既有 SEO/SSG 架构。本期只补独立社交图、验证 token、缓存配置和部署后验收。

---

## 2. 关键事实（代码已就绪，勿重写）

| 位置                                                                    | 行为                                                                                                              | 依赖                                                   |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `src/lib/seo.js` `buildSeo` / `buildLanguageSeo` / `buildLanguageLinks` | 生成根/语言路由 canonical、`og:url`、hreflang 三连、绝对 `og:image`；优先 `SITE.ogImage`，旧数据回退到 `portrait` | 绝对 URL gated on `SITE.url`                           |
| `src/prerender.jsx` `seoHeadElements`                                   | 为 `/`、`/en/`、`/zh/` 注入完整 head；**无论根或语言路由都会 emit `buildLanguageLinks`**（三条路由都带 hreflang） | `SITE`                                                 |
| `vite.config.js` `buildDiscoveryFiles` + `seoHtmlPlugin.writeBundle`    | 构建时写 `dist/robots.txt` + `dist/sitemap.xml`；`SITE.url` 空时留空并 `this.warn(...)`                           | `SITE.url`                                             |
| `render.yaml`                                                           | 声明静态站构建和缓存头：哈希资源一年 immutable；HTML revalidate；robots/sitemap 短缓存                            | Render Blueprint，或把同样规则同步到既有服务 Dashboard |
| `scripts/check-deploy.mjs`                                              | 模拟 Googlebot / Facebook / LinkedIn / X，并检查路由、head、OG 图、发现资源和缓存头                               | 已部署的新版本                                         |
| `vite.config.js`（无 `base`，默认 `'/'`）                               | 打包资源 URL 为根绝对路径（`/assets/...`）；`src/data.js` 里手写的 `/picture`、`/works`… 媒体路径也是根绝对字符串 | —                                                      |

> 含义：SEO 内容继续由 `SITE` 单一事实源派生；部署后的真实性由 `npm run check:deploy` 负责验证，不以“构建成功”代替线上证据。

---

## 3. 决策矩阵 · Host 选型

| Host                             | 默认根域(`base='/'`)?                                                          | 自定义域    | 构建/部署                       | PR 预览           | 备注                                       |
| -------------------------------- | ------------------------------------------------------------------------------ | ----------- | ------------------------------- | ----------------- | ------------------------------------------ |
| **Cloudflare Pages**（推荐默认） | ✅ `*.pages.dev`                                                               | ✅ 免费、快 | 连接仓库自动构建                | ✅                | CDN 强、免费额度大、根域零改动             |
| **Netlify**                      | ✅ `*.netlify.app`                                                             | ✅          | 连接仓库零配置（自动识别 Vite） | ✅ Deploy Preview | `_redirects`/`_headers` 方便               |
| **Vercel**                       | ✅ `*.vercel.app`                                                              | ✅          | 连接仓库零配置                  | ✅ Preview        | 对 Vite 友好、DX 最简                      |
| **GitHub Pages**                 | ⚠️ 仅当用**自定义域**或 user-site；**项目站**默认 `…/personal_website/` 子路径 | ✅ (CNAME)  | 复用现有 Actions                | ❌ 无原生预览     | 全程留在 GitHub、零新账号；子路径有坑见 §4 |

**推荐**：优先**根域托管**（Cloudflare Pages / Netlify / Vercel 任一，或 GitHub Pages **配自定义域**）。理由：保持 `base='/'`、对代码零侵入；自带自动构建、预览、免费 HTTPS 与自定义域。

**仅当你想 100% 留在 GitHub**：用 GitHub Pages + 自定义域（避开 §4 的子路径坑），见 §6.C。

---

## 4. `base` 路径陷阱（务必读）

GitHub Pages **项目站**（仓库名 `personal_website`，非 `dilititi.github.io`）在没有自定义域时，站点位于子路径：

```
https://dilititi.github.io/personal_website/
```

此时：

- Vite 会给**打包后的资源**自动加 `base` 前缀（若设了 `base`），但
- `src/data.js` 里**手写的媒体字符串**（`/picture/...`、`/works/...`、`/covers/...` 等）是运行时数据、不经打包，**不会被 `base` 重写** → 这些图片/音频在子路径下 **404**。

**结论**：

- ✅ **首选根域**（自定义域，或托管平台子域），保持 `base='/'`，**零代码改动**。
- ⚠️ **必须子路径**时：除了 `vite.config.js` 设 `base:'/personal_website/'`，还要把 `data.js` 所有媒体路径改成 `import.meta.env.BASE_URL` 前缀或相对路径——属于较大、易漏的改动，**不推荐**，且与「模板友好」相悖。

---

## 5. 改动文件

| 文件                                   | 改动                                                                                                   | 必需?   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------- |
| `src/data.js`                          | `SITE.url` 为生产 origin；`portrait` 仅供页面；`ogImage` 为独立社交封面；可选 `googleSiteVerification` | ✅      |
| `public/og-cover.jpg`                  | 一张 **1200×630 横版**、来源可追溯的原创/授权 OG 图，建议 <1MB                                         | ✅      |
| `render.yaml`                          | Render 静态站与缓存头的仓库配置                                                                        | ✅      |
| `scripts/check-deploy.mjs`             | 部署后自动验收                                                                                         | ✅      |
| `.github/workflows/deploy.yml`（新增） | 仅 **GitHub Pages** 路线需要（§6.C）；托管平台路线用仪表盘连接，**不需要**此文件                       | 视 host |
| `public/CNAME`（新增）                 | 仅 **GitHub Pages + 自定义域**：写入裸域名一行                                                         | 视 host |
| `vite.config.js`                       | 仅**子路径**部署时设 `base`（§4），默认**不动**                                                        | 否      |
| `README.md` / `PLAN.md`                | 记录线上地址 + 部署 runbook / 上线状态                                                                 | ✅      |

**关于 OG 图**：`twitter:card` 使用 `summary_large_image`。`SITE.ogImage` 与 `portrait` 已分离，避免竖版头像在大卡中被裁切，也避免模板示例人物成为用户发布后的默认社交身份。

---

## 6. 实施步骤

### 6.A 当前 Render 服务收尾（本项目）

1. 合并并部署本期改动，确认线上 `/og-cover.jpg` 返回 `image/jpeg`。
2. 如果现有 Static Site 不是 Blueprint 管理，在 Render Dashboard → **Headers** 同步 `render.yaml` 中的规则：
   - `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`
   - `/`、`/en/*`、`/zh/*`、`/*.html` → `Cache-Control: no-cache`
   - `/robots.txt`、`/sitemap.xml` → `Cache-Control: public, max-age=300`
3. 手动触发一次 Clear build cache & deploy，避免旧 HTML 与新哈希资源混用。
4. 运行 `npm run check:deploy`。只有严格模式通过，才能把缓存项标为完成。

> `render.yaml` 不会自动接管一个原本由 Dashboard 创建的既有服务。不要为了读取 Blueprint 新建第二个同名生产站；要么在 Dashboard 同步规则，要么明确迁移为 Blueprint 后再删除旧服务。

### 6.B 社交平台与 Search Console

1. 先运行 `npm run check:deploy`，确认四种 bot User-Agent 都能取得完整 OG head。
2. 在 Facebook Sharing Debugger 与 LinkedIn Post Inspector 输入生产 URL，执行重新抓取；在 X 发布草稿/卡片预览中确认大图。
3. Google Search Console 新建 **URL-prefix** 资源：`https://personal-website-x3u4.onrender.com/`。
4. 选择 HTML tag 验证，把 Google 给出的 `content` 值填入 `SITE.googleSiteVerification`，提交并部署。
5. 回到 Search Console 点验证，然后提交 `https://personal-website-x3u4.onrender.com/sitemap.xml`。

### 6.C GitHub Pages（替代托管路线）

新增 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- 仓库 Settings → Pages → Source 选 **GitHub Actions**。
- **自定义域**（推荐）：加 `public/CNAME`（内容为裸域名，如 `chen.studio`）+ DNS（`CNAME`/A）→ 站点在根路径，`base` 不用动。
- **无自定义域**：站点在 `…/personal_website/` 子路径 → 必须处理 §4（不推荐）。

> 注意：`deploy.yml` 与现有 `ci.yml` 是两个独立 workflow；CI 仍是合并前门禁，deploy 在 `main` 合并后跑。

---

## 7. 上线后验收（Definition of Done）

- [x] 线上站点经 **HTTPS** 可访问；`/`、`/en/`、`/zh/` 三条路由都返回**预渲染 HTML**（非空 `#root`）。
- [x] 当前线上三条路由包含 canonical、`og:url`、三条 hreflang 和随语言变化的 title/description。
- [x] `robots.txt` 含生产 sitemap URL。
- [x] `sitemap.xml` 含 `/`、`/en/`、`/zh/` 三个绝对 `<loc>`。
- [x] 构建日志不再出现 `SITE.url is empty` warning。
- [x] 本地产物使用独立 `/og-cover.jpg`，包含 `og:image:width/height/alt` 与 `twitter:image:alt`。
- [ ] 新版部署后 `npm run check:deploy` 严格模式通过，证明 HTML 与资源缓存头均已在线生效。
- [ ] OG 卡片在 Facebook、X、LinkedIn 的真实抓取/预览工具中图文正常渲染。
- [ ] 在 **Google Search Console** 验证域名所有权并提交 `sitemap.xml`。
- [x] 本地 build、测试、production preview smoke、`check:dist` 通过。
- [ ] CI 仍全绿（部署改动未引入回归）。

---

## 8. 验证工具（清单）

- **OG / 卡片**：[Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)、[LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)、X 发帖草稿/卡片预览（首次需重新抓取以刷新缓存）。
- **结构/收录**：Google Rich Results Test、Google Search Console（提交 sitemap、查覆盖率）。
- **自动验收**：新版部署后运行 `npm run check:deploy`；若新版已部署但 Dashboard 缓存规则尚未同步，可临时用 `npm run check:deploy -- --skip-cache` 隔离缓存问题。
- **手查**：`view-source` 三路由看 head；`curl -sI https://域名/` 看状态码与缓存头。
- **回归**：`npm run build`（无 SITE.url warning）+ `npm run test:ui:preview`（生产预渲染冒烟）。

---

## 9. 风险与回退

- **子路径媒体 404**（§4）：最常见坑。坚持根域即可规避。
- **OG 缓存**：社交平台会缓存旧卡片；改图后用各家调试器强制重新抓取。
- **`SITE.url` 尾斜杠**：`seo.js` / `buildDiscoveryFiles` 已 `replace(/\/+$/,'')`，填不填尾斜杠都安全。
- **部署凭据**：托管平台用 GitHub OAuth（只读仓库）；GitHub Pages 用内置 `GITHUB_TOKEN`，无需手配 secret。
- **回退**：托管平台可一键回滚到上一次部署；GitHub Pages 回滚 = revert 对应 commit 重跑 deploy。

---

## 10. 与后续阶段的衔接

- 上线后，`SITE.url` 成为**唯一权威 origin**；任何绝对 URL 只能从它派生（不得在别处硬编码域名）——延续 `ENGINEERING.md` 的单一事实源原则。
- 这步完成后，**Phase 2 才算真正交付**（「被看见」成立）。下一步可进 **Phase 3 持久化**（推荐路径 A：浏览器内 GitHub OAuth 直接提交 `data.js`/`style.js`），与本次部署天然契合——同一个仓库、同一套静态托管。
