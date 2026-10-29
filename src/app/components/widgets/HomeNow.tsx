"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import ForwardArrow from "../ForwardArrow";
import { catOf, eventsAround, fromCalItems, roomOf, type VenueEvent } from "../../../lib/venue/data";
import type { CalItem } from "../../../lib/events/constants";

/**
 * The home page's two live bits (Ed, 2026-10-28) — the same calendar as Studio Productions
 * (George's real events + the sample week while SHOW_SAMPLE_EVENTS is on), worked out from the
 * visitor's own clock:
 *   HeroLive  — the small card in the hero's corner: what's on now, or next
 *   ThisWeek  — the next few public nights, as cards, with "See everything"
 * Before the clock is known (server render) both render nothing / a quiet placeholder.
 */

const subscribe = (cb: () => void) => {
  const t = window.setInterval(cb, 30_000);
  return () => window.clearInterval(t);
};
const minuteNow = () => Math.floor(Date.now() / 60_000);

function useEvents(items: CalItem[], showSamples: boolean): { now: Date | null; events: VenueEvent[] } {
  const minute = useSyncExternalStore(subscribe, minuteNow, () => 0);
  const day = minute ? new Date(minute * 60_000).toDateString() : "";
  const events = useMemo(() => {
    if (!minute) return [];
    const all = [...fromCalItems(items), ...(showSamples ? eventsAround(new Date(minute * 60_000)) : [])];
    return all.filter((e) => e.visibility === "public" && !e.ambient).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [day, items, showSamples]); // eslint-disable-line react-hooks/exhaustive-deps
  return { now: minute ? new Date(minute * 60_000) : null, events };
}

const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const href = (e: VenueEvent) => (e.slug ? `/studio-productions/${e.slug}` : "/studio-productions");

/* ── The hero's corner card ── */
export function HeroLive({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const { now, events } = useEvents(items, showSamples);
  if (!now) return null;
  const live = events.find((e) => e.start <= now && e.end > now);
  const next = events.find((e) => e.start > now);
  const e = live ?? next;
  if (!e) return null;
  const label = live
    ? "On now"
    : sameDay(e.start, now)
      ? `${e.start.getHours() >= 17 ? "Tonight" : "Today"} · ${time(e.start)}`
      : `${e.start.toLocaleDateString("en-US", { weekday: "long" })} · ${time(e.start)}`;
  return (
    <Link
      href={href(e)}
      className="vo-pop group flex max-w-[22rem] items-center gap-3.5 rounded-[8px] border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-md transition-colors hover:border-[#d4a030]/70"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4a030] opacity-60" />}
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#d4a030]" />
      </span>
      <span className="min-w-0">
        <span className="block font-[family-name:var(--font-poppins)] text-[10.5px] font-medium uppercase tracking-[0.18em] text-[#d4a030]">{label}</span>
        <span className="mt-0.5 block truncate font-[family-name:var(--font-poppins)] text-[15px] font-semibold text-white">{e.title}</span>
        <span className="block text-[12.5px] text-white/60">{roomOf(e.room).name}{e.price ? ` · ${e.price}` : ""}</span>
      </span>
      <span className="ml-1 shrink-0 text-white/60 transition-colors group-hover:text-[#d4a030]"><ForwardArrow /></span>
    </Link>
  );
}

/* ── This week ── */
export function ThisWeek({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const { now, events } = useEvents(items, showSamples);
  if (!now) return <div className="h-[260px] animate-pulse rounded-[8px] bg-white/[0.04]" aria-label="Loading what’s on" />;
  const week = events.filter((e) => e.end > now && e.start.getTime() < now.getTime() + 7 * 86_400_000).slice(0, 4);
  if (!week.length) {
    return <p className="font-[family-name:var(--font-lora)] text-lg italic text-white/55">Nothing on the calendar this week yet. Join the list below and we’ll tell you first.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {week.map((e) => {
        const onNow = e.start <= now;
        return (
          <li key={e.id}>
            <Link href={href(e)} className="group flex h-full flex-col rounded-[8px] border border-white/[0.08] bg-[#0f0f0f] p-4 transition-colors hover:border-[#d4a030]/60">
              <span className="flex items-start justify-between gap-3">
                <span className="leading-none">
                  <span className="block font-[family-name:var(--font-poppins)] text-[11px] font-medium uppercase tracking-[0.16em] text-white/50">
                    {sameDay(e.start, now) ? (e.start.getHours() >= 17 ? "Tonight" : "Today") : e.start.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="mt-1.5 block font-[family-name:var(--font-poppins)] text-[30px] font-semibold tabular-nums text-white">{e.start.getDate()}</span>
                </span>
                {onNow ? (
                  <span className="flex items-center gap-1.5 rounded-[4px] bg-[#d4a030]/15 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#d4a030]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4a030]" /> Live
                  </span>
                ) : (
                  <span className="text-[12.5px] tabular-nums text-white/55">{time(e.start)}</span>
                )}
              </span>
              <span className="mt-4 flex items-center gap-2 text-[12px] text-white/55">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: catOf(e.category).color }} />
                {catOf(e.category).name} · {roomOf(e.room).name}
              </span>
              <span className="mt-1.5 font-[family-name:var(--font-poppins)] text-[16px] font-semibold leading-snug text-white transition-colors group-hover:text-[#d4a030]">{e.title}</span>
              <span className="mt-auto pt-4 text-[13px] text-white/60">{e.price || "Free"}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
