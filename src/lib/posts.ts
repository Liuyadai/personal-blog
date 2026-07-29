import type { BlogEntry, TimelineGroup } from "../types/blog";
import { SITE } from "../config/site";
import { taxonomySlug } from "../config/taxonomy";

export function getPostSlug(post: Pick<BlogEntry, "id">) {
  return post.id.replace(/\/index$/, "").replace(/\\/g, "/");
}

export function getPublishedPosts(posts: BlogEntry[]) {
  return posts
    .filter((post) => !post.data.draft)
    .sort((left, right) => {
      const dateDifference =
        right.data.publishedAt.getTime() - left.data.publishedAt.getTime();
      return dateDifference || getPostSlug(left).localeCompare(getPostSlug(right));
    });
}

export function getHomePosts(posts: BlogEntry[]) {
  return getPublishedPosts(posts).slice(0, SITE.homePostLimit);
}

export function groupPostsByMonth(posts: BlogEntry[]): TimelineGroup<BlogEntry>[] {
  const formatter = new Intl.DateTimeFormat(SITE.locale, {
    year: "numeric",
    month: "long",
    timeZone: SITE.timezone
  });
  const groups = new Map<string, TimelineGroup<BlogEntry>>();

  for (const post of getPublishedPosts(posts)) {
    const date = post.data.publishedAt;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const existing = groups.get(key) ?? {
      key,
      label: formatter.format(date),
      posts: []
    };
    existing.posts.push(post);
    groups.set(key, existing);
  }

  return [...groups.values()];
}

export function getAllTags(posts: BlogEntry[]) {
  const tags = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of getPublishedPosts(posts)) {
    for (const name of post.data.tags) {
      const slug = taxonomySlug(name, "tag");
      const current = tags.get(slug);
      tags.set(slug, {
        name,
        slug,
        count: (current?.count ?? 0) + 1
      });
    }
  }
  return [...tags.values()].sort(
    (left, right) =>
      right.count - left.count || left.name.localeCompare(right.name, SITE.locale)
  );
}

export function getAllSeries(posts: BlogEntry[]) {
  const series = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of getPublishedPosts(posts)) {
    const name = post.data.series;
    if (!name) continue;
    const slug = taxonomySlug(name, "series");
    const current = series.get(slug);
    series.set(slug, {
      name,
      slug,
      count: (current?.count ?? 0) + 1
    });
  }
  return [...series.values()].sort((left, right) =>
    left.name.localeCompare(right.name, SITE.locale)
  );
}

export function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat(SITE.locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: SITE.timezone
  }).format(date);
}

export function formatTimelineDate(date: Date) {
  return new Intl.DateTimeFormat(SITE.locale, {
    month: "2-digit",
    day: "2-digit",
    timeZone: SITE.timezone
  }).format(date);
}

export function daysSinceLatestPost(
  posts: BlogEntry[],
  now = new Date()
): number | null {
  const latest = getPublishedPosts(posts)[0];
  if (!latest) return null;

  const start = Date.UTC(
    latest.data.publishedAt.getUTCFullYear(),
    latest.data.publishedAt.getUTCMonth(),
    latest.data.publishedAt.getUTCDate()
  );
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}
