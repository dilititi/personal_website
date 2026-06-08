# SPEC · 2.2 性能 + 2.3 无障碍

> 实施状态：图片 B3 + a11y 已完成；字体 A1 与移动端 Lighthouse 复测进入下一 PR。

> 面向并行实现流的实施规格。格式遵循 `ENGINEERING.md`：诊断 · 工作分解 · 改哪些文件 · 决策（含影响分析）· 不变量 · DoD。
> 2.2 与 2.3 **合并执行**（互不冲突，可并行）。
> 前置：2.1a/2.1b 已完成（SEO 100、prerender、check:dist）。本 spec 不改数据/风格层核心逻辑、不改 `useData`/`useStyle` API、不引**运行时**依赖。

## 0. 目标与现状

移动端 Lighthouse 基线：**Performance 57 · Accessibility 90 · Best Practices 96 · SEO 100**。

| 指标                | 现在 | 目标      |
| ------------------- | ---- | --------- |
| Performance（移动） | 57   | **≥ 90**  |
| Accessibility       | 90   | **≥ 95**  |
| Best Practices      | 96   | 维持 ≥ 96 |
| SEO                 | 100  | 维持 100  |
| CLS                 | 未测 | **< 0.1** |

硬约束：`npm run check:dist` 保持绿（INV-8 纯静态）；不破 hydration（复用 `prerendered`/`loadOnMount`，SSR 首帧与 client 首帧的 `<img>`/属性必须一致）。

## 1. 诊断（57 分大概率来自这三处）

1. **字体（最大头）**：`index.html` 一次性加载 5 个 Google Fonts，含 **Noto Serif SC + Noto Sans SC 全量中文字体（各 MB 级）**；字体样式表从 `fonts.googleapis.com` 跨域、render-blocking。影响 LCP、传输量、连接成本，swap 还带来 CLS。`display=swap` 与 `preconnect` 已有，但全量 CJK 仍是大坑。
2. **图片**：主内容图是长边 1800 的 JPG，直发移动端小视口；**无 `srcset`/尺寸/现代格式**，`loading="lazy"` 仅见于 `NowPlaying`/`PreviewFrame`（`Works`/`Photography`/`Journey`/`books`/portrait 都没有）。影响 LCP、传输量、CLS（无尺寸）。
3. **JS / hydration（次要）**：主包 ~317 kB + 移动端 hydration TBT。预渲染已救了首屏文本的 FCP/LCP，所以这是第三优先。

> 基线审查时仅具备 `prefers-reduced-motion` 的基础处理。当前图片 B3、模态焦点管理、`:focus-visible`、对比度护栏与 reduced-motion 补全已实现；剩余字体 fallback metrics。

## 2. 工作分解 · 2.2 性能

### 2.2-F 字体（最大杠杆）

- **通用动作（任何方案都先做，零依赖、立即见效）**：
  - **砍字重**：只保留首屏真正用到的字重（现在 Lora 7 档+斜体、Manrope 5 档…多半用不到）。
  - **preload 关键字重**：首屏标题/正文字体 `<link rel="preload" as="font" crossorigin>`。
  - **fallback metrics 降 CLS**：为系统回退字体加 `@font-face { size-adjust / ascent-override / descent-override }`，让 webfont 换入时不跳动。
- **方案选择见 §5 决策 A**（自托管子集 vs CDN vs 中文走系统字体——影响差异大）。

### 2.2-I 图片

- **通用动作（零依赖、立即见效）**：
  - 所有 `<img>` 加**显式 `width`/`height` 或 `aspect-ratio`**（防 CLS）。
  - 首屏 **LCP 图** `fetchpriority="high"` 且**不** lazy；其余 `loading="lazy"` + `decoding="async"`。
  - 加 `srcset` + `sizes`（先用现有 JPG 的多尺寸；现代格式见决策 B）。
- **方案选择见 §5 决策 B**（构建期管线 vs 手工多格式 vs 仅 srcset/lazy）。
- 注意两条线：编辑器上传走 `utils.js#resizeImage`（运行时压缩）；**这里要解决的是「打包/部署期资产优化」**。模板用户放进 `public/` 的图也要能受益——这会影响决策 B 的取舍。

