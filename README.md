# Personal Website · 个人网站

基于 **React 19 + Vite 8** 的双语（EN / 中文）个人作品集**模板**。内置站内**内容编辑器**与**风格编辑器**，支持「用 AI 一键生成全部内容」，构建为纯静态站点，可部署到任意静态托管。

> 仓库里的「Chen · 杭州电影学生」是模板自带的**示例内容**，替换成你自己的即可。

## 示例网站

https://personal-website-x3u4.onrender.com

## 前置要求

- [Node.js](https://nodejs.org/) 20.19+ 或 22.12+（建议当前 LTS 版本）
- npm（随 Node.js 自动安装）

## 快速开始

```bash
git clone https://github.com/dilititi/personal_website.git
cd personal_website
npm install
npm run dev      # 打开 http://localhost:5173/
```

## 自定义内容

有两种方式，**推荐用站内编辑器**。

### 方式 A · 站内编辑器（推荐）

- 顶栏点 **✏️ 内容** 打开内容编辑器：分章节填写 SITE / ABOUT / WORKS… 改动**实时保存到浏览器 localStorage**，主站即时预览。
- 顶部的 **🪄 自动填充** 可以让 AI 帮你生成整站数据 —— 复制提示词喂给任意大模型，把返回的 JSON 粘回来一键导入（详见 [CONTENT_GUIDE.md](./CONTENT_GUIDE.md)）。
- 不想从示例改起？同一个 **🪄 自动填充** 面板里可以**直接套用一个内容预设**（organic / film / digital…，会同时套上对应风格）作为起点，或下载空白 starter JSON 从零填。
- 顶栏点 **🎨 风格** 打开风格编辑器：8 个预设起步，再微调色彩、排版、空间、质感、光影、深度、动态。

浏览器存储只是草稿层。要永久上线，可以继续用 **📋 全部 / 下载 data.js** 手动提交，也可以在内容或风格编辑器点 **发布**，用仅授权本仓库 Contents 读写的 fine-grained PAT 直接生成 GitHub commit。token 默认只保存在当前标签页的 sessionStorage。

图片 / 音频在本地开发时写入本机 `public/`；生产站点配置 GitHub 发布凭据后会直接提交到仓库的 `public/`。没有凭据时仍可手动填写 public 路径。

### 方式 B · 直接改 `src/data.js`

`src/data.js` 是所有文案的**最终来源（source of truth）**。所有双语字段用 `L(en, zh)` 包裹：

```js
export const ABOUT = {
  intro: L('Your English intro…', '你的中文介绍…'),
  // …
}
```

保存后浏览器会自动刷新。**注意**：`data.js` 导出的变量（`SITE`、`ABOUT`、`WORKS`…）被多个组件引用，修改时请保持数据结构不变。

## 项目结构

```text
.
├── index.html
├── vite.config.js            # Vite 配置 + 开发期上传接口 /api/upload（仅 dev）
├── CONTENT_GUIDE.md          # 内容填充手册（字段清单、双语规则、AI 提示词）
├── public/                   # 静态资源（图片 / 音频按子目录存放）
└── src/
    ├── main.jsx              # React 挂载入口
    ├── App.jsx               # Provider 链 + 区块组装
    ├── data.js               # 所有双语内容（source of truth）
    ├── data-context.jsx      # 内容 overrides + 深合并 + localStorage
    ├── style.js              # 默认风格 + 8 个预设
    ├── style-engine.js       # 风格配置 → CSS 变量
    ├── style-context.jsx     # 把风格应用到文档
    ├── lang.jsx              # 语言切换上下文
    ├── np-context.jsx        # Now Playing 播放器状态
    ├── hooks.jsx  utils.js
    ├── styles.css  styles/   # 全局样式（base / layout / sections / style-runtime / editors）
    └── components/
        ├── NavShell  Landing  About  Journey  Works  Library
        ├── Photography  Travel  Contact  Colophon  NowPlaying  CVModal  Overlays
        ├── ContentEditor  StyleEditor
        └── editor/           # schema · export · validation · PublishPanel · content presets · fields/
```

## 从编辑器发布

1. 在 GitHub 创建 fine-grained PAT，只授权目标仓库的 **Contents: Read and write**。
2. 打开内容或风格编辑器，点 **发布**，核对 owner / repository / branch。
3. 粘贴 token 并先点 **验证连接**。默认不勾选“记住”，关闭标签页后 token 即消失。
4. 点 **发布内容**或**发布风格**并确认。提交成功后，Render 等已连接仓库的静态托管会自动重建。

发布器只改 `src/data.js` / `src/style.js` 哨兵区域内被编辑的 export。未配置 token 时，原有 Copy、下载备份、手动提交和站点浏览都不受影响。

## 部署上线

`npm run build` 产出 `dist/`，是完整的静态站点，可部署到任意静态托管平台。

构建会生成 `/`、`/en/`、`/zh/` 三份可索引 HTML，并在浏览器中 hydrate 为完整交互站点。部署平台需保留目录式静态路由（即 `en/index.html`、`zh/index.html`）；上线前可运行 `npm run test:ui:preview` 检查生产产物。

部署前在内容编辑器的 SITE 中填写「站点 URL」与「社交分享图」，或直接设置 `src/data.js#SITE.url` / `SITE.ogImage`。canonical、Open Graph、`robots.txt` 与 `sitemap.xml` 都从这里生成；`portrait` 只负责页面肖像，不再兼任横版社交卡片。

**Render / Cloudflare Pages / Netlify / Vercel（任一，推荐根域托管）**：把仓库推到 GitHub → 在平台连接仓库 → 选 **Static Site**、构建命令 `npm run build`、输出目录 `dist`。本仓库的 `render.yaml` 已登记 Render 构建与缓存规则；如果既有服务由 Dashboard 创建，请在 Headers 中同步这些规则。

部署完成后运行 `npm run check:deploy`，它会检查三条语言路由、Google/Facebook/LinkedIn/X bot 可见的 OG 标签、社交图片、robots、sitemap 以及 HTML/哈希资源缓存头。Search Console 可在 SITE 中填写 Google 给出的 verification token，部署后验证 URL-prefix 资源并提交 `/sitemap.xml`。

**阿里云 OSS（国内访问最快）**：创建 Bucket（地域选杭州）→ 开启静态网站托管、权限公共读 → 用 `ossutil cp -r dist/ oss://你的Bucket名称/ --update` 上传 `dist/`。

## 技术栈

React 19 · Vite 8 · 原生 CSS（无第三方 UI 库）· 自定义双语 Context · 站内内容 / 风格编辑器 · AI 自动填充导入。

## 许可

MIT © 你的名字
