import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "../../../../lib/seo";
import { SITE_NAME } from "../../../../lib/site-config";
import { parsePageParam, totalBlogPages } from "../../../../lib/blog/pagination";
import BlogArchive from "../../BlogArchive";

/**
 * /blog/page/[page] — pages 2, 3, … of the blog archive.
 *
 * Real server-rendered pages with real <a href> links, not a "load more" button.
 * Googlebot does not click; a JS-gated archive leaves every post past the first
 * page with no crawlable path, and they drop out of the index.
 *
 * Page 1 deliberately does NOT live here — /blog is page 1, and /blog/page/1
 * 308s to it (next.config.ts) so the same posts never exist at two URLs.
 */

// One prerendered page per real page number, starting at 2. dynamicParams=false
// makes everything else — page 1, out-of-range, zero, negative, non-numeric —
// a 404 without a request ever reaching the component.
export function generateStaticParams() {
  const pages = totalBlogPages();
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}
export const dynamicParams = false;

/**
 * SELF-referencing canonical: /blog/page/2 canonicalises to /blog/page/2,
 * never back to /blog.
 *
 * This is the single most common mistake in a paginated archive. Canonicalising
 * page 2 to page 1 tells Google page 2 is a duplicate — so it de-indexes it, and
 * with it the only links pointing at the posts on page 2. The posts go with it.
 *
 * The title differs per page for the same reason: pages sharing one title
 * compete with each other as duplicates.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const page = parsePageParam((await params).page);
  // Unreachable in practice (dynamicParams=false filters these first), but a
  // metadata function that throws takes the whole render with it.
  if (page === null || page < 2 || page > totalBlogPages()) return {};

  return buildPageMetadata({
    title: `Writing — page ${page} — ${SITE_NAME}`,
    description: `Page ${page} of articles and notes from ${SITE_NAME}.`,
    path: `/blog/page/${page}`,
    focusKeyword: "blog",
  });
}

export default async function BlogArchivePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const page = parsePageParam((await params).page);
  // page < 2 is a 404 rather than a redirect: next.config.ts already 308s
  // /blog/page/1 before routing gets here, so anything still arriving as 1 is
  // a URL that should not exist.
  if (page === null || page < 2 || page > totalBlogPages()) notFound();

  return <BlogArchive page={page} />;
}
