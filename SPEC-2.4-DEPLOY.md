# SPEC 2.4 · 部署与 SEO 上线（Deploy & Go-Live）

> 配套文档：`PLAN.md` §2.1 / `SPEC-2.1-SEO.md`（SEO 规格）/ `ENGINEERING.md`（工程契约）。
> 状态：**待执行**（建档 2026-06-08）。读者：项目所有者 + AI 编码 Agent。
> 一句话目标：**把已经建好但休眠的 SEO/SSG 真正点亮**——部署到真实域名并填 `SITE.url`，让三条路由的元数据、发现资源与社交卡片在线生效、可被外部工具验证。

---

## 1. 背景与目标

**现状（已核对源码）**：`src/data.js` 里 `SITE.url = ''`、`SITE.portrait = ''`。Phase 2 的 SEO/SSG 代码全部就绪，但因为 `SITE.url` 为空，以下产物目前都是空的：

- canonical（根 + `/en/`、`/zh/` 路由级）
- `og:url`
- hreflang 备用链接（`en` / `zh` / `x-default`）
- `og:image` / `twitter:image`（绝对 URL）
- `dist/sitemap.xml` 的 `<loc>`、`dist/robots.txt` 的 `Sitemap:` 行

构建时还会打印一条 warning：`SITE.url is empty…`。

**目标**：部署到真实域名 + 填 `SITE.url`（并补一张 OG 图）后，上述全部生效，并通过 OG 调试器 / Search Console 外部验证。

**非目标**：不引入任何后端（在线编辑落盘是 Phase 3）；**不改 SEO 逻辑**——本期只是「填值 + 部署」，不是再写一遍 SEO。

---

## 2. 关键事实（代码已就绪，勿重写）

| 位置 | 行为 | 依赖 |
| --- | --- | --- |
| `src/lib/seo.js` `buildSeo` / `buildLanguageSeo` / `buildLanguageLinks` | 生成根/语言路由 canonical、`og:url`、hreflang 三连、绝对 `og:image`（`absoluteImage` 用 `SITE.url` 拼） | 全部 gated on `SITE.url`；空则不输出 |
| `src/prerender.jsx` `seoHeadElements` | 为 `/`、`/en/`、`/zh/` 注入完整 head；**无论根或语言路由都会 emit `buildLanguageLinks`**（三条路由都带 hreflang） | `SITE` |
| `vite.config.js` `buildDiscoveryFiles` + `seoHtmlPlugin.writeBundle` | 构建时写 `dist/robots.txt` + `dist/sitemap.xml`；`SITE.url` 空时留空并 `this.warn(...)` | `SITE.url` |
| `vite.config.js`（无 `base`，默认 `'/'`） | 打包资源 URL 为根绝对路径（`/assets/...`）；`src/data.js` 里手写的 `/picture`、`/works`… 媒体路径也是根绝对字符串 | — |

> 含义：**点亮 SEO 不需要改任何 SEO 代码**，只需 (a) 填 `SITE.url`（+`portrait`）、(b) 部署到能在**根路径**提供服务的地址。

---

## 3. 决策矩阵 · Host 选型

| Host | 默认根域(`base='/'`)? | 自定义域 | 构建/部署 | PR 预览 | 备注 |
| --- | --- | --- | --- | --- | --- |
| **Cloudflare Pages**（推荐默认） | ✅ `*.pages.dev` | ✅ 免费、快 | 连接仓库自动构建 | ✅ | CDN 强、免费额度大、根域零改动 |
| **Netlify** | ✅ `*.netlify.app` | ✅ | 连接仓库零配置（自动识别 Vite） | ✅ Deploy Preview | `_redirects`/`_headers` 方便 |
| **Vercel** | ✅ `*.vercel.app` | ✅ | 连接仓库零配置 | ✅ Preview | 对 Vite 友好、DX 最简 |
| **GitHub Pages** | ⚠️ 仅当用**自定义域**或 user-site；**项目站**默认 `…/personal_website/` 子路径 | ✅ (CNAME) | 复用现有 Actions | ❌ 无原生预览 | 全程留在 GitHub、零新账号；子路径有坑见 §4 |

**推荐**：优先**根域托管**（Cloudflare Pages / Netlify / Vercel 任一，或 GitHub Pages **配自定义域**）。理由：保持 `base='/'`、对代码零侵入；自带自动构建、预览、免费 HTTPS 与自定义域。

