# 内容填充指南

这是给本模板使用者的内容填充手册。**所有数据通过站内 ContentEditor 编辑**——你不需要直接改代码。

## 目录

- [快速上手（5 分钟）](#快速上手5-分钟)
- [完整字段清单（分基础/进阶/图片）](#完整字段清单)
- [双语 / 格式规则](#双语--格式规则)
- [用 AI 一键生成全部内容](#用-ai-一键生成全部内容)
- [图片资产规格](#图片资产规格)
- [发布到公网](#发布到公网)

---

## 快速上手（5 分钟）

```powershell
git clone https://github.com/dilititi/personal_website
cd personal_website
npm install
npm run dev
```

浏览器打开 `http://localhost:5173/` → 右上角点 **`✏️ 编辑`** → 你看到一个完整的内容管理面板。

最低需求：填好 **SITE** 一个章节就能上线。

---

## 完整字段清单

按重要程度分三档。先填🌟，能用；加上⭐，像样；加上💎，丰富。

### 🌟 必填 — 缺这些站点不成形

| 章节 | 字段 | 说明 |
|---|---|---|
| **SITE** | `name` | 你的名字（双语） |
| **SITE** | `email` | 邮箱 |
| **SITE** | `location` | 所在城市（双语） |
| **SITE** | `role` | 你的身份/职业（双语） |
| **SITE** | `tagline` | 一句话介绍（双语） |
| **SITE** | `nowDate` | 站点最后更新时间（"2026 年 5 月" 这种） |
| **ABOUT** | `intro` | 首字下沉的开场介绍（约 2-3 句话） |
| **MODULES** | （所有模块） | 决定显示哪些章节，关掉不想要的 |

### ⭐ 应填 — 让站点像个人样

| 章节 | 字段 | 说明 |
|---|---|---|
| **SITE** | `nameRight` | Frame 00 右侧的小斜体红字（一般是姓的首字母或单字） |
| **SITE** | `nameFull` | 你的完整名（CV 头部用） |
| **SITE** | `social[]` | 1-5 个社交账号链接 |
| **SITE** | `status` + `statusObject` | "在看什么"实时状态 |
| **SITE** | `now` | 一段较长的"现在在做什么"（4-5 句） |
| **SITE** | `portrait` | 头像图片路径 |
| **SITE** | `tzName` | IANA 时区名（如 `Asia/Shanghai` / `America/New_York`） |
| **ABOUT** | `paragraphs[]` | 2-3 段叙述（接着 intro 往下讲） |
| **ABOUT** | `stats[]` | 侧边栏 4 个数据格 |
| **ABOUT** | `cv.edu[]` | 学历 |
| **ABOUT** | `cv.work[]` | 工作经历 |
| **ABOUT** | `cv.awards[]` | 奖项/展映 |
| **ABOUT** | `cv.skills[]` | 工具/技能 |
| **JOURNEY** | （8 帧） | 时间线节点，每帧带年份、地点、标题、叙述 |
| **WORKS** | （至少 2-3 件） | 作品集，每件带封面图 + 详情 |

### 💎 进阶 — 让站点丰富、有人味

| 章节 | 字段 | 说明 |
|---|---|---|
| **BOOKS** | （5-10 本） | 私藏书架，每本带封面色 + 短评 |
| **USER_READING_LOG** | （可选） | 你在站内 Reading log 表单里新增的个人读书笔记，会进入“复制全部”发布流 |
| **FILMS** | （5-10 部） | 私藏影院，导演 + 短评 |
| **MUSIC** | （5-10 首） | 私藏歌单 |
| **MUSIC** | `spotifyId` / `neteaseId` / `audio` | 让点击能直接播放（任一即可） |
| **TRAVEL** | （N 座城市） | 地图 + 城市记录 |
| **PHOTOS** | （N 张） | 摄影作品，按系列分组 |
| **NOW_PLAYING** | spotify / netease / html5 三组 | 站点右下角的"现在在听"播放器 |
| **SITE** | `cvPdf` | 上传 PDF 简历，About 里下载按钮会自动指向它 |
| **TEXTS** | 各章节 | UI 文字微调（如 Frame 00 上的 "Film / Student & Director" 这类大字） |
| **NAV** | 8 项 | 章节导航的标签（默认不用动） |

---

## 双语 / 格式规则

### 双语字段
所有标"双语"的字段是这种结构：
```json
{ "en": "Hello world", "zh": "你好,世界" }
```
**只填一种语言也行**——站点会自动用填了的那个版本兜底。

### 强调标记
`title` / `intro` / `text` 类字段支持 `*星号*` 把词括起来做斜体彩色高亮：
```json
{ "en": "*Tide* — a 16mm short", "zh": "*潮* —— 一部 16 毫米短片" }
```

### 星级评分
1-5 的整数。

### 日期
`"2026.05"`（月）或 `"2026.05.27"`（日）。

### 颜色
`"#abc123"`（六位十六进制）。

### Tags 数组
`["tag1", "tag2", "tag3"]`（普通字符串数组,不双语）。

---

## 图片资产规格

编辑器的 "📁 选择文件" 按钮会**自动压缩到长边 1800px、JPEG 0.85 质量、自动保存到 public/ 对应子目录**。所以你只需要选原图,后续都自动。

| 用途 | 推荐比例 | 推荐尺寸 | 保存目录 |
|---|---|---|---|
| 头像 Portrait | 4:5 | 600×750+ | `public/picture/` |
| 作品封面 Work cover | 16:10 | 1600×1000+ | `public/works/` |
| 书封面 Book cover | 2:3 | 600×900+ | `public/books/` |
| 影片海报 Film poster | 2:3 | 600×900+ | `public/films/` |
| 时间线帧 Journey frame | 3:4 | 600×800+ | `public/journey/` |
| 摄影作品 Photo | 3:2 / 2:3 | 1500×1000+ | `public/photos/` |
| CV PDF | — | < 5 MB | `public/docs/` |
| 本地音频 | — | mp3/m4a | `public/audio/` |

**所有上传都通过 "📁 选择文件" 按钮自动完成**——你不需要手动操作 public/ 目录,除非你想批量放图。

---

## 用 AI 一键生成全部内容

这是模板最有意思的功能——**你描述自己,AI 把所有数据帮你写好,一键导入网站**。

### 操作流程

1. 编辑器顶部点 **🪄 自动填充 · Auto-fill**
2. 点 **📋 复制 AI 提示词** → 提示词进你剪贴板
3. 打开 ChatGPT / Claude / 国内大模型(豆包/智谱/Kimi/通义千问等),粘贴提示词
4. **填好提示词里的「我的信息」部分**(姓名、职业、城市、爱好等)
5. AI 返回一段 JSON 代码
6. 复制 JSON → 回编辑器粘到文本框
7. 点 **✓ 应用到网站**
8. 主站立刻显示你的内容

### 提示词模板的设计

提示词内置了**网站需要的完整 JSON 结构**——AI 拿到后就知道每个字段填什么、什么格式、什么是双语字段。你只需要描述自己,AI 负责填充结构。

### 上传 JSON 文件

如果你已经有 JSON 文件(比如自己手写、或别人给的、或之前导出过)——直接点 "📁 上传 .json 文件",一步导入。

### 下载空白模板

点 **📥 下载空白模板** 会下载一个全字段都用占位符填好的 `starter.json`——可以直接喂给 AI,也可以手动编辑。

---

## 发布到公网

填好内容后:

```powershell
npm run dev   # 本地预览一下
# 编辑器 → 点 📋 全部 → 复制全部代码
# 粘贴到 src/data.js 替换对应章节
git add .
git commit -m "fill in my content"
git push
```

然后在 [Render](https://render.com) / [Vercel](https://vercel.com) / [Netlify](https://netlify.com) 创建 Static Site,连接你的 GitHub 仓库,build command `npm run build`,publish dir `dist`——几分钟内你的站点就上线了。

---

## FAQ

**Q: localStorage 里的编辑会传到 GitHub 吗?**
A: 不会。localStorage 只在你这台电脑的这个浏览器有。要发布,必须用编辑器底部的 "📋 全部" 按钮复制代码,粘到 `data.js`,再 git push。站内新增的照片和个人读书日志已经并入统一数据段,也会包含在“📋 全部”里。

**Q: 我能只填部分章节吗?**
A: 当然。空着的字段会显示默认占位符(或为空)。配合 MODULES 关掉整个章节,效果更整洁。

**Q: AI 生成的 JSON 不太对怎么办?**
A: 一般两种问题:
- **格式错误** → 编辑器会校验,告诉你哪行错了,改了再上传
- **内容不准** → 直接在编辑器对应章节里手动改,saved 立即生效

**Q: 我能换 AI 模型吗?**
A: 任何长上下文 + 支持 JSON 输出的模型都行。推荐 GPT-4o / Claude 3.5 Sonnet / 智谱 GLM-4 / Kimi。
