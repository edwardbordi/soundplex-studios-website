"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PREVIEW_VARIANTS } from "../../lib/site-config";
import { useEdgeDock } from "./useEdgeDock";
import { LayoutIcon } from "./ReviewIcons";

/**
 * TEMPORARY — client review only. A small floating switch between the home
 * page directions so Jason can flip without remembering a URL. Starts tucked
 * as a "Preview" tab on the left edge; open it, drag it by the label to either
 * side at any height (it snaps to the nearer edge), tuck it with the chevron.
 * Position and open/closed are remembered per browser.
 * The versions come from PREVIEW_VARIANTS in site-config — an empty list (the
 * default) hides the widget entirely, so a build with one home page never sees
 * it. Delete this file, its usages and the variant routes once a version is picked.
 */
const OPTIONS = PREVIEW_VARIANTS;
const KEY = "review-variant";

export default function VariantToggle({ current }: { current: string }) {
  const [tucked, setTucked] = useState(true);
  const { side, drag, frameRef, grip, tabGrip, wasDrag, panelStyle, tabStyle } = useEdgeDock(`${KEY}-v2`, { side: "l", topPx: 172 });

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        setTucked(localStorage.getItem(`${KEY}-tucked`) !== "0");
      } catch {}
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  const set = (v: boolean) => {
    setTucked(v);
    try {
      localStorage.setItem(`${KEY}-tucked`, v ? "1" : "0");
    } catch {}
  };

  const left = side === "l";
  const chevron = left ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />;
  const tabChevron = left ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />;

  return (
    <>
      <div
        ref={frameRef}
        role="group"
        aria-label="Home page version (preview)"
        aria-hidden={tucked}
        inert={tucked}
        style={panelStyle}
        className={`fixed z-[55] flex items-center gap-1 rounded-sm border border-ink-2 bg-ink p-1 shadow-lg ${
          left ? "left-4" : "right-4"
        } ${drag?.what === "panel" ? "" : "transition-transform duration-300 ease-out motion-reduce:transition-none"} ${
          tucked ? `pointer-events-none ${left ? "-translate-x-[calc(100%+1.5rem)]" : "translate-x-[calc(100%+1.5rem)]"}` : ""
        }`}
      >
        {/* Grip: the label. Drag it anywhere; it snaps to the nearer edge. */}
        <span
          {...grip}
          className={`font-display flex items-center gap-1.5 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-paper/60 select-none touch-none ${
            drag ? "cursor-grabbing" : "cursor-grab"
          }`}
          title="Drag to move"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3 fill-current opacity-70">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
          Preview
        </span>
        {OPTIONS.map((o) => {
          const active = o.href === current;
          return (
            <Link
              key={o.href}
              href={o.href}
              tabIndex={tucked ? -1 : 0}
              aria-current={active ? "page" : undefined}
              className={`font-display inline-flex min-h-9 items-center rounded-sm px-3 text-sm font-semibold uppercase tracking-[0.04em] ${
                active ? "bg-signal text-paper" : "text-paper hover:bg-ink-2"
              }`}
            >
              {o.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => set(true)}
          tabIndex={tucked ? -1 : 0}
          aria-label="Tuck the preview switch away"
          className="ml-1 flex h-9 w-8 items-center justify-center rounded-sm text-paper hover:bg-signal"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2.5">
            {chevron}
          </svg>
        </button>
      </div>

      {/* The tab at the edge while tucked. */}
      <button
        type="button"
        tabIndex={tucked ? 0 : -1}
        {...tabGrip}
        onClick={() => {
          if (!wasDrag()) set(false);
        }}
        aria-label="Show the preview switch"
        aria-hidden={!tucked}
        inert={!tucked}
        style={tabStyle}
        className={`group font-display fixed z-50 flex h-7 items-center gap-1 bg-ink/85 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-paper/90 select-none touch-none hover:bg-ink hover:text-paper ${
          drag?.what === "tab" ? "cursor-grabbing" : "cursor-grab transition-transform duration-300 ease-out motion-reduce:transition-none"
        } ${left ? "left-0 rounded-r-sm px-1.5" : "right-0 rounded-l-sm px-1.5 flex-row-reverse"} ${
          tucked ? "" : `pointer-events-none ${left ? "-translate-x-full" : "translate-x-full"}`
        }`}
      >
        <LayoutIcon />
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100 motion-reduce:transition-none">
          Preview
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-2.5 w-2.5 stroke-current opacity-60" fill="none" strokeWidth="3">
          {tabChevron}
        </svg>
      </button>
    </>
  );
}
