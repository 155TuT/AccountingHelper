# 参与开发

先阅读 [PRD](docs/prd.md)、[架构说明](docs/architecture.md) 和 [AI 协作约定](AGENTS.md)，按模块拆分工作。课程协作要求每位组员独立完成自己负责的模块，并保留真实提交记录。

## 开发流程

1. 使用 Node.js 24，执行 `npm ci` 安装依赖。
2. 按变更内容创建分支，执行 `npm run dev` 进行开发。
3. 将业务规则放入 `domain`，文件交互放入 `infrastructure`，在 `features` 中组合交互。
4. 为金额、筛选、格式和保存等数据行为补充必要测试。
5. 更新受影响的文档，执行 `npm test`、`npm run build`、`npm run format:check`，再提交变更。

## 文件与命名

- 文件和目录使用 `kebab-case`；React 组件和类型使用 `PascalCase`；函数和变量使用 `camelCase`。
- 一个文件围绕一个职责组织；测试以 `.test.ts` 命名，与被测模块同目录。
- 跨目录导入使用 `@/` 别名，同一模块内可用相对路径。
- 共享类型与规则从 `domain/ledger` 导出；业务组件直接导入具体文件，保持依赖关系清楚。
- TypeScript 使用严格模式。处理外部 JSON 时从 `unknown` 开始校验，金额始终使用整数分。

## 界面规范

前端展示和交互使用 shadcn 组件组合，布局交给语义容器、Grid 和 Flex。新基础组件通过 CLI 添加：

```bash
npx shadcn@latest add <component>
```

检查生成代码，将 `cn` 引用统一为 `@/lib/utils`。通用组件保留在 `components/ui`，业务文案与业务规则放在对应 `features`。颜色使用主题 token，并在深浅两种模式下检查输入、弹层、表格、空状态和图表。

标题、卡片和间距承担层级表达。正文使用直接的操作与结果说明，提示用于错误、授权或必要状态。保持键盘可操作，图标按钮提供中文可访问名称。

## 格式与依赖

Prettier 配置为两空格、单引号和省略分号；`.editorconfig` 统一编码与换行。新增依赖时说明用途，并同时提交 `package.json` 和 `package-lock.json`。生成产物与个人账本放在仓库外或已忽略的目录中。

当前 CI 执行格式、单元测试和生产构建。提交说明写清修改的模块、行为和验证结果；涉及存储字段或读写流程的变化，同时更新数据格式和验收文档。
