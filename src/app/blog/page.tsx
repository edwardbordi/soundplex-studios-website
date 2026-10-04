import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";
import BlogArchive from "./BlogArchive";

/**
 * /blog — page 1 of the archive. Pages 2+ live at /blog/page/[page]; both
 * render through BlogArchive so they can never drift apart. /blog/page/1
 * 308s here (next.config.ts) so page 1 never exists at two URLs.
 */
export const metadata = buildPageMetadata({
  title: `Writing — ${SITE_NAME}`,
  description: `Articles and notes from ${SITE_NAME}.`,
  path: "/blog",
  focusKeyword: "blog",
});

export default function BlogIndexPage() {
  return <BlogArchive page={1} />;
}
