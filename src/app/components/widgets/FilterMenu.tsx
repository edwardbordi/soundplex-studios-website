"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "../../../lib/venue/data";
import Check from "./Check";

/**
 * "Filter" for the calendar (Ed, 2026-10-11): the category chips and "Free" moved out of the
 * bar into one quiet menu, so the page stays calm. Square like the header buttons; fixed to the
 * screen so the phone's scrolling bar can't clip it.
 */
export default function FilterMenu({
  cats,
  setCats,
  free,
  setFree,
}: {
  cats: string[];
  setCats: (c: string[]) => void;
  free: boolean;
  setFree: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{ top: number; right: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const count = cats.length + (free ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) return e.key === "Escape" && setOpen(false);
      if (e.type === "scroll" || e.type === "resize") return setOpen(false);
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    const r = btn.current?.getBoundingClientRect();
    if (r) setAt({ top: r.bottom + 6, right: Math.max(12, window.innerWidth - r.right) });
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className={`flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[4px] border px-3 font-[family-name:var(--font-poppins)] text-[13px] font-medium transition-colors ${
          count ? "border-[#d4a030]/70 text-[#d4a030]" : "border-white/20 text-white hover:border-white/50"
        }`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        Filter
        {count > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#d4a030] px-1 text-[11px] font-semibold text-black">{count}</span>
        )}
      </button>

      {open && at && (
        <div
          ref={menu}
          role="dialog"
          aria-label="Filter events"
          className="vo-pop fixed z-[75] w-64 overflow-hidden rounded-[8px] border border-white/12 bg-[#141414] text-white shadow-2xl"
          style={{ top: at.top, right: at.right }}
        >
          <p className="px-4 pb-1 pt-3 font-[family-name:var(--font-poppins)] text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/40">What&apos;s on</p>
          {CATEGORIES.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => setCats(on ? cats.filter((x) => x !== c.id) : [...cats, c.id])}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-[14px] transition-colors hover:bg-white/[0.06]"
              >
                <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: c.color }} />
                <span className={`flex-1 ${on ? "text-white" : "text-white/75"}`}>{c.name}</span>
                {on && <Check className="h-4 w-4 text-[#d4a030]" />}
              </button>
            );
          })}
          <div className="mt-1 border-t border-white/10" />
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={free}
            onClick={() => setFree(!free)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-white/[0.06]"
          >
            <span className={free ? "text-white" : "text-white/75"}>Free events only</span>
            <span className={`relative h-5 w-9 rounded-full transition-colors ${free ? "bg-[#d4a030]" : "bg-white/20"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${free ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </button>
          {count > 0 && (
            <button
              type="button"
              onClick={() => {
                setCats([]);
                setFree(false);
              }}
              className="w-full border-t border-white/10 px-4 py-2.5 text-left text-[13px] text-white/55 hover:bg-white/[0.06] hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </>
  );
}
