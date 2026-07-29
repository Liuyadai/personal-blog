import type { CollectionEntry } from "astro:content";

export type BlogEntry = CollectionEntry<"blog">;

export interface TimelineGroup<T> {
  key: string;
  label: string;
  posts: T[];
}
