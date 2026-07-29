import { describe, expect, it } from "vitest";
import type { BlogEntry } from "../types/blog";
import {
  daysSinceLatestPost,
  getHomePosts,
  getPublishedPosts,
  groupPostsByMonth
} from "./posts";

function post(
  id: string,
  date: string,
  draft = false
): BlogEntry {
  return {
    id: `${id}/index`,
    collection: "blog",
    data: {
      title: id,
      description: `${id} description`,
      publishedAt: new Date(`${date}T00:00:00.000Z`),
      category: "技术实践",
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
});
