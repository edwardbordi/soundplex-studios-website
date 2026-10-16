import { eventWhen, formatWhen, splitEvents } from "@realiizlabs/admin/events";
import { SITE_TIMEZONE } from "../site-config";
import { getAllEvents } from "./events";
import { kindLabel, type EventItem, type Mood } from "./schema";

/** Room slug → display name (content/rooms is the source of truth for pages; this is the quick map). */
export const ROOM_NAMES: Record<string, string> = {
  "wood-room": "WoodRoom",
  "studio-a": "Studio A",
  "podcast-studio": "Podcasting Studios",
  "sound-lounge": "SoundLounge",
  "whole-building": "The whole building",
};

/** Only public productions ever leave the server. Private = rentals and member sessions. */
export function getPublicEvents(): EventItem[] {
  return getAllEvents()
    .map((e) => e.frontmatter)
    .filter((e) => e.visibility !== "private");
}

/** A flat, serialisable shape for the client-side calendar. */
export type EventCard = {
  slug: string;
  title: string;
  summary: string;
  kind: string;
  kindLabel: string;
  date: string; // YYYY-MM-DD
  startISO: string;
  endISO?: string;
  whenText: string;
  weekday: string;
  day: string;
  month: string;
  room: string;
  roomName: string;
  producer?: string;
  price?: string;
  ticketLabel?: string;
  url?: string;
  heroImage?: string;
  heroImageAlt?: string;
  mood: Mood[];
  cancelled: boolean;
  closed: boolean;
  rescheduledTo?: string;
  location?: string;
};

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
