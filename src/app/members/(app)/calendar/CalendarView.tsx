"use client";

import { useState } from "react";
import type { CalItem } from "../../../../lib/events/constants";
import { catOf, roomOf, type VenueEvent } from "../../../../lib/venue/data";
import { EventRow } from "../NowView";
import { Em, PANEL, PageHead, eventTitle, fmtDay, useEvents, useNow, useRsvps } from "../shared";

/** Calendar (members): the next six weeks, grouped by day. Filters: everything, members-only, going. */
type Filter = "all" | "members" | "going";
const DAYS_AHEAD = 42;

export default function CalendarView({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const now = useNow();
  const rsvps = useRsvps();
  const events = useEvents(items, showSamples, now);
  const [filter, setFilter] = useState<Filter>("all");
  // Search (Ed, 2026-10-30): by title, room, kind of night or description, on top of the filter.
  const [q, setQ] = useState("");

  if (!now) return <div className="h-96" aria-hidden="true" />;

  const until = now.getTime() + DAYS_AHEAD * 86_400_000;
  const ahead = events.filter((e) => e.end > now && e.start.getTime() < until && !e.ambient);
  const needle = q.trim().toLowerCase();
  const matches = (e: VenueEvent) =>
    !needle || [eventTitle(e), roomOf(e.room).name, catOf(e.category).name, e.visibility === "private" ? "" : e.blurb].join(" ").toLowerCase().includes(needle);
  const shown = ahead.filter((e) => (filter === "members" ? e.visibility === "members" : filter === "going" ? rsvps.includes(e.id) : true)).filter(matches);

  const days: { key: string; date: Date; list: VenueEvent[] }[] = [];
  for (const e of shown) {
    const key = e.start.toDateString();
    const last = days[days.length - 1];
    if (last?.key === key) last.list.push(e);
    else days.push({ key, date: e.start, list: [e] });
  }

  const tabs: [Filter, string, number][] = [
    ["all", "Everything", ahead.length],
    ["members", "Members only", ahead.filter((e) => e.visibility === "members").length],
    ["going", "Going", ahead.filter((e) => rsvps.includes(e.id)).length],
  ];

  return (
    <>
      <PageHead
        eyebrow="Calendar"
        title={
          <>
            What’s <Em>on.</Em>
          </>
        }
        sub="The next six weeks at SoundPlex. RSVP so George and the other members know you’re coming."
        right={
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search events</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--mx-faint)" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events, rooms…"
              className="w-full rounded-[4px] border border-(--mx-line-strong) bg-(--mx-field) py-2.5 pl-9 pr-3 text-[15px] text-(--mx-text) outline-none placeholder:text-(--mx-faint) focus:border-(--mx-gold)"
            />
          </label>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Show">
        {tabs.map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={`rounded-[4px] border px-3.5 py-1.5 text-[14px] transition-colors ${filter === id ? "border-(--mx-gold) bg-(--mx-gold) font-medium text-[#141414]" : "border-(--mx-line-strong) text-(--mx-muted) hover:text-(--mx-text)"}`}
          >
            {label} <span className={filter === id ? "opacity-70" : "text-(--mx-faint)"}>{n}</span>
          </button>
        ))}
      </div>

      {days.length === 0 ? (
        <div className={`${PANEL} p-8 text-center text-(--mx-muted)`}>{needle ? `No events match “${q.trim()}”.` : filter === "going" ? "You haven’t RSVP’d to anything yet." : "Nothing here yet."}</div>
      ) : (
        <div className="space-y-6">
          {days.map((d) => (
            <section key={d.key} className={`${PANEL} px-5 py-2 sm:px-6`}>
              <h2 className="border-b border-(--mx-line) py-3 text-[13px] uppercase tracking-[0.16em] text-(--mx-gold-text)">{fmtDay(d.date, now)}</h2>
              <ul className="divide-y divide-(--mx-line)">
                {d.list.map((e) => (
                  <EventRow key={e.id} e={e} now={now} going={rsvps.includes(e.id)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
