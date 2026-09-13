import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  buildPostTemplate,
  normalizeArticlePath,
  resolveArticleDirectory
} from "./lib/post-template.mjs";

const [, , titleArgument, slugArgument] = process.argv;
const prompt = createInterface({ input, output });

try {
  const title = (titleArgument ?? (await prompt.question("文章标题："))).trim();
  const articlePath = normalizeArticlePath(
    (slugArgument ?? (await prompt.question("文章路径（支持多级，英文或拼音）："))).trim()
  );

  if (!title) {
    throw new Error("文章标题不能为空。");
  }

  const contentRoot = path.join(process.cwd(), "src", "content", "blog");
  const articleDirectory = resolveArticleDirectory(contentRoot, articlePath);
  const articleFilePath = path.join(articleDirectory, "index.md");

  try {
    await access(articleDirectory);
    throw new Error(`文章目录已经存在：${articleDirectory}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  await mkdir(articleDirectory, { recursive: true });
  await writeFile(articleFilePath, buildPostTemplate({ title }), "utf8");

  console.log(`\n已创建草稿：${articleFilePath}`);
  console.log("下一步：填写 description、category 和正文，然后运行 npm run dev 预览。");
} catch (error) {
  console.error(`\n创建失败：${error.message}`);
  process.exitCode = 1;
} finally {
  prompt.close();
}
