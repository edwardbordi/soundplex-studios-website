"use client";

import { useEffect, useRef, useState } from "react";

// Ease-out cubic — fast start, gentle settle. No overshoot/bounce.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animated count-up number. Ticks from 0 up to `to` once, the first time it
 * scrolls into view (IntersectionObserver, then unobserves). Renders just the
 * number — wrap it with whatever label/suffix markup the layout needs.
 *
 * Respects prefers-reduced-motion: such users (and browsers without
 * IntersectionObserver) see the final value immediately, no animation.
 */
export default function CountUp({
  to,
  decimals = 0,
  durationMs = 1400,
  className,
}: {
  to: number;
  decimals?: number;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // No tick animation for reduced-motion or unsupported environments: jump to
    // the final value on the next frame. Scheduling via rAF (rather than a
    // synchronous effect-body setState) keeps the SSR/initial render at 0 — no
    // hydration mismatch — and satisfies react-hooks/set-state-in-effect.
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(raf);
    }

    let raf = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / durationMs, 1);
      setValue(to * easeOut(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            raf = requestAnimationFrame(step);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
    </span>
  );
}
