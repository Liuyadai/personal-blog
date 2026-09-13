import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  normalizeArticlePath
} from "./lib/post-template.mjs";
import { createArticleDraft } from "./lib/post-files.mjs";

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
  const { filePath: articleFilePath } = await createArticleDraft({
    contentRoot,
    articlePath,
    title
  });

  console.log(`\n已创建草稿：${articleFilePath}`);
  console.log("下一步：填写 description、category 和正文，然后运行 npm run dev 预览。");
} catch (error) {
  console.error(`\n创建失败：${error.message}`);
  process.exitCode = 1;
} finally {
  prompt.close();
}
