import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildPostTemplate,
  normalizeArticlePath,
  resolveArticleDirectory
} from "./post-template.mjs";

export async function createArticleDraft({
  contentRoot,
  articlePath,
  title,
  date
}) {
  const normalizedPath = normalizeArticlePath(articlePath);
  const directory = resolveArticleDirectory(contentRoot, normalizedPath);
  const filePath = path.join(directory, "index.md");

  try {
    await access(directory);
    throw new Error(`文章目录已经存在：${directory}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  await mkdir(directory, { recursive: true });
  await writeFile(filePath, buildPostTemplate({ title, date }), "utf8");

  return { articlePath: normalizedPath, directory, filePath };
}
