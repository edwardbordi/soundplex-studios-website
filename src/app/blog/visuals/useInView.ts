"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the element first scrolls into view, for scroll-triggered
 * post visuals. Shared by all blog chart/graphic components so the trigger +
 * reduced-motion handling stay consistent.
 *
 * Returns `{ ref, active }`. `active` flips true to start animations.
 * - Reduced motion (or no IntersectionObserver): `active` is true immediately,
 *   so components should render their FINAL state with no transition/count.
 * - Otherwise it flips true the first time the element crosses `threshold`
 *   in the viewport, then the observer disconnects (fires once).
 */
export function useInView(threshold = 0.4): {
  ref: React.RefObject<HTMLDivElement | null>;
  active: boolean;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Reduced motion or unsupported: show the resolved state right away.
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      // One-shot sync of an environment state (reduced-motion / no IO) read on
      // mount — not a render cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            observer.disconnect();
          }
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, active };
}

/**
 * True when the user prefers reduced motion (read once on mount). Components use
 * it to skip count-up/transition work and jump straight to final values.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    // Sync the OS reduced-motion preference into state once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reduced;
}
