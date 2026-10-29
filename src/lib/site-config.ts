/**
 * ────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — the ONE place to brand a new site.
 *  Change these values when you spin up a site from this template. Everything
 *  else (metadata, JSON-LD, sitemap, feed, nav, footer) reads from here.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** Site / brand name — used in titles, JSON-LD, the feed, and the footer. */
export const SITE_NAME = "SoundPlex Studios";

/** Production origin — single source of truth for absolute URLs (sitemap, robots, metadataBase). */
export const SITE_URL = "https://soundplexstudios.com";

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
export const PREVIEW_CHROME = true; // wave 2 is in client review; false at launch

/**
 * SAMPLE EVENTS on What's On (/studio-productions) — made-up nights generated from today's date
 * (src/lib/events/samples.ts) so the board, the calendar and the room timeline have something
 * on while George's real calendar is still to come. Samples never get pages, never go in the
 * sitemap or to Google, and a small note on the page says they're samples.
 * WHEN THE REAL EVENTS ARE IN: set this to false (and you can delete samples.ts).
 */
export const SHOW_SAMPLE_EVENTS = true;

/**
 * The walkthrough video: whoever built the site explaining what this preview is
 * and what feedback is wanted. Put an mp4 at public/preview/walkthrough.mp4 and
 * point here, or use a YouTube embed URL. A Loom URL works but loses the speed
 * and fullscreen controls. Empty — the default — makes the widget say it's coming.
 */
export const PREVIEW_WALKTHROUGH_URL: string = "";

/** Where feedback goes when no FEEDBACK_WEBHOOK_URL is set. Your address, not the client's. */
export const PREVIEW_FEEDBACK_EMAIL = "ebordi@icloud.com";

/**
 * The preview deployment: what the speed badge tests and what the walkthrough's QR code opens on a
 * phone. NOT SITE_URL while in review — soundplexstudios.com is still the old site (Ed, 2026-10-29).
 */
export const PREVIEW_TEST_URL = "https://soundplex-studios-website.vercel.app";

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

/**
 * Opening hours, in SITE_TIMEZONE (the live site: Monday – Saturday, 8 AM – 10 PM). HOURS_SPEC
 * drives "Open now · until 10 PM" (lib/hours.ts); HOURS_ROWS is the same week written for people.
 * Change both together.
 */
export const HOURS_SPEC = [
  { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "08:00", closes: "22:00" },
];
export const HOURS_ROWS = [
  { days: "Mon–Sat", time: "8 AM – 10 PM" },
  { days: "Sun", time: "Closed" },
];

/** One-line description used as the default meta description + OG description. */
export const SITE_DESCRIPTION =
  "A creative production and performance space in Pennsauken, NJ — recording studios, podcast studios, and live event spaces in South Jersey.";

/** Legal entity behind the trade name (compliance / footer). */
// Per the live Terms of Service ("SOUNDPLEX STUDIOS operates soundplexstudios.com"); exact
// entity to be confirmed with George — design-process/COMPANY-FACTS.md §1.
export const LEGAL_ENTITY = "SoundPlex Studios";

/** Default social share image (1200×630) at /public/og/…  — replace with your own. */
export const OG_IMAGE_PATH = "/og/default.png";

/** Contact essentials shown in the footer. Leave blank to hide. */
export const CONTACT_EMAIL = "george@thesoundplex.com";
export const PHONE_DISPLAY = "(609) 697-2077";
export const PHONE_TEL = "+16096972077";
export const LOCATION = "6713 Rudderow Ave, Pennsauken, NJ 08109";

/** Off-site profiles — used for JSON-LD sameAs + footer links. Add/remove as needed. */
export const SOCIAL_LINKS: { label: string; url: string }[] = [
  { label: "Facebook", url: "https://facebook.com/thesoundplex" },
  { label: "Instagram", url: "https://instagram.com/thesoundplex" },
];

/**
 * The main navigation — ONE list that every nav surface reads (header, mobile
 * menu, and any future footer nav). Add a page here and it appears everywhere;
 * there is no second list to keep in sync.
 */
export const NAV_LINKS: { href: string; label: string }[] = [
  // The site's IA (design-process/SITE-STRUCTURE-BRIEF.md §6) — the live site's four, same URLs.
  { href: "/about", label: "About" },
  { href: "/studio-productions", label: "Studio Productions" },
  { href: "/rooms", label: "Rooms" },
  { href: "/membership", label: "Membership" },
];

/**
 * Stable JSON-LD identity for the Organization (rendered once in layout.tsx).
 * Anything that ever needs to REFER to the organization (a post's publisher, an
 * event's organizer) points at this @id instead of restating the fields and
 * drifting into a second, conflicting Organization entity.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** The header's one button — the phone number, as a hollow gold button right of the links. */
export const NAV_CTA = { href: `tel:${PHONE_TEL}`, label: `Call ${PHONE_DISPLAY}` };
