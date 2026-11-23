/**
 * Event constants that are safe in client components: no imports, no zod, no fs.
 *
 * Client widgets (EventsCalendar, UpcomingEvents) import from HERE. schema.ts and public.ts
 * re-export these so server code keeps its existing imports. Do not add imports to this file —
 * anything that reaches @realiizlabs/admin or the content loaders drags node:fs into the
 * browser bundle and the build fails ("does not support external modules").
 */

/** SoundPlex event kinds. "other" + kindLabel is added by the package for the rest. */
export const EVENT_KINDS = [
  "show",
  "comedy",
  "talk",
  "workshop",
  "screening",
  "open-mic",
  "podcast-taping",
  "networking",
  "private",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

// What visitors read. George, 2026-11-23 (zoning): no "live music", "comedy", "open mic" or
// "event" on the site; everything here is a studio production. The ids stay (content uses them).
export const KIND_LABELS: Record<EventKind | "other", string> = {
  show: "Music production",
  comedy: "Studio production",
  talk: "Talk",
  workshop: "Workshop",
  screening: "Screening",
  "open-mic": "Open studio",
  "podcast-taping": "Podcast recording",
  networking: "Networking",
  private: "Private booking",
  other: "Production",
};

/** The rooms an event can be in — values match content/rooms/*.mdx slugs. Three rooms; podcast is a use. */
export const ROOM_SLUGS = ["wood-room", "studio-a", "sound-lounge", "whole-building"] as const;

/** Room slug → display name (content/rooms is the source of truth for pages; this is the quick map). */
export const ROOM_NAMES: Record<string, string> = {
  "wood-room": "WoodRoom",
  "studio-a": "Studio A",
  "sound-lounge": "SoundLounge",
  "whole-building": "The whole building",
};

/** The three rooms What's On shows (whole-building events appear in every room's lane). */
export const BOARD_ROOMS = ["wood-room", "studio-a", "sound-lounge"] as const;

/**
 * A dot color per kind, for the calendar views — muted so the page stays black-and-gold and
 * the dots only help the eye group things. Private bookings are grey.
 */
export const KIND_COLORS: Record<string, string> = {
  show: "#d4a030",
  comedy: "#e07a4f",
  talk: "#7fa7d9",
  workshop: "#6fb1a0",
  screening: "#b48ad6",
  "open-mic": "#e0c35a",
  "podcast-taping": "#d98aa8",
  networking: "#8fc77a",
  private: "#6b6b6b",
  other: "#a3a3a3",
};

/** Opening hours (George, 2026-11-23: Monday–Saturday, 12 PM–8 PM; see site-config HOURS_SPEC). 0 = Sunday. null = closed. */
export const HOURS: Record<number, [number, number] | null> = { 0: null, 1: [12, 20], 2: [12, 20], 3: [12, 20], 4: [12, 20], 5: [12, 20], 6: [12, 20] };

export type Visibility = "public" | "members" | "private";

/**
 * One thing on the calendar, as the What's On page receives it (built on the server by
 * public.ts — or by samples.ts while sample events are on). Private items arrive already
 * stripped to "Private event · this room · these times"; members-only items carry their
 * details for logged-in members but the page shows a lock to everyone else.
 */
export type CalItem = {
  id: string;
  /** Public events have a page: /studio-productions/<slug>. */
  slug?: string;
  title: string;
  kind: string;
  kindLabel: string;
  room: string;
  startISO: string;
  endISO: string;
  visibility: Visibility;
  summary?: string;
  price?: string;
  url?: string;
  ticketLabel?: string;
  hostNote?: string;
  producer?: string;
  heroImage?: string;
  heroImageAlt?: string;
  cancelled?: boolean;
  closed?: boolean;
  /** A made-up sample (samples.ts) — never has a page, never goes to search engines. */
  sample?: boolean;
};

/** "Find your kind of night" — the mood prompts the calendar filters on (George's #7). */
// Labels only changed (George, 2026-11-23, zoning: no live music, comedy or shows); the values
// stay, because the productions' content files use them.
export const MOODS = [
  { value: "music", label: "Music and video productions" },
  { value: "laugh", label: "Something lighthearted" },
  { value: "learn", label: "Teach me something" },
  { value: "people", label: "Let me meet people" },
  { value: "film", label: "Screenings" },
  { value: "unwind", label: "Something relaxed" },
] as const;
export type Mood = (typeof MOODS)[number]["value"];

/** A flat, serializable shape for the client-side calendar. Built by public.ts on the server. */
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
