/**
 * Back/left arrow for "return" navigation (e.g. back-to-blog) — the mirror of
 * ForwardArrow (lucide-style "arrow-left"), so it shares the exact weight and
 * sizing of the site's arrow system. Decorative (aria-hidden); inherits color via
 * currentColor. On hover of the enclosing `group` link it nudges left, gated
 * behind `motion-safe`. Spacing is handled by the parent's `gap-*`.
 */
export default function BackArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1.3em] w-[1.3em] shrink-0 transition-transform duration-200 ease-out motion-safe:group-hover:-translate-x-1"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}
