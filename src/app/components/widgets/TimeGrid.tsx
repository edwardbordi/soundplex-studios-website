"use client";

import { catOf, roomOf, type VenueEvent } from "../../../lib/venue/data";
import { hideTip, showTip } from "./CalTip";

/**
 * The calendar's Day and Week views (Ed, 2026-10-11): an hour grid, 9 AM to midnight, one
 * column per day. Calm blocks (soft grey, a category dot), matching Month, List and Rooms.
 */
const OPEN_H = 9;
const CLOSE_H = 24;
const HOUR = 52; // px per hour

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const t = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined });
const hourLabel = (h: number) => (h === 12 ? "12 PM" : h === 24 ? "12 AM" : h > 12 ? `${h - 12} PM` : `${h} AM`);

const STRIP = 14; // px: a long background event shown as a slim strip
const LONG = 4 * 3_600_000;

/**
 * Lay out one day: overlapping events sit side by side, never on top of each other. In the
 * narrow Week columns, a long members-only or private event that overlaps others (e.g. Open Studio)
 * becomes a slim strip on the left so the shorter ones keep their width.
 */
function layout(list: VenueEvent[], single: boolean) {
  const sorted = [...list].sort((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime());
  const overlaps = (a: VenueEvent, b: VenueEvent) => a.start < b.end && a.end > b.start;
  // Only background-ish events become strips (members-only drop-ins, private bookings), never a public show.
  const isStrip = (e: VenueEvent) =>
    !single && e.visibility !== "public" && e.end.getTime() - e.start.getTime() >= LONG && sorted.some((o) => o !== e && overlaps(o, e));
  const stripsList = sorted.filter(isStrip);
  const rest = sorted.filter((e) => !isStrip(e));
  const ends: number[] = [];
  const placed = rest.map((e) => {
    let lane = ends.findIndex((end) => end <= e.start.getTime());
    if (lane < 0) lane = ends.length;
    ends[lane] = e.end.getTime();
    return { e, lane };
  });
  const out = placed.map((o) => ({
    ...o,
    of: Math.max(...placed.filter((x) => overlaps(x.e, o.e)).map((x) => x.lane)) + 1,
    strip: false,
    stripIndex: 0,
    strips: stripsList.filter((s) => overlaps(s, o.e)).length,
  }));
  return [
    ...stripsList.map((e, i) => ({ e, lane: 0, of: 1, strip: true, stripIndex: i, strips: 0 })),
    ...out,
  ];
}

export default function TimeGrid({
  days,
  events,
  now,
  title,
  locked,
  onOpen,
  onPickDay,
}: {
  days: Date[];
  events: VenueEvent[];
  now: Date;
  title: (e: VenueEvent) => string;
  locked: (e: VenueEvent) => boolean;
  onOpen: (e: VenueEvent) => void;
  onPickDay?: (d: Date) => void;
}) {
  const hours = Array.from({ length: CLOSE_H - OPEN_H }, (_, i) => OPEN_H + i);
  const y = (d: Date, base: Date) => {
    const h = (d.getTime() - new Date(base).setHours(0, 0, 0, 0)) / 3_600_000;
    return (Math.min(CLOSE_H, Math.max(OPEN_H, h)) - OPEN_H) * HOUR;
  };
  const single = days.length === 1;

  return (
    <div className={`overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#080808] ${single ? "" : "overflow-x-auto"}`}>
      <div className={single ? "" : "min-w-[760px]"}>
        {/* Day headers: small caps, the date beside it; gold circle only on today. */}
        <div className="grid border-b border-white/[0.08]" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
          <div />
          {days.map((d) => {
            const today = sameDay(d, now);
            return (
              <button
                key={d.toDateString()}
                type="button"
                disabled={!onPickDay}
                onClick={() => onPickDay?.(d)}
                className="flex items-center gap-2 px-3 py-2.5 enabled:hover:bg-white/[0.03]"
              >
                <span className="font-[family-name:var(--font-poppins)] text-[0.62rem] font-medium uppercase tracking-[0.2em] text-white/40">
                  {d.toLocaleDateString("en-US", { weekday: single ? "long" : "short" })}
                </span>
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full font-[family-name:var(--font-poppins)] text-[13px] tabular-nums leading-none ${today ? "font-semibold text-[#050505]" : "text-white/75"}`}
                  style={today ? { background: "#d4a030" } : undefined}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* The grid */}
        <div className="relative grid" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
          <div className="relative" style={{ height: hours.length * HOUR }}>
            {hours.map((h, i) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-white/35" style={{ top: i * HOUR }}>
                {i === 0 ? "" : hourLabel(h)}
              </span>
            ))}
          </div>
          {days.map((d) => {
            const list = layout(events.filter((e) => sameDay(e.start, d)), single);
            const today = sameDay(d, now);
            return (
              <div key={d.toDateString()} className={`relative border-l border-white/[0.05] ${today ? "bg-white/[0.015]" : ""}`} style={{ height: hours.length * HOUR }}>
                {hours.map((h, i) => (
                  <span key={h} className="absolute inset-x-0 border-t border-white/[0.035]" style={{ top: i * HOUR }} />
                ))}
                {list.map(({ e, lane, of, strip, stripIndex, strips }) => {
                  const c = catOf(e.category).color;
                  const top = y(e.start, d);
                  const h = Math.max(22, y(e.end, d) - top - 2);
                  const short = h < 40;
                  const muted = locked(e);
                  if (strip) {
                    // A long event under others: a slim strip on the left, so it never hides them.
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onOpen(e)}
                        onMouseEnter={(ev) => showTip(e, title(e), ev.currentTarget)}
                        onMouseLeave={hideTip}
                        onFocus={(ev) => showTip(e, title(e), ev.currentTarget)}
                        onBlur={hideTip}
                        aria-label={`${title(e)}, ${t(e.start)} to ${t(e.end)}`}
                        className="absolute flex justify-center rounded-[4px] bg-white/[0.085] pt-2 transition-colors hover:bg-white/[0.13]"
                        style={{ top: top + 1, height: h, left: 2 + stripIndex * (STRIP + 2), width: STRIP }}
                      >
                        <span className="h-[6px] w-[6px] rounded-full" style={{ background: c }} />
                      </button>
                    );
                  }
                  const inset = strips * (STRIP + 2) + 2;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onOpen(e)}
                      onMouseEnter={(ev) => showTip(e, title(e), ev.currentTarget)}
                      onMouseLeave={hideTip}
                      onFocus={(ev) => showTip(e, title(e), ev.currentTarget)}
                      onBlur={hideTip}
                      className="absolute flex flex-col justify-start overflow-hidden rounded-[4px] bg-white/[0.085] px-2 py-1.5 text-left text-[12px] leading-tight transition-colors hover:bg-white/[0.13]"
                      style={{
                        top: top + 1,
                        height: h,
                        left: `calc(${inset}px + (100% - ${inset + 2}px) * ${lane / of})`,
                        width: `calc((100% - ${inset + 2}px) / ${of} - 2px)`,
                      }}
                    >
                      {/* One line, "…" when it doesn't fit; the hover card shows the full title (Ed). */}
                      <span className="flex min-w-0 max-w-full items-center gap-1.5">
                        <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: c }} />
                        <span className={`min-w-0 truncate font-medium ${muted ? "italic text-white/50" : "text-white/90"}`}>{title(e)}</span>
                      </span>
                      {!short && (
                        <span className="mt-0.5 block truncate pl-[12px] text-white/40">
                          {t(e.start)}
                          {single ? ` – ${t(e.end)} · ${roomOf(e.room).name}` : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
                {today && now.getHours() >= OPEN_H && (
                  <span className="pointer-events-none absolute inset-x-0 z-10 h-px" style={{ top: y(now, d), background: "#d4a030" }}>
                    <span className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] rounded-full" style={{ background: "#d4a030" }} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
