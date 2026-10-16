import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { roomFrontmatterSchema, type RoomItem } from "./schema";

/** Server-only loader, same shape as lib/events/events.ts. Fails the build on bad frontmatter. */
const DIR = path.join(process.cwd(), "content", "rooms");

export type RoomEntry = { frontmatter: RoomItem; content: string };

function parseFile(fileName: string): RoomEntry {
  const raw = fs.readFileSync(path.join(DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const result = roomFrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`Invalid frontmatter in content/rooms/${fileName}:\n${issues}`);
  }
  return { frontmatter: result.data, content: content.trim() };
}

let cache: RoomEntry[] | null = null;

export function getAllRooms(): RoomEntry[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(DIR)) return [];
  const all = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
    .map(parseFile)
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order);
  if (process.env.NODE_ENV === "production") cache = all;
  return all;
}

export function getRoomBySlug(slug: string): RoomEntry | null {
  return getAllRooms().find((r) => r.frontmatter.slug === slug) ?? null;
}
