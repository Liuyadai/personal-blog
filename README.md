# 所见所得

一个使用 Astro、Markdown、GitHub 和 Cloudflare Pages 构建的个人博客。文章和图片保存在本地文件与 Git 历史中，不依赖数据库。

## 第一次运行

需要：

- Node.js 22.12 或更高的受支持版本（当前项目使用 22.14）
- Git
- VS Code 或其他文本编辑器

在 PowerShell 中执行：

```powershell
cd D:\Projects\personal-blog
npm.cmd install
npm.cmd run dev
```

看到类似以下内容表示启动成功：

```text
Local http://localhost:4321/
```

按住 `Ctrl` 点击地址，或将地址复制到浏览器。

停止本地博客时，在终端按 `Ctrl+C`。

> Windows PowerShell 如果提示不能运行 `npm.ps1`，请使用本项目文档中的 `npm.cmd`，不需要修改系统执行策略。

## 最常用命令

```powershell
npm.cmd run new-post        # 创建文章模板
npm.cmd run dev             # 本地预览
npm.cmd run verify          # 发布前完整检查
npm.cmd run build           # 生成静态站点
```

## 日常写作

详细步骤见：

- [写作与发布](docs/publishing.md)
- [常见问题处理](docs/troubleshooting.md)
- [Cloudflare 部署](docs/cloudflare-deployment.md)
- [修改文章地址](docs/redirects.md)

## 主要目录

```text
src/content/blog/       文章与文章专属图片
src/assets/images/      头像、Logo 等站点公共图片
src/pages/              页面入口
src/components/         页面组件
src/styles/             全局样式
scripts/                创建文章和发布检查脚本
docs/                   使用说明
```

## 发布状态

文章顶部的：

```yaml
draft: true
```

表示草稿。草稿可以提交到 GitHub 备份，但不会出现在首页、搜索、RSS 或 sitemap。

准备发布时改为：

```yaml
draft: false
```

然后运行 `npm.cmd run verify`，检查通过后再提交和推送。
