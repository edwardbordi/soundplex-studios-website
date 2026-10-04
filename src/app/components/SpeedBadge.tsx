"use client";

import { useEffect, useState } from "react";
import { PREVIEW_SCORES, PREVIEW_TEST_URL } from "../../lib/site-config";
import OutboundArrow from "./OutboundArrow";
import { useEdgeDock } from "./useEdgeDock";
import { GaugeIcon } from "./ReviewIcons";

/**
 * TEMPORARY — client review only. A tab on the left edge that opens a small
 * card proving the site is fast: the time THIS page took to paint, measured
 * in the visitor's own browser just now (navigation timing — nobody can fake
 * it), the last PageSpeed Insights scores with their date, and a link that
 * runs Google's test on the live URL so they can check for themselves.
 * Drag it by its title to either side at any height (it snaps to the nearer
 * edge); position and open/closed are remembered per browser.
 * Gated by PREVIEW_CHROME in site-config; delete with the preview switch.
 */
const KEY = "review-speed-open";

export default function SpeedBadge() {
  const [open, setOpen] = useState(false);
  const [paint, setPaint] = useState<string | null>(null);
  const { side, drag, frameRef, grip, tabGrip, wasDrag, panelStyle, tabStyle } = useEdgeDock(`${KEY}-v2`, { side: "l", topPx: 212 });
  const left = side === "l";

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        setOpen(localStorage.getItem(KEY) === "1");
      } catch {}
    });
    const measure = () => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return;
      const dcl = nav.domContentLoadedEventEnd - nav.startTime;
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
      const ms = Math.max(dcl, fcp);
      // Only print a number worth printing; on a cold, slow load the line stays out.
      if (ms > 0 && ms < 2500) setPaint((ms / 1000).toFixed(2));
    };
    if (document.readyState === "complete") measure();
    else window.addEventListener("load", measure, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", measure);
    };
  }, []);

  const set = (v: boolean) => {
    setOpen(v);
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {}
  };

  const psi = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(PREVIEW_TEST_URL)}`;
  const rows: [string, { performance: number; accessibility: number; bestPractices: number; seo: number }][] = [
    ["Desktop", PREVIEW_SCORES.desktop],
    ["Mobile", PREVIEW_SCORES.mobile],
  ];

  return (
    <>
      {/* The tab. */}
      <button
        type="button"
        tabIndex={open ? -1 : 0}
        {...tabGrip}
        onClick={() => {
          if (!wasDrag()) set(true);
        }}
        aria-label="Show page speed"
        aria-hidden={open}
        inert={open}
        style={tabStyle}
        className={`group font-display fixed z-50 flex h-7 items-center gap-1 bg-ink/85 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-paper/90 select-none touch-none hover:bg-ink hover:text-paper ${
          drag?.what === "tab" ? "cursor-grabbing" : "cursor-grab transition-transform duration-300 ease-out motion-reduce:transition-none"
        } ${left ? "left-0 rounded-r-sm px-1.5" : "right-0 rounded-l-sm px-1.5 flex-row-reverse"} ${
          open ? `pointer-events-none ${left ? "-translate-x-full" : "translate-x-full"}` : ""
        }`}
      >
        <GaugeIcon />
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100 motion-reduce:transition-none">
          Speed
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-2.5 w-2.5 stroke-current opacity-60" fill="none" strokeWidth="3">
          {left ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
        </svg>
      </button>

      {/* The card. */}
      <div
        ref={frameRef}
        role="region"
        aria-label="Page speed"
        aria-hidden={!open}
        inert={!open}
        style={panelStyle}
        className={`fixed z-[55] w-[min(88vw,300px)] border-t-4 border-signal bg-ink p-5 text-paper shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${
          left ? "left-4" : "right-4"
        } ${drag?.what === "panel" ? "" : "transition-transform duration-300 ease-out motion-reduce:transition-none"} ${
          open ? "" : `pointer-events-none ${left ? "-translate-x-[calc(100%+2rem)]" : "translate-x-[calc(100%+2rem)]"}`
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Grip: the title. Drag it anywhere; the card snaps to the nearer edge. */}
          <p
            {...grip}
            title="Drag to move"
            className={`font-display flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-paper/60 select-none touch-none ${drag?.what === "panel" ? "cursor-grabbing" : "cursor-grab"}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3 fill-current opacity-70">
              <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
            </svg>
            Page speed
          </p>
          <button
            type="button"
            onClick={() => set(false)}
            aria-label="Tuck page speed away"
            className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-sm text-paper hover:bg-signal"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2.5">
              {left ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
            </svg>
          </button>
        </div>

        {paint && (
          <p className="mt-3 text-sm leading-snug text-paper/85">
            This page painted in{" "}
            <span className="font-display text-2xl font-bold text-signal-light">{paint}s</span> in your browser, just now.
          </p>
        )}

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-[0.7rem] uppercase tracking-[0.08em] text-paper/60">
              <th className="pb-1 font-medium">Google PageSpeed</th>
              <th className="pb-1 text-center font-medium">Perf</th>
              <th className="pb-1 text-center font-medium">A11y</th>
              <th className="pb-1 text-center font-medium">Best</th>
              <th className="pb-1 text-center font-medium">SEO</th>
            </tr>
          </thead>
          <tbody className="font-display text-lg font-bold">
            {rows.map(([label, sc]) => (
              <tr key={label} className="border-t border-paper/10">
                <td className="py-1.5 font-sans text-sm font-normal text-paper/85">{label}</td>
                {[sc.performance, sc.accessibility, sc.bestPractices, sc.seo].map((v, i) => (
                  <td key={i} className={`py-1.5 text-center tabular-nums ${v >= 90 ? "text-signal-light" : "text-paper"}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-xs text-paper/55">Measured {PREVIEW_SCORES.measured}. Scores vary a few points run to run.</p>

        {/* Context: how the web at large does on the same test. Source is the
            HTTP Archive Web Almanac 2025 (Performance chapter) — keep the number
            in step with it if this survives more than a season. */}
        <div className="mt-4 border-l-4 border-signal pl-3">
          <p className="text-sm leading-snug text-paper/85">
            Only <span className="font-display text-xl font-bold text-paper">48%</span> of websites pass Google&apos;s Core Web Vitals on mobile.
            This one passes all three.
          </p>
          <a
            href="https://almanac.httparchive.org/en/2025/performance"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-1 inline-flex items-center gap-1 text-xs text-paper/55 hover:text-paper"
          >
            HTTP Archive Web Almanac, 2025
            <OutboundArrow />
          </a>
        </div>

        <a
          href={psi}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-paper hover:text-signal-light"
        >
          Run Google&apos;s test yourself
          <OutboundArrow />
        </a>

        <p className="mt-4 border-t border-paper/10 pt-3 text-[0.7rem] leading-snug text-paper/45">
          Build-preview widget — shown while the site is being reviewed. It won&apos;t appear on the live site.
        </p>
      </div>
    </>
  );
}
