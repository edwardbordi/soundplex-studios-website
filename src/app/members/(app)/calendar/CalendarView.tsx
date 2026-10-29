"use client";

import { useState } from "react";
import type { CalItem } from "../../../../lib/events/constants";
import type { VenueEvent } from "../../../../lib/venue/data";
import { EventRow } from "../NowView";
import { Em, PANEL, PageHead, fmtDay, useEvents, useNow, useRsvps } from "../shared";

/** Calendar (members): the next six weeks, grouped by day. Filters: everything, members-only, going. */
type Filter = "all" | "members" | "going";
const DAYS_AHEAD = 42;

export default function CalendarView({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const now = useNow();
  const rsvps = useRsvps();
  const events = useEvents(items, showSamples, now);
  const [filter, setFilter] = useState<Filter>("all");

  if (!now) return <div className="h-96" aria-hidden="true" />;

  const until = now.getTime() + DAYS_AHEAD * 86_400_000;
  const ahead = events.filter((e) => e.end > now && e.start.getTime() < until && !e.ambient);
  const shown = ahead.filter((e) => (filter === "members" ? e.visibility === "members" : filter === "going" ? rsvps.includes(e.id) : true));

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
        <div className={`${PANEL} p-8 text-center text-(--mx-muted)`}>{filter === "going" ? "You haven’t RSVP’d to anything yet." : "Nothing here yet."}</div>
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
