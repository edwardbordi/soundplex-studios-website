// Shared date formatting for the blog. Fixed locale + UTC time zone so the
// rendered string is deterministic (no SSR/client hydration drift, and no
// off-by-one from a date stored as UTC midnight being shifted into a local tz).
const postDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/** e.g. "June 24, 2026" — full month, for the post-page header. */
export function formatPostDate(date: Date): string {
  return postDateFormatter.format(date);
}

// Compact variant for the index cards: three-letter month, no period (the card
// eyebrow CSS uppercases it → "JUL 2, 2026", "FEB 23, 2026").
const postDateShortFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** e.g. "Jul 2, 2026" — short month, for the compact index cards. */
export function formatPostDateShort(date: Date): string {
  return postDateShortFormatter.format(date);
}

/**
 * Estimated read time in minutes from an MDX/markdown body: JSX component tags
 * stripped (so they don't inflate the count), words ÷ 230 wpm, rounded, min 1.
 * Shared by the post-page pill and the blog-index cards so both agree.
 */
export function readingTimeMinutes(body: string): number {
  const words = body
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
