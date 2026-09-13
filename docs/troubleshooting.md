# 常见问题处理

## PowerShell 不允许执行 npm.ps1

现象：

```text
无法加载文件 npm.ps1，因为在此系统上禁止运行脚本
```

处理：使用 `npm.cmd`：

```powershell
npm.cmd install
npm.cmd run dev
```

不需要修改 Windows 执行策略。

## Node.js 版本不符合要求

检查：

```powershell
node --version
```

本项目要求 Node.js 22.12 或更高的受支持版本。修改 Node 版本后重新运行：

```powershell
npm.cmd install
```

## 端口 4321 被占用

Astro 通常会自动选择另一个端口。请使用终端实际显示的 Local 地址。

也可以指定端口：

```powershell
npm.cmd run dev -- --port 4322
```

## description 或 category 不能为空

打开错误中指出的 `index.md`，填写 Frontmatter：

```yaml
description: "一到两句话的文章摘要。"
category: "技术实践"
```

## 日期格式错误

正确格式：

```yaml
publishedAt: "2026-07-29"
updatedAt: "2026-08-03"
```

不用斜杠，也不要写中文年月日。

## 图片或附件不存在

错误会显示找不到的相对路径。检查：

- 文件是否与 `index.md` 放在预期目录。
- 文件名大小写是否一致。
- 扩展名是否正确。
- Markdown 是否使用 `./image.png` 形式。

## 草稿没有出现在博客里

这是正常行为。草稿的：

```yaml
draft: true
```

不会生成公开页面。准备发布时改为 `false`。

## 正式文章仍没有出现

依次检查：

1. `draft` 是否为 `false`。
2. `npm.cmd run verify` 是否通过。
3. Git 是否已提交并推送。
4. Cloudflare 最新部署是否为 `Success`。

## npm install 失败

先确认网络正常，然后运行：

```powershell
npm.cmd cache verify
npm.cmd install
```

不要随意删除 `package-lock.json`，它用于保持本地和 Cloudflare 依赖一致。

## Cloudflare 构建失败

进入：

```text
Cloudflare Dashboard
→ Workers & Pages
→ 你的 Pages 项目
→ Deployments
→ 失败的部署
```

展开 Build logs，先寻找第一条 `ERROR`。

常见检查：

- Build command 是否为 `npm run build`。
- Build output directory 是否为 `dist`。
- Node 版本是否与项目一致。
- GitHub 中是否已经包含最新 `package-lock.json`。

构建失败不会替换上一版成功站点。修复后重新推送即可。

## 恢复误删文章

查看历史：

```powershell
git log --oneline -- src/content/blog
```

恢复操作可能覆盖当前文件。如果不熟悉 Git，请先停止操作，把错误现象和 `git status --short` 的结果交给 Codex 分析。
