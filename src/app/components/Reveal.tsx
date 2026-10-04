"use client";

import { useEffect, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** ms delay before this element animates in — for gentle stagger */
  delay?: number;
  /** render as a different element (default: div) */
  as?: ElementType;
  className?: string;
  /**
   * Above-the-fold content ONLY: reveals via a pure-CSS animation on load
   * instead of waiting for hydration + IntersectionObserver. Without this,
   * wrapping the hero (the LCP element) in <Reveal> holds it invisible
   * until the JS bundle lands — a real mobile-LCP penalty. Everything
   * below the fold should keep the default scroll-triggered reveal.
   */
  eager?: boolean;
};

/**
 * Tasteful scroll-reveal. Uses IntersectionObserver; if motion is reduced or
 * the API is unavailable, content is shown immediately (handled by CSS too).
 */
export default function Reveal({
  children,
  delay = 0,
  as,
  className,
  eager = false,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (eager) return; // CSS animates it; no observer needed
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver support: reveal on next frame as a fallback.
    // (Reduced-motion is handled in CSS, which forces content visible.)
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  if (eager) {
    return (
      <Tag
        data-reveal-eager=""
        className={className}
        style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={`${visible ? "is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
