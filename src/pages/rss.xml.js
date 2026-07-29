import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../config/site";
import { getPostSlug, getPublishedPosts } from "../lib/posts";

export async function GET(context) {
  const posts = getPublishedPosts(await getCollection("blog"));
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/posts/${getPostSlug(post)}/`,
      categories: [post.data.category, ...post.data.tags]
    })),
    customData: `<language>${SITE.language}</language>`
  });
}
