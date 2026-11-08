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
| `features/ledger`        | 当前账本、默认目录、异步状态与错误反馈           | `workspace.ts`、`use-ledger.ts`、`ledger-tree.tsx`                       |
| `features/entries`       | 记账表单、最近记录与分页表格                     | `entry-composer.tsx`、`entry-form.tsx`、`entry-table.tsx`                |
| `features/settings`      | 全局币种、主题和默认目录草稿                     | `settings-dialog.tsx`                                                    |
| `features/statistics`    | 筛选表单、汇总和图表                             | `filter-popover.tsx`、`summary-cards.tsx`、`charts.tsx`                  |
| `features/theme`         | 当前页面的主题色与深浅模式                       | `use-theme.ts`                                                           |
| `styles`                 | 颜色、间距基础与全局主题                         | `globals.css`                                                            |

依赖由外向内：`app` 组合 `features`；`features` 调用 `domain`、`infrastructure` 和 `components/ui`；`infrastructure` 复用 `domain` 的校验规则。`domain` 只依赖 TypeScript 和标准 JavaScript API，`components/ui` 保持通用。

## 一笔账目的保存

1. `EntryForm` 收集输入并检查类型、日期、类别和金额，保留用户填写的内容。
2. `workspace.add` 捕获目标账本和币种，创建唯一标识、录入时间与候选账目集合；JSONL 校验同币种合计范围。
3. 已保存账本通过 `saveLedgerFile` 核对文件快照；未保存账本通过 `createLedgerFile` 选择保存位置。随后序列化完整账本，写入并关闭文件流。
4. 文件提交成功后更新对应账本的 React 状态，汇总、图表、文件树和表格共同读取新状态，表单关闭并清空金额与备注。
5. 发生错误时保留原账本状态和表单输入，显示原因，允许用户处理后重试。

账本操作使用同一个忙碌标记，写入期间禁用相关操作并保证写入串行。文件快照检查用于发现已发生的外部修改，写入流请求独占模式。多账本工作区在文件树中新建、打开、切换和保存；右上角文件操作区依次提供打开、保存和另存为，复用 `navigation.open`、`ledger.save` 和 `ledger.saveAs`，统一按忙碌状态和浏览器文件能力禁用。选择账目时同步选择它所属的账本，账目标识只要求在单个文件内唯一。控制器通过 `useSyncExternalStore` 通知 React，并可注入存储接口进行事务回归测试。批量打开全部校验后一次发布；按文件句柄身份去重，关闭最后一本回到空工作台。

## 类别目录

默认类别只用于首次初始化。用户在“管理类别”弹层中按收支类型新增、重命名或删除类别，每次修改都同步写入 `localStorage`。类别名称在全部收支中唯一，每种收支至少保留一个类别。

账目中的类别始终以字符串保存，打开账本时不依赖当前浏览器的类别目录，因此自定义类别账本可跨设备读取。历史账目使用的类别即使已从目录删除，仍会合并到筛选选项；重命名或删除类别不重写历史账目。

## 筛选与展示

筛选草稿在弹出面板内编辑，点击“应用筛选”后统一生效。日期和金额区间包含边界，各条件取交集。

原始账目只用于文件写入和文件树。统计展示先调用 `projectEntries` 换算，再筛选和汇总；筛选金额上下界随币种转换并保持可解析格式。展示溢出时保留原币表格并提示，用户仍可保存或切换币种。

总览卡片、收支走势、分类收支图表和表格共用同一份筛选结果。收支分别累加，结余为收入减支出。`categoryBreakdown` 按收支类型汇总分类金额和笔数，分类占比分别以当前筛选下的收入或支出合计为分母。

收支走势可切换柱状图与折线图，分类收入与分类支出可分别切换环形图与条形图。图表样式只保留在当前组件会话中。最近记录按记账日期倒序，同日按录入时刻倒序；全部账目每页 10 笔。

## UI 与主题

交互控件、卡片、状态、表格和空状态均由 `components/ui` 中的 shadcn 组件组合。侧栏操作在悬停和键盘聚焦时显示功能提示。`EntryComposer` 通过非模态 Popover 将单张 `EntryForm` 卡片锚定到右下角按钮；保存期间禁止关闭，失败保留输入。布局使用 Grid 和 Flex，桌面内容最小宽度为 1200px。基础组件来自官方 registry 的 `new-york` 风格，`components.json` 记录生成配置。

文件树“新建账目”和右下角“+”共用 `App` 的卡片开关；文件树入口同时传入目标账本 ID，切换后复用该账本的表单与保存流程。侧栏品牌区底部和设置区顶部使用 `border-sidebar-border` 主题 token。

品牌图标使用 `public/favicon.svg` 与 `public/favicon-dark.svg`。HTML 初始化脚本按系统偏好选择标签页图标，`useTheme` 在页面主题变更时同步更新；侧栏读取同一主题状态。资源路径兼容 Vite `BASE_URL` 子路径部署。

主色由独立于币种的全局主题色设置决定，提供紫色、青色、蓝色、玫红、琥珀和绿色六套深浅色配色。图标使用 `components.json` 中配置的 Lucide 图标库；按钮、提示、卡片和弹层统一组合 shadcn 基础组件。主题颜色集中在 CSS 变量中，深浅色分别配置卡片、边框、文字和图表色。每次打开页面使用系统颜色偏好，手动切换保留在 React 状态中；HTML 中的初始化脚本在 React 渲染前应用深浅模式，减少闪烁。全局设置通过 Dialog 覆盖主页面，保存后一次性应用币种、主题色、深浅模式和默认目录。默认目录句柄仅保存在当前页面会话，并作为 `showSaveFilePicker` 的 `startIn`。账目、筛选、主题和目录都只在当前页面存续。

设置页每次打开创建独立草稿，关闭时丢弃；选择目录只返回候选句柄，保存设置时才提交。目录选择复用工作区忙碌状态，避免文件操作并发，取消保持原状态，权限错误在设置页内显示。目录仅作为保存对话框的起始位置，选择时申请只读访问，具体文件在保存时单独授权。

界面通过卡片、Tabs、表单标签、间距和按钮提示表达层级，币种菜单和图表省去重复说明。浮动卡片使用统一圆角和间距，顶部图标按钮保留可访问名称及键盘提交。

顶栏与新建卡片共用 `globals.css` 的 `--panel-padding` 和 `--panel-gap`，当前均为 12px；`--toolbar-height` 由控件高度和 padding 推导，侧栏标识区使用同一高度。日期使用 shadcn Calendar 与 Popover，类别使用非模态 DropdownMenu 的单选菜单；`useExclusivePopup` 管理同一表单中的弹层互斥，关闭旧弹层时不会清除新打开的弹层。新建卡片的选择面板向左展开，保持表单控件可见；筛选面板复用日期和类别选择器。

shadcn 源码的 `cn` 引用统一指向 `lib/utils.ts`，Toaster 的主题由应用传入，Sidebar 状态仅保留在当前页面。更新基础组件时保留这些本地适配。

## 本版取舍

- 账目规模较小，每次保存重写完整 JSONL 文件，优先保证格式和提交过程清楚。
- 通过标准浏览器文件选择器管理授权，刷新后由用户重新打开账本。
- 页面与业务状态使用 React Hook 管理，多账本工作区与两种视图直接切换。
- 主内容区使用完整宽度展示账本；点击文件树中的账目定位并高亮表格对应页，右下角浮动卡片用于新建账目。
- 默认空工作台可直接录入首笔账目，周、月生活案例作为独立 JSONL 文件放在 `examples/`；三笔 PRD 验收数据保留在 `test/fixtures/`。
