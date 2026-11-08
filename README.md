<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/favicon-dark.svg">
    <img src="./public/favicon.svg" alt="" width="36" height="36">
  </picture>
  AccountingHelper
</h1>

<p align="center">
  一个简洁的桌面个人记账本，账目保存在你选择的本地文件中。
</p>

<p align="center">
  <a href="https://155TuT.github.io/AccountingHelper/">在线使用</a>
  ·
  <a href="https://www.cnblogs.com/155TuT/p/23587485">作业博客</a>
  ·
  <a href="./LICENSE">MIT License</a>
</p>

## 项目简介

AccountingHelper 是 2026 秋福州大学软件工程现场编程作业，面向个人日常收支记录、账目回看和筛选统计。应用为纯前端桌面工作台，打开页面即可记账，通过浏览器文件选择器将账目保存为 JSONL 文件。

账目、筛选、展示币种、主题和文件句柄只保留在当前页面会话中。刷新或重新打开页面后，从空工作台开始，通过“打开账本”重新选择文件；仅类别目录在当前浏览器中跨刷新保留。

## 主要功能

- **多账本工作区**：新建或批量打开账本，按日期筛选，点击文件树账目定位表格记录。
- **快捷记账**：文件树悬停菜单和右下角“+”共用新建账目卡片，支持收入、支出、日期、类别和备注。
- **本地文件保存**：右上角集中提供打开、保存与另存为；格式错误指出行号，写入失败保留输入，外部修改提示重新打开。
- **账目筛选**：类别按收入、支出分组，支持整组选择、跨组多选和再次点击取消；组合日期与金额区间，在全部账目中按每页 10 笔浏览。
- **收支统计**：默认展示每日收入、支出和截至当天的累计结余，点击对应汇总卡片单独查看，再点一次恢复全部；支持柱状图和平滑折线图。分类收支展示金额、占比和笔数，支持切换图表类型。
- **多币种**：支持人民币、美元、欧元、日元、港币和英镑；统计按参考汇率换算，账本和文件树保留原币金额。
- **类别管理**：在本地新增、重命名或删除类别，历史账目的类别仍可查看和筛选。
- **主题与设置**：深浅色跟随系统初始偏好，可手动切换；页面品牌图标和浏览器标签页图标同步切换，README 品牌图标也适配深浅色。提供六套主题色、展示币种和默认保存目录设置。

## 技术栈

| 层级     | 技术                              |
| -------- | --------------------------------- |
| 前端     | React 19、TypeScript、Vite 7      |
| 界面     | Tailwind CSS 4、shadcn/ui、Lucide |
| 图表     | shadcn Chart、Recharts            |
| 数据     | JSONL、File System Access API     |
| 类别目录 | 浏览器 `localStorage`             |
| 验证     | Vitest、TypeScript、Prettier      |
| 部署     | GitHub Actions、GitHub Pages      |

## 目录结构

```text
AccountingHelper/
├─ src/
│  ├─ app/                     # 页面组装、桌面布局和导航
│  ├─ components/              # 通用组件组合
│  │  └─ ui/                   # shadcn 基础组件
│  ├─ domain/
│  │  ├─ currency/             # 币种、参考汇率和展示换算
│  │  └─ ledger/               # 类型、校验、金额、筛选和统计
│  ├─ features/                # 记账、工作区、类别、统计与设置
│  ├─ infrastructure/storage/  # 文件接口、JSONL 与类别存储
│  ├─ hooks/                   # 通用 Hook
│  ├─ lib/                     # 样式工具
│  └─ styles/                  # 主题 token 和全局样式
├─ public/                     # 品牌图标
├─ docs/                       # 需求、架构、格式和验收说明
├─ examples/                   # 周、月生活案例账本
├─ test/                       # 跨模块验收与异常测试
└─ .github/workflows/           # CI 与 GitHub Pages 部署
```

业务规则放在 `domain`，文件接口放在 `infrastructure`，交互流程放在 `features`，页面通过 `app` 组装。模块测试与被测模块同目录。

