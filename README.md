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
- 顶栏点 **🎨 风格** 打开风格编辑器：8 个预设起步，再微调色彩、排版、空间、质感、光影、深度、动态。

> ⚠️ localStorage 里的编辑**不会进 Git，也不会自动上线**。发布前必须点编辑器里的 **📋 全部**，把导出的代码粘进 `src/data.js`（风格则用「复制 STYLE」粘进 `src/style.js`），再提交。
> 图片 / 音频**上传仅在本地 `npm run dev` 时可用**（依赖 dev server 的 `/api/upload`）；线上编辑器里上传按钮会被禁用，只能直接填 `public/` 路径。

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
        └── editor/           # schema · export · validation · contentPresets · ImportPanel · PreviewFrame · fields/
```

## 部署上线

`npm run build` 产出 `dist/`，是完整的静态站点，可部署到任意静态托管平台。

**Cloudflare Pages（推荐）**：把仓库推到 GitHub → 在 Cloudflare Pages 连接仓库 → 构建命令 `npm run build`，输出目录 `dist`。之后每次推送自动重建。

**阿里云 OSS（国内访问最快）**：创建 Bucket（地域选杭州）→ 开启静态网站托管、权限公共读 → 用 `ossutil cp -r dist/ oss://你的Bucket名称/ --update` 上传 `dist/`。

## 技术栈

React 19 · Vite 8 · 原生 CSS（无第三方 UI 库）· 自定义双语 Context · 站内内容 / 风格编辑器 · AI 自动填充导入。

## 许可

MIT © 你的名字
