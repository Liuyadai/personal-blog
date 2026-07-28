# 私人博客设计方案

- 日期：2026-07-28
- 状态：已确认
- 项目目录：`D:\Projects\personal-blog`
- 技术路线：Astro + Markdown/MDX + GitHub + Cloudflare Pages

## 1. 背景与目标

博客用于长期沉淀技术实践、阅读笔记、生活观察和思考随笔。公开访问，但不以 SEO、流量运营或商业化为主要目标。

核心目标：

1. 文章和图片以普通文件形式归个人所有，可长期保存和迁移。
2. 日常使用本地 Markdown 写作，通过 Git 保存历史并发布。
3. 第一阶段低成本、低维护上线，后续保留页面和功能定制空间。
4. 通过时间线快速回顾历史写作，并提供温和的持续写作提醒。
5. 面向没有 Astro 和 Cloudflare 使用经验的维护者，提供完整的新手文档。

非目标：

- 不建设登录、用户系统、数据库或网页 CMS。
- 不建设评论、点赞、积分、连续签到或断更警告。
- 不以复杂动画、大量配图或内容运营功能为重点。
- 不在第一阶段解决私密文章访问控制。

## 2. 核心设计决策

采用 Astro 构建纯静态站点：

```text
本地 Markdown 与图片
        ↓
      Git 提交
        ↓
 GitHub 私有仓库
        ↓ 自动构建
 Cloudflare Pages
        ↓
 pages.dev 地址或独立域名
```

选择该方案的原因：

- Markdown、图片和 Git 历史均可脱离框架独立保存。
- Astro Content Collections 可统一加载文章并校验元数据。
- 静态站点没有数据库和服务端运行时，维护面和故障面较小。
- Astro 支持逐步加入组件与自定义页面，兼顾长期可控和后续定制。
- Cloudflare Pages 可连接 GitHub，在推送后自动构建并提供分支预览。

运行环境固定使用 Node.js 24 LTS，并通过 `.node-version`、`package.json` 的 `engines` 字段和依赖锁文件保持本地与云端一致。

## 3. 项目结构

```text
personal-blog/
├─ src/
│  ├─ content/
│  │  └─ blog/
│  │     └─ building-my-blog/
│  │        ├─ index.md
│  │        ├─ architecture.png
│  │        └─ deploy-flow.png
│  ├─ assets/
│  │  └─ images/
│  │     ├─ avatar.png
│  │     ├─ logo.svg
│  │     └─ default-cover.jpg
│  ├─ components/
│  ├─ layouts/
│  └─ pages/
├─ public/
│  ├─ favicon.ico
│  └─ files/
├─ scripts/
├─ docs/
│  ├─ publishing.md
│  ├─ cloudflare-deployment.md
│  ├─ troubleshooting.md
│  └─ superpowers/specs/
├─ astro.config.mjs
├─ package.json
└─ README.md
```

图片存储规则：

- 文章专属图片与该文章的 `index.md` 放在同一目录，正文使用相对路径引用。
- 头像、Logo、默认封面等站点公共图片放在 `src/assets/images/`。
- 必须保持文件名和路径不变的文件放在 `public/`，包括 favicon、下载附件和站点验证文件。

普通文章优先使用 Markdown。只有确实需要嵌入交互组件时才使用 MDX。

## 4. 内容模型

每篇文章使用以下元数据：

```yaml
---
title: "从零搭建我的私人博客"
description: "记录博客的技术选型、内容模型与部署过程"
publishedAt: 2026-07-28
updatedAt:
category: "技术实践"
tags: ["Astro", "博客"]
series: "搭建个人博客"
draft: true
---
```

字段规则：

| 字段 | 要求 | 说明 |
|---|---|---|
| `title` | 必填 | 页面与列表标题 |
| `description` | 必填 | 一到两句话的文章摘要 |
| `publishedAt` | 必填 | `YYYY-MM-DD` 格式；创建模板时自动填入当天日期 |
| `updatedAt` | 可选 | 文章发布后有实质修订时填写 |
| `category` | 必填 | 单一主分类 |
| `tags` | 可为空 | 多个跨分类主题标签 |
| `series` | 可选 | 连续文章所属系列 |
| `draft` | 必填 | `true` 为草稿，`false` 为公开文章 |

