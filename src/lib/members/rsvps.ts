"use client";

import { useSyncExternalStore } from "react";
import { setSession } from "../venue/session";

/**
 * A member's RSVPs (this browser for now; the "real RSVPs" step moves them into the database).
 *
 * Each RSVP keeps when the production ENDS (Ed, 2026-11-24: "My RSVPs" in the avatar menu said 6,
 * counting ones long past). So the count is upcoming only, and anything that ended over a day ago
 * drops off on its own. Older saves were bare ids: a sample's id carries its date
 * ("sample-2026-11-25-…"), which is used; a bare id with no date is kept and counted as upcoming.
 */

const KEY = "sp-member-rsvps";
const EVENT = "sp-member-rsvps";
const KEEP_AFTER_END_MS = 24 * 60 * 60 * 1000;

type Rsvp = { id: string; end?: number };

let cache: Rsvp[] | null = null;
let idsCache: string[] = [];

function endFromId(id: string): number | undefined {
  const m = id.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? Date.parse(`${m[1]}T23:59:59`) : undefined;
}

function read(): Rsvp[] {
  if (cache) return cache;
  let raw: unknown = [];
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {}
  const list: Rsvp[] = (Array.isArray(raw) ? raw : [])
    .map((x): Rsvp | null =>
      typeof x === "string" ? { id: x, end: endFromId(x) } : x && typeof x.id === "string" ? { id: x.id, end: typeof x.end === "number" ? x.end : undefined } : null,
    )
    .filter((x): x is Rsvp => x !== null)
    // Long over: gone.
    .filter((x) => x.end === undefined || x.end > Date.now() - KEEP_AFTER_END_MS);
  cache = list;
  idsCache = list.map((x) => x.id);
  return list;
}

function write(list: Rsvp[]) {
  cache = list;
  idsCache = list.map((x) => x.id);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* lasts this visit */
  }
  setSession({ rsvps: upcomingRsvpCount() });
  window.dispatchEvent(new Event(EVENT));
}

/** How many RSVPs are still to come (not yet ended). What "My RSVPs" shows. */
export function upcomingRsvpCount(): number {
  const now = Date.now();
  return read().filter((x) => x.end === undefined || x.end > now).length;
}

const EMPTY: string[] = [];
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
const getIds = () => {
  read();
  return idsCache;
};

/** The ids you've RSVP'd to (for "Going" marks and filters). */
export function useRsvps(): string[] {
  return useSyncExternalStore(subscribe, getIds, () => EMPTY);
}

/** RSVP or un-RSVP; `end` is when the production ends, so it stops counting once it's over. */
export function toggleRsvp(id: string, end?: Date | number) {
  const cur = read();
  const endMs = end instanceof Date ? end.getTime() : end;
  write(cur.some((x) => x.id === id) ? cur.filter((x) => x.id !== id) : [...cur, { id, end: endMs ?? endFromId(id) }]);
}

/**
 * Drop RSVPs to productions that aren't on the calendar any more (cancelled, or a sample week that
 * was replaced), so "My RSVPs" and the Calendar's "Going" always agree (Ed, 2026-11-24: 2 vs 1).
 * `events` is what the members area has loaded; only RSVPs inside its time span are checked, so
 * one further out than the calendar reaches is left alone.
 */
export function reconcileRsvps(events: { id: string; start: Date; end: Date }[]) {
  if (!events.length) return;
  const known = new Set(events.map((e) => e.id));
  const last = Math.max(...events.map((e) => e.end.getTime()));
  const cur = read();
  const kept = cur.filter((x) => known.has(x.id) || (x.end !== undefined && x.end > last));
  // Fill in an end time for any kept RSVP that didn't have one (older saves).
  const ends = new Map(events.map((e) => [e.id, e.end.getTime()]));
  const filled = kept.map((x) => (x.end === undefined && ends.has(x.id) ? { ...x, end: ends.get(x.id) } : x));
  if (filled.length !== cur.length || filled.some((x, i) => x.end !== cur[i]?.end)) write(filled);
  else syncRsvpCount();
}

/** Bring the saved count in line (on load): it was stored once and could have gone stale. */
export function syncRsvpCount() {
  setSession({ rsvps: upcomingRsvpCount() });
}
