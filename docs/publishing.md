# 写作与发布手册

## 1. 进入项目

打开 PowerShell：

```powershell
cd D:\Projects\personal-blog
```

成功后，命令行左侧应显示 `D:\Projects\personal-blog`。

如果项目已经连接 GitHub，写作前先运行：

```powershell
git pull
```

## 2. 创建草稿

运行：

```powershell
npm.cmd run new-post
```

根据提示输入：

```text
文章标题：从零搭建我的私人博客
文章路径（支持多级，英文或拼音）：blog/astro/building-my-blog
```

路径中的每一级目录只使用：

- 小写英文字母
- 数字
- 单个连字符

成功后会创建：

```text
src/content/blog/blog/astro/building-my-blog/index.md
```

输入 `/` 或 Windows 的 `\` 都可以，程序会统一处理。路径层级也会成为文章 URL：

```text
/posts/blog/astro/building-my-blog/
```

如果不需要分组，仍可直接输入 `building-my-blog`，已有扁平文章无需迁移。

## 3. 填写文章信息

打开 `index.md`，顶部模板如下：

```yaml
---
title: "从零搭建我的私人博客"
description: ""
publishedAt: "2026-07-29"
updatedAt:
category: ""
tags: []
series:
draft: true
---
```

需要填写：

```yaml
description: "记录博客的技术选型、内容组织和部署过程。"
category: "技术实践"
tags: ["Astro", "博客"]
```

允许的分类：

- 技术实践
- 阅读笔记
- 生活观察
- 思考随笔

`updatedAt` 和 `series` 不需要时保持空白。

## 4. 添加正文和图片

在第二个 `---` 下方写 Markdown 正文。

文章专属图片放到同一目录：

```text
building-my-blog/
├─ index.md
└─ deploy-flow.png
```

正文使用相对路径：

```markdown
![部署流程](./deploy-flow.png)
```

图片替代文字不要留空，它会帮助搜索和无障碍阅读。

## 5. 本地预览

运行：

```powershell
npm.cmd run dev
```

打开终端显示的 `http://localhost:4321/`。

草稿默认不会出现在页面中。需要预览完整文章页面时，可以临时将：

```yaml
draft: false
```

预览结束后，如果还没有准备发布，请改回：

```yaml
draft: true
```

## 6. 推送草稿备份

草稿可以安全推送到 `main`，因为公开状态由 `draft` 控制：

```powershell
git add .
git commit -m "draft: 添加博客搭建文章"
git push
```

## 7. 发布文章

准备发布时，将：

```yaml
draft: true
```

改为：

```yaml
draft: false
```

执行完整检查：

```powershell
npm.cmd run verify
```

成功时最后会看到：

```text
内容检查通过。
构建结果检查通过。
```

然后提交：

```powershell
git add .
git commit -m "发布文章：从零搭建我的私人博客"
git push
```

Cloudflare Pages 会自动构建。进入 Cloudflare 项目的 Deployments 页面，状态显示 `Success` 后访问博客确认文章。

## 8. 修改已发布文章

- 小修改：直接修改正文并重新发布。
- 有实质内容更新：填写 `updatedAt: "YYYY-MM-DD"`。
- 可以修改标题，但不要修改文章目录名。
- 必须修改目录名时，按照 [文章地址重定向](redirects.md) 保留旧地址。
