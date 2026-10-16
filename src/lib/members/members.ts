import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { memberFrontmatterSchema, type MemberItem } from "./schema";

/**
 * Server-only loader for the Connection Wall. Returns the wall's data in the shape the
 * widget consumes: members in wall order, and connections where BOTH sides have agreed.
 */
const DIR = path.join(process.cwd(), "content", "members");

export type WallMember = {
  id: string;
  name: string;
  role: string;
  story: string;
  offer: string;
  looking: string;
  portrait?: string;
};
export type WallConnection = { between: [string, string]; steps: [string, string, string]; permission: boolean };

function parseFile(fileName: string): MemberItem {
  const raw = fs.readFileSync(path.join(DIR, fileName), "utf8");
  const { data } = matter(raw);
  const result = memberFrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`Invalid frontmatter in content/members/${fileName}:\n${issues}`);
  }
  return result.data;
}

let cache: MemberItem[] | null = null;

export function getAllMembers(): MemberItem[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(DIR)) return [];
  const all = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
    .map(parseFile)
    .sort((a, b) => a.order - b.order);
  if (process.env.NODE_ENV === "production") cache = all;
  return all;
}

/** The public wall: members who've agreed, and connections both sides agreed to. */
export function getWall(): { members: WallMember[]; connections: WallConnection[] } {
  const all = getAllMembers().filter((m) => m.permission);
  const ok = new Set(all.map((m) => m.slug));
  const members: WallMember[] = all.map((m) => ({
    id: m.slug,
    name: m.name,
    role: m.role,
    story: m.story,
    offer: m.offer,
    looking: m.looking,
    ...(m.portrait ? { portrait: m.portrait } : {}),
  }));
  const seen = new Set<string>();
  const connections: WallConnection[] = [];
  for (const m of all) {
    for (const c of m.connections) {
      if (!ok.has(c.with)) continue;
      const key = [m.slug, c.with].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      connections.push({ between: [m.slug, c.with], steps: c.steps, permission: true });
    }
  }
  return { members, connections };
}
