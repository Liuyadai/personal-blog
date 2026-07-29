const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function issue(field, reason, suggestion) {
  return { field, reason, suggestion };
}

export function validateFrontmatter(data, { slug, categories }) {
  const issues = [];

  for (const field of ["title", "description", "publishedAt", "category", "draft"]) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      issues.push(issue(field, `${field} 不能为空。`, `请填写 ${field}。`));
    }
  }

  if (!SLUG_PATTERN.test(slug)) {
    issues.push(
      issue(
        "slug",
        "文章目录名不是 kebab-case。",
        "请使用小写英文字母、数字和单个连字符。"
      )
    );
  }

  if (
    data.publishedAt !== undefined &&
    !DATE_PATTERN.test(String(data.publishedAt))
  ) {
    issues.push(
      issue(
        "publishedAt",
        "发布日期格式不正确。",
        "请使用 YYYY-MM-DD，例如 2026-07-29。"
      )
    );
  }

  if (
    data.updatedAt &&
    !DATE_PATTERN.test(String(data.updatedAt))
  ) {
    issues.push(
      issue(
        "updatedAt",
        "更新日期格式不正确。",
        "请使用 YYYY-MM-DD，或将该字段留空。"
      )
    );
  }

  if (
    DATE_PATTERN.test(String(data.publishedAt)) &&
    DATE_PATTERN.test(String(data.updatedAt)) &&
    String(data.updatedAt) < String(data.publishedAt)
  ) {
    issues.push(
      issue(
        "updatedAt",
        "更新日期早于发布日期。",
        "请修改 updatedAt，或将该字段留空。"
      )
    );
  }

  if (data.category && !categories.includes(data.category)) {
    issues.push(
      issue(
        "category",
        `未定义的分类：${data.category}`,
        `请选择：${categories.join("、")}。`
      )
    );
  }

  if (typeof data.draft !== "boolean") {
    issues.push(
      issue("draft", "draft 必须是布尔值。", "草稿填写 true，正式文章填写 false。")
    );
  }

  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    issues.push(issue("tags", "tags 必须是数组。", "例如：tags: [Astro, 博客]。"));
  } else if (Array.isArray(data.tags)) {
    const normalized = data.tags.map((tag) => String(tag).trim().toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      issues.push(issue("tags", "存在重复标签。", "请删除重复标签。"));
    }
  }

  return issues;
}

export function extractLocalReferences(markdown) {
  const references = new Set();
  const pattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of markdown.matchAll(pattern)) {
    const target = match[1];
    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("/") ||
      target.startsWith("#") ||
      target.startsWith("mailto:") ||
      target.startsWith("tel:")
    ) {
      continue;
    }
    references.add(decodeURIComponent(target.split(/[?#]/)[0]));
  }
  return [...references];
}