### 2.2-J JS / 运行时（次要，按需）

- 先量 TBT；若 Perf 已达标可不动。可选：把非首屏重组件（`Travel` 地图、`Photography` 灯箱等）也 `React.lazy`；减少 hydration 主线程开销。

## 3. 工作分解 · 2.3 无障碍（90 → ≥95）

- **模态焦点管理**（`Works` 的 WorkModal、`CVModal`、`Photography` 灯箱）：`role="dialog"` + `aria-modal="true"` + `aria-label`；打开聚焦首个可聚焦元素；**焦点陷阱**；`Esc` 关闭（部分已有）；**关闭后焦点归位**到触发元素。
- **`:focus-visible` 可见焦点环**：全局给键盘焦点统一样式（走 `styles/*` + CSS 变量，勿用 `outline:none` 裸删）。
- **图片 `alt`**：作品/照片/portrait 用有意义的 `alt`（双语 caption 经 `pick` → alt）；装饰性图 `alt=""`。
- **颜色对比**：确保默认 + 各 preset 的正文 `text`/`background` ≥ 4.5:1；可选在 `StyleEditor` 加开发期 WCAG 提示（用风格引擎已有的 `contrast`）。
- **prefers-reduced-motion**：核对 `style-runtime.css:326` 是否覆盖 `CursorSpotlight`、`useReveal`、parallax、`--style-motion-duration` 等；与 `motion.mode`（INV-10）协同，**系统 reduce 优先**。
- **语言**：`documentElement.lang` 已随 `lang`（✅）；预渲染各路由 lang 正确（2.1b ✅）。

## 4. 改哪些文件

| 文件 / 模块                                                               | 改动                                                                                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `index.html`                                                              | 字体 `<link>` 瘦身 + `preload`；（自托管方案下）改指向本地字体。                                     |
| `public/fonts/`（视决策 A）                                               | 自托管 / 子集字体文件。                                                                              |
| `src/styles/*.css`                                                        | fallback `@font-face`（size-adjust）、`:focus-visible`、补充 reduced-motion、`aspect-ratio` 工具类。 |
| 含 `<img>` 的组件（`Works`/`Photography`/`Journey`/`Library`/`About` 等） | `srcset`/`sizes`/`width`/`height`/`loading`/`decoding`/`fetchpriority`/`alt`。                       |
| 模态组件（`Works` modal、`CVModal`、`Photography` 灯箱）                  | dialog 语义 + 焦点陷阱 + 归位；可抽 `hooks.jsx#useFocusTrap`。                                       |
| `vite.config.js` + `package.json`（视决策 B/A）                           | 构建期图片/字体管线（若选带依赖方案）。                                                              |
| `hooks.jsx`（可选）                                                       | `useReducedMotion()` / `useFocusTrap()`。                                                            |
| `tests/`                                                                  | 新增纯函数测试（如 `buildSrcset`、LCP 选择）；可加键盘可达 smoke。                                   |
| `CLAUDE.md` / `PLAN.md` / `ENGINEERING.md` / `CODEBASE_ANALYSIS.html`     | 同步机制与不变量。                                                                                   |

## 5. 决策项（重点：不同选择的影响）

> 评分维度：**性能提升 · 新依赖 · 维护成本 · 模板友好（clone 后换文案/换图是否还省心）· 视觉一致**。

> **默认路线（本项目已定）**：先零依赖通用动作 + **A1**（字体瘦身 / `preload` / fallback metrics）+ **B3**（图片 `srcset` / 显式尺寸 / `loading=lazy` / LCP `fetchpriority`），量一次 Lighthouse；**仍 < 90 才升级**到 **A2**（构建期自动子集字体）/ **B1**（构建期 AVIF/WebP 管线）。**排除 A2′ / B2**（手工方案，破模板属性）。a11y（§3）与性能并行。理由：契合「依赖克制 + 模板友好 + 视觉一致」三条指导原则，且 B3+A1 很可能已把移动端 Performance 推过 80，再按测量结果决定是否引入构建依赖。

### 决策 A · 字体策略

