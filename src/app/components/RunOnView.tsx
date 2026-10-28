"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Adds `run` to its box when it scrolls into view — once per page load by default, or every
 * time it comes back (`once={false}`). The animation itself is CSS — this only says
 * "now". Under reduced motion the CSS shows the finished state and ignores `run`.
 * Same mechanism as the stages stepper on the Surveillance Review site.
 */
export default function RunOnView({ className, children, threshold = 0.45, once = true }: { className: string; children: ReactNode; threshold?: number; once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        // once (default — Ed, 2026-10-28): play the first time it's seen, then stay finished
        // until the page reloads. once={false}: restart every time it comes back into view.
        if (once) {
          el.classList.add("run");
          io.disconnect();
          return;
        }
        el.classList.remove("run");
        void el.offsetWidth; // restart the CSS animations
        el.classList.add("run");
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return <div ref={ref} className={className}>{children}</div>;
}
