# SPEC 3 · 真正的持久化 · 路径 A（浏览器内 GitHub 写入）

> 配套文档：`PLAN.md` §Phase 3 / `ENGINEERING.md`（工程契约）/ `CONTENT_GUIDE.md`（现有 promote-to-code 流）/ `CLAUDE.md`（架构）。
> 状态：**3A.1 / 3A.2 已实现，待真实仓库与 Render 外部验收**（2026-06-11）。读者：项目所有者 + AI 编码 Agent。
> 一句话目标：让站内编辑器的「📋 全部 → 粘回 `data.js` → git push」**自动化**——在浏览器里点「发布」，直接把改动提交成一个 GitHub commit，Render 随即重新部署。**仍是纯静态、零长期后端**。

---

## 1. 背景与目标

**原始缺口**：站内编辑（`ContentEditor` / `StyleEditor`）只把改动写进 `localStorage`；要真正上线，用户得手动复制 export、粘回源码并 git push。上传图片/音频也仅在本地 dev 可用。

**当前实现**：手动导出流完整保留；编辑器新增 GitHub 发布面板，生产媒体也可经 GitHub Contents API 写入仓库。localStorage 仍只是草稿层。

**目标（路径 A）**：在编辑器里点一个「发布到 GitHub」，浏览器直接：

1. 用现有序列化器（`export.js#exportLine`）拼出与今天手动粘贴**完全一致**的 `data.js` 内容；
2. 经 GitHub REST API 提交成一个 commit；
3. Render 自动重建 → 几分钟后线上更新。

`localStorage` 退化为**草稿层**；数据继续活在用户自己的 git 仓库里。

**非目标**：不引入任何长期后端（serverless 是路径 B）；不改内容数据模型；不做多用户/权限系统（单所有者管理工具）。

**关键约束（继承 `ENGINEERING.md`）**：

- **静态优先、优雅降级**：未配置 token 时，行为与今天**完全一致**（Copy / 📋 全部 / 下载备份照常；发布按钮提示「请先配置」）。
- **单一事实源**：内容仍以 `src/data.js` 为唯一权威；**不新增第二个序列化器**（复用 `export.js`）。
- **依赖克制**：零新增运行时依赖（用浏览器原生 `fetch` + GitHub REST）。

---

## 2. 机制选型 · 浏览器如何写 GitHub

纯静态站**无法**完成标准 OAuth：授权码换 token 需要 client secret（静态站存不住），而 GitHub 的 **Device Flow** 的 token 端点（`github.com/login/oauth/access_token`）**不发 CORS 头**，浏览器直连被拦。但 **`api.github.com` 的 REST 接口支持 CORS**，带 Bearer token 的浏览器 `fetch` 可用。因此：

| 选项                                   | 机制                                                                          | 后端   | UX               | 取舍                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------- | ------ | ---------------- | ------------------------------------------------------- |
| **A1 · 细粒度 PAT（推荐默认）**        | 所有者生成 fine-grained PAT（仅本仓库、Contents 读写），粘进编辑器，REST 提交 | **零** | 首次粘一次 token | 真正零后端、最契合模板；token 在浏览器需妥善存（见 §7） |
| A2 · GitHub App + OAuth/Device（备选） | 「用 GitHub 登录」，但需一个**极小 token-exchange 边缘函数**绕过 CORS         | 微后端 | 最顺滑           | 引入一个一次性边缘函数，偏离「纯静态」，**本期不做**    |

**结论**：本期落 **A1（细粒度 PAT）**。它对单所有者的个人站足够、零后端、与「数据进自己仓库」一致。A2 留作未来「想要登录式 UX」时的增量。

---

## 3. 写入目标选型 · 提交什么文件

| 选项                                          | 做法                                                   | 单一事实源                  | 健壮性                                     | 评价                                                     |
| --------------------------------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| **W1 · `data.js` 哨兵区域内定点重写（推荐）** | 在内容区前后加哨兵；发布时只替换发生变化的 export 声明 | ✅ 保持                     | 高：未改声明、相邻注释与哨兵外文本原样保留 | 最小 diff，与现流等价                                    |
| W2 · 提交 `src/content.overrides.json`        | 直接提交 overrides 对象，运行时 `deepMerge` 到默认值   | ⚠️ 引入「默认 vs 实例」两层 | 最高（纯 JSON，无需解析 JS）               | 需改架构 + 改 `ENGINEERING.md`，破坏「文案都在 data.js」 |
| W3 · 全量重生成 `data.js`                     | 用序列化器重建整个文件                                 | ✅                          | 低：要忠实复刻 imports/helpers/注释        | 易漂移，不推荐                                           |

