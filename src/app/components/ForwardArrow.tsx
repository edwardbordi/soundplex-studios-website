/**
 * Forward/right arrow for internal, in-flow actions — an inline SVG (lucide-style
 * "arrow-right"), matching OutboundArrow's weight and sizing so the site's arrows
 * read as one system. Use this (straight →) for internal navigation; use
 * OutboundArrow (diagonal ↗) for external links.
 *
 * Decorative (aria-hidden); inherits color via currentColor. Sized in `em` so it
 * stays a bit larger than the link text. Vertical centering relies on the
 * enclosing link being a flex row with `items-center`. On hover of the enclosing
 * `group` link it nudges right, gated behind `motion-safe`. Spacing is handled by
 * the parent's `gap-*` (no margin here).
 */
export default function ForwardArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1.3em] w-[1.3em] shrink-0 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-1"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
