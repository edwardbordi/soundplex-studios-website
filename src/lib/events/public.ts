import { eventWhen, formatWhen, splitEvents } from "@realiizlabs/admin/events";
import { SITE_TIMEZONE } from "../site-config";
import { getAllEvents } from "./events";
import { kindLabel, type EventItem } from "./schema";
import { ROOM_NAMES, type EventCard, type CalItem } from "./constants";

// Server-only. Client widgets import ROOM_NAMES / EventCard from ./constants, never from here.
export { ROOM_NAMES, type EventCard };

/** Public productions: the ones with pages, in the sitemap and in search results. */
export function getPublicEvents(): EventItem[] {
  return getAllEvents()
    .map((e) => e.frontmatter)
    .filter((e) => e.visibility === "public");
}

/**
 * Everything on the calendar from the 1st of last month to three months out, in every visibility, shaped
 * for What's On. Private bookings leave the server as "Private event" + room + times ONLY —
 * no title, no host, nothing else. Members-only items keep their details (the page shows a lock
 * until a member logs in; the members-area wave tightens this to server-side).
 */
export function getCalendarItems(now = new Date()): CalItem[] {
  // From the 1st of last month — the calendar shows this whole month (and last) filled in.
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const to = now.getTime() + 92 * 86_400_000;
  const out: CalItem[] = [];
  for (const { frontmatter: fm } of getAllEvents()) {
    const when = eventWhen(fm, { defaultZone: SITE_TIMEZONE });
    const start = when.start.getTime();
    if (start < from || start > to) continue;
    const end = (when.end ?? new Date(start + 2 * 3_600_000)).toISOString();
    const base = { id: fm.slug, room: fm.venue ?? "wood-room", startISO: when.start.toISOString(), endISO: end };
    if (fm.visibility === "private") {
      out.push({ ...base, title: "Private event", kind: "private", kindLabel: "Private", visibility: "private" });
      continue;
    }
    out.push({
      ...base,
      ...(fm.visibility === "public" ? { slug: fm.slug } : {}),
      title: fm.title,
      kind: fm.kind ?? "other",
      kindLabel: kindLabel(fm),
      visibility: fm.visibility === "members" ? "members" : "public",
      summary: fm.summary,
      ...(fm.price ? { price: fm.price } : {}),
      ...(fm.url ? { url: fm.url } : {}),
      ...(fm.ticketLabel ? { ticketLabel: fm.ticketLabel } : {}),
      ...(fm.hostNote ? { hostNote: fm.hostNote } : {}),
      ...(fm.producer ? { producer: fm.producer } : {}),
      ...(fm.heroImage ? { heroImage: fm.heroImage, heroImageAlt: fm.heroImageAlt ?? fm.title } : {}),
      ...(fm.cancelled ? { cancelled: true } : {}),
      ...(fm.closed ? { closed: true } : {}),
    });
  }
  return out.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

export function toCard(fm: EventItem): EventCard {
  const when = eventWhen(fm, { defaultZone: SITE_TIMEZONE });
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: when.zone, weekday: "short", day: "numeric", month: "short" }).formatToParts(when.start);
  const part = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    slug: fm.slug,
    title: fm.title,
    summary: fm.summary,
    kind: fm.kind ?? "other",
    kindLabel: kindLabel(fm),
    date: fm.date,
    startISO: when.start.toISOString(),
    ...(when.end ? { endISO: when.end.toISOString() } : {}),
    whenText: formatWhen(when),
    weekday: part("weekday"),
    day: part("day"),
    month: part("month"),
    room: fm.venue ?? "wood-room",
    roomName: ROOM_NAMES[fm.venue ?? "wood-room"] ?? fm.venue ?? "",
    ...(fm.producer ? { producer: fm.producer } : {}),
    ...(fm.price ? { price: fm.price } : {}),
    ...(fm.ticketLabel ? { ticketLabel: fm.ticketLabel } : {}),
    ...(fm.url ? { url: fm.url } : {}),
    ...(fm.heroImage ? { heroImage: fm.heroImage, heroImageAlt: fm.heroImageAlt ?? fm.title } : {}),
    mood: fm.mood ?? [],
    cancelled: fm.cancelled === true,
    closed: fm.closed === true,
    ...(fm.rescheduledTo ? { rescheduledTo: fm.rescheduledTo } : {}),
    ...(fm.location ? { location: fm.location } : {}),
  };
}

export function getUpcomingAndPast(now = new Date()) {
  const { upcoming, past } = splitEvents(getPublicEvents(), now, { defaultZone: SITE_TIMEZONE });
  return { upcoming: upcoming.map(toCard), past: past.map(toCard) };
}
