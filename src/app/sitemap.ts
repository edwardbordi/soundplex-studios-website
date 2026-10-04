import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site-config";
import { getAllPosts } from "../lib/blog/posts";
import { totalBlogPages } from "../lib/blog/pagination";
import { getAllEvents } from "../lib/events/events";

/**
 * sitemap.xml — Next 16 file convention (app/sitemap.ts).
 *
 * Static pages are listed explicitly; blog posts are pulled from the loader so
 * new posts appear automatically. Post lastModified prefers updatedAt, falling
 * back to publishedAt.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/book`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/events`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Archive pages from page 2 onward — /blog itself is page 1 and is already
  // listed above. Never list /blog/page/1: it 308s (next.config.ts), and a
  // sitemap must not contain a redirecting URL.
  const archivePages: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, totalBlogPages() - 1) },
    (_, i) => ({
      url: `${SITE_URL}/blog/page/${i + 2}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }),
  );

  const posts: MetadataRoute.Sitemap = getAllPosts().map(({ frontmatter }) => ({
    url: `${SITE_URL}/blog/${frontmatter.slug}`,
    lastModified: frontmatter.updatedAt ?? frontmatter.publishedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const events: MetadataRoute.Sitemap = getAllEvents().map(({ frontmatter }) => ({
    url: `${SITE_URL}/events/${frontmatter.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...archivePages, ...posts, ...events];
}
