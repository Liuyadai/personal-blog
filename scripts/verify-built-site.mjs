import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const dist = path.join(root, "dist");
const required = [
  "index.html",
  "archive/index.html",
  "categories/index.html",
  "about/index.html",
  "search/index.html",
  "404.html",
  "rss.xml",
  "sitemap-index.xml",
  "pagefind/pagefind.js",
  "pagefind/pagefind-ui.js",
  "pagefind/pagefind-ui.css"
];
const failures = [];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

for (const relative of required) {
  if (!(await exists(path.join(dist, relative)))) {
    failures.push(`缺少构建产物：dist/${relative}`);
  }
}

async function findFiles(directory, pattern) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await findFiles(target, pattern)));
    } else if (pattern.test(entry.name)) {
      output.push(target);
    }
  }
  return output;
}

const publicFiles = await findFiles(dist, /\.(?:html|xml)$/);
const publicText = (
  await Promise.all(publicFiles.map((file) => readFile(file, "utf8")))
).join("\n");

const articleFiles = await findFiles(
  path.join(root, "src", "content", "blog"),
  /^index\.(?:md|mdx)$/
);
for (const file of articleFiles) {
  const source = await readFile(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  const data = YAML.parse(match[1]);
  const slug = path.basename(path.dirname(file));
  const articleOutput = path.join(dist, "posts", slug, "index.html");

  if (data.draft === true) {
    if (publicText.includes(data.title)) {
      failures.push(`草稿标题出现在公开构建结果中：${data.title}`);
    }
    if (await exists(articleOutput)) {
      failures.push(`草稿生成了公开页面：/posts/${slug}/`);
    }
  } else if (!(await exists(articleOutput))) {
    failures.push(`正式文章没有生成页面：/posts/${slug}/`);
  }
}

function routeToFile(urlPath) {
  const clean = urlPath.split(/[?#]/)[0];
  if (!clean || clean === "/") return path.join(dist, "index.html");
  const relative = clean.replace(/^\/+/, "");
  if (path.extname(relative)) return path.join(dist, relative);
  return path.join(dist, relative, "index.html");
}

for (const file of publicFiles.filter((item) => item.endsWith(".html"))) {
  const html = await readFile(file, "utf8");
  if (!/<title>[^<]+<\/title>/.test(html)) {
    failures.push(`${path.relative(root, file)} 缺少页面标题。`);
  }
  const links = [...html.matchAll(/href="(\/[^"#]*)"/g)].map(
    (match) => match[1]
  );
  for (const link of links) {
    if (
      link.startsWith("/_astro/") ||
      link.startsWith("/pagefind/") ||
      link === "/favicon.svg"
    ) {
      continue;
    }
    if (!(await exists(routeToFile(link)))) {
      failures.push(
        `${path.relative(root, file)} 包含无效站内链接：${link}`
      );
    }
  }
}

if (failures.length) {
  console.error("\n[构建结果检查失败]");
  for (const failure of [...new Set(failures)]) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("构建结果检查通过。");
}
