"use client";

/**
 * Studio Productions — "Find your kind of night" (George's #7).
 *
 * Two views over the same public events: a list (default on phones) and a month grid
 * (default on desktop; one tap away on phones). Three filters above both: the mood
 * prompts, the kind, the room. Filters are plain state — nothing is fetched; every
 * public event is in the page already (there are dozens, not thousands).
 *
 * Past productions sit under a separate heading, list only, dimmed, newest first —
 * proof the place is alive, not a thing to browse.
 */

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import ForwardArrow from "../ForwardArrow";
import { MOODS, KIND_LABELS, type Mood } from "../../../lib/events/schema";
import { ROOM_NAMES, type EventCard } from "../../../lib/events/public";

type View = "list" | "grid";

export default function EventsCalendar({ upcoming, past, today }: { upcoming: EventCard[]; past: EventCard[]; today: string }) {
  const [view, setView] = useState<View>("list");
  const [mood, setMood] = useState<Mood | "">("");
  const [kind, setKind] = useState("");
  const [room, setRoom] = useState("");
  const [month, setMonth] = useState(() => today.slice(0, 7)); // YYYY-MM

  // Desktop defaults to the grid; a user's explicit choice sticks for the visit.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem("sp-events-view") as View | null;
      if (saved === "list" || saved === "grid") {
        setView(saved); // eslint-disable-line react-hooks/set-state-in-effect -- one-time restore
        return;
      }
    } catch { /* ignore */ }
    if (window.matchMedia("(min-width: 861px)").matches) setView("grid");
  }, []);
  const pick = (v: View) => {
    setView(v);
    try { window.sessionStorage.setItem("sp-events-view", v); } catch { /* ignore */ }
  };

  const matches = (e: EventCard) => (!mood || e.mood.includes(mood)) && (!kind || e.kind === kind) && (!room || e.room === room);
  const up = useMemo(() => upcoming.filter(matches), [upcoming, mood, kind, room]); // eslint-disable-line react-hooks/exhaustive-deps
  const gone = useMemo(() => past.filter(matches), [past, mood, kind, room]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = useMemo(() => [...up, ...gone], [up, gone]);

  const kinds = useMemo(() => Array.from(new Set([...upcoming, ...past].map((e) => e.kind))), [upcoming, past]);
  const rooms = useMemo(() => Array.from(new Set([...upcoming, ...past].map((e) => e.room))), [upcoming, past]);
  const filtered = !!(mood || kind || room);

  return (
    <div className="ev">
      {/* Filters */}
      <div className="ev__filters">
        <div className="ev__moods" role="group" aria-label="Kind of night">
          <button type="button" className={`ev__chip${mood === "" ? " is-active" : ""}`} onClick={() => setMood("")}>Everything</button>
          {MOODS.map((m) => (
            <button key={m.value} type="button" className={`ev__chip${mood === m.value ? " is-active" : ""}`} onClick={() => setMood(mood === m.value ? "" : m.value)}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="ev__selects">
          <label className="ev__select">
            <span>Kind</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">All kinds</option>
              {kinds.map((k) => <option key={k} value={k}>{KIND_LABELS[k as keyof typeof KIND_LABELS] ?? k}</option>)}
            </select>
          </label>
          <label className="ev__select">
            <span>Room</span>
            <select value={room} onChange={(e) => setRoom(e.target.value)}>
              <option value="">All rooms</option>
              {rooms.map((r) => <option key={r} value={r}>{ROOM_NAMES[r] ?? r}</option>)}
            </select>
          </label>
          <div className="ev__views" role="group" aria-label="View">
            <button type="button" className={`ev__view${view === "list" ? " is-active" : ""}`} aria-pressed={view === "list"} onClick={() => pick("list")}>List</button>
            <button type="button" className={`ev__view${view === "grid" ? " is-active" : ""}`} aria-pressed={view === "grid"} onClick={() => pick("grid")}>Month</button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <MonthGrid events={all} month={month} setMonth={setMonth} today={today} />
      ) : (
        <section aria-labelledby="ev-upcoming" className="ev__section">
          <h2 id="ev-upcoming" className="ev__h">Coming up</h2>
          {up.length === 0 ? (
            <p className="ev__empty">{filtered ? "Nothing matches that just now — try another kind of night." : "Nothing on the calendar yet. Check back soon, or join the list in the footer."}</p>
          ) : (
            <ol className="ev__list">{up.map((e) => <li key={e.slug}><Row e={e} /></li>)}</ol>
          )}
        </section>
      )}

      {gone.length > 0 && view === "list" && (
        <section aria-labelledby="ev-past" className="ev__section ev__section--past">
          <h2 id="ev-past" className="ev__h">Past productions</h2>
          <ol className="ev__list ev__list--past">{gone.slice(0, 24).map((e) => <li key={e.slug}><Row e={e} past /></li>)}</ol>
        </section>
      )}
    </div>
  );
}

function Row({ e, past = false }: { e: EventCard; past?: boolean }) {
  return (
    <article className={`ev__row${past ? " is-past" : ""}${e.cancelled ? " is-cancelled" : ""}`}>
      <div className="ev__date" aria-hidden>
        <span className="ev__wd">{e.weekday}</span>
        <span className="ev__dd">{e.day}</span>
        <span className="ev__mo">{e.month}</span>
      </div>
      <div className="ev__body">
        <p className="ev__meta">
          <span className="ev__kind">{e.kindLabel}</span>
          <span className="ev__dot">·</span>
          <span>{e.roomName}</span>
          {e.price && <><span className="ev__dot">·</span><span>{e.price}</span></>}
          {e.cancelled && <><span className="ev__dot">·</span><span className="ev__warn">Canceled</span></>}
          {e.closed && !e.cancelled && <><span className="ev__dot">·</span><span className="ev__warn">Sold out</span></>}
        </p>
        <h3 className="ev__title"><Link href={`/studio-productions/${e.slug}`}>{e.title}</Link></h3>
        <p className="ev__when"><time dateTime={e.startISO}>{e.whenText}</time>{e.producer && e.producer !== "SoundPlex" && <> · presented by {e.producer}</>}</p>
        {!past && <p className="ev__sum">{e.summary}</p>}
        {!past && (
          <Link href={`/studio-productions/${e.slug}`} className="card-cta group mt-3 inline-flex items-center gap-2 whitespace-nowrap">
            {e.url && !e.cancelled && !e.closed ? (e.ticketLabel ?? "Tickets") : "Details"}<ForwardArrow />
          </Link>
        )}
      </div>
      {e.heroImage && !past && (
        <div className="ev__thumb">
          <Image src={e.heroImage} alt={e.heroImageAlt ?? ""} fill sizes="(max-width: 860px) 100vw, 220px" className="object-cover" />
        </div>
      )}
    </article>
  );
}

function MonthGrid({ events, month, setMonth, today }: { events: EventCard[]; month: string; setMonth: (m: string) => void; today: string }) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = first.getUTCDay(); // 0 = Sunday
  const label = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const shift = (d: number) => {
    const n = new Date(Date.UTC(y, m - 1 + d, 1));
    setMonth(`${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}`);
  };
  const byDay = new Map<string, EventCard[]>();
  for (const e of events) {
    if (!e.date.startsWith(month)) continue;
    byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
  }
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const monthHas = events.some((e) => e.date.startsWith(month));

  return (
    <section className="ev__grid-wrap" aria-label={`Calendar, ${label}`}>
      <div className="ev__grid-head">
        <button type="button" className="ev__nav" onClick={() => shift(-1)} aria-label="Previous month">←</button>
        <h2 className="ev__h ev__h--month">{label}</h2>
        <button type="button" className="ev__nav" onClick={() => shift(1)} aria-label="Next month">→</button>
      </div>
      <div className="ev__grid" role="grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="ev__dow" role="columnheader">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`b${i}`} className="ev__cell is-blank" role="gridcell" />;
          const key = `${month}-${String(d).padStart(2, "0")}`;
          const items = byDay.get(key) ?? [];
          const isPast = key < today;
          return (
            <div key={key} className={`ev__cell${isPast ? " is-past" : ""}${key === today ? " is-today" : ""}`} role="gridcell">
              <span className="ev__num">{d}</span>
              {items.map((e) => (
                <Link key={e.slug} href={`/studio-productions/${e.slug}`} className={`ev__pill${e.cancelled ? " is-cancelled" : ""}`} title={e.title}>
                  <span className="ev__pill-k">{e.kindLabel}</span>
                  <span className="ev__pill-t">{e.title}</span>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      {!monthHas && <p className="ev__empty">Nothing on the calendar this month.</p>}
    </section>
  );
}
