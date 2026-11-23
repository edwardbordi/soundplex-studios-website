import { KIND_LABELS, type CalItem, type Visibility } from "./constants";

/**
 * SAMPLE EVENTS — made up, for What's On while the real calendar is still to come.
 * Switched by SHOW_SAMPLE_EVENTS in site-config.ts. TO REMOVE: set that to false, then delete
 * this file and the one `sampleItems` import in WhatsOn.tsx.
 *
 * Generated in the browser from the visitor's own "today", so the board always has something
 * on now, later and this week. A weekly rhythm (what a SoundPlex week could look like), with
 * titles rotating by week so the month doesn't repeat itself. No imports beyond constants:
 * safe in client code.
 */

type Slot = {
  /** 0 = Sunday … 6 = Saturday */
  dow: number;
  start: [number, number];
  end: [number, number];
  kind: string;
  room: string;
  visibility: Visibility;
  titles: string[];
  summary: string;
  price?: string;
  hostNote?: string;
  producer?: string;
};

// George, 2026-11-23 (zoning): only approved creative and media uses, inside the opening hours
// (Monday–Saturday 12–8pm), and nothing sold — no prices, so no ticket buttons.
const WEEK: Slot[] = [
  // Monday
  { dow: 1, start: [12, 0], end: [16, 0], kind: "workshop", room: "studio-a", visibility: "members", titles: ["Open Studio"], summary: "The studio's open for members: bring a project, borrow the room, find a collaborator." },
  { dow: 1, start: [17, 0], end: [19, 0], kind: "networking", room: "sound-lounge", visibility: "public", titles: ["Creative Enterprise Networking"], summary: "Creators and business owners meet, trade notes and find collaborators.", price: "Free · RSVP", hostNote: "Coming alone? Most people do. George will introduce you around." },
  // Tuesday
  { dow: 2, start: [12, 0], end: [15, 0], kind: "private", room: "studio-a", visibility: "private", titles: ["Private session"], summary: "" },
  { dow: 2, start: [16, 0], end: [18, 0], kind: "workshop", room: "wood-room", visibility: "public", titles: ["Founders Workshop: Telling Your Story", "Founders Workshop: Pricing What You're Worth", "Founders Workshop: Your First Ten Clients"], summary: "An educational workshop for owners and founders: one talk, then the room does the work together.", price: "Free · RSVP", producer: "The Plex Collective", hostNote: "Bring a business card and one problem you're stuck on." },
  // Wednesday
  { dow: 3, start: [12, 0], end: [13, 0], kind: "podcast-taping", room: "sound-lounge", visibility: "public", titles: ["Local Lens: Recording Session"], summary: "Sit in on a recording of Local Lens, our interview show with South Jersey business owners.", price: "Free · RSVP" },
  { dow: 3, start: [15, 0], end: [18, 0], kind: "show", room: "wood-room", visibility: "members", titles: ["Music Video Production Day"], summary: "Members film a performance video on the WoodRoom stage with our three-camera crew." },
  // Thursday
  { dow: 4, start: [12, 0], end: [15, 0], kind: "private", room: "wood-room", visibility: "private", titles: ["Private booking"], summary: "" },
  { dow: 4, start: [16, 0], end: [18, 0], kind: "networking", room: "sound-lounge", visibility: "public", titles: ["Third Place Thursdays"], summary: "Networking that isn't awkward: a game, and people you'd actually want to call back.", price: "Free · RSVP", hostNote: "Everyone arrives alone to this one. That's the point." },
  { dow: 4, start: [17, 0], end: [20, 0], kind: "show", room: "studio-a", visibility: "public", titles: ["Studio A Livestream Session"], summary: "A musician records and livestreams a set from Studio A. Watch online, or members can sit in.", price: "Free · online" },
  // Friday
  { dow: 5, start: [12, 0], end: [14, 0], kind: "podcast-taping", room: "studio-a", visibility: "members", titles: ["Members' Podcast Hour"], summary: "Members record with the full three-camera setup — book a slot at the front desk." },
  { dow: 5, start: [15, 0], end: [18, 0], kind: "private", room: "sound-lounge", visibility: "private", titles: ["Private booking"], summary: "" },
  { dow: 5, start: [16, 0], end: [19, 0], kind: "workshop", room: "wood-room", visibility: "public", titles: ["Content Creation Lab", "Lighting for Video", "Editing Basics"], summary: "A hands-on workshop: small group, real gear, and something you made by the end.", price: "Free · RSVP" },
  // Saturday
  { dow: 6, start: [12, 0], end: [14, 0], kind: "workshop", room: "studio-a", visibility: "public", titles: ["Portraits at the Plex", "Songwriting Circle", "Home Recording Basics"], summary: "A hands-on afternoon in Studio A. Small group, real gear.", price: "Free · RSVP" },
  { dow: 6, start: [15, 0], end: [17, 0], kind: "screening", room: "wood-room", visibility: "public", titles: ["Cinema Salon", "Local Film Showcase", "Cinema Salon"], summary: "A filmmaker screens their work, then talks about how it was made.", price: "Free · RSVP" },
  { dow: 6, start: [17, 0], end: [20, 0], kind: "networking", room: "sound-lounge", visibility: "members", titles: ["Plex Collective Meeting"], summary: "Members only: the creative group meets, new faces, and whoever George wants you to meet." },
];

/**
 * How far back the samples go: the 1st of LAST month, so this whole month is full (past days
 * included) and so is last month when you page back (Ed, 2026-10-28). Forward: ~2 months.
 */
export function sampleRange(now: Date): { back: number; ahead: number } {
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const firstOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { back: Math.round((day0.getTime() - firstOfLast.getTime()) / 86_400_000), ahead: 62 };
}

/** Sample events from the 1st of last month to ~2 months out, around the visitor's own today. */
export function sampleItems(now: Date): CalItem[] {
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: CalItem[] = [];
  const { back, ahead } = sampleRange(now);
  for (let d = -back; d <= ahead; d++) {
    const day = new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + d);
    const weekIdx = Math.floor((day.getTime() / 86_400_000 + 4) / 7); // stable per calendar week
    for (const s of WEEK) {
      if (s.dow !== day.getDay()) continue;
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), s.start[0], s.start[1]);
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), s.end[0], s.end[1]);
      const title = s.titles[weekIdx % s.titles.length];
      const id = `sample-${day.toISOString().slice(0, 10)}-${s.room}-${s.start[0]}`;
      if (s.visibility === "private") {
        out.push({ id, title: "Private booking", kind: "private", kindLabel: "Private", room: s.room, startISO: start.toISOString(), endISO: end.toISOString(), visibility: "private", sample: true });
        continue;
      }
      out.push({
        id,
        title,
        kind: s.kind,
        kindLabel: KIND_LABELS[s.kind as keyof typeof KIND_LABELS] ?? "Event",
        room: s.room,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        visibility: s.visibility,
        summary: s.summary,
        ...(s.price ? { price: s.price } : {}),
        ...(s.visibility === "public" && s.price && !/free/i.test(s.price) ? { url: "#sample-tickets", ticketLabel: "Get tickets" } : {}),
        ...(s.hostNote ? { hostNote: s.hostNote } : {}),
        ...(s.producer ? { producer: s.producer } : { producer: "SoundPlex" }),
        sample: true,
      });
    }
  }
  return out;
}
