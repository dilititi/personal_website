# SPEC 4 · 模板上手：解耦 + 目标预设 + 部署前审计（P0 / P1 / P2）

> 配套文档：`PRODUCT-DIRECTION.md`（为什么做这三件）/ `PLAN.md`（路线图，Phase 4「模板上手」）/ `SPEC-3-PERSIST.md`（发布）/ `ENGINEERING.md`（工程契约）。
> 状态：**P0 / P1 / P2 + 首轮反馈 UX 已实现，待任务制复测**（2026-06-12）。读者：项目所有者 + AI 编码 Agent。
> 一句话目标：把模板从「Chen 的示例站」变成「**别人 5 分钟能用起来**」。落地 `PRODUCT-DIRECTION.md` 的 **P0 / P1 / P2**。
> **重要前提：大量基础设施已存在**——这是「接线 + 收口」,不是从零造（见 §0）。

---

## 0. 现有可复用资产（先认账，别重造）

| 资产         | 位置                                                                                                  | 现状                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 空白起步内容 | `contentPresets.js` `STARTER_TEMPLATE`                                                                | 全占位（`<Your name>` 等）；`ImportPanel.downloadStarter()` 已能导出                                                                                    |
| 命名预设     | `contentPresets.js` `CONTENT_PRESETS`                                                                 | 每个含 `{ id, label, description, preview, stylePreset, data: { MODULES, SITE, ABOUT, … } }`（organic / film / digital…）；`ImportPanel` 已渲染卡片网格 |
| AI 提示词    | `contentPresets.js` `AI_PROMPT`                                                                       | `ImportPanel.copyPrompt()` 已能复制                                                                                                                     |
| 导入校验     | `validation.js` `validateImportData`                                                                  | 已用于粘贴导入                                                                                                                                          |
| 体检用校验器 | `validation.js#validateSiteData`；`export.js#findMissingPublicPaths/collectDataUrls/exportAllWarning` | 现成，P2 直接复用                                                                                                                                       |
| 持久化       | `data-context.jsx` `replaceOverrides` / `setSection`；发布走 `SPEC-3` 的 GitHub PAT                   | 现成                                                                                                                                                    |

**落地结果**：`ImportPanel` 已成为显眼的 Start 入口；`goals.js` 在现有内容预设之上定义目标映射；`STARTER_TEMPLATE` 与所有目标覆盖完整可编辑章节；`audit.js` / `AuditPanel.jsx` 提供结构化审计并接入发布前检查。

---

## P0 · 解耦 + 空载实例化

**目标**：新克隆者不必在 Chen 的内容上逐字段覆盖；能一键从「空白 / 某预设」起步；`data.js` 与「Chen 示例」解耦。

**决策（三选一,给推荐）**：

| 方案             | 做法                                                                                                                                                                                                        | 取舍                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **W0-a（推荐）** | `data.js` 仍作「可替换示例」（**不动**）；解耦在 UX 层达成：编辑器给**显眼**的「从预设 / 空白起步」一键入口（覆盖 overrides）；「重置所有本地编辑」即回到 `data.js` 的 Chen 示例,**无需把 Chen 复制成预设** | 风险最低,复用现成 `applyContentPreset`,**不动 `data.js` 消费链**（prerender / SEO / sections 都不受影响） |
| W0-b             | `data.js` 出厂即 `STARTER_TEMPLATE`（空占位）,Chen 示例下沉为 `demo` 预设                                                                                                                                   | 真正「中立出厂」,但改首屏预渲染/SEO 默认值,**风险高,需全量回归**                                          |
| W0-c             | 双文件 `data.js` + `data.demo.js` + 构建开关                                                                                                                                                                | 引入第二份内容源,与单一事实源冲突,**不推荐**                                                              |

**已采用 W0-a**：`data.js` 继续是唯一示例事实源；空白与目标只原子替换 overrides，重置全部本地编辑仍回到 Chen 示例。没有复制 Chen demo，也没有引入第二份数据事实源。真正的「中立出厂」（W0-b）留到有 ≥5 个真实用户之后再评估。

**改动文件**：

- `src/components/editor/ImportPanel.jsx`（或新增轻量 `FirstRunPanel`）：把「应用预设 / 空白起步」做成显眼的一步,而非埋在导入 tab 深处。
- `src/components/editor/contentPresets.js`：扩展 `STARTER_TEMPLATE` 覆盖所有访客 section（让「应用空白」是干净白板）。**不**把 Chen 复制成预设（reset 已能回到 `data.js` 的 Chen）。
- `README.md`：上手段加「可从预设起步」。
- （可选）首次检测到无 overrides 时,在编辑器顶部提示「选择一个起点」。

**DoD**：新用户能在编辑器**一步**应用某预设或空白 → 主站立即变成该起点 → 再精修 → 按 `SPEC-3` 发布；`data.js` 现有消费（prerender / SEO / 各 section）行为不变；CI 绿。

**实现证据**：

- `STARTER_TEMPLATE` 覆盖 `EXPORTABLE_SECTIONS` 的全部 16 个数据段，包括此前未进入编辑器的 `READING_LOG` / `PHOTO_SERIES`。
- `SITE` 与 `TEXTS` 的访客身份字段由每个目标完整覆盖，避免从 Chen 默认值泄漏。
- Start 面板可直接应用空白起点；应用前快照同时保存内容与风格，兼容旧版只含内容的快照。

---

## P1 · Goal Picker → preset

**目标**：把「选风格预设」升级成「**选目标**」——目标决定模块集 / 结构 / 默认风格 / 文案骨架。

