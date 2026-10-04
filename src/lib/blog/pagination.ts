import { getAllPosts, type Post } from "./posts";

/**
 * Paging rules for the blog archive.
 *
 * Kept out of the route files because /blog, /blog/page/[page] and that route's
 * generateStaticParams all have to agree on the same arithmetic — if any one of
 * them disagrees, Google finds either a gap in the archive or a page number that
 * 404s, and both quietly strip crawl paths to the older posts.
 */

/** Posts per archive page. One number, one place — never inline this. */
export const POSTS_PER_PAGE = 9;

/**
 * The archive order: `featured` posts first, then newest-first.
 *
 * The ordering has to happen BEFORE the slice. The index gives the lead slots
 * to featured posts, so if they were promoted after paging they would appear as
 * the lead on page 1 *and* still be listed on whichever page their date puts
 * them — the same post twice, which is a duplicate-content signal, not a design
 * quirk.
 */
function orderedPosts(): Post[] {
  const posts = getAllPosts();
  return [
    ...posts.filter((p) => p.frontmatter.featured),
    ...posts.filter((p) => !p.frontmatter.featured),
  ];
}

/**
 * How many archive pages exist. Never returns 0: a blog with no posts still has
 * a page 1, because /blog renders a written empty state rather than a 404.
 */
export function totalBlogPages(): number {
  return Math.max(1, Math.ceil(orderedPosts().length / POSTS_PER_PAGE));
}

/** The posts on a given 1-based page. Out-of-range pages return []. */
export function getPostsForPage(page: number): Post[] {
  const start = (page - 1) * POSTS_PER_PAGE;
  return orderedPosts().slice(start, start + POSTS_PER_PAGE);
}

/**
 * The one canonical path for an archive page. Page 1 is always /blog — the
 * /blog/page/1 form is a 308 (see next.config.ts) and must never be linked.
 */
export function blogPagePath(page: number): string {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}

/**
 * Strict 1-based page number from a URL segment, or null.
 *
 * Deliberately stricter than Number(): "02", "2.0", "+2", " 2" and "2e0" all
 * parse to 2 loosely, which would mint a family of URLs serving identical
 * content. Anything that isn't the exact canonical spelling is a 404.
 */
export function parsePageParam(raw: string): number | null {
  if (!/^[1-9][0-9]*$/.test(raw)) return null;
  const page = Number(raw);
  return Number.isSafeInteger(page) ? page : null;
}
