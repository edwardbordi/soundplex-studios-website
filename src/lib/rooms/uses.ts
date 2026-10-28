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

export const ROOM_USES: RoomUse[] = [
  { id: "podcast", label: "A podcast or interview", plural: "Podcasts", note: "We set up the cameras and mics in whichever room is free" },
  { id: "workshop", label: "A workshop, talk or class", plural: "Workshops & talks" },
  { id: "concert", label: "A concert or showcase", plural: "Concerts" },
  { id: "comedy", label: "A comedy night", plural: "Comedy" },
  { id: "screening", label: "A screening", plural: "Screenings" },
  { id: "party", label: "A party or celebration", plural: "Parties" },
  { id: "wedding", label: "A wedding", plural: "Weddings" },
  { id: "shoot", label: "A photo or video shoot", plural: "Shoots" },
  { id: "recording", label: "A recording or rehearsal", plural: "Recording" },
  { id: "meeting", label: "A meeting or offsite", plural: "Meetings" },
  { id: "other", label: "Something else", plural: "Something else" },
];

export const useById = (id: string | undefined) => ROOM_USES.find((u) => u.id === id);

/** The podcast use as it's sold today (live-site numbers; COMPANY-FACTS §4 — rate/guests OPEN). */
export const PODCAST = {
  rate: "$250/hr · cameras, mics, lights and an operator included",
  guests: "Up to 6 at the table",
  line: "Three cameras that know who’s talking. We set up in whichever room is free, and the episode is ready to publish when you leave.",
};
