import path from "node:path";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(slug) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      "目录名只能包含小写英文字母、数字和单个连字符，例如 building-my-blog。"
    );
  }
  return slug;
}

export function normalizeArticlePath(value) {
  const input = value.trim();
  if (
    !input ||
    /^[\\/]/.test(input) ||
    /^[a-zA-Z]:[\\/]/.test(input)
  ) {
    throw new Error(
      "文章路径必须是 src/content/blog 下的相对路径，例如 database/mysql/partition-table2。"
    );
  }

  const normalized = input.replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (
    segments.some(
      (segment) =>
        !segment || segment === "." || segment === ".." || !SLUG_PATTERN.test(segment)
    )
  ) {
    throw new Error(
      "文章路径的每一级只能包含小写英文字母、数字和单个连字符，例如 database/mysql/partition-table2。"
    );
  }
  return segments.join("/");
}

export function resolveArticleDirectory(contentRoot, value) {
  const articlePath = normalizeArticlePath(value);
  const root = path.resolve(contentRoot);
  const target = path.resolve(root, ...articlePath.split("/"));
  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new Error("文章路径超出了 src/content/blog 目录。请使用安全的相对路径。");
  }
  return target;
}

export function escapeYamlString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function shanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

export function buildPostTemplate({ title, date = shanghaiDate() }) {
  const safeTitle = escapeYamlString(title.trim());
  return `---
title: "${safeTitle}"
description: ""
publishedAt: "${date}"
updatedAt:
category: ""
tags: []
series:
draft: true
---

从这里开始写正文。
`;
}
