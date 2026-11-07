# 博客配图

本目录保存 [blog.md](../blog.md) 使用的 11 张图片，均为 2026-11-07 的真实浏览器截图，文件格式为 JPEG。

总览、记账、筛选和 GitHub 记录已更新至提交 [`7ea3c9a`](https://github.com/155TuT/AccountingHelper/commit/7ea3c9a1a9402d7741e801b29bd9acb5074a235f)。两张设置页图片复用[PR #19 桌面验收](../pr19-verification.md)中的本地截图，对应同版设置实现，并由博客和验收文档共同引用。

## 图片与来源

| 文件                                                       | 博客位置与用途                                  | 来源                                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [product-overview-light.jpg](product-overview-light.jpg)   | 3.1：浅色总览、三笔账目、收支汇总和分类分析     | [GitHub Pages](https://155TuT.github.io/AccountingHelper/)，打开 `examples/acceptance.jsonl`                       |
| [product-entry-currency.jpg](product-entry-currency.jpg)   | 3.2：浮动记账卡片与六币种入口                   | 同一账本，输入 25.50 和“午餐”后展开币种面板，截图后取消                                                            |
| [product-filter.jpg](product-filter.jpg)                   | 3.3：类别与金额边界取交集                       | 同一账本，类别“饮食”，金额上下限均为 25.50，结果一笔                                                               |
| [product-overview-dark.jpg](product-overview-dark.jpg)     | 3.4：深色、折线走势和支出条形图                 | 同一账本，切换深色、折线图与分类支出条形图                                                                         |
| [settings-pr19-light.jpg](settings-pr19-light.jpg)         | 3.5：浅色全局设置，展示全部选项与保存、关闭按钮 | PR #19 本地桌面验收，紫色主题、人民币、空工作台                                                                    |
| [settings-pr19-dark.jpg](settings-pr19-dark.jpg)           | 3.5：深色全局设置与选中状态                     | 同次验收，保存深色设置后重新打开                                                                                   |
| [github-pull-requests.jpg](github-pull-requests.jpg)       | 4.2：已合并 PR 列表节选                         | [合并列表](https://github.com/155TuT/AccountingHelper/pulls?q=is%3Apr+is%3Amerged)，共 10 个已合并 PR              |
| [github-settings-merged.jpg](github-settings-merged.jpg)   | 4.2：设置模块作者、合并状态与关联任务           | [PR #19](https://github.com/155TuT/AccountingHelper/pull/19)，作者 Feion-Chen，合并提交 ad5566a，关联关闭 #18      |
| [github-commits.jpg](github-commits.jpg)                   | 4.2：设置实现、合并、修正与验收记录             | [main 提交历史](https://github.com/155TuT/AccountingHelper/commits/main/)，包含 4ded66b、ad5566a、8265f1c、7ea3c9a |
| [github-pages-deployment.jpg](github-pages-deployment.jpg) | 4.2：构建、部署成功与在线地址                   | [部署任务 42381589242](https://github.com/155TuT/AccountingHelper/actions/runs/42381589242)                        |
| [github-ci.jpg](github-ci.jpg)                             | 第七节：两项版本检查和七项模块测试              | [CI 任务 42381589269](https://github.com/155TuT/AccountingHelper/actions/runs/42381589269)，9 项任务全部成功       |

产品截图的数据来自独立验收文件。截图后刷新演示页面，恢复空工作台；示例文件保留原有三笔记录。截图内容与正文中的金额、主题、PR 数量和工作流版本对应。

## 开发截图清理

原有的 `integration-*`、`floating-entry-*`、`compact-*` 和 `workspace-tooltip.jpg` 共 8 张开发过程截图已移出当前目录。对应验收文字保留在 [testing.md](../testing.md)，历史图片可从 [fb189be 的资源目录](https://github.com/155TuT/AccountingHelper/tree/fb189be/docs/assets) 查阅。
