import Link from "next/link";
import BackArrow from "../components/BackArrow";
import ForwardArrow from "../components/ForwardArrow";
import { blogPagePath } from "../../lib/blog/pagination";

/**
 * The blog archive pager.
 *
 * A server component with nothing but links, on purpose. Googlebot does not
 * click buttons, submit forms or fire click handlers, so a JS "load more" leaves
 * every post past the first page with no crawlable path to it. Every control
 * here renders as a real <a href> in the server HTML (next/link emits one), so
 * the archive is walkable with JavaScript switched off entirely.
 *
 * Renders nothing at a single page — a pager over one page is furniture.
 */
export default function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-8"
      aria-label="Pagination"
    >
      {/* Prev/next are omitted rather than rendered disabled at the ends: a
          greyed-out control is still a tab stop and still announces itself. */}
      {page > 1 ? (
        <Link
          className="font-mono-label group inline-flex items-center gap-2 text-sm text-ink transition-colors hover:text-signal-strong"
          href={blogPagePath(page - 1)}
          rel="prev"
        >
          <BackArrow />
          Previous
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}

      <ol className="flex items-center gap-2">
        {pages.map((n) => (
          <li key={n}>
            {n === page ? (
              /* Not a link — the current page must not link to itself, and
                 aria-current is what tells a screen reader where it is. */
              <span
                className="font-mono-label inline-flex h-8 w-8 items-center justify-center rounded-full bg-signal/10 text-sm text-signal-strong"
                aria-current="page"
              >
                {n}
              </span>
            ) : (
              <Link
                className="font-mono-label inline-flex h-8 w-8 items-center justify-center rounded-full text-sm text-slate transition-colors hover:text-ink"
                href={blogPagePath(n)}
              >
                <span className="sr-only">Page </span>
                {n}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {page < totalPages ? (
        <Link
          className="font-mono-label group inline-flex items-center gap-2 text-sm text-ink transition-colors hover:text-signal-strong"
          href={blogPagePath(page + 1)}
          rel="next"
        >
          Next
          <ForwardArrow />
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
