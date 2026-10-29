import { HOURS_SPEC, SITE_TIMEZONE } from "./site-config";

/**
 * "Open now · until 10 PM" / "Opens Mon 8 AM", computed from HOURS_SPEC in SoundPlex's own time
 * zone, so a visitor anywhere sees the building's clock, not theirs. Ported from the hours widget
 * on our other sites (Ed, 2026-10-28).
 */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT: Record<string, string> = {
  Sunday: "Sun", Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat",
};

function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fmt(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}
function windowFor(day: string) {
  return HOURS_SPEC.find((h) => h.days.includes(day)) ?? null;
}

export type OpenStatus = { open: true; until: string } | { open: false; opens: string; day: string; isToday: boolean; isTomorrow: boolean };

/** Status for a given instant (defaults to now), evaluated in SITE_TIMEZONE. */
export function openStatus(at: Date = new Date()): OpenStatus {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIMEZONE, weekday: "long", hour: "numeric", minute: "numeric", hour12: false,
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday");
  const now = (Number(get("hour")) % 24) * 60 + Number(get("minute"));

  const today = windowFor(day);
  if (today) {
    if (now < toMin(today.opens)) return { open: false, opens: fmt(today.opens), day: SHORT[day], isToday: true, isTomorrow: false };
    if (now < toMin(today.closes)) return { open: true, until: fmt(today.closes) };
  }
  // Next day with hours.
  const i = DAYS.indexOf(day);
  for (let n = 1; n <= 7; n++) {
    const d = DAYS[(i + n) % 7];
    const w = windowFor(d);
    if (w) return { open: false, opens: fmt(w.opens), day: SHORT[d], isToday: false, isTomorrow: n === 1 };
  }
  return { open: false, opens: "", day: "", isToday: false, isTomorrow: false };
}

/** The one-line label. */
export function openLabel(s: OpenStatus = openStatus()) {
  if (s.open) return `Open now · until ${s.until}`;
  if (!s.opens) return "";
  return s.isToday ? `Opens today ${s.opens}` : s.isTomorrow ? `Opens tomorrow ${s.opens}` : `Opens ${s.day} ${s.opens}`;
}

/** schema.org openingHoursSpecification, from the same table. */
export function openingHoursJsonLd() {
  return HOURS_SPEC.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days,
    opens: h.opens,
    closes: h.closes,
  }));
}
