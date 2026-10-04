/**
 * "The short version" — a dark ink summary panel at the top of the pillar post,
 * matching the chart/graphic cards' treatment (ink→ink-2, line-dark border,
 * signal-light eyebrow). Reading-column width (not Breakout). `visual-reset`
 * frees its bare <p>s from .blog-prose's element colors so the tokens apply.
 */
export default function ShortVersion() {
  return (
    <div className="visual-reset rounded-2xl border border-line-dark bg-linear-to-b from-ink to-ink-2 p-6 text-bone sm:p-8">
      <p className="eyebrow text-signal-light">The short version</p>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-bone/80">
        Diagnose before you buy anything. Map your real constraints, rank them by
        what your business needs at its current stage, and fix the top one deeply
        — don&apos;t run ten shallow pilots. Redesign the work around the AI
        instead of bolting a tool onto a broken process (the tool is ~20% of the
        value; the redesign is the other 80%). Build cost controls and human
        oversight in from day one. Measure whether the constraint actually moved.
        Then take the next item on the list. The rest of this article is the why
        and the how.
      </p>
    </div>
  );
}