| 方案                     | 做法                                                                     | 性能提升 | 依赖                            | 维护 | 模板友好   | 视觉一致               |
| ------------------------ | ------------------------------------------------------------------------ | -------- | ------------------------------- | ---- | ---------- | ---------------------- |
| **A1 CDN 瘦身**          | 保留 Google Fonts，仅砍字重 + preload + fallback metrics                 | 中低     | 零                              | 最低 | 高         | 高                     |
| **A2 自托管 + 自动子集** | 构建期工具扫描文案、子集化 CJK，自托管                                   | **高**   | 有（subfont/fontmin 等 devDep） | 中   | 高（自动） | 高                     |
| **A2′ 手工预子集**       | 手工子集文件提交 `public/fonts/`                                         | 高       | 零                              | 高   | **差**     | 高                     |
| **A3 折中**              | 拉丁字体自托管子集；中文走**系统字体回退**（PingFang/微软雅黑/思源本地） | 中高     | 零/低                           | 低   | 高         | **中**（中文随系统变） |

影响要点：

- **Noto SC 全量是分数杀手**。A1 改善 CLS 与字重数量，但**首访仍要下 MB 级 CJK**，对移动 Perf 提升有限——适合「先摘低垂果实」。
- **A2 收益最大**（CJK 从 MB → 几十 KB、去跨域、可精准 preload），但子集是「按当前文案用到的字形」生成；**模板用户改了文案就会缺字**，所以必须**构建期自动子集**（扫 `data.js`/渲染产物）才不破模板属性——代价是一个 devDependency。
- **A2′（手工子集）** 同等运行时收益但写死字形，**与「模板」定位冲突**（别人 clone 改文案即缺字），不推荐做模板默认。
- **A3** 拉丁部分稳定收益、中文几乎零成本，但中文视觉随系统字体变化（一致性下降）。对「模板 + 极简依赖」很合适。
- **建议**：要「快且保模板性」→ **A2（自动子集）**，接受 1 个构建期依赖；要「零依赖快速见效」→ **A3**（先把拉丁自托管 + 中文系统回退，之后需要再上 A2）。**A1 可作为任何路线的第一步**。

### 决策 B · 图片策略

| 方案                  | 做法                                                                                  | 性能提升 | 依赖                                 | 维护           | 模板友好   |
| --------------------- | ------------------------------------------------------------------------------------- | -------- | ------------------------------------ | -------------- | ---------- |
| **B1 构建期管线**     | `vite-imagetools` / `sharp` 脚本自动出 AVIF/WebP + 多尺寸 + 尺寸元数据                | **高**   | 有（sharp/imagetools，含原生二进制） | 中             | 高（自动） |
| **B2 手工多格式**     | 预先转好 `.avif`/`.webp` + 多尺寸提交 `public/`，组件用 `<picture>`/srcset            | 高       | 零                                   | **高（手工）** | 差         |
| **B3 仅 srcset/lazy** | 不转格式，只加 `srcset`（现有 JPG 缩放档）+ `loading`+ 显式尺寸 + LCP `fetchpriority` | 中       | 零                                   | 低             | 中         |

影响要点：

- **AVIF/WebP 比 JPG 小约 30–50%**，所以 B1/B2 的传输收益明显高于 B3。
- **B1 最省心但有两个坑**：① `sharp` 是较大的原生依赖，CI 安装变慢；② 本项目图片是 **`public/` 运行时路径**（`data.js` 存 `/works/x.jpg`），而 Vite 默认**不处理 `public/`**——要么把图改成 `import`（影响 data 驱动的灵活性），要么加自定义构建步专门处理 `public/`。但好处是**模板用户新放的图自动受益**。
- **B2** 运行时收益等同 B1，但手工转/维护多份文件，**模板用户加图要自己转、易漏**，破模板性。
- **B3 零依赖、能拿到 lazy/CLS/LCP 优先级的可观收益**（很可能就把 Perf 推过 80），但不享受现代格式的体积下降。`resizeImage` 的缩放思路可复用来生成尺寸档。
- **建议**：想要最大收益 + 模板自动化 → **B1**（接受 sharp/imagetools + 解决 public 处理）；想零依赖先冲一波 → **B3**，测完不够再上 B1。

