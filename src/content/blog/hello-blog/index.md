---
title: "你好，博客"
description: "这是一篇随项目提供的草稿，用来熟悉写作和发布流程。"
publishedAt: 2026-07-29
updatedAt:
category: "思考随笔"
tags: ["博客"]
series:
draft: true
---

这是第一篇草稿。

你可以修改它，也可以运行 `npm run new-post` 创建自己的文章。草稿会保存在 Git 仓库中，但不会出现在正式博客里。

## 先填写文章信息

在文档顶部填写摘要、分类和标签。发布日期会由创建命令自动生成。

## 再开始写正文

正文使用普通 Markdown。文章配图与 `index.md` 放在同一个目录，并通过相对路径引用。

### 本地预览

运行：

```powershell
npm.cmd run dev
```

## 准备正式发布

将 `draft` 改为 `false`，然后运行：

```powershell
npm.cmd run verify
```

检查通过后再提交并推送。
