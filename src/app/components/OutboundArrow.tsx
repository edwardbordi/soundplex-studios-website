/**
 * Outbound/diagonal arrow for external links — an inline SVG (lucide-style
 * "arrow-up-right"). We use an SVG rather than the Unicode ↗ glyph because that
 * glyph is drawn high within its character box, so box-centering never visually
 * centers it; an SVG's artwork is centered in its viewBox and can be flex-aligned.
 *
 * Decorative (aria-hidden); inherits the link's color via currentColor. Sized in
 * `em` so it stays a bit larger than the link's text without changing the text
 * size. Vertical centering relies on the enclosing link being a flex row with
 * `items-center`. On hover of the enclosing `group` link it lifts up-and-right,
 * gated behind `motion-safe` so it's disabled under reduced motion.
 */
export default function OutboundArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-0.5 h-[1.3em] w-[1.3em] shrink-0 transition-transform duration-150 ease-out motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}
