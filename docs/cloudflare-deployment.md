# Cloudflare Pages 零基础部署

本教程在本地博客能够通过以下命令后执行：

```powershell
npm.cmd run verify
```

## 1. 创建 GitHub 私有仓库

1. 登录 GitHub。
2. 点击右上角 `+`，选择 `New repository`。
3. Repository name 填写 `personal-blog`。
4. 选择 `Private`。
5. 不勾选自动创建 README、`.gitignore` 或 License。
6. 点击 `Create repository`。

GitHub 会显示仓库地址。回到项目终端，按 GitHub 页面给出的地址执行：

```powershell
git branch -M main
git remote add origin 你的仓库地址
git push -u origin main
```

成功判断：刷新 GitHub 仓库页面后能看到 `src`、`docs` 和 `package.json`。

## 2. 连接 Cloudflare Pages

1. 登录 Cloudflare Dashboard。
2. 在左侧依次打开 `Build` → `Compute`。
3. 点击 `Create app`。
4. 在创建方式页面底部点击 `Continue to Pages`，不要使用上方默认的 Workers 创建入口。
5. 选择 `Connect to Git`，再选择 GitHub 并完成授权。
6. 授权时只选择 `personal-blog` 仓库。
7. 返回 Cloudflare，选择该仓库并开始设置。

构建配置：

```text
Production branch: main
Framework preset: Astro
Build command: npm run build
Build output directory: dist
```

环境变量增加：

```text
NODE_VERSION = 22.14.0
ASTRO_TELEMETRY_DISABLED = 1
```

点击 `Save and Deploy`。

成功判断：

- 部署状态显示 `Success`。
- Cloudflare 提供一个 `*.pages.dev` 地址。
- 打开地址能看到“所见所得”首页。

## 3. 验证分支预览

结构性改动不要直接推送 `main`：

```powershell
git switch -c preview/test-layout
git push -u origin preview/test-layout
```

Cloudflare 会为该分支生成预览地址，不影响正式博客。

确认后再将改动合并到 `main`。不需要预览分支时可以在 GitHub 删除。

## 4. 绑定独立域名

绑定域名会修改外部 DNS，请在操作前确认域名归属和当前解析记录。

1. 打开 Pages 项目。
2. 进入 `Custom domains`。
3. 点击 `Set up a domain`。
4. 输入域名或子域名。

根域名示例：

```text
example.com
```

根域名需要将 DNS 托管到 Cloudflare。

子域名示例：

```text
blog.example.com
```

如果 DNS 不在 Cloudflare，可按页面提示添加 CNAME，指向：

```text
你的项目.pages.dev
```

必须先在 Pages 的 Custom domains 页面添加域名，再修改 DNS；只添加 CNAME 可能导致验证失败。

成功判断：

- Custom domains 状态为 `Active`。
- 浏览器访问域名时使用 HTTPS。
- 证书正常，没有安全警告。

## 5. 将正式域名写入项目

域名生效后，修改：

```text
src/config/site.ts
astro.config.mjs
public/robots.txt
```

将其中的 `https://example.com` 替换为真实域名，然后运行：

```powershell
npm.cmd run verify
git add .
git commit -m "chore: configure production domain"
git push
```

重新部署后检查：

- 页面 canonical 使用正式域名。
- `/rss.xml` 可访问。
- `/sitemap-index.xml` 可访问。

## 6. 构建失败时

进入失败部署的 Build logs，找到第一条错误。不要删除项目重新开始；上一版成功站点仍会在线。

如果失败发生在 `initialize`，日志只有：

```text
Failed: unable to submit build job
```

并且 `clone repo`、`build`、`deploy` 都没有开始，说明 Cloudflare 尚未提交构建任务，通常不是代码错误。先点击 `Retry deployment` 重试同一次部署，不要修改构建设置。

修复本地代码后先运行：

```powershell
npm.cmd run verify
```

通过后重新推送。

## 重要限制

Cloudflare Pages 使用 Git 集成创建后，不能直接切换为 Direct Upload。如以后确实需要更换部署方式，应创建新的 Pages 项目，并在确认新站点正常后切换域名。
