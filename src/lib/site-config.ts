/**
 * ────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — the ONE place to brand a new site.
 *  Change these values when you spin up a site from this template. Everything
 *  else (metadata, JSON-LD, sitemap, feed, nav, footer) reads from here.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** Site / brand name — used in titles, JSON-LD, the feed, and the footer. */
export const SITE_NAME = "Your Site";

/** Production origin — single source of truth for absolute URLs (sitemap, robots, metadataBase). */
export const SITE_URL = "https://example.com";

/* ---------------------------------------------------------------------------
 * Review chrome — TEMPORARY, for the client-review phase only
 * -------------------------------------------------------------------------
 * While a site is being reviewed, a small eye nub floats on the edge of every
 * page. Behind it: a walkthrough video, a home-page version switch, a feedback
 * widget that emails notes and records approval, a page-speed badge, and an
 * outline mode showing every spot still waiting on the client.
 *
 * Everything is off until the reviewer switches it on, and each widget's code
 * is only downloaded at that point — a cold visit, and Lighthouse, get the nub
 * and nothing else.
 *
 * AT LAUNCH: set PREVIEW_CHROME to false, then delete PreviewChrome, ReviewMenu,
 * ReviewIcons, NotesWidget, Walkthrough, VariantToggle, SpeedBadge, useEdgeDock,
 * previewPrefs, /api/feedback, any variant routes, and this block.
 * ------------------------------------------------------------------------- */

/** The master switch. False ships the site with no review chrome at all. */
export const PREVIEW_CHROME = false;

/**
 * The walkthrough video: whoever built the site explaining what this preview is
 * and what feedback is wanted. Put an mp4 at public/preview/walkthrough.mp4 and
 * point here, or use a YouTube embed URL. A Loom URL works but loses the speed
 * and fullscreen controls. Empty — the default — makes the widget say it's coming.
 */
export const PREVIEW_WALKTHROUGH_URL: string = "";

/** Where feedback goes when no FEEDBACK_WEBHOOK_URL is set. Your address, not the client's. */
export const PREVIEW_FEEDBACK_EMAIL = "";

/** The URL the speed badge offers to test — usually the preview deployment. */
export const PREVIEW_TEST_URL = SITE_URL;

/**
 * Home-page versions to offer the reviewer, when a build is showing more than
 * one. Empty hides the switch entirely. Each `href` needs a real route.
 */
export const PREVIEW_VARIANTS: { href: string; label: string }[] = [];

/** Last PageSpeed Insights snapshot, filled in by hand after a run. */
export const PREVIEW_SCORES = {
  measured: "",
  desktop: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
  mobile: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
};

/**
 * The time zone event dates and times are read in when an event doesn't name
 * its own. CHANGE THIS to the site's home zone — an IANA name such as
 * "America/Chicago", "America/Los_Angeles" or "Europe/London".
 */
export const SITE_TIMEZONE = "America/New_York";

/** One-line description used as the default meta description + OG description. */
export const SITE_DESCRIPTION =
  "A fast, owned, AI-search-ready website built on the site-starter framework.";

/** Legal entity behind the trade name (compliance / footer). */
export const LEGAL_ENTITY = "Your Company LLC";

/** Default social share image (1200×630) at /public/og/…  — replace with your own. */
export const OG_IMAGE_PATH = "/og/default.png";

/** Contact essentials shown in the footer. Leave blank to hide. */
export const CONTACT_EMAIL = "hello@example.com";
export const PHONE_DISPLAY = "";
export const PHONE_TEL = "";
export const LOCATION = "";

/** Off-site profiles — used for JSON-LD sameAs + footer links. Add/remove as needed. */
export const SOCIAL_LINKS: { label: string; url: string }[] = [];

/**
 * The main navigation — ONE list that every nav surface reads (header, mobile
 * menu, and any future footer nav). Add a page here and it appears everywhere;
 * there is no second list to keep in sync.
 */
export const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/book", label: "Contact" },
];

/**
 * Stable JSON-LD identity for the Organization (rendered once in layout.tsx).
 * Anything that ever needs to REFER to the organization (a post's publisher, an
 * event's organizer) points at this @id instead of restating the fields and
 * drifting into a second, conflicting Organization entity.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
