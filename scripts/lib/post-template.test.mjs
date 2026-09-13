import { describe, expect, it } from "vitest";
import {
  buildPostTemplate,
  escapeYamlString,
  normalizeArticlePath,
  resolveArticleDirectory,
  shanghaiDate,
  validateSlug
} from "./post-template.mjs";

describe("post template", () => {
  it("accepts kebab-case slugs", () => {
    expect(validateSlug("building-my-blog")).toBe("building-my-blog");
  });

  it("rejects unsafe directory names", () => {
    expect(() => validateSlug("../blog")).toThrow("目录名只能");
    expect(() => validateSlug("My Blog")).toThrow("目录名只能");
  });

  it("normalizes multi-level article paths from both path separators", () => {
    expect(normalizeArticlePath("database/mysql/partition-table2")).toBe(
      "database/mysql/partition-table2"
    );
    expect(normalizeArticlePath("database\\mysql\\partition-table2")).toBe(
      "database/mysql/partition-table2"
    );
  });

  it.each([
    "../outside",
    "/absolute/path",
    "C:\\absolute\\path",
    "database//partition",
    "database/../partition",
    "database/MySQL/partition"
  ])("rejects unsafe multi-level article path: %s", (articlePath) => {
    expect(() => normalizeArticlePath(articlePath)).toThrow("文章路径");
  });

  it("resolves a nested article directory inside the content root", () => {
    expect(
      resolveArticleDirectory(
        "D:/blog/src/content/blog",
        "database/mysql/partition-table2"
      ).replace(/\\/g, "/")
    ).toBe("D:/blog/src/content/blog/database/mysql/partition-table2");
  });

  it("escapes YAML double quoted values", () => {
    expect(escapeYamlString('我的 "博客"')).toBe('我的 \\"博客\\"');
  });

  it("formats dates in Shanghai timezone", () => {
    expect(shanghaiDate(new Date("2026-07-28T16:30:00Z"))).toBe("2026-07-29");
  });

  it("creates a draft template", () => {
    const template = buildPostTemplate({
      title: "第一篇文章",
      date: "2026-07-29"
    });
    expect(template).toContain('title: "第一篇文章"');
    expect(template).toContain('publishedAt: "2026-07-29"');
    expect(template).toContain("draft: true");
  });
});
