"use client";

import { Fragment, useSyncExternalStore } from "react";
import { HOURS_ROWS, SITE_TIMEZONE } from "../../lib/site-config";
import { openLabel, openStatus } from "../../lib/hours";

/**
 * The hours, live (Ed, 2026-10-28 — "same features as blue": it knows the hours and adjusts in
 * real time). From HOURS_SPEC / HOURS_ROWS in site-config, in SoundPlex's own time zone,
 * re-checked every minute. Nothing time-dependent renders on the server.
 *   <OpenNow />                  pill: "Open now · until 10 PM" (About → Getting here)
 *   <OpenNow variant="inline" /> plain text with a dot (the header's top bar)
 *   <HoursTable />               the week, today's row marked
 * Open = a gold pulsing dot (not green: green on this site means "you"); closed = hollow dot.
 */
const subscribe = (cb: () => void) => {
  const t = window.setInterval(cb, 60_000);
  return () => window.clearInterval(t);
};
const minuteNow = () => Math.floor(Date.now() / 60_000);
const useMinute = () => useSyncExternalStore(subscribe, minuteNow, () => 0);

export default function OpenNow({ variant = "pill" }: { variant?: "pill" | "inline" }) {
  const minute = useMinute();
  if (!minute) return null;
  const s = openStatus(new Date(minute * 60_000));
  const label = openLabel(s);
  if (!label) return null;
  const dot = <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.open ? "animate-pulse bg-[#d4a030]" : "border border-white/50"}`} />;
  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        {dot}
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-[3px] border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[12.5px] text-white/80">
      {dot}
      {label}
    </span>
  );
}

const ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function coversToday(label: string, today: string) {
  const [a, b] = label.split(/[–-]/).map((x) => x.trim().slice(0, 3));
  const i = ORDER.indexOf(today);
  const from = ORDER.indexOf(a);
  const to = b ? ORDER.indexOf(b) : from;
  if (from < 0) return false;
  return to >= from ? i >= from && i <= to : i >= from || i <= to;
}

export function HoursTable({ className = "" }: { className?: string }) {
  const minute = useMinute();
  const at = minute ? new Date(minute * 60_000) : null;
  const today = at ? new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, weekday: "short" }).format(at) : null;
  const open = at ? openStatus(at).open : false;
  return (
    <dl className={`grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 ${className}`}>
      {HOURS_ROWS.map((r) => {
        const now = today !== null && coversToday(r.days, today);
        const tone = today === null || now ? "text-white" : "text-white/50";
        return (
          <Fragment key={r.days}>
            <dt className={`flex items-center gap-2 whitespace-nowrap ${tone} ${now ? "font-semibold" : ""}`}>
              <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${!now ? "bg-transparent" : open ? "bg-[#d4a030]" : "border border-white/50"}`} />
              {r.days}
              {now && <span className="sr-only"> (today)</span>}
            </dt>
            <dd className={`whitespace-nowrap tabular-nums ${tone} ${now ? "font-semibold" : ""}`}>{r.time}</dd>
          </Fragment>
        );
      })}
    </dl>
  );
}
