import { describe, expect, it } from "vitest";
import type { BlogEntry } from "../types/blog";
import {
  daysSinceLatestPost,
  getAllSeries,
  getAllTags,
  getHomePosts,
  getPostSlug,
  getPublishedCategories,
  getPublishedPosts,
  groupPostsByMonth
} from "./posts";

function post(
  id: string,
  date: string,
  draft = false,
  category = "技术实践"
): BlogEntry {
  return {
    id: `${id}/index`,
    collection: "blog",
    data: {
      title: id,
      description: `${id} description`,
      publishedAt: new Date(`${date}T00:00:00.000Z`),
      category,
      tags: [],
      draft
    }
  } as BlogEntry;
}

describe("published post queries", () => {
  it("filters drafts and sorts newest first", () => {
    const result = getPublishedPosts([
      post("old", "2026-01-01"),
      post("draft", "2026-03-01", true),
      post("new", "2026-02-01")
    ]);
    expect(result.map(({ id }) => id)).toEqual(["new/index", "old/index"]);
  });

  it("preserves nested article paths in the public slug", () => {
    expect(getPostSlug(post("database/mysql/partition-table2", "2026-09-13")))
      .toBe("database/mysql/partition-table2");
  });

  it("limits the homepage to twenty posts", () => {
    const posts = Array.from({ length: 25 }, (_, index) =>
      post(`post-${index}`, `2026-01-${String(index + 1).padStart(2, "0")}`)
    );
    expect(getHomePosts(posts)).toHaveLength(20);
  });

  it("groups archives across months and years", () => {
    const groups = groupPostsByMonth([
      post("a", "2026-07-01"),
      post("b", "2026-07-15"),
      post("c", "2025-12-31")
    ]);
    expect(groups.map(({ key, posts }) => [key, posts.length])).toEqual([
      ["2026-07", 2],
      ["2025-12", 1]
    ]);
  });

  it("handles a site without published posts", () => {
    expect(daysSinceLatestPost([post("draft", "2026-01-01", true)])).toBeNull();
  });

  it("calculates natural days since the latest post", () => {
    expect(
      daysSinceLatestPost(
        [post("latest", "2026-07-10")],
        new Date("2026-07-29T10:00:00.000Z")
      )
    ).toBe(19);
  });

  it("counts distinct tags and series whose punctuation differs", () => {
    const cpp = post("cpp", "2026-07-10");
    cpp.data.tags = ["C++"];
    cpp.data.series = "C++";
    const csharp = post("csharp", "2026-07-11");
    csharp.data.tags = ["C#"];
    csharp.data.series = "C#";

    expect(getAllTags([cpp, csharp])).toHaveLength(2);
    expect(getAllSeries([cpp, csharp])).toHaveLength(2);
  });

  it("uses Asia/Shanghai calendar days across local midnight", () => {
    const latest = post("latest", "2026-07-29");
    latest.data.publishedAt = new Date("2026-07-29T15:30:00.000Z");

    expect(
      daysSinceLatestPost(
        [latest],
        new Date("2026-07-29T16:30:00.000Z")
      )
    ).toBe(1);
  });

  it("returns only categories used by published posts", () => {
    const categories = [
      { name: "技术实践", slug: "tech" },
      { name: "阅读笔记", slug: "reading" },
      { name: "生活观察", slug: "life" }
    ];
    expect(
      getPublishedCategories(
        [
          post("published", "2026-01-02", false, "阅读笔记"),
          post("draft", "2026-01-03", true, "生活观察")
        ],
        categories
      )
    ).toEqual([{ name: "阅读笔记", slug: "reading" }]);
  });
});
