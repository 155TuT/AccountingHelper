---
负责人：郑嘉文，周恪玄
---

# 架构说明

## 运行方式

AccountingHelper 是一个纯前端单页应用。Vite 提供开发服务并构建静态资源，React 负责桌面 dashboard，TypeScript 约束账目与模块接口。当前支持收支总览、全部账目两个视图。

React 状态保存多个账本会话、当前账本及账目选择和筛选条件；用户授权的 JSONL 文件保存正式账目。每次打开页面进入空工作台，通过选择文件恢复账本。首次直接添加记录时，先选择保存位置再写入文件。本地类别目录单独保存在浏览器 `localStorage`，跨刷新保留，不写入账本文件。

## 模块职责

| 目录                     | 职责                                             | 主要入口                                                                 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------ |
| `app`                    | 页面布局、导航、功能组合                         | `app.tsx`、`app-sidebar.tsx`                                             |
| `components/ui`          | shadcn 基础组件源码                              | Card、Table、Input、Sidebar、Chart 等                                    |
| `domain/ledger`          | 类型、默认类别、金额、日期、筛选、排序和统计     | `types.ts`、`categories.ts`、`validation.ts`、`money.ts`、`selectors.ts` |
| `infrastructure/storage` | 文件授权、读写、JSONL 校验与序列化、类别本地存储 | `file-system.ts`、`jsonl.ts`、`category-storage.ts`                      |
| `features/categories`    | 本地类别目录、增删改查与管理弹层                 | `use-categories.ts`、`category-manager-dialog.tsx`                       |
| `domain/currency`        | 六种币种、参考换算、展示投影与筛选阈值换算       | `currencies.ts`、`projection.ts`                                         |
| `features/currency`      | 全局币种和选择器                                 | `use-currency.ts`、`currency-picker.tsx`                                 |
| `features/ledger`        | 当前账本、异步状态、错误反馈                     | `workspace.ts`、`use-ledger.ts`、`ledger-tree.tsx`                       |
| `features/entries`       | 记账表单、最近记录与分页表格                     | `entry-form.tsx`、`entry-table.tsx`                                      |
| `features/statistics`    | 筛选表单、汇总和图表                             | `filter-popover.tsx`、`summary-cards.tsx`、`charts.tsx`                  |
| `features/theme`         | 当前页面的深浅色状态                             | `use-theme.ts`                                                           |
| `styles`                 | 颜色、间距基础与全局主题                         | `globals.css`                                                            |

依赖由外向内：`app` 组合 `features`；`features` 调用 `domain`、`infrastructure` 和 `components/ui`；`infrastructure` 复用 `domain` 的校验规则。`domain` 只依赖 TypeScript 和标准 JavaScript API，`components/ui` 保持通用。

## 一笔账目的保存

1. `EntryForm` 收集输入并检查类型、日期、类别和金额，保留用户填写的内容。
2. `workspace.add` 捕获目标账本和币种，创建唯一标识、录入时间与候选账目集合；JSONL 校验同币种合计范围。
3. 已保存账本通过 `saveLedgerFile` 核对文件快照；未保存账本通过 `createLedgerFile` 选择保存位置。随后序列化完整账本，写入并关闭文件流。
4. 文件提交成功后更新对应账本的 React 状态，汇总、图表、文件树和明细共同读取新状态，表单关闭并清空金额与备注。
5. 发生错误时保留原账本状态和表单输入，显示原因，允许用户处理后重试。

账本操作使用同一个忙碌标记，写入期间禁用相关操作并保证写入串行。文件快照检查用于发现已发生的外部修改，写入流请求独占模式。多账本工作区在文件树中新建、打开、切换、保存与另存为；选择账目时同步选择它所属的账本，账目标识只要求在单个文件内唯一。控制器通过 `useSyncExternalStore` 通知 React，并可注入存储接口进行事务回归测试。批量打开全部校验后一次发布；按文件句柄身份去重，关闭最后一本回到空工作台。

## 类别目录

默认类别只用于首次初始化。用户在“管理类别”弹层中按收支类型新增、重命名或删除类别，每次修改都同步写入 `localStorage`。类别名称在全部收支中唯一，每种收支至少保留一个类别。

账目中的类别始终以字符串保存，打开账本时不依赖当前浏览器的类别目录，因此自定义类别账本可跨设备读取。历史账目使用的类别即使已从目录删除，仍会合并到筛选选项；重命名或删除类别不重写历史账目。

## 筛选与展示

筛选草稿在弹出面板内编辑，点击“应用筛选”后统一生效。日期和金额区间包含边界，各条件取交集。

原始账目只用于文件写入、文件树和明细。统计展示先调用 `projectEntries` 换算，再筛选和汇总；筛选金额上下界随币种转换并保持可解析格式。展示溢出时保留原币表格并提示，用户仍可保存或切换币种。

总览卡片、收支走势、分类收支图表和表格共用同一份筛选结果。收支分别累加，结余为收入减支出。`categoryBreakdown` 按收支类型汇总分类金额和笔数，分类占比分别以当前筛选下的收入或支出合计为分母。

收支走势可切换柱状图与折线图，分类收入与分类支出可分别切换环形图与条形图。图表样式只保留在当前组件会话中。最近记录按记账日期倒序，同日按录入时刻倒序；全部账目每页 10 笔。

## UI 与主题

交互控件、卡片、状态、表格和空状态均由 `components/ui` 中的 shadcn 组件组合。侧栏操作支持悬停和键盘聚焦，明细显示原币，记账抽屉在保存期间禁止关闭，失败保留输入。布局使用 Grid 和 Flex，桌面内容最小宽度为 1200px。基础组件来自官方 registry 的 `new-york` 风格，`components.json` 记录生成配置。

主题颜色集中在 CSS 变量中，深浅色分别配置卡片、边框、文字和图表色。每次打开页面使用系统颜色偏好，手动切换保留在 React 状态中；HTML 中的初始化脚本在 React 渲染前应用主题，减少闪烁。账目、筛选和主题都只在当前页面存续。

shadcn 源码的 `cn` 引用统一指向 `lib/utils.ts`，Toaster 的主题由应用传入，Sidebar 状态仅保留在当前页面。更新基础组件时保留这些本地适配。

## 本版取舍

- 账目规模较小，每次保存重写完整 JSONL 文件，优先保证格式和提交过程清楚。
- 通过标准浏览器文件选择器管理授权，刷新后由用户重新打开账本。
- 页面与业务状态使用 React Hook 管理，多账本工作区与两种视图直接切换。
- 主内容区左右分栏，账本页与选中账目明细并行展示；“记一笔”通过右侧抽屉打开。
- 默认空工作台可直接录入首笔账目，验收数据作为独立 JSONL 文件放在 `examples/`。