## 本地运行

### 环境要求

- Node.js 22.12+，推荐使用 Node.js 24。
- npm。
- 支持 File System Access API 的桌面版 Chrome 或 Edge，通过 localhost 或 HTTPS 访问；建议窗口宽度至少为 1280px。

### 启动步骤

```bash
git clone https://github.com/155TuT/AccountingHelper.git
cd AccountingHelper
npm ci
npm run dev
```

在浏览器中打开终端显示的地址，通常为 `http://127.0.0.1:5173`。

### 常用命令

| 命令                   | 说明                          |
| ---------------------- | ----------------------------- |
| `npm run dev`          | 本地开发与热更新              |
| `npm run build`        | TypeScript 检查并生成 `dist/` |
| `npm run preview`      | 本地预览生产构建              |
| `npm run typecheck`    | 检查 TypeScript 类型          |
| `npm test`             | 执行业务规则、验收与存储测试  |
| `npm run test:watch`   | 开发时持续运行测试            |
| `npm run format`       | 使用 Prettier 统一格式        |
| `npm run format:check` | 检查格式                      |

## 使用 AccountingHelper 管理账本

1. 打开页面后，点击右下角“+”填写第一笔账目；也可悬停或用 Tab 聚焦左侧“工作区”，新建账本或批量打开 `.jsonl` 文件。新建账本先创建空会话，首次保存时再选择文件位置。
2. 右上角按“打开 / 保存 / 另存为”集中提供文件操作：打开可批量选择账本；保存写回当前文件，首次保存时选择位置；另存为选择新文件。悬停或聚焦文件树账本行，也可保存、新建账目或关闭账本；“新建账目”会选中该账本并打开与右下角“+”相同的卡片，关闭仅将账本移出工作区。
3. 在卡片中选择收支类型、币种、金额、类别和日期，按需填写备注。日期、类别和币种面板互斥，选择后收起；类别可用方向键与回车选择，Esc 优先关闭当前选择面板。
4. 点击卡片左上角“✓”或按 Enter 保存，首次保存时授权文件位置。文件写入完成后，记录、统计和图表同步更新，卡片关闭；保存失败或取消文件选择时保留输入。右上角“×”或 Esc 可取消记账。
5. 点击账本切换，点击日期筛选当天，点击账目定位主表格记录。使用“筛选账目”组合日期、类别和金额条件：一级收入、支出可全选或取消该组，二级类别可多选，再次点击取消；点击“应用筛选”生效，未选类别表示不限。在“全部账目”中分页查看。
6. 总览依次显示收支走势、三张汇总卡片和分类分析。在“收支走势”右上角切换柱状图或折线图，点击“总收入 / 总支出 / 收支结余”卡片单独查看对应走势，再次点击恢复全部。结余按当前筛选结果逐日累计，表示截至当天的累计收入减累计支出，末日数值与汇总结余一致。在分类卡片右上角切换环形图或条形图；环形图距标题的位置固定，类别列表向下延伸。在表单“管理类别”中维护本地类别。
7. 点击侧栏底部左侧按钮切换深浅色，右侧按钮打开全局设置。可选择展示币种、紫色/青色/蓝色/玫红/琥珀/绿色六套主题色、深浅模式和默认保存目录；点击“✓”后生效，关闭或点击遮罩放弃修改。

默认保存目录用于首次保存和另存为，仅在当前页面保留。页面默认保持空工作台，可通过“打开账本”选择以下案例：

| 案例                                              | 日期范围          | 笔数 | 收入（元） | 支出（元） | 结余（元） |
| ------------------------------------------------- | ----------------- | ---- | ---------- | ---------- | ---------- |
| [校园一周](examples/campus-week-2026-10-26.jsonl) | 2026-10-26～11-01 | 39   | 688.00     | 451.60     | 236.40     |
| [城市生活一月](examples/city-month-2026-10.jsonl) | 2026-10-01～10-31 | 154  | 9,280.00   | 5,897.30   | 3,382.70   |

