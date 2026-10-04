"use client";

import { useEffect, useState } from "react";

export type RailSection = { id: string; label: string };

/**
 * Vertical section-navigation rail — a column of measurement-style tick dashes
 * down the right edge of the homepage. Quiet by default; the active dash is
 * longer and signal-blue; hovering a dash extends it and reveals the section
 * label. Scroll-spy via IntersectionObserver. Desktop only (lg+).
 *
 * Built on real anchor links so it works without JS and is keyboard-navigable.
 * Smooth scroll + reduced-motion are handled by the global CSS on <html>.
 */
export default function SectionRail({ sections }: { sections: RailSection[] }) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    // A zero-height band at the vertical center of the viewport: a section is
    // "active" when it crosses the center line.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <ul className="flex flex-col items-end gap-1">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-label={s.label}
                aria-current={isActive ? "true" : undefined}
                className="group relative flex min-h-6 min-w-6 items-center justify-end px-1 py-2"
              >
                <span className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md bg-bone/95 px-2.5 py-1 text-xs font-medium text-ink opacity-0 shadow-sm ring-1 ring-line backdrop-blur-sm transition-all duration-150 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  {s.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-px rounded-full transition-all duration-150 ease-out ${
                    isActive
                      ? "w-7 bg-signal"
                      : "w-4 bg-slate/45 group-hover:w-6 group-hover:bg-slate/70 group-focus-visible:w-6 group-focus-visible:bg-slate/70"
                  }`}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
