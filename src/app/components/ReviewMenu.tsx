"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePreviewPrefs, WIDGETS } from "./previewPrefs";
import { GaugeIcon, LayoutIcon, PlayIcon, NoteIcon, NeedsIcon } from "./ReviewIcons";
import { useEdgeDock } from "./useEdgeDock";

/**
 * TEMPORARY — a very small eye nub on the screen edge (starts top-right,
 * just under the utility bar). Drag it to either edge at any height like the
 * other review widgets; it can be moved but never hidden. Opens a dropdown
 * with a checkbox per review widget and a show/hide-all, so the reviewer
 * decides what floats on the page. Rendered by PreviewChrome (PREVIEW_CHROME).
 */
export default function ReviewMenu() {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [prefs, setPrefs] = usePreviewPrefs();
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();
  // Movable like the other review widgets: drag the button to either edge at
  // any height (starts top-right, just under the utility bar). Never hidden.
  const { side, drag, tabGrip, wasDrag, tabStyle } = useEdgeDock("review-dock", { side: "r", bottomPx: 16 });
  const left = side === "l";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  if (!prefs) return null;
  const floating = WIDGETS.filter((w) => w.key !== "needs");
  const anyOn = floating.some((w) => prefs[w.key]);
  const count = floating.filter((w) => prefs[w.key]).length;

  return (
    <div ref={rootRef} style={tabStyle} className={`fixed z-[60] ${left ? "left-0" : "right-0"}`}>
      <button
        type="button"
        {...tabGrip}
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          if (wasDrag()) return;
          // Open upward when there's more room above the nub than below it.
          const r = e.currentTarget.getBoundingClientRect();
          setOpenUp(window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom);
          setOpen((v) => !v);
        }}
        title="Review widgets (drag to move)"
        aria-label={`Review widgets (${count} on)`}
        className={`flex h-9 w-9 items-center justify-center bg-ink/85 md:h-7 md:w-7 select-none touch-none transition-colors hover:bg-ink hover:text-signal-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-signal-light ${
          left ? "rounded-r-sm" : "rounded-l-sm"
        } ${drag?.what === "tab" ? "cursor-grabbing" : "cursor-grab"} ${anyOn ? "text-paper" : "text-paper/50"}`}
      >
        {/* Eye — open while any widget shows, struck through when none do. */}
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 stroke-current md:h-3.5 md:w-3.5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
          <circle cx="12" cy="12" r="2.5" />
          {!anyOn && <path d="M4 4l16 16" />}
        </svg>
      </button>
      {open && (
        <div
          id={id}
          className={`absolute w-64 bg-ink p-4 text-paper shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${
            openUp ? "bottom-full mb-1 border-b-4 border-signal" : "top-full mt-1 border-t-4 border-signal"
          } ${left ? "left-4" : "right-4"}`}
        >
          <p className="eyebrow text-signal">Review widgets</p>
          <p className="mt-1 text-xs leading-snug text-paper/60">Build-preview tools. None of this ships with the live site.</p>
          <ul className="mt-3 flex flex-col gap-1">
            {WIDGETS.map((w) => (
              <li key={w.key}>
                <label className="flex min-h-10 cursor-pointer items-start gap-3 rounded-sm px-1 py-1.5 hover:bg-ink-2">
                  <input
                    type="checkbox"
                    checked={prefs[w.key]}
                    onChange={(e) => setPrefs({ ...prefs, [w.key]: e.target.checked })}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-signal)]"
                  />
                  <span className="mt-0.5 shrink-0 text-paper/80">
                    {w.icon === "gauge" ? <GaugeIcon className="h-4 w-4" /> : w.icon === "play" ? <PlayIcon className="h-4 w-4" /> : w.icon === "note" ? <NoteIcon className="h-4 w-4" /> : w.icon === "needs" ? <NeedsIcon className="h-4 w-4" /> : <LayoutIcon className="h-4 w-4" />}
                  </span>
                  <span className="text-sm leading-snug">
                    <span className="block font-semibold text-paper">{w.label}</span>
                    <span className="block text-xs text-paper/60">{w.hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setPrefs({ ...prefs, walkthrough: !anyOn, versions: !anyOn, speed: !anyOn, notes: !anyOn })}
            className="font-display mt-3 flex min-h-9 w-full items-center justify-center rounded-sm border border-paper/30 text-sm font-semibold uppercase tracking-[0.04em] text-paper hover:border-signal-light hover:text-signal-light"
          >
            {anyOn ? "Hide all" : "Show all"}
          </button>
        </div>
      )}
    </div>
  );
}
