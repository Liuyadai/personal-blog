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
  const normalized = value.normalize("NFKC").trim();
  const ascii = normalized
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (ascii && normalized === ascii) {
    return ascii;
  }

  const suffix = [...new TextEncoder().encode(value.trim())]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return ascii ? `${ascii}-${suffix}` : `${prefix}-${suffix}`;
}
