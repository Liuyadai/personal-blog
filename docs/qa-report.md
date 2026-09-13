# 本地验收记录

- 日期：2026-09-13
- 环境：Windows、Node.js 22.14、Chrome Headless

## 自动检查

执行：

```powershell
npm.cmd run verify
```

结果：

- 内容元数据和本地引用检查通过。
- Astro/TypeScript：0 errors、0 warnings、0 hints。
- Vitest 全部通过；最新数量以 `npm.cmd run verify` 输出为准。
- Astro 静态构建成功。
- Pagefind 中文索引生成成功。
- 草稿泄漏、关键页面和站内链接检查通过。

## 浏览器检查

已检查：

- 1440px 桌面首页。
- 390px 移动首页。
- 移动端菜单打开、`aria-expanded` 状态变化。
- 文章页标题、元数据、标签、目录、代码块和长正文。
- 页面无 JavaScript 控制台错误。
- 桌面和移动端均未出现横向滚动。

文章页检查期间曾将示例文章临时设为正式文章；检查结束后已经恢复为 `draft: true`，最终构建不会公开该文章。

## 视觉结果

- 桌面端保持固定左侧导航和右侧内容区。
- 移动端侧栏收为顶部菜单。
- 首页空状态明确说明草稿发布方式。
- 文章目录在至少三个二、三级标题时出现。
- 页面使用系统字体，不依赖外部字体服务。

## Lighthouse

使用与 Cloudflare 相同的静态构建，通过 `astro preview` 和 Chrome Headless 进行 Lighthouse 12.8.2 验收：

| 页面 | 性能 | 无障碍 |
|---|---:|---:|
| 首页 | 100 | 95 |
| `database-mysql-partition-table` 文章页 | 100 | 95 |

两个页面均达到不低于 90 的验收目标。Lighthouse 生成报告后在 Windows 清理临时 Chrome 配置时遇到文件占用，但 JSON 报告完整、无运行时错误，分数有效。

## Cloudflare 上线验收

- 线上地址：<https://personal-blog-4xd.pages.dev>
- Cloudflare Pages 生产部署成功。
- 首页 HTTPS、canonical 和 Open Graph URL 正确。
- RSS 与 sitemap 使用实际 Pages 域名。
- Pagefind 搜索输入框在线上环境正常加载。
- 示例文章仍为 `draft: true`，未生成公开文章页。