**仅当你想 100% 留在 GitHub**：用 GitHub Pages + 自定义域（避开 §4 的子路径坑），见 §6.B。

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

| 文件 | 改动 | 必需? |
| --- | --- | --- |
| `src/data.js` | `SITE.url = 'https://你的域名'`（**无需**尾斜杠，代码会 strip）；`SITE.portrait = '/picture/og-cover.jpg'`（或专用 OG 图路径） | ✅ |
| `public/og-cover.jpg`（新增） | 一张 **1200×630 横版** OG 图；`portrait` 指向它 | 强烈建议 |
| `.github/workflows/deploy.yml`（新增） | 仅 **GitHub Pages** 路线需要（§6.B）；托管平台路线用仪表盘连接，**不需要**此文件 | 视 host |
| `public/CNAME`（新增） | 仅 **GitHub Pages + 自定义域**：写入裸域名一行 | 视 host |
| `vite.config.js` | 仅**子路径**部署时设 `base`（§4），默认**不动** | 否 |
| `README.md` / `PLAN.md` | 记录线上地址 + 部署 runbook / 上线状态 | ✅ |

**关于 OG 图**：`twitter:card` 是 `summary_large_image`，需要横版大图（≈1200×630，<1MB）。当前 `portrait` 为空；即便填一张竖版肖像，在大卡里也会被裁切难看。建议单独做一张横版封面放 `public/og-cover.jpg` 并让 `portrait` 指向它（`portrait` 同时被 Landing 与 OG 复用，如要区分可后续在 `SITE` 增 `ogImage` 字段，但本期复用即可）。

---

## 6. 实施步骤

### 6.A 根域托管（推荐：Cloudflare Pages / Netlify / Vercel）

1. 平台「连接 Git 仓库」选 `dilititi/personal_website`；构建命令 `npm run build`、输出目录 `dist`、Node 版本 22（与 CI 一致）。
2. 先用平台子域（`*.pages.dev` / `*.netlify.app` / `*.vercel.app`）触发首次部署，拿到地址。
3. 在 `src/data.js` 填 `SITE.url` 为该地址（或下一步的自定义域）、填 `SITE.portrait`；`git push` → 平台自动重建。
4. （可选）绑定自定义域：平台后台加域名 → 按提示设 DNS（`CNAME` 指向平台，或 apex 用平台给的 A/ALIAS）→ 等签发 HTTPS。改 `SITE.url` 为自定义域后再 push 一次。

> 这条路线**不需要**仓库里加任何部署文件；CI（`ci.yml`）继续只做质量门禁，部署由平台负责。

### 6.B GitHub Pages（留在 GitHub，建议配自定义域）

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

- [ ] 线上站点经 **HTTPS** 可访问；`/`、`/en/`、`/zh/` 三条路由都返回**预渲染 HTML**（非空 `#root`）。
- [ ] `view-source:` 三条路由都能看到：`<link rel="canonical">`、`og:url`、**三条** `rel="alternate" hreflang`（en/zh/x-default）、`og:image`（绝对 URL）、随语言变化的 `<title>` / `description`。
- [ ] `https://域名/robots.txt` 含 `Sitemap: https://域名/sitemap.xml`。
- [ ] `https://域名/sitemap.xml` 含 `/`、`/en/`、`/zh/` 三个绝对 `<loc>`。
- [ ] 构建日志**不再**出现 `SITE.url is empty` warning。
- [ ] OG 卡片在 **Facebook Sharing Debugger**、**Twitter/X Card Validator**、**LinkedIn Post Inspector** 中图文正常渲染（图能加载）。
- [ ] 在 **Google Search Console** 验证域名所有权并提交 `sitemap.xml`。
- [ ] 本地 `npm run build && npm run preview` 冒烟通过；`npm run check:dist` 仍通过（无 server 渲染器泄漏）。
- [ ] CI 仍全绿（部署改动未引入回归）。

---

## 8. 验证工具（清单）

- **OG / 卡片**：Facebook Sharing Debugger、X Card Validator、LinkedIn Post Inspector（首次需「Scrape Again」强刷缓存）。
- **结构/收录**：Google Rich Results Test、Google Search Console（提交 sitemap、查覆盖率）。
- **手查**：`view-source` 三路由看 head；`curl -sI https://域名/` 看状态码与缓存头；`curl https://域名/sitemap.xml`。
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
