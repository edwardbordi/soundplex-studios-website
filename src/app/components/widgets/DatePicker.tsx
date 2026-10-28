"use client";

import Image from "next/image";
import { useMemo, useState, useSyncExternalStore } from "react";

/**
 * An inline, branded month calendar for the survey's "When?" (Ed, 2026-10-28) — replaces the
 * browser's date input, whose popup can't be styled. One month at a time, past days off,
 * today ringed, the chosen day in gold, a plain-English readout and Clear underneath.
 * Value in and out is "YYYY-MM-DD" (same as the old input), or "" for none.
 *
 * "Today" is read on the client only (useSyncExternalStore with a null server snapshot), so the
 * server and the browser never disagree about which day it is near midnight.
 */

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayKey = () => {
  const t = new Date();
  return keyOf(t.getFullYear(), t.getMonth(), t.getDate());
};
const noop = () => () => {};

/** How far off a day is, the way people say it. */
function fromToday(day: string, today: string): string {
  const ms = new Date(`${day}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime();
  const d = Math.round(ms / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d < 14) return `In ${d} days`;
  if (d < 60) return `In ${Math.round(d / 7)} weeks`;
  return `In ${Math.round(d / 30)} months`;
}

export type DatePreview = { roomName?: string; image?: string; imageAlt?: string; what?: string };

export default function DatePicker({ value, onChange, label = "Pick a date", preview }: { value: string; onChange: (v: string) => void; label?: string; preview?: DatePreview }) {
  const today = useSyncExternalStore(noop, todayKey, () => null);
  const [view, setView] = useState<string | null>(null); // "YYYY-MM" the visitor paged to

  const shown = view ?? (value || today || "").slice(0, 7);
  const [y, m] = shown ? shown.split("-").map(Number) : [0, 0];
  const month = m - 1;

  const cells = useMemo(() => {
    if (!shown) return [];
    const lead = new Date(y, month, 1).getDay();
    const days = new Date(y, month + 1, 0).getDate();
    const out: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
    while (out.length % 7) out.push(null);
    return out;
  }, [shown, y, month]);

  if (!shown || !today) return <div className="dp dp--loading" aria-hidden />;

  const title = new Date(y, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const atStart = shown <= today.slice(0, 7);
  const shift = (d: number) => {
    const n = new Date(y, month + d, 1);
    setView(`${n.getFullYear()}-${pad(n.getMonth() + 1)}`);
  };
  const readout = value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: value.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric" })
    : "";

  const picked = value ? new Date(`${value}T12:00:00`) : null;

  return (
    <div className="dp-wrap">
    <div className="dp" role="group" aria-label={label}>
      <div className="dp__head">
        <button type="button" className="dp__nav" onClick={() => shift(-1)} disabled={atStart} aria-label="Previous month">‹</button>
        <p className="dp__title" aria-live="polite">{title}</p>
        <button type="button" className="dp__nav" onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>
      <div className="dp__grid">
        {WEEKDAYS.map((d, i) => <span key={i} className="dp__dow" aria-hidden>{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />;
          const k = keyOf(y, month, d);
          const past = k < today;
          const picked = k === value;
          return (
            <button
              key={k}
              type="button"
              disabled={past}
              aria-pressed={picked}
              aria-label={new Date(y, month, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              onClick={() => onChange(picked ? "" : k)}
              className={`dp__day${picked ? " is-picked" : ""}${k === today ? " is-today" : ""}`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="dp__foot">
        <p className="dp__readout">{readout || "No date yet — that’s fine if you’re flexible."}</p>
        {value && <button type="button" className="sv__link" onClick={() => onChange("")}>Clear</button>}
      </div>
    </div>

    {/* The preview: a ticket for the day they picked, in the room they picked. */}
    <aside className={`dp-ticket${picked ? " is-set" : ""}`} aria-live="polite">
      {preview?.image && (
        <div className="dp-ticket__img">
          <Image src={preview.image} alt={preview.imageAlt ?? ""} fill sizes="(max-width: 860px) 100vw, 320px" className="object-cover" />
        </div>
      )}
      <div className="dp-ticket__scrim" aria-hidden />
      <div className="dp-ticket__body">
        {picked ? (
          <>
            <p className="dp-ticket__when">{fromToday(value, today)}</p>
            <p className="dp-ticket__wd">{picked.toLocaleDateString("en-US", { weekday: "long" })}</p>
            <p className="dp-ticket__day">{picked.getDate()}</p>
            <p className="dp-ticket__mo">{picked.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          </>
        ) : (
          <>
            <p className="dp-ticket__when">Your date</p>
            <p className="dp-ticket__day dp-ticket__day--empty">—</p>
            <p className="dp-ticket__mo">Tap a day on the calendar</p>
          </>
        )}
        {(preview?.roomName || preview?.what) && (
          <p className="dp-ticket__where">
            {preview?.what && <span>{preview.what}</span>}
            {preview?.roomName && <span>{preview.roomName} · SoundPlex</span>}
          </p>
        )}
      </div>
    </aside>
    </div>
  );
}
