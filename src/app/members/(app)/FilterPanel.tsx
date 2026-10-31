"use client";

import { useEffect, useRef } from "react";

/**
 * The members area's one "Filters" button (Ed, 2026-10-31), shared by Members and Calendar.
 * Opens every filter at once: a dropdown panel on desktop, a bottom sheet on phones. Each option
 * shows how many results it would give; options that would give none are hidden (unless ticked).
 * Selections are { groupKey: [values] }; the page owns them and does the filtering.
 */
export type FilterSel = Record<string, string[]>;
export type FilterGroup = { key: string; title: string; options: { v: string; label: string; n: number; dot?: string }[] };

export const filterCount = (sel: FilterSel) => Object.values(sel).reduce((a, l) => a + l.length, 0);
export const toggleIn = (sel: FilterSel, key: string, v: string): FilterSel => {
  const cur = sel[key] ?? [];
  return { ...sel, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
};

export default function FilterPanel({
  open,
  setOpen,
  title,
  noun,
  resultCount,
  groups,
  selected,
  onToggle,
  onClear,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  title: string;
  /** "member" / "event": for "Show 3 members". */
  noun: string;
  resultCount: number;
  groups: FilterGroup[];
  selected: FilterSel;
  onToggle: (key: string, v: string) => void;
  onClear: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const active = filterCount(selected);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open, setOpen]);

  const chip = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13.5px] transition-colors ${on ? "border-(--mx-gold) bg-(--mx-gold) font-medium text-[#141414]" : "border-(--mx-line-strong) text-(--mx-soft) hover:border-(--mx-gold)"}`;

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex h-[46px] items-center gap-2 rounded-[4px] border px-3.5 text-[14.5px] transition-colors ${active ? "border-(--mx-gold) text-(--mx-text)" : "border-(--mx-line-strong) text-(--mx-soft) hover:border-(--mx-gold)"}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h9M14 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0M19 7h1M4 17h3M8 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0M13 17h7" />
        </svg>
        Filters
        {active > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-(--mx-gold) px-1.5 text-[11px] font-bold text-[#141414]">{active}</span>}
      </button>

      {open && (
        <>
          {/* Phones: dim the page behind the sheet; tap it to close. */}
          <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label={title}
            className="vo-pop fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[14px] border border-(--mx-line) bg-(--mx-pop) text-(--mx-text) shadow-(--mx-shadow) sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[min(70vh,640px)] sm:w-[26rem] sm:rounded-[8px]"
          >
            <div className="flex items-center justify-between border-b border-(--mx-line) px-5 py-3.5">
              <p className="font-[family-name:var(--font-poppins)] text-[16px] font-medium">{title}</p>
              <div className="flex items-center gap-3 text-[13.5px]">
                {active > 0 && (
                  <button type="button" onClick={onClear} className="text-(--mx-gold-text) hover:underline">
                    Clear all
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="grid h-8 w-8 place-items-center rounded-full text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)">
                  ×
                </button>
              </div>
            </div>

            <div className="mx-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {groups.map((g) => {
                const sel = selected[g.key] ?? [];
                const opts = g.options.filter((o) => o.n > 0 || sel.includes(o.v));
                if (!opts.length) return null;
                return (
                  <section key={g.key}>
                    <p className="mb-2.5 text-[11.5px] uppercase tracking-[0.16em] text-(--mx-faint)">{g.title}</p>
                    <div className="flex flex-wrap gap-2">
                      {opts.map((o) => {
                        const on = sel.includes(o.v);
                        return (
                          <button key={o.v} type="button" aria-pressed={on} onClick={() => onToggle(g.key, o.v)} className={chip(on)}>
                            {o.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: o.dot }} aria-hidden="true" />}
                            {o.label}
                            <span className={on ? "opacity-70" : "text-(--mx-faint)"}>{o.n}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="border-t border-(--mx-line) p-4">
              <button type="button" onClick={() => setOpen(false)} className="w-full rounded-[4px] bg-(--mx-gold) py-3 text-[15px] font-medium text-[#141414]">
                Show {resultCount} {noun}
                {resultCount === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** The active filters as chips you can tap off, plus Clear all. */
export function ActiveFilters({ chips, onRemove, onClear }: { chips: { key: string; v: string; label: string }[]; onRemove: (key: string, v: string) => void; onClear: () => void }) {
  if (!chips.length) return null;
  return (
    <div className="-mt-3 mb-6 flex flex-wrap items-center gap-2 text-[13px]">
      {chips.map((c) => (
        <button
          key={`${c.key}-${c.v}`}
          type="button"
          onClick={() => onRemove(c.key, c.v)}
          aria-label={`Remove filter ${c.label}`}
          className="flex items-center gap-1.5 rounded-full border border-[#d4a030]/50 bg-[#d4a030]/10 py-1 pl-3 pr-2 text-(--mx-text) hover:border-(--mx-gold)"
        >
          {c.label} <span className="text-(--mx-faint)" aria-hidden="true">×</span>
        </button>
      ))}
      <button type="button" onClick={onClear} className="px-1 text-(--mx-gold-text) hover:underline">
        Clear all
      </button>
    </div>
  );
}