初始分类控制在四个：

- 技术实践
- 阅读笔记
- 生活观察
- 思考随笔

分类不建立多层树。标签允许自由扩展，但显示时合并完全相同的值。

## 5. 草稿与发布状态

Git 分支与公开状态相互独立：

| 分支 | `draft` | 结果 |
|---|---:|---|
| `main` | `true` | 保存并备份到仓库，不进入任何公开输出 |
| `main` | `false` | 进入正式博客 |
| 非 `main` | 任意 | 仅生成 Cloudflare 分支预览 |

`draft: true` 的文章必须从以下输出中全部排除：

- 首页与归档
- 分类、标签与系列页面
- 全文搜索索引
- RSS
- sitemap
- 上一篇与下一篇导航
- “距上次发布”时间计算

新文章始终默认为 `draft: true`。作者准备发布时将其改为 `false` 后提交并推送。

## 6. URL 规则

文章使用稳定的语义地址：

```text
/posts/building-my-blog/
/categories/tech/
/tags/astro/
/series/building-my-blog/
/archive/
```

规则：

- 文章 URL 不包含日期。
- `slug` 默认取文章目录名，使用简短英文或拼音的 kebab-case。
- 修改标题不修改 `slug`。
- 必须修改 `slug` 时，在重定向配置中保留旧地址到新地址的永久跳转。
- 分类、标签和系列的显示名称可使用中文，URL 使用稳定的 ASCII 标识。

## 7. 页面与交互

### 7.1 首页

首页采用“数字笔记本 + 时间线”布局：

- 桌面端左侧展示头像、简介、主要导航和距上次发布的时间。
- 右侧按年月展示最近 20 篇已发布文章。
- 每项依次展示日期、标题、摘要和标签。
- 超过 20 篇后通过归档页查看完整历史。
- 移动端将左侧栏折叠为顶部菜单，时间线仍是页面主体。

“距上次发布”只展示客观时间，例如“上次记录：19 天前”。它是一句温和提醒，不提供连续签到、断更警告、排名或惩罚性措辞。

### 7.2 其他页面

- 文章页：正文、发布日期、更新时间、分类、标签；长文章自动显示目录。
- 归档页：按年份和月份展示全部已发布文章。
- 分类与标签页：提供主题浏览，不建立多级导航。
- 系列页：字段和路由保留；存在系列文章时自动生成。
- 搜索：静态全文搜索标题、摘要、标签和正文，不依赖服务器。
- 关于页：个人介绍、博客定位和联系方式。
- 404 页面：提供首页和搜索入口。
- RSS：输出全部已发布文章。

### 7.3 视觉原则

- 低饱和中性色、充足留白、文字优先。
- 支持浅色、深色和跟随系统模式。
- 不依赖文章封面；封面为可选内容。
- 不使用无限滚动，避免丢失时间位置感。
- 避免复杂动画；交互动效只用于状态提示和导航反馈。

## 8. 日常写作流程

项目提供：

```bash
npm run new-post
```

命令询问文章标题与目录名，创建独立文章目录，并生成以下模板：

```yaml
---
title: "文章标题"
description: ""
publishedAt: 2026-07-28
updatedAt:
category: ""
tags: []
series:
draft: true
---

从这里开始写正文。
```

标准流程：

```text
创建文章模板
→ 编写正文并添加配图
→ 本地预览
→ 推送草稿以备份
→ 将 draft 改为 false
→ 执行发布前验证
→ 提交并推送
→ Cloudflare Pages 自动发布
```

日常只需要理解以下命令：

```bash
npm install
npm run new-post
npm run dev
npm run verify
git add .
git commit -m "发布文章：文章标题"
git push
```

布局、依赖和构建配置等结构性改动使用独立分支，经 Cloudflare 预览地址确认后再合并。普通文章可以直接推送 `main`。

## 9. 自动验证

`npm run verify` 是唯一的发布前检查入口，依次完成：

1. Astro 与 TypeScript 静态检查。
2. Content Collections 元数据校验。
3. 自定义内容规则校验。
4. 本地图片存在性与站内链接检查。
5. 草稿过滤规则测试。
6. 静态站点完整构建。
7. 生成结果中的关键页面检查。

