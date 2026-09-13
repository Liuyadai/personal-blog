const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ARTICLE_PATH_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

export function isValidCalendarDate(value) {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];
  return (
    month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1]
  );
}

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

  if (!ARTICLE_PATH_PATTERN.test(slug)) {
    issues.push(
      issue(
        "slug",
        "文章路径不是有效的 kebab-case 多级路径。",
        "请让每一级都只使用小写英文字母、数字和单个连字符，例如 database/mysql/partition-table2。"
      )
    );
  }

  if (
    data.publishedAt !== undefined &&
    !isValidCalendarDate(data.publishedAt)
  ) {
    issues.push(
      issue(
        "publishedAt",
        "发布日期格式不正确。",
        '请使用带引号的 YYYY-MM-DD，例如 "2026-07-29"。'
      )
    );
  }

  if (
    data.updatedAt &&
    !isValidCalendarDate(data.updatedAt)
  ) {
    issues.push(
      issue(
        "updatedAt",
        "更新日期格式不正确。",
        '请使用带引号的 YYYY-MM-DD，例如 "2026-07-29"，或将该字段留空。'
      )
    );
  }

  if (
    isValidCalendarDate(data.publishedAt) &&
    isValidCalendarDate(data.updatedAt) &&
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
