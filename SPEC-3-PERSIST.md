# SPEC 3 · 真正的持久化 · 路径 A（浏览器内 GitHub 写入）

> 配套文档：`PLAN.md` §Phase 3 / `ENGINEERING.md`（工程契约）/ `CONTENT_GUIDE.md`（现有 promote-to-code 流）/ `CLAUDE.md`（架构）。
> 状态：**待实施**（建档 2026-06-08）。读者：项目所有者 + AI 编码 Agent。
> 一句话目标：让站内编辑器的「📋 全部 → 粘回 `data.js` → git push」**自动化**——在浏览器里点「发布」，直接把改动提交成一个 GitHub commit，Render 随即重新部署。**仍是纯静态、零长期后端**。

---

## 1. 背景与目标

**现状缺口**：站内编辑（`ContentEditor` / `StyleEditor`）只把改动写进 `localStorage`；要真正上线，用户得手动点「📋 全部」复制 `export const …`、粘回 `src/data.js`、再 `git commit && push`（见 `CONTENT_GUIDE.md`）。上传图片/音频更是**仅 `npm run dev`** 可用（`FileField` 在生产禁用，见 Phase 0）。即「线上编辑不落盘」。

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

| 选项                                  | 机制                                                                                 | 后端    | UX                  | 取舍                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------ | ------- | ------------------- | -------------------------------------------------------- |
| **A1 · 细粒度 PAT（推荐默认）**       | 所有者生成 fine-grained PAT（仅本仓库、Contents 读写），粘进编辑器，REST 提交         | **零**  | 首次粘一次 token    | 真正零后端、最契合模板；token 在浏览器需妥善存（见 §7）   |
| A2 · GitHub App + OAuth/Device（备选）| 「用 GitHub 登录」，但需一个**极小 token-exchange 边缘函数**绕过 CORS                 | 微后端  | 最顺滑              | 引入一个一次性边缘函数，偏离「纯静态」，**本期不做**       |

**结论**：本期落 **A1（细粒度 PAT）**。它对单所有者的个人站足够、零后端、与「数据进自己仓库」一致。A2 留作未来「想要登录式 UX」时的增量。

---

## 3. 写入目标选型 · 提交什么文件

| 选项                                              | 做法                                                                                          | 单一事实源 | 健壮性                                | 评价         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------- | ------------------------------------- | ------------ |
| **W1 · `data.js` 哨兵区域重写（推荐）**           | 在 `data.js` 内容区前后加哨兵注释；发布时只替换该区域为 `exportLine` 的输出（= 今天手动粘贴的内容）| ✅ 保持    | 高：区域外的 imports/`L`/`pick`/注释/小写辅助导出原样保留 | 与现流等价、最稳 |
| W2 · 提交 `src/content.overrides.json`            | 直接提交 overrides 对象，运行时 `deepMerge` 到默认值                                           | ⚠️ 引入「默认 vs 实例」两层 | 最高（纯 JSON，无需解析 JS）          | 需改架构 + 改 `ENGINEERING.md`，破坏「文案都在 data.js」 |
| W3 · 全量重生成 `data.js`                          | 用序列化器重建整个文件                                                                         | ✅         | 低：要忠实复刻 imports/helpers/注释    | 易漂移，不推荐 |

**结论**：用 **W1**。理由：它复用编辑器今天已在跑的 `EXPORTABLE_SECTIONS.map(s => exportLine(s.key, data[s.key])).join('\n\n')`（即 `handleCopyAll` 的 payload），产物与用户手动粘贴**逐字节一致**，且哨兵区域保证 imports / `L` / `pick` / 小写辅助导出 / 文件头注释**不被动到**。

**哨兵约定**（加进 `src/data.js`，`src/style.js` 同理对 `DEFAULT_STYLE`）：

```js
// <<< EDITOR:CONTENT START — 此区域由「发布到 GitHub」整体重写，勿手动加注释 >>>
export const SITE = { … }
export const NAV = [ … ]
// …其余 EXPORTABLE_SECTIONS，顺序固定…
// <<< EDITOR:CONTENT END >>>
```

发布器只替换两枚哨兵之间的文本；区域**外**的一切（`import`、`L`/`pick` 定义、版本号等小写辅助导出、说明注释）保持不变。

---

## 4. 改动文件

| 文件                                          | 改动                                                                                                                                  | 新增?  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `src/lib/github.js`                           | token 读写/校验、`getFileSha(path)`、`putFile({path,content,sha,branch,message})`、UTF-8→base64、409 冲突重取重试。`fetch` 可注入以便测试 | ✅     |
| `src/lib/publish.js`                          | 组装提交内容：用 `exportLine` 生成内容区 + 哨兵拼接成完整 `data.js`/`style.js`；发布前校验管线（复用 `validateSiteData` / `exportAllWarning` / `findMissingPublicPaths`） | ✅     |
| `src/data.js` / `src/style.js`                | 加 §3 哨兵注释，界定可重写区域                                                                                                        | 改     |
| `src/components/ContentEditor.jsx`            | 新增「发布到 GitHub」动作（复用 `handleCopyAll` 的 payload + `exportDataWarning`）；token 配置 UI；提交模式开关；状态/差异预览          | 改     |
| `src/components/StyleEditor.jsx`              | 同上，对 `exportStyle()` → `src/style.js`                                                                                             | 改     |
| `src/components/editor/fields/FileField.jsx`  | 生产环境有 token 时，走 GitHub 提交把响应式图片族写进 `public/{subfolder}/`（复用 `createResponsiveImageVariants`），**填平 dev-only 上传缺口** | 改     |
| `src/lib/publish-config.js`                   | 仓库 `owner`/`repo`/默认 `branch`（预填 `dilititi`/`personal_website`/`main`，可在 UI 改）                                            | ✅     |
| `CONTENT_GUIDE.md` / `ENGINEERING.md` / `CLAUDE.md` / `PLAN.md` | 记录新发布流、新不变量、`src/lib/github.js`、新键 `chen.github.token`、Phase 3 状态                                  | 改     |

