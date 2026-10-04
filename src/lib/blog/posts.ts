import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { postFrontmatterSchema, type PostFrontmatter } from "./schema";

/**
 * Server-only content loader for the blog.
 *
 * Reads MDX files from content/blog/, splits YAML frontmatter from the MDX body
 * (gray-matter), and validates the frontmatter against the zod schema. Validation
 * failures throw immediately with the offending file + the specific problem, so
 * the build fails loudly on bad content instead of shipping it.
 *
 * The returned `content` is the raw MDX body (frontmatter stripped) — ready to be
 * handed to next-mdx-remote's <MDXRemote source={content} /> in the route layer
 * (built in a later session).
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type Post = {
  frontmatter: PostFrontmatter;
  /** Raw MDX body with frontmatter removed. */
  content: string;
};

function parsePostFile(fileName: string): Post {
  const filePath = path.join(BLOG_DIR, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const result = postFrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid blog frontmatter in content/blog/${fileName}:\n${issues}`,
    );
  }

  return { frontmatter: result.data, content: content.trim() };
}

/**
 * Build-time memoization: the content directory doesn't change within a build.
 *
 * ⚠️ PRODUCTION ONLY. In dev this cache is a trap: the server reads content/ on
 * first request and memoizes, but content/ isn't part of the module graph, so
 * adding or editing a post never invalidates it. You get a stale list until you
 * restart the server — and if content/blog/ didn't exist when the server
 * booted, you get an empty list forever, which reads as "nothing published"
 * even though the files are right there. Cost of skipping the cache in dev is a
 * directory read per request; the alternative is losing an afternoon to it.
 */
let cache: Post[] | null = null;
const useCache = process.env.NODE_ENV === "production";

function loadAllPosts(): Post[] {
  if (useCache && cache) return cache;

  if (!fs.existsSync(BLOG_DIR)) {
    // Deliberately NOT cached: the directory may be created while the server is
    // running, which is exactly what happens the first time someone adds a post.
    return [];
  }

  const posts = fs
    .readdirSync(BLOG_DIR)
    // Underscore-prefixed files are copy-me templates for editors, not content.
    // ⚠️ Without this filter, content/blog/_template.mdx would PUBLISH — as a
    // live post, in the sitemap, with placeholder copy. Every loader that reads
    // a content/ directory must skip `_` files.
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
    .map(parsePostFile);

  // Slugs are the routing key — duplicates would clobber routes. Fail loudly.
  const seen = new Map<string, string>();
  for (const post of posts) {
    const existing = seen.get(post.frontmatter.slug);
    if (existing) {
      throw new Error(
        `Duplicate blog slug "${post.frontmatter.slug}" in content/blog/ — ` +
          `both "${existing}" and another post declare it. Slugs must be unique.`,
      );
    }
    seen.set(post.frontmatter.slug, post.frontmatter.slug);
  }

  cache = posts;
  return cache;
}

/** All posts, sorted newest-first by publishedAt. */
export function getAllPosts(): Post[] {
  return [...loadAllPosts()].sort(
    (a, b) =>
      b.frontmatter.publishedAt.getTime() - a.frontmatter.publishedAt.getTime(),
  );
}

/** A single post (frontmatter + raw MDX content) by slug, or null if not found. */
export function getPostBySlug(slug: string): Post | null {
  return loadAllPosts().find((post) => post.frontmatter.slug === slug) ?? null;
}

/** All slugs — for generateStaticParams when the route is built. */
export function getAllSlugs(): string[] {
  return loadAllPosts().map((post) => post.frontmatter.slug);
}
