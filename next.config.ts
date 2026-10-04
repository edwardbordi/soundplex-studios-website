import type { NextConfig } from "next";

/**
 * Site-wide redirects. EMPTY by default — add your own when you migrate an old
 * site onto this one (e.g. WordPress → Next domain cutover), so old indexed URLs
 * keep their ranking. `permanent: true` emits HTTP 308, which Google/Bing treat
 * identically to a 301 for ranking transfer.
 *
 * Example:
 *   { source: "/old-path/", destination: "/new-path", permanent: true },
 */
const redirects = async () => [
  /**
   * Page 1 of the blog archive is /blog. /blog/page/1 would serve the exact
   * same posts at a second URL — a self-inflicted duplicate that splits
   * whatever links the archive earns between two addresses and gives Google a
   * pick-one problem it did not need to have.
   *
   * A redirect rather than a 404 because the URL is guessable: readers on
   * /blog/page/2 hit "Previous" or hand-edit the number, and crawlers try it
   * unprompted. 308 keeps it out of the index permanently while still resolving.
   *
   * Nothing in the app ever links here — blogPagePath() in lib/blog/pagination.ts
   * returns "/blog" for page 1 precisely so this redirect stays a safety net
   * rather than a hop in the normal path.
   */
  { source: "/blog/page/1", destination: "/blog", permanent: true },
  // The hero v2 review page (Sept 2026) became the homepage. Anyone holding the old link
  // (George) lands on the real thing. Query strings (?night=…) carry over.
  { source: "/v2", destination: "/", permanent: true },
  // WordPress → new routes. The full map with reasoning is design-process/URL-MAP.md;
  // this list grows as wave 2 pages land. Nothing Google has today may 404.
  { source: "/sp-room", destination: "/rooms", permanent: true },
  { source: "/sp-room/:slug", destination: "/rooms", permanent: true },
  { source: "/privacy-policy", destination: "/privacy", permanent: true },
  { source: "/terms-of-service", destination: "/terms", permanent: true },
];

/**
 * Baseline security headers applied to every route. A restrictive
 * Content-Security-Policy is intentionally NOT set here — a wrong CSP can break
 * fonts, inline JSON-LD, or embeds. Add a tuned CSP as a deliberate later step.
 */
const headers = async () => [
  {
    source: "/:path*",
    headers: [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ],
  },
  // /admin is a back office: never indexed, never cached by a shared cache.
  {
    source: "/admin/:path*",
    headers: [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Cache-Control", value: "private, no-store" },
    ],
  },
];

const nextConfig: NextConfig = {
  redirects,
  headers,

  /* ── Ship content/ with the server bundle ────────────────────────────────
     The loaders read content/ from disk at request time (dev, and ISR
     regeneration if a site enables it). Next's file tracer follows imports,
     and a content/ directory reached only through fs calls is exactly the
     case tracing is least reliable about. If content/ is left behind, pages
     that worked at build time 500 after deploy. Including the whole folder is
     cheap insurance. */
  outputFileTracingIncludes: {
    "/**": ["./content/**"],
  },

  experimental: {
    /* /admin saves carry a post's pictures as base64: up to 3.5 MB decoded ≈
       4.7 MB encoded. Vercel's hard cap on a function body is 4.5 MB, so the
       real ceiling is the server-side check in src/lib/admin/images.ts. */
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
