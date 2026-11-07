# AccountingHelper

一个简洁的桌面个人记账本。使用 React + TypeScript + Vite 构建，界面基于 shadcn/ui，账目保存在用户选择的 JSONL 文件中。

本项目为 2026 秋福州大学软件工程现场编程作业

## 快速开始

推荐 Node.js 24 LTS，最低版本为 22.12。使用 npm 安装锁定的依赖：

```bash
npm ci
npm run dev
```

在桌面版 Chrome 或 Edge 中打开终端显示的地址，通常为 `http://127.0.0.1:5173`。界面按桌面使用设计，建议窗口宽度至少为 1280px。

## 使用

打开页面即可使用空工作台。直接填写第一笔账目并点击“添加记录”，浏览器会让你选择账本保存位置；也可以先新建或打开已有账本。

1. 点击“新建账本”选择保存位置，或点击“打开账本”选择已有 `.jsonl` 文件。
2. 在“记一笔”中选择收支类型，填写金额、类别和日期，按需添加备注。点击类别旁的“管理类别”可新增、重命名或删除类别。
3. 点击“添加记录”。文件写入完成后，记录、统计和图表同步更新。
4. 使用“筛选账目”组合日期、类别和金额条件；“全部账目”按每页 10 笔显示。
5. 在“收支走势”右上角切换柱状图或折线图，在“分类支出”和“分类收入”右上角切换环形图或条形图。
6. 点击侧栏的主题按钮切换深浅色。刷新或重新打开页面后，通过“打开账本”重新选择文件。

文件读写通过浏览器的 File System Access API 完成，需要用户授权以及 localhost 或 HTTPS 环境。账目持久保存在所选 JSONL 文件中；本地类别列表保存在浏览器 `localStorage`，不写入账本文件。页面会话结束后清空账目、筛选和主题状态，下次打开从空工作台开始，类别列表继续保留。

## 当前功能

- 收入与支出录入，金额以整数分保存和计算。
- 收支类别支持本地新增、重命名、删除和筛选，目录保存在当前浏览器。
- JSONL 新建、打开、保存与另存为，错误提示精确到行。
- 最近 10 笔记录、全部账目分页、日期与金额区间及类别组合筛选。
- 总收入、总支出、结余和每日收支走势。分类支出与分类收入按金额降序展示各类别的金额、占比和笔数，随筛选更新。
- 深浅色主题，打开页面时跟随系统偏好，可在当前页面切换。
- 写入失败时保留表单；检测到文件被外部修改时提示重新打开。

## 项目结构

```text
src/
├── app/                     # 页面组装、桌面导航
├── components/              # 通用组件组合（日期选择器等）
│   └── ui/                  # shadcn 基础组件
├── domain/ledger/           # 账目类型、校验、金额、筛选与统计
├── features/
│   ├── categories/          # 本地类别目录与管理弹层
│   ├── entries/             # 记账表单、账目表格
│   ├── ledger/              # 账本会话与操作状态
│   ├── statistics/          # 筛选、汇总卡片、图表
│   └── theme/               # 当前页面的主题切换
├── infrastructure/storage/ # 浏览器文件接口、JSONL 编解码、类别本地存储
├── hooks/                   # shadcn 组件依赖的通用 Hook
├── lib/                     # 样式工具
└── styles/                  # 主题 token 和全局样式
docs/                        # 需求、架构、格式和验收说明
examples/                    # 可打开的 JSONL 验收账本
```

业务规则放在 `domain`，文件接口放在 `infrastructure`，交互流程放在 `features`，页面通过 `app` 组装。测试与被测模块同目录。

## 常用命令

| 命令                   | 用途                          |
| ---------------------- | ----------------------------- |
| `npm run dev`          | 本地开发与热更新              |
| `npm run build`        | TypeScript 检查并生成 `dist/` |
| `npm run preview`      | 本地预览生产构建              |
| `npm run typecheck`    | 检查 TypeScript 类型          |
| `npm test`             | 执行业务规则、验收与存储测试  |
| `npm run test:watch`   | 开发时持续运行测试            |
| `npm run format`       | 使用 Prettier 统一格式        |
| `npm run format:check` | 检查格式                      |

生产构建为静态资源。推送到 `main` 后，`.github/workflows/deploy-pages.yml` 检查代码并将 `dist/` 部署到 [GitHub Pages](https://155TuT.github.io/AccountingHelper/)，也可在 Actions 中手动触发。仓库 `Settings → Pages → Source` 需选择 `GitHub Actions`。

Pages 工作流按仓库名设置资源子路径。本地复现部署构建可运行 `npm run build -- --base=/AccountingHelper/`，再运行 `npm run preview -- --base=/AccountingHelper/`；部署到其他 HTTPS 静态站点时，按站点路径设置 `--base`。

## 文档

| 文档                                 | 内容                                  |
| ------------------------------------ | ------------------------------------- |
| [产品需求](docs/prd.md)              | 功能范围、选型与验收口径              |
| [架构说明](docs/architecture.md)     | 模块职责、数据流与设计取舍            |
| [JSONL 格式](docs/data-format.md)    | 字段约束、读写和异常处理              |
| [验收与测试](docs/testing.md)        | 自动化覆盖、桌面验收步骤              |
| [参与开发](CONTRIBUTING.md)          | 命名、组件、依赖和提交约定            |
| [AI 协作约定](AGENTS.md)             | AI 工作范围、模块规范、验证与贡献记录 |
| [课程要求](docs/task-requirement.md) | 作业要求与交付时间                    |

UI 组件来自 [shadcn/ui](https://ui.shadcn.com/docs/installation/vite)，图表使用其 Chart 组件与 Recharts。文件接口参考 [File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)，格式遵循 [JSON Lines](https://jsonlines.org/)。
