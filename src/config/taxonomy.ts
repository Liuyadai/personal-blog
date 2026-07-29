import categories from "./categories.json";

export const CATEGORIES = categories;

export type CategoryName = string;

export const CATEGORY_NAMES = CATEGORIES.map((category) => category.name) as [
  CategoryName,
  ...CategoryName[]
];

export function getCategoryByName(name: string) {
  return CATEGORIES.find((category) => category.name === name);
}

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug);
}

export function getCategorySlug(name: string) {
  const category = getCategoryByName(name);
  if (!category) {
    throw new Error(`未定义的文章分类：${name}`);
  }
  return category.slug;
}

export function taxonomySlug(value: string, prefix = "topic") {
  const ascii = value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (ascii) {
    return ascii;
  }

  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(36)}`;
}
