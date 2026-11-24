"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { reconcileRsvps } from "../../../lib/members/rsvps";
import type { CalItem } from "../../../lib/events/constants";
import { eventsAround, fromCalItems, type VenueEvent } from "../../../lib/venue/data";

/**
 * Shared bits for the members' pages: the clock, the events list, RSVPs, formatting, and the
 * page header. RSVPs and check-ins live in this browser for now; the "real check-ins" step moves
 * both into the database so every member sees them live.
 */

// ── The clock (ticks each minute; null on the server so nothing time-based renders twice) ──
const subMinute = (cb: () => void) => {
  const t = window.setInterval(cb, 60_000);
  return () => window.clearInterval(t);
};
const minuteNow = () => Math.floor(Date.now() / 60_000);
export function useNow(): Date | null {
  const m = useSyncExternalStore(subMinute, minuteNow, () => 0);
  return m ? new Date(m * 60_000) : null;
}

/** George's real events plus (while samples are on) the sample calendar, sorted. */
export function useEvents(items: CalItem[], showSamples: boolean, now: Date | null): VenueEvent[] {
  const day = now ? now.toDateString() : "";
  const events = useMemo(
    () => (now ? [...fromCalItems(items), ...(showSamples ? eventsAround(now) : [])].sort((a, b) => a.start.getTime() - b.start.getTime()) : []),
    [day, items, showSamples], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // RSVPs to productions no longer on the calendar drop off, so "My RSVPs" matches "Going".
  useEffect(() => reconcileRsvps(events), [events]);
  return events;
}

// ── RSVPs (this browser for now): lib/members/rsvps.ts, so the avatar menu can count them too ──
export { toggleRsvp, useRsvps } from "../../../lib/members/rsvps";

// ── Formatting ──
export const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined });
export const fmtRange = (e: VenueEvent) => `${fmtTime(e.start)} – ${fmtTime(e.end)}`;
export function fmtDay(d: Date, today: Date): string {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((a - b) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
export const isLive = (e: VenueEvent, now: Date) => e.start <= now && now < e.end;
export const eventTitle = (e: VenueEvent) => (e.visibility === "private" ? "Private event" : e.title);

// ── Page header + panel styles ──
export const PANEL = "rounded-[8px] rounded-bl-none border border-(--mx-line) bg-(--mx-panel)";
export const EYEBROW = "text-[12px] uppercase tracking-[0.16em] text-(--mx-faint)";

export function PageHead({ eyebrow, title, sub, right }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-[12px] uppercase tracking-[0.18em] text-(--mx-gold-text)">{eyebrow}</p>}
        <h1 className="mt-1.5 font-[family-name:var(--font-poppins)] text-[28px] font-medium leading-tight tracking-tight sm:text-[32px]">{title}</h1>
        {sub && <p className="mt-1.5 text-[15px] text-(--mx-muted)">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** The lora italic accent used in titles ("Good evening, *Ed.*"). */
export function Em({ children }: { children: React.ReactNode }) {
  return <em className="font-[family-name:var(--font-lora)] font-normal text-(--mx-gold-text)">{children}</em>;
}
