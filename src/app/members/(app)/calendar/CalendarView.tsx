"use client";

import { useRef, useState } from "react";
import { CalendarView as MonthWeekDay, RoomsView, type CalMode } from "../../../components/widgets/WhatsOn";
import type { CalItem } from "../../../../lib/events/constants";
import { CATEGORIES, ROOMS, catOf, roomOf, type VenueEvent } from "../../../../lib/venue/data";
import FilterPanel, { ActiveFilters, filterCount, toggleIn, type FilterSel } from "../FilterPanel";
import { EventRow } from "../NowView";
import { Em, PANEL, PageHead, eventTitle, fmtDay, useEvents, useNow, useRsvps } from "../shared";

/**
 * Calendar (members): the next six weeks. Filters: everything, members-only, going. Three views,
 * as on Studio Productions (Ed, 2026-11-24): List (grouped by day, with RSVP), Calendar (day, week,
 * month) and Rooms (every room side by side). Calendar and Rooms are Studio Productions' own
 * (components/widgets/WhatsOn), with .mx-cal re-colouring them for the light theme (globals.css).
 */
type Filter = "all" | "members" | "going";
type View = "list" | "calendar" | "rooms";
const DAYS_AHEAD = 42;

export default function CalendarView({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const now = useNow();
  const rsvps = useRsvps();
  const events = useEvents(items, showSamples, now);
  const [filter, setFilter] = useState<Filter>("all");
  // Search (Ed, 2026-10-30): by title, room, kind of night or description, on top of the filter.
  const [q, setQ] = useState("");
  const [flt, setFlt] = useState<FilterSel>({});
  const [panel, setPanel] = useState(false);
  const [view, setView] = useState<View>("list");
  const [calMode, setCalMode] = useState<CalMode>("month");
  const [dayOffset, setDayOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [roomsOffset, setRoomsOffset] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  // A production picked on the Calendar or Rooms view: its row (with RSVP) shows above.
  const [opened, setOpened] = useState<VenueEvent | null>(null);
  const openedRef = useRef<HTMLDivElement>(null);

  if (!now) return <div className="h-96" aria-hidden="true" />;

  const until = now.getTime() + DAYS_AHEAD * 86_400_000;
  const ahead = events.filter((e) => e.end > now && e.start.getTime() < until && !e.ambient);
  const needle = q.trim().toLowerCase();
  const matches = (e: VenueEvent) =>
    !needle || [eventTitle(e), roomOf(e.room).name, catOf(e.category).name, e.visibility === "private" ? "" : e.blurb].join(" ").toLowerCase().includes(needle);
  const base = ahead.filter((e) => (filter === "members" ? e.visibility === "members" : filter === "going" ? rsvps.includes(e.id) : true)).filter(matches);

  // Filters (Ed, 2026-10-31): kind of event, room, when.
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dayOf = (d: Date) => Math.floor((new Date(d).setHours(0, 0, 0, 0) - today.getTime()) / 86_400_000);
  const isWhen = (e: VenueEvent, w: string) => {
    const d = dayOf(e.start);
    if (w === "today") return d <= 0;
    if (w === "tomorrow") return d === 1;
    if (w === "week") return d < 7;
    // This weekend: the coming Friday to Sunday (or the rest of it, if it's already the weekend).
    const dow = today.getDay();
    const toFri = dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow;
    return d >= Math.max(0, toFri) && d <= toFri + 2 && (d > toFri || e.start.getHours() >= 17 || dow === 5);
  };
  const passes = (e: VenueEvent, f: FilterSel, skip?: string) => {
    const on = (k: string) => (k === skip ? [] : (f[k] ?? []));
    if (on("type").length && !on("type").includes(e.category)) return false;
    if (on("room").length && !on("room").includes(e.room)) return false;
    if (on("when").length && !on("when").some((w) => isWhen(e, w))) return false;
    return true;
  };
  const shown = base.filter((e) => passes(e, flt));
  // Calendar and Rooms show past days too (paging back), with the same tab, search and filters.
  const forViews = events
    .filter((e) => !e.ambient)
    .filter((e) => (filter === "members" ? e.visibility === "members" : filter === "going" ? rsvps.includes(e.id) : true))
    .filter(matches)
    .filter((e) => passes(e, flt));
  const open = (e: VenueEvent) => {
    setOpened(e);
    requestAnimationFrame(() => openedRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };
  const countFor = (key: string, test: (e: VenueEvent) => boolean) => base.filter((e) => passes(e, flt, key) && test(e)).length;
  const WHEN: [string, string][] = [
    ["today", "Today"],
    ["tomorrow", "Tomorrow"],
    ["weekend", "This weekend"],
    ["week", "Next 7 days"],
  ];
  const chips = [
    ...(flt.type ?? []).map((v) => ({ key: "type", v, label: catOf(v).name })),
    ...(flt.room ?? []).map((v) => ({ key: "room", v, label: roomOf(v).name })),
    ...(flt.when ?? []).map((v) => ({ key: "when", v, label: WHEN.find(([id]) => id === v)?.[1] ?? v })),
  ];
  const filtering = filterCount(flt) > 0;

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
          <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="relative block min-w-0 flex-1 sm:w-72 sm:flex-none">
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
          <FilterPanel
            open={panel}
            setOpen={setPanel}
            title="Filter events"
            noun="event"
            resultCount={shown.length}
            selected={flt}
            onToggle={(k, v) => setFlt((f) => toggleIn(f, k, v))}
            onClear={() => setFlt({})}
            groups={[
              { key: "type", title: "Kind of event", options: CATEGORIES.map((c) => ({ v: c.id, label: c.name, dot: c.color, n: countFor("type", (e) => e.category === c.id) })) },
              { key: "room", title: "Room", options: ROOMS.map((r) => ({ v: r.id, label: r.name, n: countFor("room", (e) => e.room === r.id) })) },
              { key: "when", title: "When", options: WHEN.map(([id, label]) => ({ v: id, label, n: countFor("when", (e) => isWhen(e, id)) })) },
            ]}
          />
          </div>
        }
      />

      <ActiveFilters chips={chips} onRemove={(k, v) => setFlt((f) => toggleIn(f, k, v))} onClear={() => setFlt({})} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Show">
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
      {/* List, Calendar or Rooms, as on Studio Productions. */}
      <div className="flex rounded-[6px] border border-(--mx-line) bg-(--mx-panel) p-1" role="tablist" aria-label="View">
        {(
          [
            ["list", "List"],
            ["calendar", "Calendar"],
            ["rooms", "Rooms"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => {
              setView(id);
              setOpened(null);
            }}
            className={`rounded-[4px] px-3.5 py-1.5 text-[13.5px] font-medium transition-colors ${view === id ? "bg-(--mx-gold)/15 text-(--mx-gold-text)" : "text-(--mx-muted) hover:text-(--mx-text)"}`}
          >
            {label}
          </button>
        ))}
      </div>
      </div>

      {view !== "list" && opened && (
        <div ref={openedRef} className={`${PANEL} mb-6 px-5 py-1 sm:px-6`}>
          <div className="flex items-center justify-between border-b border-(--mx-line) py-3">
            <h2 className="text-[13px] uppercase tracking-[0.16em] text-(--mx-gold-text)">{fmtDay(opened.start, now)}</h2>
            <button type="button" onClick={() => setOpened(null)} aria-label="Close" className="text-(--mx-muted) hover:text-(--mx-text)">
              ✕
            </button>
          </div>
          <ul>
            <EventRow e={opened} now={now} going={rsvps.includes(opened.id)} />
          </ul>
          {opened.visibility !== "private" && opened.blurb && <p className="pb-4 text-[14px] text-(--mx-muted)">{opened.blurb}</p>}
        </div>
      )}

      {view === "calendar" && (
        <div className="mx-cal">
          <MonthWeekDay
            mode={calMode}
            setMode={setCalMode}
            dayOffset={dayOffset}
            setDayOffset={setDayOffset}
            monthOffset={monthOffset}
            setMonthOffset={setMonthOffset}
            events={forViews}
            now={now}
            picked={picked}
            setPicked={setPicked}
            title={eventTitle}
            locked={() => false}
            onOpen={open}
          />
        </div>
      )}
      {view === "rooms" && (
        <div className="mx-cal">
          <RoomsView events={forViews} now={now} offset={roomsOffset} setOffset={setRoomsOffset} title={eventTitle} locked={() => false} onOpen={open} />
        </div>
      )}

      {view !== "list" ? null : days.length === 0 ? (
        <div className={`${PANEL} p-8 text-center text-(--mx-muted)`}>{needle || filtering ? "No events match. Try fewer filters or a different search." : filter === "going" ? "You haven’t RSVP’d to anything yet." : "Nothing here yet."}</div>
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