### 决策 C · a11y 静态检查（可选）

- 引 `eslint-plugin-jsx-a11y`（devDep）持续防 a11y 回退 vs 手工 + Lighthouse 把关。影响：前者防回退但加依赖、初期可能一堆告警；后者零依赖、靠人/CI。**建议**：先手工到 ≥95，之后再决定是否上 plugin。

## 6. 满足 / 影响的不变量

- **INV-8 静态 + check:dist**：任何构建期图片/字体处理产物仍纯静态；不得把 server renderer 牵连进来；check:dist 保持绿。
- **hydration**：`<img>` 的 `srcset`/`sizes`/`width`/`height`/`fetchpriority`/`loading` 在 SSR 与 client 首帧必须一致；字体 preload 同理。
- **INV-1 CSS 变量**：focus/reduced-motion 样式走 `styles/*` 与既有变量，不重命名 `--*`。
- **INV-10 motion**：reduced-motion 与 `motion.mode` 协同，系统 reduce 优先。
- **INV-4 双语**：`alt` 文案双语经 `pick`。
- **原则 6 依赖克制**：B1/A2/C 的依赖须在变更说明给理由（仅构建期/开发期，不进运行时 bundle）。
- **ESM 扩展名**（§ENGINEERING.4）。

## 7. 测试 / 验收

- **单测（vitest）**：新增的纯函数（如 `buildSrcset(path, widths)`、LCP 图选择、字体 preload 列表派生）。
- **构建守卫**：`check:dist` 绿；产物含 `.avif`/`.webp`（若 B1）；字体子集文件存在（若 A2）。
- **Lighthouse（移动）**：Perf ≥ 90、a11y ≥ 95、BP ≥ 96、SEO = 100、CLS < 0.1（贴分数）。
- **CDP smoke**：加一条键盘可达——模态 `打开 → Esc → 焦点归位`；`prefers-reduced-motion` 媒体查询命中时动画弱化。
- **不回归**：现有 62 测试 + production preview smoke。

## 8. Definition of Done

- [x] 图片 B3 + a11y PR 五段门禁全绿（`lint` / `test` / `build` / `check:dist` / `format:check`）+ production CDP smoke。
- [ ] 移动端 Lighthouse：**Perf ≥ 90、a11y ≥ 95、BP ≥ 96、SEO = 100、CLS < 0.1**（附分数）。
- [x] 所有 `<img>` 有显式尺寸/`aspect-ratio` + `alt`；首个内容图 `fetchpriority="high"` 不 lazy、其余 `loading="lazy"`。
- [ ] 字体仅加载首屏所需字重；关键字重 `preload`；fallback metrics 降 CLS；按决策 A 落地。
- [x] 模态 `role="dialog"`+`aria-modal`+焦点陷阱+归位；`:focus-visible` 可见焦点环。
- [x] `prefers-reduced-motion` 覆盖全部动效并与 `motion.mode` 协同。
- [ ] 新依赖（若有）在变更说明写明理由；未违反 §6 任一 INV；不破 hydration。
- [ ] 文档同步（`CLAUDE.md`/`PLAN.md`/`ENGINEERING.md`/`CODEBASE_ANALYSIS.html`）；写 ENGINEERING §8 变更说明。

## 9. 顺序 / 边界

- **第 1 步（零依赖、立即见效）**：图片尺寸/`lazy`/`fetchpriority`/`srcset` + 字体字重瘦身/`preload`/fallback metrics + a11y（模态焦点、focus-visible、alt、reduced-motion 补全）。→ **量一次 Lighthouse**。
- **第 2 步（按测量结果）**：若 Perf 未到 90，再上**决策 A2（自动子集字体）**和/或 **B1（构建期图片管线）**冲刺。
- a11y 与 perf 并行。**不动**数据/风格层核心逻辑、不改 `useData`/`useStyle` API、不引运行时依赖。
- 建议小步多 PR：①图片通用动作 ②字体通用动作 ③a11y ④（如需）A2/B1 依赖冲刺——每步各自过门禁。
