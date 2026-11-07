---
负责人：郑嘉文，周恪玄
---
# 架构说明

## 运行方式

AccountingHelper 是一个纯前端单页应用。Vite 提供开发服务并构建静态资源，React 负责桌面 dashboard，TypeScript 约束账目与模块接口。当前支持收支总览、全部账目两个视图。

React 状态保存当前账本和筛选条件；用户授权的 JSONL 文件保存正式账目。每次打开页面进入空工作台，通过选择文件恢复账本。首次直接添加记录时，先选择保存位置再写入文件。

## 模块职责

| 目录                     | 职责                                     | 主要入口                                                |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------- |
| `app`                    | 页面布局、导航、功能组合                 | `app.tsx`、`app-sidebar.tsx`                            |
| `components/ui`          | shadcn 基础组件源码                      | Card、Table、Input、Sidebar、Chart 等                   |
| `domain/ledger`          | 类型、类别、金额、日期、筛选、排序和统计 | `types.ts`、`validation.ts`、`money.ts`、`selectors.ts` |
| `infrastructure/storage` | 文件授权、读写、JSONL 校验与序列化       | `file-system.ts`、`jsonl.ts`                            |
| `features/ledger`        | 当前账本、异步状态、错误反馈             | `use-ledger.ts`                                         |
| `features/entries`       | 记账表单、最近记录与分页表格             | `entry-form.tsx`、`entry-table.tsx`                     |
| `features/statistics`    | 筛选表单、汇总和图表                     | `filter-popover.tsx`、`summary-cards.tsx`、`charts.tsx` |
| `features/theme`         | 当前页面的深浅色状态                     | `use-theme.ts`                                          |
| `styles`                 | 颜色、间距基础与全局主题                 | `globals.css`                                           |

依赖由外向内：`app` 组合 `features`；`features` 调用 `domain`、`infrastructure` 和 `components/ui`；`infrastructure` 复用 `domain` 的校验规则。`domain` 只依赖 TypeScript 和标准 JavaScript API，`components/ui` 保持通用。

## 一笔账目的保存

1. `EntryForm` 收集输入并检查类型、日期、类别和金额，保留用户填写的内容。
2. `useLedger.add` 创建唯一标识和录入时间，形成候选账目集合，检查合计范围。
3. 已打开账本通过 `saveLedgerFile` 核对文件快照；首次记账通过 `createLedgerFile` 选择保存位置。随后序列化完整账本，写入并关闭文件流。
4. 文件提交成功后更新 React 状态，汇总、图表和记录列表共同读取新状态，表单清空金额与备注。
5. 发生错误时保留原账本状态和表单输入，显示原因，允许用户处理后重试。

账本操作使用同一个忙碌标记，写入期间禁用相关操作。文件快照检查用于发现已发生的外部修改，写入流请求独占模式。当前使用场景为单窗口维护一份账本。

## 筛选与展示

筛选草稿在弹出面板内编辑，点击“应用筛选”后统一生效。日期和金额区间包含边界，各条件取交集。

总览卡片、两种图表和表格共用同一份筛选结果。收支分别累加，结余为收入减支出。最近记录按记账日期倒序，同日按录入时刻倒序；全部账目每页 10 笔。

## UI 与主题

交互控件、卡片、状态、表格和空状态均由 `components/ui` 中的 shadcn 组件组合。布局使用 Grid 和 Flex，桌面内容最小宽度为 1200px。基础组件来自官方 registry 的 `new-york` 风格，`components.json` 记录生成配置。

主题颜色集中在 CSS 变量中，深浅色分别配置卡片、边框、文字和图表色。每次打开页面使用系统颜色偏好，手动切换保留在 React 状态中；HTML 中的初始化脚本在 React 渲染前应用主题，减少闪烁。账目、筛选和主题都只在当前页面存续。

shadcn 源码的 `cn` 引用统一指向 `lib/utils.ts`，Toaster 的主题由应用传入，Sidebar 状态仅保留在当前页面。更新基础组件时保留这些本地适配。

## 本版取舍

- 账目规模较小，每次保存重写完整 JSONL 文件，优先保证格式和提交过程清楚。
- 通过标准浏览器文件选择器管理授权，刷新后由用户重新打开账本。
- 页面与业务状态使用 React Hook 管理，两种视图直接切换。
- 默认空工作台可直接录入首笔账目，验收数据作为独立 JSONL 文件放在 `examples/`。
