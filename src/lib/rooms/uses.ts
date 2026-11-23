/**
 * What a room gets used FOR. Three rooms, many uses (SITE-STRUCTURE-BRIEF §8e, Ed 2026-10-28).
 *
 * Podcast is a use, not a room: the rig is set up fresh per booking in whichever room is free.
 * No imports here — the survey (client) and the room pages (server) both read this.
 */
export type RoomUse = {
  id: string;
  /** What the visitor picks: "A podcast", "A workshop". */
  label: string;
  /** Card / chip wording on a room page: "Podcasts", "Workshops". */
  plural: string;
  /** One line under the choice, when there's something worth saying. */
  note?: string;
};

/**
 * Only the uses SoundPlex is approved for (George's "Authorized creative and media use" list,
 * 2026-11-23, a zoning matter): media production, not concerts, comedy nights, weddings,
 * celebrations or parties. Every room takes every use. Don't add a use that isn't on his list.
 */
export const ROOM_USES: RoomUse[] = [
  { id: "podcast", label: "A podcast", plural: "Podcasts", note: "We set up the cameras and mics in whichever room is free" },
  { id: "video", label: "Video or film production", plural: "Video & film" },
  // George, 2026-11-01 (Studio A): "Music productions, including video".
  { id: "production", label: "A music or multimedia production", plural: "Music & multimedia" },
  { id: "recording", label: "An audio recording session", plural: "Recording" },
  { id: "livestream", label: "A livestream or broadcast", plural: "Livestreams" },
  { id: "shoot", label: "A photo shoot", plural: "Photography" },
  { id: "content", label: "Content creation", plural: "Content creation" },
  { id: "editing", label: "Editing and post-production", plural: "Editing & post" },
  { id: "workshop", label: "An educational creative workshop", plural: "Creative workshops" },
  { id: "screening", label: "A screening", plural: "Screenings" },
  { id: "meeting", label: "A production meeting or planning session", plural: "Production meetings" },
  { id: "networking", label: "Creative networking", plural: "Creative networking" },
  { id: "other", label: "Something else", plural: "Something else" },
];

/** Older links (and old booking links in emails) may name a use that's gone; send them somewhere sensible. */
const RETIRED: Record<string, string> = {
  party: "other",
  celebration: "other",
  wedding: "other",
  comedy: "other",
  concert: "production",
};
export const useById = (id: string | undefined) => ROOM_USES.find((u) => u.id === (id && RETIRED[id] ? RETIRED[id] : id));

/** The podcast use as it's sold today (live-site numbers; COMPANY-FACTS §4 — rate/guests OPEN). */
export const PODCAST = {
  rate: "$250/hr · cameras, mics, lights and an operator included",
  guests: "Up to 6 at the table",
  line: "Three cameras that know who’s talking. We set up in whichever room is free, and the episode is ready to publish when you leave.",
};
