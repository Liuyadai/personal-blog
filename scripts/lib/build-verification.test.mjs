import { describe, expect, it } from "vitest";

const helpers = await import("./build-verification.mjs").catch(() => ({}));
const parseRedirects = helpers.parseRedirects ?? (() => []);
const validateRedirects = helpers.validateRedirects ?? (() => []);
const validatePagefindMarkers = helpers.validatePagefindMarkers ?? (() => []);
const articleRouteFromFile = helpers.articleRouteFromFile ?? (() => "");
const validateDraftArtifacts = helpers.validateDraftArtifacts ?? (() => []);

describe("redirect build verification", () => {
  it("parses non-comment redirect rules with line numbers", () => {
    expect(
      parseRedirects(`
# old article aliases
/posts/old/   /posts/new/   301

/start /about/ 302
`)
    ).toEqual([
      { lineNumber: 3, source: "/posts/old/", destination: "/posts/new/", status: "301" },
      { lineNumber: 5, source: "/start", destination: "/about/", status: "302" }
    ]);
  });

  it("accepts supported statuses whose destination artifact exists", () => {
    const entries = parseRedirects([
      "/old-root / 301",
      "/old-about /about/ 302",
      "/old-feed /rss.xml 307",
      "/old-search /search/?q=astro 308"
    ].join("\n"));

    expect(validateRedirects(entries, new Set([
      "index.html",
      "about/index.html",
      "rss.xml",
      "search/index.html"
    ]))).toEqual([]);
  });

  it("rejects unsupported statuses and missing destination artifacts", () => {
    const entries = parseRedirects([
      "/temporary /missing/ 200",
      "/external https://example.com/ 301"
    ].join("\n"));

    expect(validateRedirects(entries, new Set())).toEqual([
      "_redirects 第 1 行使用了不支持的状态码：200",
      "_redirects 第 1 行目标没有构建产物：/missing/",
      "_redirects 第 2 行目标没有构建产物：https://example.com/"
    ]);
  });
});

describe("Pagefind build verification", () => {
  it("requires markers on published articles and forbids them elsewhere", () => {
    const pages = new Map([
      ["/", '<main data-pagefind-body>Home</main>'],
      ["/posts/published/", "<main>Article</main>"],
      ["/about/", "<main>About</main>"]
    ]);

    expect(validatePagefindMarkers(
      pages,
      new Set(["/posts/published/"])
    )).toEqual([
      "非文章页面包含 Pagefind 正文标记：/",
      "正式文章缺少 Pagefind 正文标记：/posts/published/"
    ]);
  });

  it("maps nested article directories to nested post routes", () => {
    expect(
      articleRouteFromFile(
        "D:/blog/src/content/blog",
        "D:/blog/src/content/blog/database/mysql/partition-table2/index.md"
      )
    ).toEqual({
      slug: "database/mysql/partition-table2",
      url: "/posts/database/mysql/partition-table2/",
      artifact: "posts/database/mysql/partition-table2/index.html"
    });
  });
});

describe("draft build verification", () => {
  it("ignores matching title text when the draft route artifact is absent", () => {
    const draftRoutes = [{
      title: "MySQL",
      url: "/posts/mysql-draft/",
      artifact: "posts/mysql-draft/index.html"
    }];

    expect(validateDraftArtifacts(draftRoutes, new Set(["index.html"]))).toEqual([]);
  });

  it("rejects a generated artifact for a draft route", () => {
    const draftRoutes = [{
      title: "草稿",
      url: "/posts/draft/",
      artifact: "posts/draft/index.html"
    }];

    expect(
      validateDraftArtifacts(draftRoutes, new Set(["posts/draft/index.html"]))
    ).toEqual(["草稿生成了公开页面：/posts/draft/"]);
  });
});