**结论**：用 **W1 定点重写**。它复用 `exportLine` 生成目标声明，但不重生成整个内容区。这样 `READING_LOG` / `PHOTO_SERIES` 等未暴露给编辑器的运行时数据、相邻说明注释与手工格式不会因发布其它章节被删除。

**哨兵约定**（加进 `src/data.js`，`src/style.js` 同理对 `DEFAULT_STYLE`）：

```js
// <<< EDITOR:CONTENT START >>>
export const SITE = { … }
export const NAV = [ … ]
// <<< EDITOR:CONTENT END >>>
```

发布器只在两枚哨兵之间查找明确命名的 `export const NAME = expression`，通过平衡括号/字符串/注释扫描确定表达式边界，再替换该声明。区域外、未选声明和声明后的注释/空白保持逐字节不变。

---

## 4. 改动文件

| 文件                                                            | 改动                                                                                                                                            | 新增? |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `src/lib/github.js`                                             | GitHub REST 请求、文件读写、UTF-8/base64、409 冲突重取重试；`fetch` 可注入测试                                                                  | ✅    |
| `src/lib/publish.js`                                            | 用 `exportLine` 定点生成目标声明并执行哨兵替换；发布前复用 `validateSiteData` / `findMissingPublicPaths` 等校验                                 | ✅    |
| `src/data.js` / `src/style.js`                                  | 加 §3 哨兵注释，界定可重写区域                                                                                                                  | 改    |
| `src/components/editor/PublishPanel.jsx`                        | 内容/风格共用的 token、仓库、分支、验证、确认与提交状态 UI                                                                                      | ✅    |
| `src/components/ContentEditor.jsx`                              | 新增内容发布入口；只提交当前浏览器 overrides 涉及的章节                                                                                         | 改    |
| `src/components/StyleEditor.jsx`                                | 新增风格发布入口，对 `exportStyle()` → `src/style.js`                                                                                           | 改    |
| `src/components/editor/fields/FileField.jsx`                    | 生产环境有 token 时，走 GitHub 提交把响应式图片族写进 `public/{subfolder}/`（复用 `createResponsiveImageVariants`），**填平 dev-only 上传缺口** | 改    |
| `src/lib/publish-config.js`                                     | 仓库 `owner`/`repo`/默认 `branch`（预填 `dilititi`/`personal_website`/`main`，可在 UI 改）                                                      | ✅    |
| `CONTENT_GUIDE.md` / `ENGINEERING.md` / `CLAUDE.md` / `PLAN.md` | 记录新发布流、新不变量、`src/lib/github.js`、新键 `chen.github.token`、Phase 3 状态                                                             | 改    |

---

## 5. 数据流与 UX

**内容发布**：编辑器「发布」→ 填细粒度 PAT + 核对 `owner/repo/branch` → 验证仓库、分支与显式 push 权限 → 校验 resolved data、public 路径和 data URL → GET `src/data.js` 与 SHA → 定点替换 changed exports → PUT commit → 显示 commit 链接与 Render 重建提示。

当前浏览器草稿与代码默认值一致时，「发布内容」按钮禁用，但仍可单独验证 GitHub 连接。资源回退检查只有在 GitHub 明确返回 404 时才判定为缺失；认证、限流和网络错误保留原始错误，避免误导为路径问题。

**冲突**：PUT 返回 409（`sha` 过期）→ 自动重取 `sha`、重新生成区域、重试一次；仍失败则提示手动。

**当前提交模式**：3A.1 只实现直接提交所填 branch（默认 `main`），提交前必须二次确认。分支 + PR 属于 3A.3，可选且尚未实现。

**资产上传**：`FileField` 生产环境有 token 时，对每个响应式尺寸 PUT 到 `public/{subfolder}/{filename}`，`onChange` 写回 `/subfolder/filename` 路径。媒体始终是 `public/` 下的**文件**，**绝不**把 base64 塞进 `data.js`（见 §7 风险）。

---

## 6. 安全模型

- **token 作用域**：fine-grained PAT，**仅本仓库**，权限只给 **Contents: Read and write**（不给其它）。UI 在保存前校验仓库、branch 与显式 push 能力，并显示目标仓库。
- **token 存储**：默认 **`sessionStorage`**（关标签即清）；显式勾选「记住」才进 `localStorage`，并明确提示 **XSS 风险**。键名 `chen.github.token`，登记进 `CLAUDE.md` 的键清单。
- **绝不外泄**：token 不进任何导出 / 提交 / `data.js`；发布器对组装出的内容做断言（不得含 `ghp_`/`github_pat_` 前缀）。
- **编辑器可见性**：编辑器与发布 UI 随静态包发给所有访客，但**写操作需有效 token**，故只有持 token 的所有者能发布——「编辑器存在」本身不是漏洞，需在文档写明。
- **CSP 备注**：将来若加 CSP，`connect-src` 需允许 `https://api.github.com`。