两份账本均为独立的虚构人民币案例。周案例包含食堂三餐、打印、日用品、聚餐、生活费和家教收入；月案例包含租房、水电、通勤、买菜、假期出游、工资和兼职。记录带有具体备注与录入时间，结余表示期间收入减去支出。

## 数据约定

每个账本是 UTF-8 编码的 `.jsonl` 文件，每行一个账目对象：

<!-- prettier-ignore -->
```jsonl
{"id":"r001","type":"expense","date":"2026-11-07","amountCents":2550,"category":"饮食","note":"午餐","createdAt":"2026-11-07T14:00:00+08:00","currency":"CNY"}
```

- `type` 为 `income` 或 `expense`，`date` 为记账日期，`createdAt` 为带时区的录入时间。
- `amountCents` 保存原币金额的整数分，输入最多两位小数；六种币种统一采用 100 分 = 1 单位，包括日元。单笔和同币种合计须为安全整数。
- `currency` 保存记账币种；旧记录缺少该字段时按人民币读取。
- 展示换算使用内置演示参考汇率，每笔四舍五入到分后汇总；换算溢出时提示并保留原币记录。参考值不代表实时牌价。
- 打开文件先完成全部校验，再载入工作区；保存成功并关闭写入流后才更新界面。检测到外部修改时提示重新打开。

完整字段、读写约束及异常处理见 [JSONL 账本格式](docs/data-format.md)。

## 部署

仓库已配置 GitHub Pages 工作流。推送到 `main` 或手动触发 `.github/workflows/deploy-pages.yml` 后，GitHub Actions 会：

1. 使用 Node.js 24 执行 `npm ci`。
2. 运行格式检查、全部测试和 TypeScript 检查。
3. 按仓库名设置资源子路径并构建生产版本。
4. 将 `dist/` 发布到 [GitHub Pages](https://155TuT.github.io/AccountingHelper/)。

首次部署时，在 **Settings → Pages** 中将 Source 设为 **GitHub Actions**。本地复现子路径构建：

```bash
npm run build -- --base=/AccountingHelper/
npm run preview -- --base=/AccountingHelper/
```

也可将 `dist/` 部署到其他 HTTPS 静态站点，按站点路径设置 `--base`。独立 CI 在 Node.js 22.12 / 24 上检查格式与构建，并分别运行完整测试和模块测试。

## 反馈与贡献

- 功能问题可提交 [Issue](https://github.com/155TuT/AccountingHelper/issues)，说明浏览器版本、操作步骤和预期结果；示例账目请先移除个人信息。
- 开发前阅读 [参与开发](CONTRIBUTING.md) 和 [AI 协作约定](AGENTS.md)，按模块边界修改，并保留真实贡献记录。
- 修改后运行 `npm test`、`npm run build`、`npm run format:check` 和 `git diff --check`；界面变更检查桌面尺寸、空状态、键盘操作及深浅色。

相关文档：

| 文档                                    | 内容                                    |
| --------------------------------------- | --------------------------------------- |
| [产品需求](docs/prd.md)                 | 功能范围、选型与验收口径                |
| [架构说明](docs/architecture.md)        | 模块职责、数据流与设计取舍              |
| [JSONL 格式](docs/data-format.md)       | 字段约束、读写和异常处理                |
| [设置页验收](docs/pr19-verification.md) | PR #19 本地联调、原生目录选择与回归结果 |
| [验收与测试](docs/testing.md)           | 自动化覆盖、模块命令与桌面验收步骤      |
| [课程要求](docs/task-requirement.md)    | 作业要求与交付时间                      |

## 致谢

界面组件来自 [shadcn/ui](https://ui.shadcn.com/)，图表使用 [Recharts](https://recharts.org/)，图标使用 [Lucide](https://lucide.dev/)。本地文件读写参考 [File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)，账本格式遵循 [JSON Lines](https://jsonlines.org/)。

## License

本项目基于 [MIT License](./LICENSE) 开源。