---

## 5. 数据流与 UX

**内容发布**：编辑器「发布到 GitHub」→（首次）填细粒度 PAT + 确认 `owner/repo/branch` → 校验（`exportAllWarning` + `findMissingPublicPaths`，有错/有大体积 base64 则**阻止**并提示）→ `github.js` GET `src/data.js` 拿当前 `sha` → `publish.js` 用哨兵区域生成新内容 → PUT 提交（message 如 `content: update via editor`）→ 成功 → 提示「Render 正在重建，约 1–2 分钟生效」→ 可清空 `localStorage` 草稿。

**冲突**：PUT 返回 409（`sha` 过期）→ 自动重取 `sha`、重新生成区域、重试一次；仍失败则提示手动。

**提交模式**（开关，默认前者）：
- **直接提交 `main`**（默认，最快）：Render 立即重建。配合**强制的客户端校验**兜底。
- **分支 + PR**（更稳）：提交到 `content/<时间戳>` 分支并开 PR → 现有 `ci.yml` 跑 lint/test/build → 绿了再合并 → Render 部署。把已有 CI 当发布前安全网。

**资产上传**：`FileField` 生产环境有 token 时，对每个响应式尺寸 PUT 到 `public/{subfolder}/{filename}`，`onChange` 写回 `/subfolder/filename` 路径。媒体始终是 `public/` 下的**文件**，**绝不**把 base64 塞进 `data.js`（见 §7 风险）。

---

## 6. 安全模型

- **token 作用域**：fine-grained PAT，**仅本仓库**，权限只给 **Contents: Read and write**（不给其它）。UI 在保存前调一次 `GET /repos/{owner}/{repo}` 校验可达 + 权限，显示仓库名与权限范围。
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
- `publish.js`：哨兵区域替换**往返**（assemble → `eval` 内容区 → 与原 sections `deepEqual`）；校验管线对非法/超大 data URL 返回阻止。

**不变量（并入 `ENGINEERING.md`）**：
- **INV-持久化降级**：无 token / 未配置 → 站点与编辑器与今天完全一致，纯静态不受影响。
- **INV-token 不入码**：token 绝不出现在任何提交 / 导出 / 源文件。
- **INV-单序列化器**：发布复用 `export.js`，不得新增第二份序列化器。
- **INV-单一源（W1）**：内容仍以 `src/data.js` 为唯一权威；哨兵区域外不被发布器改动。

---

## 9. Definition of Done

- [ ] 站内改一处文案 → 点「发布到 GitHub」→ GitHub 上出现对应 commit；内容区 diff **仅**限改动章节、区域外零变化。
- [ ] Render 自动重建后，线上反映该改动；随后清空 `localStorage` 草稿无任何丢失。
- [ ] 上传一张图片 → 响应式尺寸出现在仓库 `public/{subfolder}/`，字段写回正确路径（**生产环境**可用，dev-only 缺口消除）。
- [ ] **未配置 token** 时：发布按钮优雅提示，Copy / 📋 全部 / 下载备份 / 站点浏览全部与今天一致。
- [ ] 提交前校验能拦下非法数据与大体积内联 base64。
- [ ] 新增 `github.js` / `publish.js` 单测通过；`npm run build`/`lint`/`test`/`check:dist`/`format:check` 全绿。
- [ ] `CONTENT_GUIDE.md`/`ENGINEERING.md`/`CLAUDE.md`/`PLAN.md` 已对齐（新流程、新不变量、新键、新 lib）。

---

## 10. 分期（Phase 3 内）

1. **3A.1 内容发布**：`github.js` + `publish.js` + `data.js`/`style.js` 哨兵 + 编辑器「发布」按钮 + token UI + 客户端校验（直接提交 `main`）。
2. **3A.2 资产上传**：`FileField` 生产环境经 GitHub 提交响应式图片族，填平 dev-only 上传缺口。
3. **3A.3（可选）PR 模式**：分支 + PR + CI 把关 + 冲突 UX 打磨。
4. **3A.4（可选，远期）A2 登录式**：极小边缘函数做 OAuth/Device token 交换，换「用 GitHub 登录」UX——仅当 PAT 体验不够时再做。

> 每步的「改哪些文件、满足哪些不变量、Definition of Done」以本 spec §4 / §8 / §9 为准；实现前先读 `ENGINEERING.md`。
