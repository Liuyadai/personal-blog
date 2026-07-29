# 私人博客实施计划

- 日期：2026-07-28
- 依据：`docs/superpowers/specs/2026-07-28-personal-blog-design.md`
- 目标：实现 Astro 静态博客、内容校验、写作命令、自动构建和零基础使用文档
- 工作目录：`D:\Projects\personal-blog`

## 实施原则

1. 每个阶段都先完成最小可验证结果，再继续下一阶段。
2. 内容规则和草稿过滤优先于页面美化。
3. 所有发布前检查统一收口到 `npm run verify`。
4. 不引入数据库、登录、评论、统计和网页 CMS。
5. 不使用现成重型博客主题；基于 Astro 原生能力实现已确认的数字笔记本布局。
6. 每个阶段完成后创建独立 Git 提交，便于定位问题和恢复。
7. 需要 GitHub 或 Cloudflare 账号授权的操作由用户在教程引导下完成，代码仓库内不保存访问令牌。

## 阶段 1：建立可运行的 Astro 工程

### 任务 1.1：配置 Node.js 与 npm 工程

新增或修改：

```text
.node-version
.gitignore
package.json
package-lock.json
tsconfig.json
astro.config.mjs
public/robots.txt
src/pages/index.astro
```

实施内容：

- 固定本机现有且满足 Astro 要求的 Node.js 22.14。
- 使用 npm 管理依赖并提交 `package-lock.json`。
- 安装 Astro、TypeScript、`@astrojs/check`、Vitest、RSS、sitemap 和静态搜索所需依赖。
- 配置 TypeScript `strict` 模式。
- 保持 Astro 默认静态输出，不安装服务端适配器。
- 在 `package.json` 中建立基础命令：

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  }
}
```

验证：

```powershell
node --version
npm --version
npm install
npm run check
npm run build
```

成功标准：

- Node 主版本为 24。
- `npm run check` 无错误。
- `dist/index.html` 成功生成。

提交：

```text
chore: initialize Astro project
```

### 任务 1.2：建立站点集中配置

新增：

```text
src/config/site.ts
src/config/taxonomy.ts
```

配置内容：

- 站点名称、说明、作者、默认语言和时区。
- 正式域名占位使用单一配置项，开发环境不散落硬编码 URL。
- 四个初始分类及其稳定 ASCII slug：

```text
技术实践 → tech
阅读笔记 → reading
生活观察 → life
思考随笔 → thoughts
```

测试：

```text
src/config/taxonomy.test.ts
```

覆盖：

- 每个分类名称都有唯一 slug。
- slug 只包含小写 ASCII、数字和连字符。
- 未定义分类会返回明确错误。

验证：

```powershell
npm test
```

提交：

```text
feat: add site and taxonomy configuration
```

## 阶段 2：实现内容模型与草稿规则

### 任务 2.1：定义 Astro Content Collection

新增：

```text
src/content.config.ts
src/content/blog/hello-blog/index.md
```

Schema 与设计文档保持一致：

```text
title          必填字符串
description    必填非空字符串
publishedAt    必填日期
updatedAt      可选日期
category       必填且属于预定义分类
tags           字符串数组，默认为 []
series         可选字符串
draft          必填布尔值，创建时默认为 true
```

额外规则：

- `updatedAt` 不得早于 `publishedAt`。
- 文章目录名作为 slug，必须符合 kebab-case。
- 示例文章保持 `draft: true`，不会成为正式内容。

验证：

```powershell
npm run check
npm run build
```

提交：

```text
feat: define blog content schema
```

### 任务 2.2：实现统一的文章查询模块

新增：

```text
src/lib/posts.ts
src/lib/posts.test.ts
src/types/blog.ts
```

模块只承担以下职责：

- 过滤草稿。
- 按 `publishedAt` 倒序排序。
- 取首页最近 20 篇。
- 按年月生成归档分组。
- 提取分类、标签和系列索引。
- 计算距最新一篇已发布文章的自然日数。
- 为上一篇和下一篇导航提供已发布文章序列。

测试数据必须同时包含：

- 已发布文章。
- 草稿。
- 同一天发布的多篇文章。
- 跨月和跨年文章。
- 没有任何已发布文章的空站点。

关键断言：

- 草稿不会从任何公开查询函数返回。
- 首页最多返回 20 篇。
- 空站点的“上次发布”返回空状态，而不是异常或错误天数。

验证：

```powershell
npm test
npm run check
```

提交：

```text
feat: add published post queries
```

## 阶段 3：实现文章创建与验证工具

### 任务 3.1：实现 `npm run new-post`

新增：

```text
scripts/new-post.mjs
scripts/lib/post-template.mjs
scripts/lib/post-template.test.mjs
```

行为：

1. 询问文章标题。
2. 询问英文或拼音目录名。
3. 校验目录名为 kebab-case。
4. 检查目标目录不存在，避免覆盖文章。
5. 自动填入上海时区当天日期。
6. 创建 `src/content/blog/<slug>/index.md`。
7. 默认生成 `draft: true`。
8. 输出下一步命令和文件位置。

模板：

```yaml
---
title: "文章标题"
description: ""
publishedAt: YYYY-MM-DD
updatedAt:
category: ""
tags: []
series:
draft: true
---

