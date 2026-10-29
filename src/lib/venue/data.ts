import type { CalItem } from "../events/constants";
import { sampleItems, sampleRange } from "../events/samples";

/**
 * What's On's data layer — the SAME shape the showroom demo's components use (Ed, 2026-10-28:
 * "make it exactly like the demo, only the colors, fonts and data change"). The components in
 * widgets/ (WhatsOn, TonightBoard, FilterMenu, RoomPicker, TimeGrid, LiveFeed, AccountMenu) are
 * the demo's, ported; this file is what changed underneath them:
 *
 *   ROOMS       SoundPlex's three rooms (keep in step with content/rooms/*.mdx)
 *   CATEGORIES  SoundPlex's kinds of night, as filter categories with a dot color
 *   fromCalItems() George's REAL events (content/events → getCalendarItems on the server)
 *   eventsAround() SAMPLE events (samples.ts) while SHOW_SAMPLE_EVENTS is on
 *
 * Honesty rules for real events (samples can simulate; real ones can't): no made-up "tickets
 * left" counts, no made-up headcounts, tickets go to George's real ticket link.
 */

export type Visibility = "public" | "members" | "private";

export interface Room {
  id: string;
  name: string;
  short: string;
  photo: string;
  capacity: number;
  /** Floor-plan box on a 100 × 64 grid (the members' "who's here" plan). */
  plan: { x: number; y: number; w: number; h: number };
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface VenueEvent {
  id: string;
  title: string;
  category: string;
  room: string;
  start: Date;
  end: Date;
  visibility: Visibility;
  /** As printed: "$15", "Free", "Members", or "". */
  price: string;
  blurb: string;
  invited?: boolean;
  /** Drop-in hours: on the room timeline and floor plan, not in the list or month. */
  ambient?: boolean;
  /** SoundPlex additions — real events: */
  url?: string;
  ticketLabel?: string;
  slug?: string;
  hostNote?: string;
  /** A made-up sample (never a page, never sent anywhere). */
  sample?: boolean;
}

/** Keep in step with content/rooms/*.mdx (name, hero image, capacity). */
export const ROOMS: Room[] = [
  { id: "wood-room", name: "WoodRoom", short: "WoodRoom", photo: "/flythrough/states/state-A.jpg", capacity: 80, plan: { x: 2, y: 2, w: 56, h: 60 } },
  { id: "studio-a", name: "Studio A", short: "Studio A", photo: "/flythrough/poster/07.jpg", capacity: 80, plan: { x: 60, y: 2, w: 38, h: 34 } },
  { id: "sound-lounge", name: "SoundLounge", short: "Lounge", photo: "/rooms/sound-lounge-1.webp", capacity: 50, plan: { x: 60, y: 38, w: 38, h: 24 } },
];

export const CATEGORIES: Category[] = [
  { id: "music", name: "Live music", color: "#e0559b" },
  { id: "comedy", name: "Comedy", color: "#ff8a3d" },
  { id: "workshop", name: "Workshops & talks", color: "#4f9dff" },
  { id: "network", name: "Networking", color: "#4ecdc4" },
  { id: "screening", name: "Screenings", color: "#b28dff" },
  { id: "podcast", name: "Podcasts", color: "#e8c35a" },
  { id: "members", name: "Members", color: "#7bd88f" },
  { id: "private", name: "Private", color: "#8a8f9c" },
];

export const catOf = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[2];
export const roomOf = (id: string) => ROOMS.find((r) => r.id === id) ?? ROOMS[0];

/** SoundPlex kind → filter category. Members-only and private events get their own. */
function categoryFor(kind: string, visibility: Visibility): string {
  if (visibility === "private") return "private";
  if (visibility === "members") return "members";
  if (kind === "show" || kind === "open-mic") return "music";
  if (kind === "comedy") return "comedy";
  if (kind === "networking") return "network";
  if (kind === "screening") return "screening";
  if (kind === "podcast-taping") return "podcast";
  return "workshop";
}

/** Members who might be "here" — the same people as the home page's Connection Wall (placeholders). */
export const MEMBERS = [
  { name: "Andre", last: "Lewis", role: "Producer", photo: "/wall/andre-1.jpg" },
  { name: "Nia", last: "Brooks", role: "Vocalist", photo: "/wall/nia-1.jpg" },
  { name: "Carlos", last: "Ortiz", role: "Drummer", photo: "/wall/carlos-1.jpg" },
  { name: "Priya", last: "Shah", role: "Podcaster", photo: "/wall/priya-2.jpg" },
  { name: "Tom", last: "Becker", role: "Sound engineer", photo: "/wall/tom-1.jpg" },
  { name: "Lena", last: "Novak", role: "Photographer", photo: "/wall/lena-1.jpg" },
  { name: "Ray", last: "Donnelly", role: "Guitarist", photo: "/wall/ray-1.jpg" },
  { name: "Sofia", last: "Marino", role: "Brand designer", photo: "/wall/sofia-1.jpg" },
  { name: "Sam", last: "Whitaker", role: "Video creator", photo: "/wall/sam-1.jpg" },
  { name: "June", last: "Parker", role: "Songwriter", photo: "/wall/june-1.jpg" },
  { name: "Dana", last: "Reyes", role: "Event planner", photo: "/wall/dana-1.jpg" },
  { name: "Marcus", last: "Hill", role: "Bassist", photo: "/wall/marcus-1.jpg" },
];

/** George's real calendar (from the server) → What's On events. */
export function fromCalItems(items: CalItem[]): VenueEvent[] {
  return items.map((e) => ({
    id: e.id,
    title: e.title,
    category: categoryFor(e.kind, e.visibility),
    room: e.room === "whole-building" ? "wood-room" : e.room,
    start: new Date(e.startISO),
    end: new Date(e.endISO),
    visibility: e.visibility,
    price: e.visibility === "private" ? "" : e.visibility === "members" && !e.price ? "Members" : e.price ?? "",
    blurb: e.summary ?? (e.visibility === "private" ? "Room booked for a private event." : ""),
    ...(e.url ? { url: e.url } : {}),
    ...(e.ticketLabel ? { ticketLabel: e.ticketLabel } : {}),
    ...(e.slug ? { slug: e.slug } : {}),
    ...(e.hostNote ? { hostNote: e.hostNote } : {}),
    ...(e.sample ? { sample: true } : {}),
  }));
}

/**
 * SAMPLE events around the visitor's today (samples.ts), plus a members' "Open Studio" drop-in
 * most days, so "right now" usually has something on — the demo's rhythm. Samples only.
 */
export function eventsAround(today: Date): VenueEvent[] {
  const out = fromCalItems(sampleItems(today));
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const { back, ahead } = sampleRange(today);
  for (let i = -back; i <= ahead; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    if (d.getDay() === 0) continue; // closed Sundays
    out.push({
      id: `sample-open-studio-${d.toISOString().slice(0, 10)}`,
      title: "Open Studio",
      category: "members",
      room: "studio-a",
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18),
      visibility: "members",
      price: "Members",
      blurb: "Studio A is open for members to drop in and work. No booking needed.",
      ambient: true,
      sample: true,
    });
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** A calendar file for one event, so "Add to calendar" really works. */
export function ics(e: VenueEvent): string {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SoundPlex Studios//What's On//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@soundplexstudios.com`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(e.start)}`,
    `DTEND:${f(e.end)}`,
    `SUMMARY:${e.title} (SoundPlex Studios)`,
    `LOCATION:${roomOf(e.room).name}, SoundPlex Studios, 6713 Rudderow Ave, Pennsauken, NJ 08109`,
    `DESCRIPTION:${e.blurb}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** A simulated live headcount — SAMPLES ONLY (a real event has no number until door scans exist). */
export function headcount(e: VenueEvent, capacity: number, now: Date): number {
  if (!e.sample) return 0;
  const p = Math.min(1, Math.max(0, (now.getTime() - e.start.getTime()) / (e.end.getTime() - e.start.getTime())));
  let h = 0;
  for (const ch of e.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const peak = e.ambient ? 0.3 + (h % 30) / 100 : 0.6 + (h % 33) / 100;
  const rise = 0.25 + 0.75 * Math.min(1, p / 0.3);
  const fall = p > 0.85 ? 0.3 + 0.7 * ((1 - p) / 0.15) : 1;
  return Math.max(1, Math.round(capacity * peak * rise * fall));
}

/**
 * Tickets left. null = not a ticketed event. A number = simulated (samples only). -1 = a real
 * ticketed event: George's ticket link knows the count, we don't — so nothing is shown.
 */
export function ticketsLeft(e: VenueEvent, capacity: number, now: Date): number | null {
  if (e.visibility !== "public" || !/\$/.test(e.price)) return null;
  if (!e.sample) return e.url ? -1 : null;
  let h = 0;
  for (const ch of e.id) h = (h * 17 + ch.charCodeAt(0)) >>> 0;
  const days = Math.max(0, (e.start.getTime() - now.getTime()) / 86_400_000);
  const sold = Math.min(1, 0.4 + 0.5 * (1 - Math.min(days, 7) / 7) + (h % 12) / 100);
  return Math.max(0, Math.round(capacity * (1 - sold)));
}

/** No video teasers yet (the demo had clips). When George has a stage clip, map it here. */
export function teaserFor(e: VenueEvent): { poster: string; clip: string } | null {
  void e;
  return null;
}

/** Members' ticket price. OPEN (COMPANY-FACTS): the demo shows 20% off — George to confirm. */
export const MEMBER_DISCOUNT = 0.2;
export const priceNum = (e: VenueEvent) => Number(e.price.replace(/[^\d.]/g, "")) || 0;
export const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);
export const ticketPrice = (e: VenueEvent, member: boolean) => (member ? money(Math.round(priceNum(e) * (1 - MEMBER_DISCOUNT) * 100) / 100) : e.price);

/** "Book a room" — SoundPlex uses the guided survey, not the demo's quick form. */
export const bookRoomHref = (room?: string) => `/start?path=room${room ? `&room=${room}` : ""}`;
