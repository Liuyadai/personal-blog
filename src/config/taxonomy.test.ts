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
    expect(taxonomySlug("Astro", "tag")).toBe("astro");
  });

  it("does not collapse distinct punctuation-bearing labels", () => {
    expect(taxonomySlug("C++", "tag")).not.toBe(taxonomySlug("C#", "tag"));
    expect(taxonomySlug("hello world", "tag")).toBe("hello-world");
  });
});
