import { describe, expect, it } from "vitest";
import {
  extractLocalReferences,
  validateFrontmatter
} from "./content-rules.mjs";

const categories = ["技术实践", "阅读笔记"];

function valid(overrides = {}) {
  return {
    title: "文章",
    description: "摘要",
    publishedAt: "2026-07-29",
    updatedAt: null,
    category: "技术实践",
    tags: ["Astro"],
    draft: true,
    ...overrides
  };
}

describe("content rules", () => {
  it("accepts valid frontmatter", () => {
    expect(
      validateFrontmatter(valid(), { slug: "my-post", categories })
    ).toEqual([]);
  });

  it("accepts a kebab-case multi-level article path", () => {
    expect(
      validateFrontmatter(valid(), {
        slug: "database/mysql/partition-table2",
        categories
      })
    ).toEqual([]);
  });

  it("reports missing metadata with a field name", () => {
    const issues = validateFrontmatter(valid({ description: "" }), {
      slug: "my-post",
      categories
    });
    expect(issues).toContainEqual(
      expect.objectContaining({ field: "description" })
    );
  });

  it("validates dates, categories and duplicate tags", () => {
    const issues = validateFrontmatter(
      valid({
        publishedAt: "29/07/2026",
        category: "未知",
        tags: ["Astro", "astro"]
      }),
      { slug: "my-post", categories }
    );
    expect(issues.map(({ field }) => field)).toEqual(
      expect.arrayContaining(["publishedAt", "category", "tags"])
    );
  });

  it.each([
    ["publishedAt", "2026-02-30"],
    ["publishedAt", "2025-02-29"],
    ["updatedAt", "2026-04-31"]
  ])("rejects an impossible calendar date in %s: %s", (field, value) => {
    const issues = validateFrontmatter(valid({ [field]: value }), {
      slug: "my-post",
      categories
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        field,
        reason: expect.stringContaining("格式不正确")
      })
    );
  });

  it("accepts February 29 in a leap year", () => {
    expect(
      validateFrontmatter(valid({ publishedAt: "2024-02-29" }), {
        slug: "my-post",
        categories
      })
    ).toEqual([]);
  });

  it("extracts only relative local references", () => {
    expect(
      extractLocalReferences(`
![本地图片](./image.png)
[附件](../files/demo.pdf)
[站内](/archive/)
[外部](https://example.com)
`)
    ).toEqual(["./image.png", "../files/demo.pdf"]);
  });
});
