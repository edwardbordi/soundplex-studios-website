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

export const KIND_LABELS: Record<EventKind | "other", string> = {
  show: "Live music",
  comedy: "Comedy",
  talk: "Talk",
  workshop: "Workshop",
  screening: "Screening",
  "open-mic": "Open mic",
  "podcast-taping": "Podcast taping",
  networking: "Networking",
  private: "Private",
  other: "Event",
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

/** "Find your kind of night" — the mood prompts the calendar filters on (George's #7). */
export const MOODS = [
  { value: "music", label: "Put me near live music" },
  { value: "laugh", label: "Make me laugh" },
  { value: "learn", label: "Teach me something" },
  { value: "people", label: "Let me meet people" },
  { value: "film", label: "Show me a film" },
  { value: "unwind", label: "Let me unwind" },
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
