"use client";

import { useEffect, useRef, useState } from "react";

/**
 * rAF "chase" toward a moving target: each frame closes ~18% of the gap,
 * so a big displayed number glides smoothly while an input (slider, field)
 * is being dragged, instead of restarting a tween on every input event.
 *
 * Pass `instant: true` (e.g. from a prefers-reduced-motion check) to jump
 * straight to the value with no animation.
 */
export default function useChasedNumber(target: number, instant: boolean) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);
  useEffect(() => {
    if (instant) {
      displayRef.current = target;
      // Reduced-motion path: jump straight to the value. One-shot, guarded — not a cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(target);
      return;
    }
    let raf = 0;
    const tick = () => {
      const cur = displayRef.current;
      const next = cur + (target - cur) * 0.18;
      if (Math.abs(target - next) < 2) {
        displayRef.current = target;
        setDisplay(target);
        return;
      }
      displayRef.current = next;
      setDisplay(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, instant]);
  return display;
}
