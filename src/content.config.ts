import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { CATEGORY_NAMES } from "./config/taxonomy";
import { isValidCalendarDate } from "../scripts/lib/content-rules.mjs";

const requiredDate = z
  .string()
  .refine(isValidCalendarDate, "日期必须是有效的 YYYY-MM-DD")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const optionalDate = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  requiredDate.optional()
);

const optionalText = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().trim().min(1).optional()
);

const blog = defineCollection({
  loader: glob({
    base: "./src/content/blog",
    pattern: "**/*.{md,mdx}"
  }),
  schema: z
    .object({
      title: z.string().trim().min(1, "title 不能为空"),
      description: z.string().trim().min(1, "description 不能为空"),
      publishedAt: requiredDate,
      updatedAt: optionalDate,
      category: z.enum(CATEGORY_NAMES),
      tags: z.array(z.string().trim().min(1)).default([]),
      series: optionalText,
      draft: z.boolean()
    })
    .refine(
      ({ publishedAt, updatedAt }) =>
        !updatedAt || updatedAt.getTime() >= publishedAt.getTime(),
      {
        message: "updatedAt 不能早于 publishedAt",
        path: ["updatedAt"]
      }
    )
});

export const collections = { blog };
