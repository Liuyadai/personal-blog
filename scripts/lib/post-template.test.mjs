import { describe, expect, it } from "vitest";
import {
  buildPostTemplate,
  escapeYamlString,
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
    expect(template).toContain("publishedAt: 2026-07-29");
    expect(template).toContain("draft: true");
  });
});
