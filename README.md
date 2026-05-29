# Personal Website · 个人网站

基于 React 19 + Vite 8 构建的双语（EN / 中文）个人作品集网站，包含关于、旅程、作品、书影音、摄影、旅行和联系等模块。

希望能帮助任何人快速入门建立自己的个人网站。

## 前置要求

- [Node.js](https://nodejs.org/) 20.19+ 或 22.12+（建议使用当前 LTS 版本，点击高亮链接即可下载）
- npm（随 Node.js 自动安装）

## 快速开始

```bash
1. 克隆仓库
git clone https://github.com/dilititi/personal_website.git
cd personal_website

2. 安装依赖
npm install

3. 启动开发服务器
npm run dev
```
## 如何自定义内容：

网站的所有文字信息都集中在data.js：

src/data.js：包含站点标题、导航、个人简介、旅程、作品、书影音、摄影、旅行等所有双语内容。直接修改这个文件即可更新网站文案。

注意：data.js 导出的变量（如 SITE, ABOUT, WORKS 等）被多个组件引用，修改时请保持数据结构不变。

示例：修改个人介绍
打开 src/data.js，找到 ABOUT 对象，修改 intro 和 paragraphs 中的文本：

```js
export const ABOUT = {
  intro: L(
    "你的英文介绍...",
    "你的中文介绍..."
  ),
  // ...
}
```
保存后浏览器会自动刷新，即时看到效果。

部署上线
构建生产版本后，dist/ 目录即为完整的静态网站，可以直接部署到任何静态托管平台。

选项一：Cloudflare Pages（推荐）
```
将仓库推送到 GitHub。

登录 Cloudflare Pages，连接 GitHub 仓库。

构建设置：

构建命令：npm run build

输出目录：dist
```
部署，每次推送代码会自动重新构建。

选项二：阿里云 OSS（国内访问最快）
```
创建 OSS Bucket（地域选杭州），开启静态网站托管，权限设置为公共读。

使用 ossutil 上传 dist/ 内容：

bash
ossutil cp -r dist/ oss://你的Bucket名称/ --update
通过 Bucket 提供的默认域名访问（无需备案），或绑定已备案的自定义域名并开启 CDN 加速。
```
更多部署细节请参考官方文档。

项目结构
```text
.
├── index.html                # Vite 入口 HTML
├── package.json              # 依赖与脚本
├── vite.config.js            # Vite 配置
├── .gitignore                # 忽略 node_modules 和 dist
├── public/                   # 静态资源（favicon 等）
├── src/
│   ├── main.jsx              # React 挂载入口
│   ├── App.jsx               # 根组件（组装所有区块）
│   ├── data.js               # 所有双语内容数据
│   ├── lang.jsx              # 语言切换上下文
│   ├── hooks.jsx             # 自定义 Hooks
│   ├── styles.css            # 全局样式
│   └── components/           # 各区块组件
│       ├── NavShell.jsx
│       ├── Landing.jsx
│       ├── About.jsx
│       ├── Journey.jsx
│       ├── Works.jsx
│       ├── Library.jsx
│       ├── Photography.jsx
│       ├── Travel.jsx
│       ├── Contact.jsx
│       ├── Colophon.jsx
│       ├── NowPlaying.jsx
│       ├── CVModal.jsx
│       └── Overlays.jsx
└── dist/                     # 构建输出（上传到服务器）
```
技术栈：

React 19

Vite 8

原生 CSS（无第三方 UI 库）

双语方案：自定义 Context + 数据结构

许可
```
MIT © 你的名字
```