**做法**：在 `CONTENT_PRESETS` 之上加「目标」维度（或重组为目标导向）。目标示例：

```
AIGC 求职作品集 · 摄影 / 影像作品集 · 游戏项目展示 · 研究 / 论文主页 · 简历落地页 · 个人主页
```

每个目标 = 一组 `MODULES` + `stylePreset` + 文案骨架（占位或精简样例）。

**关键接线**：目标解析复用 `CONTENT_PRESETS[].stylePreset`，应用路径先用 `replaceOverrides()` 原子替换完整内容，再调用 `style-context` 的 `applyPreset()` 同步落风格。

**UI**：新增一个「开始」步骤 `GoalPicker`（卡片式,复用现有 `ce-template-grid` 样式）。选完 → `applyPreset` → 进入 `ContentEditor` 精修。

**不做**：空白 prompt 凭空生成结构（理由见 `PRODUCT-DIRECTION.md` §3A——会丢掉模板的取舍、继承「AI 站点千篇一律/一改就崩」）。

**DoD**：选一个目标 → 模块集 + 默认风格 + 文案骨架**一并**落到 overrides + style → 主站立即呈现该结构；切换目标可重置；目标→预设映射有单测。

**实现证据**：

- `goals.js#GOAL_PRESETS/resolveGoalSelection` 提供空白、创作档案、影像作品集、数字作品集四个目标。
- `ImportPanel` 使用 `replaceOverrides()` 原子替换整份内容草稿，再调用既有 `applyPreset()`；切换目标不会残留上一目标遗漏的数据段。
- `tests/goals.test.js` 固定目标→风格映射、完整章节覆盖、深拷贝隔离和身份字段覆盖。

---

## P2 · 部署前审计（Layout Audit）

**目标**：发布前一键体检,拦下空链接 / 缺图 / 文案问题 / 占位符未替换 / 移动端溢出。这是 `PRODUCT-DIRECTION` 里最硬的护城河,且最便宜。

**做法**：新增「审计」面板/步骤,运行——

- **复用现成**：`validateSiteData`（结构/必填）、`findMissingPublicPaths`（缺图/坏路径）、`collectDataUrls`（大体积内联 base64 警告）、`exportAllWarning`。
- **新增轻检查（纯函数,可单测）**：空链接（`url` 为 `'#'`/`''`）、标题过长、section 缺标题、**占位符未替换**（仍含 `STARTER_TEMPLATE` 的 `<…>` 尖括号文案）。
- **移动端溢出**：复用 production CDP smoke 思路；审计里给「跑 `npm run test:ui:preview`」的提示项（不在浏览器里硬判）。

**分级**：错误（建议阻断发布）/ 警告（可继续）。**与 `SPEC-3` 发布前 `preflight` 合流**——发布按钮前先跑 audit。

**DoD**：审计面板列出错误/警告并**定位到 section/字段**；占位符未替换标红；与发布流程串起；新增纯函数有单测（mock data）；CI 绿。

**实现证据**：

- `audit.js#auditSiteData` 返回带 `severity/code/path/section/message` 的结构化报告；`runSiteAudit` 追加 public 路径检查。
- 错误覆盖结构异常、未替换占位符、缺失标题、缺失 portrait、大体积 data URL；警告覆盖空链接、过长标题和缺少独立 OG 图。
- `AuditPanel` 可在无 GitHub token 时独立运行；`PublishPanel` 在验证 token 之前执行同一纯审计，`publish.js` 再做权威复核与仓库资源检查。
- `tests/audit.test.js` 与浏览器 smoke 覆盖空白起点阻断、目标起点无阻断错误和字段路径定位。

---

## 跨阶段 · 不变量 & 测试

- **单一事实源**：预设/目标只写 overrides + style config,**复用 `export.js` 序列化器,不新增第二份**（`ENGINEERING.md` INV）。
- **静态降级**：无 token 也能用预设/审计/导出；只有「发布」才需 token（`SPEC-3`）。
- **测试**：P1 目标→预设映射纯函数单测；P2 审计纯函数单测（占位符检测 / 空链接 / 标题长度）；复用现有 validators 的既有测试。
- **代码 DoD**：`lint / test / build / check:dist / format` 全绿；开发态与生产预渲染态 browser smoke 通过；README / 架构 / 契约文档同步。
- **产品放行门槛**：P0–P2 合并后找到 ≥5 个真实用户走完整流程，再决定是否投入 P3+。此门槛不是代码完成状态，不得提前标记。

---

## 落地顺序（建议）

1. ✅ **P0（W0-a）**：Start 入口 + 完整空白起点；保留 `data.js` Chen 示例，不复制 demo 预设。
2. ✅ **P1**：目标导向映射 + 内容/模块/风格原子应用。
3. ✅ **P2**：审计面板 + 纯函数检查 + 发布前阻断。
4. ✅ **首轮反馈**：5 位用户完成观感评审，集中指出参数过散、缺少指引、编辑脱离页面、模板差异不足与首页质量问题。
5. ✅ **UX 收口**：单页 Style 工作台、结构模板、三种 Landing、区块就地编辑和移动端上下分屏已落地。
6. ⏳ **任务制复测**：让用户实际完成“选结构 → 调参 → 就地改内容 → 审计 → 发布/导出”，记录完成率、耗时与阻塞。

> 每步的「改哪些文件、满足哪些不变量、Definition of Done」以本 spec 为准；实现前先读 `ENGINEERING.md` 与 `PRODUCT-DIRECTION.md`。实现由 codex 落地,我审代码并盯 CI 绿——**不合并红 CI**。