错误信息必须包含文章路径、错误字段和可执行的修复建议，例如：

```text
文章 building-my-blog 缺少 description。
请在 index.md 顶部的 Frontmatter 中填写一到两句话的摘要。
```

## 10. 部署与故障处理

### 10.1 Cloudflare Pages

- GitHub 仓库默认设为私有。
- Cloudflare Pages 通过 GitHub 集成读取仓库。
- `main` 分支用于正式环境，其他分支用于预览。
- Cloudflare 使用与本地一致的 Node.js 24 LTS。
- 正式域名从首次上线开始使用；更换托管平台时保持域名和 URL 不变。

### 10.2 故障处理

- 构建失败：不替换上一版线上站点；根据包含上下文的日志修复后重新推送。
- 误删或误改：通过 Git 历史恢复 Markdown 或图片。
- URL 变更：配置永久重定向，保留旧链接。
- 依赖升级故障：锁定依赖版本；升级使用独立分支和预览环境。
- Cloudflare 不可用：本地构建生成静态文件，部署到其他静态托管平台。
- GitHub 或账号风险：本地仓库为主副本，GitHub 为远程副本；第二 Git 远程镜像列为后续可选增强。

系统不使用数据库，因此无需数据库备份、迁移或运行时恢复。

## 11. 文档要求

项目必须长期维护以下文档：

- `README.md`：项目目的、环境要求和首次启动。
- `docs/publishing.md`：创建草稿、预览、校验和发布文章。
- `docs/cloudflare-deployment.md`：注册、连接 GitHub、配置构建、绑定域名和 HTTPS。
- `docs/troubleshooting.md`：元数据、图片、链接、依赖和 Cloudflare 构建错误。

部署文档以 Astro、TypeScript 和 Cloudflare 零基础读者为对象。每一步必须包含：

- 操作入口或完整命令。
- 预期看到的结果。
- 成功判断方法。
- 常见失败现象及处理方式。

## 12. 测试与验收

实现完成后必须通过：

1. `npm run new-post` 生成结构正确且默认为草稿的文章。
2. `draft: true` 的文章不进入任何公开输出。
3. 改为 `draft: false` 后，文章进入首页、归档、分类、搜索、RSS 和 sitemap。
4. 元数据缺失或日期错误时，验证失败并输出文章名称和修复建议。
5. 图片不存在或站内链接失效时，验证失败。
6. 首页展示最近 20 篇文章并正确计算距上次发布的时间。
7. 归档按年份、月份正确展示全部已发布文章。
8. 浅色、深色、桌面端和移动端布局可正常使用。
9. 不存在的 URL 显示自定义 404 页面。
10. 修改标题不改变 URL；旧 `slug` 可永久重定向到新地址。
11. `main` 推送触发正式发布，其他分支只生成预览。
12. 构建失败时，生产环境继续保留上一版。
13. 首页和文章页的 Lighthouse 性能与无障碍分数目标均不低于 90。

最终执行一次完整的新手流程演练：

```text
安装依赖
→ 创建草稿
→ 本地预览
→ 修复一次模拟的元数据错误
→ 发布文章
→ 推送 GitHub
→ 查看 Cloudflare 构建
→ 访问正式博客
```

## 13. 第一阶段交付范围

第一阶段只交付本设计中明确的静态博客、自动验证、GitHub/Cloudflare 部署能力和新手文档。

评论、访问统计、私密文章、网页 CMS、第二 Git 远程镜像及其他动态能力均不进入第一阶段。后续只有在实际使用产生明确需求时再单独设计。

## 14. 参考资料

- Astro Content Collections：<https://docs.astro.build/en/guides/content-collections/>
- Astro Markdown：<https://docs.astro.build/en/guides/markdown-content/>
- Cloudflare Pages Git 集成：<https://developers.cloudflare.com/pages/configuration/git-integration/>
- Cloudflare Pages 自定义域名：<https://developers.cloudflare.com/pages/configuration/custom-domains/>
- Node.js 发布状态：<https://nodejs.org/en/about/previous-releases>
