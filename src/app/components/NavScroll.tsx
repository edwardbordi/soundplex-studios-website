"use client";

import { useEffect } from "react";

/**
 * Marks the header as scrolled (data-scrolled) once the page moves past the top, so CSS can
 * condense it — globals.css `.site-header[data-scrolled]`. No re-renders: it only flips an
 * attribute, on a passive scroll listener, and only when the state actually changes.
 */
export default function NavScroll() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;
    let on = false;
    // HYSTERESIS (Ed, 2026-10-28: "the header flickers if the page is slightly scrolled"). The
    // sticky header loses ~55px when it condenses (top bar folds, padding tightens), which pulls
    // the page up under it and drops scrollY back past a single threshold, which re-expands it:
    // a loop. So it condenses past ON and only re-expands back under OFF; the gap is wider than
    // the height it loses, so the two states can never bounce off each other.
    const ON = 96;
    const OFF = 8;
    const check = () => {
      const y = window.scrollY;
      const next = on ? y > OFF : y > ON;
      if (next === on) return;
      on = next;
      header.toggleAttribute("data-scrolled", on);
    };
    // The spacer under the (fixed) header holds its FULL height, measured while it's expanded.
    // Measured only in the expanded state, so condensing never changes the spacer.
    // --hdr-now: the header's height RIGHT NOW (full or condensed, mid-transition too), for
    // anything that sticks under it (the gallery's filter bar) so there's never a gap (Ed).
    const measure = () => {
      // getBoundingClientRect, not offsetHeight: the header's height is fractional and
      // offsetHeight rounds, which left a 1px sliver of page showing under it (Ed).
      const h = `${header.getBoundingClientRect().height}px`;
      document.documentElement.style.setProperty("--hdr-now", h);
      if (!on) document.documentElement.style.setProperty("--hdr-h", h);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    measure();
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, []);
  return null;
}
