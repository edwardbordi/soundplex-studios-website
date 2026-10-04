import { getAllPosts } from "../../lib/blog/posts";
import { SITE_URL, SITE_NAME } from "../../lib/site-config";

// RSS 2.0 feed at /feed.xml — generated from the blog posts (same source as the sitemap). Static:
// regenerated at build time with the rest of the site (everything is in-repo).
export const dynamic = "force-static";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function GET(): Response {
  const posts = getAllPosts();
  const updated = posts[0]?.frontmatter.publishedAt ?? new Date();

  const items = posts
    .map((p) => {
      const f = p.frontmatter;
      const url = `${SITE_URL}/blog/${f.slug}`;
      return `    <item>
      <title>${esc(f.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(f.description)}</description>
      <pubDate>${f.publishedAt.toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE_NAME)} — Writing</title>
    <link>${SITE_URL}/blog</link>
    <description>Writing from ${esc(SITE_NAME)}.</description>
    <language>en-us</language>
    <lastBuildDate>${updated.toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
