const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(slug) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      "目录名只能包含小写英文字母、数字和单个连字符，例如 building-my-blog。"
    );
  }
  return slug;
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
publishedAt: ${date}
updatedAt:
category: ""
tags: []
series:
draft: true
---

从这里开始写正文。
`;
}
