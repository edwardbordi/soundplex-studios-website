"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { catOf, roomOf, type VenueEvent } from "../../../lib/venue/data";

/**
 * The calendar's hover card (Ed, 2026-10-28 — "make the tooltip branded"): replaces the
 * browser's grey title tooltip on Month / Week / Day items. One card for the whole page, drawn
 * in a portal at a fixed position (so the calendar grid's overflow can never clip it), shown
 * instantly on mouse hover / keyboard focus, gone on leave. Touch screens never see it (a tap
 * opens the event panel instead).
 *
 * Use: onMouseEnter / onFocus → showTip(e, label, el); onMouseLeave / onBlur → hideTip().
 * Render <CalTipLayer /> once (WhatsOn does).
 */

type Tip = { e: VenueEvent; title: string; when: string; x: number; y: number; below: boolean } | null;
let tip: Tip = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

const fmt = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined });

/**
 * Only when it helps (Ed, 2026-10-28 — "it can be annoying"): the card shows only if the item's
 * title is cut off ("…", clamped, or clipped by a short block) or not shown at all (the slim
 * strips), and only after resting on it for a moment, so sweeping the mouse across never fires it.
 */
const DELAY = 500;
let timer: ReturnType<typeof setTimeout> | undefined;

const cutOff = (el: HTMLElement) => {
  if (!el.textContent?.trim()) return true; // a strip: no title on screen at all
  if (el.scrollHeight > el.clientHeight + 1) return true; // a block too short for its text
  return [...el.querySelectorAll<HTMLElement>("span")].some(
    (s) => s.clientWidth > 0 && (s.scrollWidth > s.clientWidth + 1 || s.scrollHeight > s.clientHeight + 1),
  );
};

export function showTip(e: VenueEvent, title: string, el: HTMLElement) {
  if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) return;
  clearTimeout(timer);
  if (!cutOff(el)) return;
  timer = setTimeout(() => place(e, title, el), DELAY);
}

function place(e: VenueEvent, title: string, el: HTMLElement) {
  if (!el.isConnected) return;
  const r = el.getBoundingClientRect();
  const below = r.top < 150; // near the top of the screen: open underneath instead
  const when = `${e.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${fmt(e.start)} – ${fmt(e.end)}`;
  tip = { e, title, when, x: Math.min(Math.max(r.left + r.width / 2, 150), window.innerWidth - 150), y: below ? r.bottom + 8 : r.top - 8, below };
  emit();
}
export function hideTip() {
  clearTimeout(timer);
  if (!tip) return;
  tip = null;
  emit();
}

const subscribe = (f: () => void) => {
  subs.add(f);
  const off = () => hideTip();
  // Scrolling or clicking anything (e.g. opening the event panel) puts the card away.
  window.addEventListener("scroll", off, { passive: true, capture: true });
  window.addEventListener("pointerdown", off, { passive: true });
  return () => {
    subs.delete(f);
    window.removeEventListener("scroll", off, true);
    window.removeEventListener("pointerdown", off);
  };
};

export default function CalTipLayer() {
  const t = useSyncExternalStore(subscribe, () => tip, () => null);
  if (!t) return null;
  const cat = catOf(t.e.category);
  const locked = t.e.visibility !== "public";
  return createPortal(
    <div
      role="tooltip"
      className="vo-pop pointer-events-none fixed z-[95] w-[17rem] rounded-[6px] border border-[#d4a030]/45 bg-[#0e0e0e]/95 px-3.5 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.55)] backdrop-blur"
      style={{ left: t.x, top: t.y, transform: `translate(-50%, ${t.below ? "0" : "-100%"})` }}
    >
      <p className="flex items-center gap-2 font-[family-name:var(--font-poppins)] text-[10px] font-medium uppercase tracking-[0.16em] text-white/55">
        <span className="h-[7px] w-[7px] rounded-full" style={{ background: cat.color }} />
        {cat.name}
        {t.e.visibility === "members" && <span className="text-[#d4a030]">· Members</span>}
      </p>
      <p className={`mt-1.5 font-[family-name:var(--font-poppins)] text-[14.5px] font-semibold leading-snug ${locked ? "italic text-white/70" : "text-white"}`}>{t.title}</p>
      <p className="mt-1.5 text-[12.5px] text-[#d4a030]">{t.when}</p>
      <p className="mt-0.5 text-[12.5px] text-white/55">
        {roomOf(t.e.room).name}
        {!locked && t.e.price ? ` · ${t.e.price}` : ""}
      </p>
    </div>,
    document.body,
  );
}
