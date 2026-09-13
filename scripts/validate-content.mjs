import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import {
  extractLocalReferences,
  validateFrontmatter
} from "./lib/content-rules.mjs";

const root = process.cwd();
const contentRoot = path.join(root, "src", "content", "blog");
const categoriesPath = path.join(root, "src", "config", "categories.json");
const categories = JSON.parse(await readFile(categoriesPath, "utf8")).map(
  ({ name }) => name
);

async function findArticles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const articles = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      articles.push(...(await findArticles(target)));
    } else if (/index\.(md|mdx)$/.test(entry.name)) {
      articles.push(target);
    }
  }
  return articles;
}

function parseArticle(source, filePath) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    throw new Error(`${filePath} 缺少以 --- 包围的 Frontmatter。`);
  }
  return {
    data: YAML.parse(match[1]),
    markdown: source.slice(match[0].length)
  };
}

const failures = [];
for (const filePath of await findArticles(contentRoot)) {
  const source = await readFile(filePath, "utf8");
  let article;
  try {
    article = parseArticle(source, filePath);
  } catch (error) {
    failures.push({
      filePath,
      issues: [
        {
          field: "Frontmatter",
          reason: error.message,
          suggestion: "请参考 docs/publishing.md 中的文章模板。"
        }
      ]
    });
    continue;
  }

  const slug = path
    .relative(contentRoot, path.dirname(filePath))
    .replace(/\\/g, "/");
  const issues = validateFrontmatter(article.data, { slug, categories });
  for (const reference of extractLocalReferences(article.markdown)) {
    const resolved = path.resolve(path.dirname(filePath), reference);
    try {
      await access(resolved);
    } catch {
      issues.push({
        field: "链接或图片",
        reason: `找不到相对路径：${reference}`,
        suggestion: "请检查文件名、扩展名和相对路径。"
      });
    }
  }
  if (issues.length) failures.push({ filePath, issues });
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`\n[内容检查失败] ${path.relative(root, failure.filePath)}`);
    for (const item of failure.issues) {
      console.error(`字段：${item.field}`);
      console.error(`原因：${item.reason}`);
      console.error(`处理：${item.suggestion}`);
    }
  }
  process.exitCode = 1;
} else {
  console.log("内容检查通过。");
}
