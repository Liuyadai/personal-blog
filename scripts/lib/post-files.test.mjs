import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { articleRouteFromFile } from "./build-verification.mjs";

const helpers = await import("./post-files.mjs").catch(() => ({}));
const createArticleDraft = helpers.createArticleDraft ?? (() => {
  throw new Error("createArticleDraft 尚未实现");
});
const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  );
});

describe("nested article filesystem flow", () => {
  it("creates a nested draft whose filesystem path maps to the same public route", async () => {
    const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "personal-blog-post-"));
    temporaryRoots.push(temporaryRoot);
    const contentRoot = path.join(temporaryRoot, "src", "content", "blog");

    const result = await createArticleDraft({
      contentRoot,
      articlePath: "database/mysql/partition-table2",
      title: "MySQL 分区表",
      date: "2026-09-14"
    });

    expect(await readFile(result.filePath, "utf8")).toContain("draft: true");
    expect(articleRouteFromFile(contentRoot, result.filePath)).toEqual({
      slug: "database/mysql/partition-table2",
      url: "/posts/database/mysql/partition-table2/",
      artifact: "posts/database/mysql/partition-table2/index.html"
    });
  });
});
