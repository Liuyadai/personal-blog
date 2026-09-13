import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  getCategorySlug,
  taxonomySlug
} from "./taxonomy";

describe("taxonomy configuration", () => {
  it("uses unique ASCII category slugs", () => {
    const slugs = CATEGORIES.map(({ slug }) => slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => /^[a-z0-9-]+$/.test(slug))).toBe(true);
  });

  it("resolves a configured category", () => {
    expect(getCategorySlug("技术实践")).toBe("tech");
  });

  it("rejects an unknown category", () => {
    expect(() => getCategorySlug("不存在")).toThrow("未定义的文章分类");
  });

  it("creates stable ASCII slugs for Chinese labels", () => {
    expect(taxonomySlug("博客", "tag")).toMatch(/^tag-[a-z0-9]+$/);
    expect(taxonomySlug("博客", "tag")).toBe(taxonomySlug("博客", "tag"));
    expect(taxonomySlug("Astro", "tag")).toMatch(/^astro-[a-z0-9]+$/);
  });

  it("does not collapse distinct punctuation-bearing labels", () => {
    expect(taxonomySlug("C++", "tag")).not.toBe(taxonomySlug("C#", "tag"));
  });

  it("does not collapse spacing, hyphen, or case variants", () => {
    const variants = [
      "machine learning",
      "machine-learning",
      "machine--learning",
      "Machine-Learning"
    ].map((label) => taxonomySlug(label, "tag"));

    expect(new Set(variants).size).toBe(variants.length);
    expect(taxonomySlug("Astro", "tag")).not.toBe(taxonomySlug("astro", "tag"));
  });
});