从这里开始写正文。
```

测试：

- 合法 slug 生成正确路径。
- 非法 slug 给出示例并拒绝创建。
- 同名目录存在时拒绝覆盖。
- 标题中的双引号能被正确转义。
- 日期固定使用 `YYYY-MM-DD`。

新增命令：

```json
{
  "scripts": {
    "new-post": "node scripts/new-post.mjs"
  }
}
```

验证：

```powershell
npm test
npm run new-post
```

人工检查生成文件后，删除本次人工测试目录，不删除自动测试夹具。

提交：

```text
feat: add new post generator
```

### 任务 3.2：实现可读的内容错误报告

新增：

```text
scripts/validate-content.mjs
scripts/lib/content-rules.mjs
scripts/lib/content-rules.test.mjs
```

检查：

- 必填字段为空。
- 日期格式和日期顺序。
- 分类不在配置中。
- slug 不合法。
- 同一文章标签重复。
- 相对图片不存在。
- Markdown 站内链接指向不存在的文章或静态文件。

错误格式：

```text
[内容检查失败] src/content/blog/building-my-blog/index.md
字段：description
原因：文章摘要不能为空。
处理：请填写一到两句话的摘要。
```

新增命令：

```json
{
  "scripts": {
    "validate:content": "node scripts/validate-content.mjs"
  }
}
```

验证：

- 为每一种错误准备自动测试夹具。
- 人工制造一次缺失摘要错误，确认输出可由新手理解。

提交：

```text
feat: validate blog content
```

## 阶段 4：实现数字笔记本视觉系统

### 任务 4.1：建立基础布局与设计变量

新增：

```text
src/layouts/BaseLayout.astro
src/components/Sidebar.astro
src/components/MobileHeader.astro
src/components/ThemeToggle.astro
src/styles/tokens.css
src/styles/global.css
src/styles/content.css
```

实现：

- 低饱和中性色设计变量。
- 正文衬线字体与界面无衬线字体组合，优先系统字体，避免外部字体成为首屏依赖。
- 桌面端左侧栏与右侧内容区。
- 移动端顶部菜单。
- 浅色、深色和跟随系统模式。
- 主题选择写入 `localStorage`，并避免页面加载时闪烁。
- 键盘可操作的导航与明显的焦点状态。

验证：

```powershell
npm run check
npm run build
npm run dev
```

人工检查宽度：

```text
360px
768px
1280px
```

提交：

```text
feat: add notebook visual system
```

### 任务 4.2：实现时间线组件

新增：

```text
src/components/PostTimeline.astro
src/components/PostTimelineItem.astro
src/components/LastPublished.astro
```

要求：

- 时间线按年月分组。
- 每项显示日期、标题、摘要和标签。
- 首页传入最近 20 篇，归档页传入全部文章。
- 无已发布文章时显示欢迎状态。
- “距上次发布”只显示客观时间，不显示断更、签到或连续天数。

验证：

- 使用测试文章验证同月、跨月、跨年和空状态。
- 移动端时间线不发生横向滚动。

提交：

```text
feat: add post timeline
```

## 阶段 5：实现页面与路由

### 任务 5.1：首页与文章页

新增：

```text
src/pages/index.astro
src/pages/posts/[...slug].astro
src/layouts/PostLayout.astro
src/components/TableOfContents.astro
src/components/PostNavigation.astro
```

首页：

- 最近 20 篇已发布文章。
- 个人简介与主要导航。
- 距上次发布的时间。

文章页：

- 标题、摘要、发布日期和更新时间。
- 分类、标签和系列。
- Markdown 正文和同目录图片。
- 达到预设标题数量后显示目录。
- 上一篇和下一篇只在已发布文章中导航。

验证：

```powershell
npm run check
npm test
npm run build
```

生成结果中不得出现示例草稿的 URL。

提交：

```text
feat: add home and post pages
```

### 任务 5.2：归档与主题浏览页面

新增：

```text
src/pages/archive.astro
src/pages/categories/index.astro
src/pages/categories/[category].astro
src/pages/tags/index.astro
src/pages/tags/[tag].astro
src/pages/series/[series].astro
```

要求：

- 归档按年份和月份展示全部已发布文章。
- 分类页面使用集中配置中的稳定 slug。
- 标签和系列页面为实际存在的已发布内容生成路由。
- 空分类不生成没有内容的页面。
- 所有列表共享文章查询模块，不各自重复草稿过滤逻辑。

提交：

```text
feat: add archive and taxonomy pages
```

### 任务 5.3：关于页、404 与基础元信息

新增：

```text
src/pages/about.astro
src/pages/404.astro
src/components/SeoHead.astro
public/favicon.svg
```

要求：

- 关于页内容集中在一个易编辑文件中。
- 404 页面提供首页与搜索入口。
- 每页具备唯一标题和摘要。
- 输出 canonical URL、Open Graph 基础字段和站点图标。

提交：

```text
feat: add about error and metadata pages
```

## 阶段 6：实现 RSS、sitemap、搜索与重定向

### 任务 6.1：RSS 与 sitemap

新增或修改：

```text
src/pages/rss.xml.js
astro.config.mjs
```

要求：

- RSS 只包含已发布文章。
- sitemap 不包含草稿 URL。
- 使用统一站点 URL 配置。

验证：

```powershell
npm run build
```

检查：

```text
dist/rss.xml
dist/sitemap-*.xml
```

提交：

```text
feat: add rss and sitemap
```

### 任务 6.2：静态全文搜索

新增或修改：

```text
src/pages/search.astro
src/components/SearchBox.astro
package.json
```

实施：

- 在 Astro 构建完成后生成 Pagefind 静态索引。
- 索引标题、摘要、标签和正文。
- 草稿因不生成页面而不会进入索引。
- 搜索页支持键盘操作和无结果状态。

验证：

```powershell
npm run build
npm run preview
```

搜索一条标题、一条正文关键词和一个标签。

提交：

```text
feat: add static search
```

### 任务 6.3：永久重定向

新增：

```text
public/_redirects
docs/redirects.md
```

要求：

- 文件包含注释示例，不包含虚假的线上地址。
- 文档说明修改 slug 时如何添加 `301` 重定向。
- 构建验证检查重定向目标存在。

提交：

```text
feat: support permanent redirects
```

## 阶段 7：收口自动验证

### 任务 7.1：构建产物检查

新增：

```text
scripts/verify-built-site.mjs
scripts/lib/built-site-rules.test.mjs
```

检查：

- 首页、归档、关于、搜索、404、RSS 和 sitemap 已生成。
- 已发布文章 URL 已生成。
- 草稿标题和 URL 未出现在 `dist`。
- 关键页面不存在空标题或重复 canonical。
- 内部生成链接指向实际构建产物。

新增命令：

```json
{
  "scripts": {
    "verify:dist": "node scripts/verify-built-site.mjs",
    "verify": "npm run validate:content && npm run check && npm test && npm run build && npm run verify:dist"
  }
}
```

验证：

```powershell
npm run verify
```

成功标准：

- 一条命令完成全部发布前检查。
- 任一步失败都返回非零退出码。
- 报错指出失败阶段和处理方法。

提交：

```text
test: add full publication verification
```

### 任务 7.2：浏览器与无障碍冒烟检查

检查页面：

```text
/
/posts/<published-slug>/
/archive/
/search/
/about/
/404.html
```

检查内容：

- 键盘导航。
- 菜单开关与主题切换。
- 标题层级。
- 图片替代文本。
- 颜色对比度。
- 360px 下无横向滚动。
- JavaScript 禁用时文章正文和主要导航仍可访问。

运行 Lighthouse：

- 首页性能不低于 90。
- 首页无障碍不低于 90。
- 文章页性能不低于 90。
- 文章页无障碍不低于 90。

若自动化工具在环境中不可用，则记录手动检查结果；不能跳过构建和内容测试。

提交：

```text
test: verify responsive and accessible pages
```

## 阶段 8：编写零基础文档

### 任务 8.1：项目入口文档

新增：

```text
README.md
```

包含：

- 博客用途和技术组成。
- Node.js 22.12 或更高受支持版本、Git、VS Code 的安装入口。
- 首次安装和启动命令。
- 常用目录说明。
- 日常只需掌握的四个 npm 命令。
- 指向详细发布、部署和排错文档的链接。

验证：

- 在全新目录按 README 命令可以完成依赖安装和本地启动。

提交：

```text
docs: add project quick start
```

### 任务 8.2：日常写作与发布手册

新增：

```text
docs/publishing.md
```

逐步说明：

1. 打开终端并进入项目。
2. 拉取最新代码。
3. 创建文章模板。
4. 填写 Frontmatter。
5. 添加同目录图片。
6. 本地预览。
7. 推送草稿备份。
8. 将 `draft` 改为 `false`。
9. 执行 `npm run verify`。
10. 提交并推送正式文章。
11. 确认线上发布结果。

每一步包含命令、预期结果、成功判断和常见错误。

提交：

```text
docs: add publishing guide
```

### 任务 8.3：排错手册

新增：

```text
docs/troubleshooting.md
```

覆盖：

- Node 版本错误。
- `npm install` 失败。
- 端口被占用。
- Frontmatter 缩进或引号错误。
- 日期格式错误。
- 图片或站内链接不存在。
- 草稿未出现或正文未发布。
- Astro 检查失败。
- Cloudflare 构建失败。
- 域名或 HTTPS 尚未生效。
- 使用 Git 恢复误删文章。

提交：

```text
docs: add troubleshooting guide
```

## 阶段 9：GitHub 与 Cloudflare 首次部署

### 任务 9.1：准备 GitHub 仓库

代码侧准备：

- 默认分支统一为 `main`。
- `.gitignore` 排除 `node_modules`、`dist`、本地缓存和环境文件。
- 确认 Git 历史中没有访问令牌或个人敏感信息。
- 本地执行 `npm run verify`。

用户操作：

1. 在 GitHub 创建私有仓库。
2. 添加远程地址。
3. 推送 `main`。
4. 在 GitHub 页面确认文件与提交记录。

未经用户明确授权，不代替用户创建远程仓库或推送。

### 任务 9.2：编写并执行 Cloudflare 教程

新增：

```text
docs/cloudflare-deployment.md
```

教程逐步覆盖：

1. 注册或登录 Cloudflare。
2. 进入 Workers & Pages。
3. 选择 Pages 并连接 Git。
4. 只授权目标 GitHub 仓库。
5. 选择 `main` 为生产分支。
6. 设置构建命令 `npm run build`。
7. 设置输出目录 `dist`。
8. 固定 Node.js 22.14。
9. 触发首次构建。
10. 访问 `pages.dev` 地址。
11. 创建测试分支并确认预览部署。
12. 查看构建日志并识别成功或失败。

说明 Cloudflare Git 集成项目无法直接切换为 Direct Upload；如需改变模式，应新建 Pages 项目。

### 任务 9.3：绑定独立域名

用户操作：

1. 准备已购买的域名。
2. 在 Pages 项目中添加自定义域名。
3. 根域名使用 Cloudflare DNS；子域名按教程配置 CNAME。
4. 等待 DNS 与证书生效。
5. 设置站点正式 URL 并重新构建。
6. 验证 HTTP 自动跳转 HTTPS。
7. 验证 canonical、RSS 和 sitemap 使用正式域名。

域名购买、DNS 修改和外部账号授权属于显著外部状态变更，实施时必须由用户确认后执行。

提交：

```text
docs: add Cloudflare deployment guide
```

## 阶段 10：最终验收与交付

### 任务 10.1：执行设计文档验收清单

运行：

```powershell
npm ci
npm run verify
npm run preview
```

逐项核对设计文档第 12 节的 13 项验收条件。

### 任务 10.2：执行一次新手发布演练

使用一篇测试文章完成：

```text
创建草稿
→ 本地预览
→ 推送草稿备份
→ 制造并修复摘要缺失错误
→ 发布文章
→ 推送 GitHub
→ 查看 Cloudflare 构建
→ 访问正式博客
```

演练文章结束后：

- 若是正式的第一篇文章则保留。
- 若纯属测试则恢复为 `draft: true`，不删除其 Git 历史。

### 任务 10.3：最终检查与提交

检查：

```powershell
git status --short
git log --oneline --decorate -15
```

最终交付说明必须包含：

- 本地启动方法。
- 日常发布入口。
- 正式博客地址。
- Cloudflare 项目位置。
- 当前已知限制。
- 后续可选增强，但不主动实施第一阶段范围外功能。

最终提交：

```text
chore: complete personal blog setup
```

## 推荐执行顺序

严格按照阶段 1 至阶段 10 执行。阶段 1 至阶段 8 可以完全在本地完成；阶段 9 需要用户的 GitHub、Cloudflare 和域名操作；阶段 10 在外部部署完成后进行。

在任何阶段，如果 `npm run verify` 已经存在并失败，应先修复失败再继续，不允许通过删除测试、放宽内容规则或跳过构建来推进。
