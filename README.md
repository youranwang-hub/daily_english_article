# CET-6 Daily Reader

一个无需常驻电脑的 CET-6 每日精读产品。网站部署为静态页面；GitHub Actions 每天生成文章、更新归档。

## 已包含的体验

- 500–700 词的六级难度英文阅读
- 10 个核心词汇、搭配与例句
- 3 个长难句的主干和结构拆解
- 4 道练习题及答案解析
- 可在手机上阅读的历史文章页

## 上线步骤

1. 新建 GitHub 仓库，把本目录推送到 `main` 分支。
2. 在仓库 **Settings → Pages** 中，将部署源设为 **GitHub Actions**。
3. 在 **Settings → Secrets and variables → Actions** 添加以下 Secret：

   | 名称 | 用途 |
   | --- | --- |
   | `DEEPSEEK_API_KEY` | 生成每日文章（默认，推荐） |

4. 在 Actions 页面手动运行一次 **Publish daily CET-6 reader**，确认网页生成和发布正常。

工作流设为每天北京时间 07:30（UTC 23:30）运行。GitHub 的定时任务存在少量延迟是正常现象。生成器检测到 `DEEPSEEK_API_KEY` 后会默认使用 `deepseek-v4-flash`；如需改回 OpenAI，只需设置 `OPENAI_API_KEY` 并在仓库 Variables 添加 `AI_PROVIDER=openai`。

## 本地预览

用任意静态服务器预览网站（例如 VS Code 的 Live Server）。生成脚本需要 Node.js 20+，并在环境变量中提供 `DEEPSEEK_API_KEY`：

```powershell
npm run generate
```

## 内容与版权

生成器要求模型写原创的“外刊风格”文章，并只记录公开参考资料链接，不转载完整新闻或付费文章。上线后仍建议每周抽查几篇，确保事实、语气和难度符合你的备考需要。