---

## 7. 失败、冲突与风险

- **token 安全（XSS）**：缓解=最小权限 + 默认 sessionStorage + 风险提示；个人管理工具可接受。
- **base64 媒体撑大 `data.js`**：缓解=媒体一律走 `public/` 文件路径；发布前用现有 `collectDataUrls` 检测，**若存在大体积内联 data URL 则阻止发布**并提示改用文件。
- **坏内容打断构建**：缓解=发布前 `validateSiteData` 客户端校验；想更稳用「分支 + PR」模式让 CI 把关。
- **Render 构建额度**：每次发布 = 一次部署；低频使用无虞；建议合并多处改动一次性发布。
- **GitHub 限流 / CORS**：个人用量远低于限额；**只调 `api.github.com`**（有 CORS），不从浏览器碰 `github.com` 的 OAuth/token 端点。

---

## 8. 测试与不变量

**单元（Vitest + 注入/mock `fetch`）**：

- `github.js`：请求构造（URL / `Authorization` / `Accept: application/vnd.github+json` / body / UTF-8 base64）；409 → 重取 `sha` → 重试；token 校验分支。
- `publish.js`：哨兵外文本不变、未选 export 与相邻注释不变、目标声明可往返；从校验到 GitHub PUT 的贯通 mock；校验管线阻止非法数据与超大 data URL。
- `publish-config.js`：session/local token 选择、配置持久化和 storage SecurityError 降级。

**不变量（并入 `ENGINEERING.md`）**：

- **INV-持久化降级**：无 token / 未配置 → 站点与编辑器与今天完全一致，纯静态不受影响。
- **INV-token 不入码**：token 绝不出现在任何提交 / 导出 / 源文件。
- **INV-单序列化器**：发布复用 `export.js`，不得新增第二份序列化器。
- **INV-单一源（W1）**：内容仍以 `src/data.js` 为唯一权威；哨兵区域外不被发布器改动。

---

## 9. Definition of Done

- [x] 本地 mock 验证：站内发布链路可生成对应 PUT；内容 diff 仅限目标 export，区域外、相邻注释与未选声明零变化。
- [ ] 真实仓库验收：站内改一处文案 → 点「发布到 GitHub」→ GitHub 上出现对应 commit。
- [ ] Render 自动重建后，线上反映该改动；随后清空 `localStorage` 草稿无任何丢失。
- [x] 本地 mock 验证：生产上传可创建/更新 `public/{subfolder}/` 文件并在 409 后重试；真实仓库图片验收待 PAT。
- [x] **未配置 token** 时：发布面板明确提示，Copy / 下载备份 / 站点浏览不受影响。
- [x] 提交前校验能拦下非法数据与大体积内联 base64。
- [x] `github.js` / `publish.js` / `publish-config.js` 有单测；当前全量为 20 个文件 / 94 项测试，开发态与 production preview CDP smoke 均通过。
- [x] `CONTENT_GUIDE.md` / `ENGINEERING.md` / `CLAUDE.md` / `PLAN.md` 已对齐。

**本轮性能对照（Lighthouse 12.8.2，移动端，本机 production preview）**：当前工作区 Performance 73–74、Accessibility 100、Best Practices 96、SEO 100、CLS 0.001；同环境导出的干净 `HEAD@9ecafb1` Performance 77，LCP 同为 3.7s、DOM 同为 1079。Phase 3 发布代码位于编辑器懒加载 chunk，当前数据不足以证明有实质首屏回退；历史 98 分保留为 2026-06-08 当时工具与环境的基线，不替换为本轮绝对值。

---

## 10. 分期（Phase 3 内）

1. **3A.1 内容发布**：`github.js` + `publish.js` + `data.js`/`style.js` 哨兵 + 编辑器「发布」按钮 + token UI + 客户端校验（直接提交 `main`）。
2. **3A.2 资产上传**：`FileField` 生产环境经 GitHub 提交响应式图片族，填平 dev-only 上传缺口。
3. **3A.3（可选）PR 模式**：分支 + PR + CI 把关 + 冲突 UX 打磨。
4. **3A.4（可选，远期）A2 登录式**：极小边缘函数做 OAuth/Device token 交换，换「用 GitHub 登录」UX——仅当 PAT 体验不够时再做。

> 每步的「改哪些文件、满足哪些不变量、Definition of Done」以本 spec §4 / §8 / §9 为准；实现前先读 `ENGINEERING.md`。
