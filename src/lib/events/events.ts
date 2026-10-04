import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { eventFrontmatterSchema, type EventItem } from "./schema";

/**
 * Server-only loader for events, the same shape as lib/blog/posts.ts: read
 * content/events/, validate each file's frontmatter, fail the build loudly on
 * a bad one. Underscore-prefixed files are templates, never content.
 */

const DIR = path.join(process.cwd(), "content", "events");

export type EventEntry = {
  frontmatter: EventItem;
  /** Raw MDX body with frontmatter removed — the long description. */
  content: string;
};

function parseFile(fileName: string): EventEntry {
  const raw = fs.readFileSync(path.join(DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const result = eventFrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`Invalid frontmatter in content/events/${fileName}:\n${issues}`);
  }
  return { frontmatter: result.data, content: content.trim() };
}

let cache: EventEntry[] | null = null;

export function getAllEvents(): EventEntry[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(DIR)) return [];
  const all = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
    .map(parseFile);
  if (process.env.NODE_ENV === "production") cache = all;
  return all;
}

export function getEventBySlug(slug: string): EventEntry | null {
  return getAllEvents().find((e) => e.frontmatter.slug === slug) ?? null;
}
