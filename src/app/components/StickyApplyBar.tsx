"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Mobile-only sticky apply bar — slides up from the bottom once the hero
 * (with its big CTA) scrolls away, and slides back down when the final CTA
 * section is on screen, so the button is always one thumb-tap away on the
 * long lander without ever doubling a visible CTA.
 */
export default function StickyApplyBar({
  href,
  label,
  heroId = "hero",
  finalCtaId = "start",
}: {
  href: string;
  label: string;
  /** Element whose disappearance summons the bar (the hero with its own CTA). */
  heroId?: string;
  /** Element whose appearance dismisses it (the final CTA section). */
  finalCtaId?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const start = document.getElementById(finalCtaId);
    let heroGone = false;
    let startVisible = false;
    const observers: IntersectionObserver[] = [];
    const update = () => setShow(heroGone && !startVisible);
    if (hero) {
      const o = new IntersectionObserver(
        ([entry]) => {
          heroGone = !entry.isIntersecting;
          update();
        },
        { threshold: 0 },
      );
      o.observe(hero);
      observers.push(o);
    }
    if (start) {
      const o = new IntersectionObserver(
        ([entry]) => {
          startVisible = entry.isIntersecting;
          update();
        },
        { threshold: 0.15 },
      );
      o.observe(start);
      observers.push(o);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [heroId, finalCtaId]);

  // Tell the Ask widget the bar is on screen (mobile) so it drops into the
  // bar's row instead of floating on top of the CTA; the bar's own CSS
  // (globals) reads the widget's corner and shrinks the button that side.
  useEffect(() => {
    if (show) document.body.dataset.applyBar = "1";
    else delete document.body.dataset.applyBar;
    return () => {
      delete document.body.dataset.applyBar;
    };
  }, [show]);

  return (
    <div
      aria-hidden={!show}
      className={`sticky-apply-bar fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-[transform,padding] duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link
        href={href}
        tabIndex={show ? 0 : -1}
        className="flex items-center justify-center gap-2 rounded-full bg-signal px-6 py-3 text-[15px] font-semibold text-paper transition-colors duration-150 active:bg-signal-strong"
      >
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
