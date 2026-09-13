import path from "node:path";

const REDIRECT_STATUSES = new Set(["301", "302", "307", "308"]);

export function parseRedirects(source) {
  return source.split(/\r?\n/).flatMap((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return [];
    const [sourcePath, destination, status] = trimmed.split(/\s+/);
    return [{
      lineNumber: index + 1,
      source: sourcePath,
      destination,
      status
    }];
  });
}

function destinationArtifact(destination) {
  if (!destination?.startsWith("/")) return null;
  const clean = destination.split(/[?#]/)[0];
  if (clean === "/") return "index.html";
  const relative = clean.replace(/^\/+/, "");
  return path.posix.extname(relative)
    ? relative
    : `${relative.replace(/\/+$/, "")}/index.html`;
}

export function validateRedirects(entries, artifacts) {
  const failures = [];
  for (const entry of entries) {
    if (!REDIRECT_STATUSES.has(entry.status)) {
      failures.push(
        `_redirects 第 ${entry.lineNumber} 行使用了不支持的状态码：${entry.status ?? "缺失"}`
      );
    }
    const artifact = destinationArtifact(entry.destination);
    if (!artifact || !artifacts.has(artifact)) {
      failures.push(
        `_redirects 第 ${entry.lineNumber} 行目标没有构建产物：${entry.destination ?? "缺失"}`
      );
    }
  }
  return failures;
}

export function validatePagefindMarkers(pages, publishedArticleUrls) {
  const failures = [];
  for (const [url, html] of pages) {
    const hasMarker = /\bdata-pagefind-body(?:\s|=|>)/.test(html);
    if (hasMarker && !publishedArticleUrls.has(url)) {
      failures.push(`非文章页面包含 Pagefind 正文标记：${url}`);
    }
  }
  for (const url of publishedArticleUrls) {
    if (!/\bdata-pagefind-body(?:\s|=|>)/.test(pages.get(url) ?? "")) {
      failures.push(`正式文章缺少 Pagefind 正文标记：${url}`);
    }
  }
  return failures;
}

export function articleRouteFromFile(contentRoot, filePath) {
  const slug = path
    .relative(contentRoot, path.dirname(filePath))
    .replace(/\\/g, "/");
  return {
    slug,
    url: `/posts/${slug}/`,
    artifact: `posts/${slug}/index.html`
  };
}
