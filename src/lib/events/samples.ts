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

const WEEK: Slot[] = [
  // Monday
  { dow: 1, start: [10, 0], end: [16, 0], kind: "workshop", room: "studio-a", visibility: "members", titles: ["Open Studio"], summary: "The studio's open for members: bring a project, borrow the room, find a collaborator." },
  { dow: 1, start: [19, 0], end: [21, 30], kind: "open-mic", room: "sound-lounge", visibility: "public", titles: ["SoundPlex Live Open Mic"], summary: "Sign up at the door. Three songs or ten minutes, whatever you've got.", price: "Free", hostNote: "Coming alone? Most people do. George will find you a seat near the front." },
  // Tuesday
  { dow: 2, start: [9, 30], end: [12, 30], kind: "private", room: "studio-a", visibility: "private", titles: ["Private session"], summary: "" },
  { dow: 2, start: [18, 30], end: [20, 30], kind: "workshop", room: "wood-room", visibility: "public", titles: ["Founders Night: Telling Your Story", "Founders Night: Pricing What You're Worth", "Founders Night: Your First Ten Clients"], summary: "A working session for owners and founders: one talk, then the room does the work together.", price: "$20", producer: "The Plex Collective", hostNote: "Bring a business card and one problem you're stuck on." },
  // Wednesday
  { dow: 3, start: [12, 0], end: [13, 0], kind: "podcast-taping", room: "sound-lounge", visibility: "public", titles: ["Local Lens: Live Taping"], summary: "Sit in on a live taping of Local Lens, our interview show with South Jersey business owners.", price: "Free · RSVP" },
  { dow: 3, start: [19, 30], end: [21, 30], kind: "comedy", room: "wood-room", visibility: "public", titles: ["Corks & Comedy Connections", "Stand-Up at the Plex", "Corks & Comedy Connections"], summary: "Five comics, one long table of wine and a room that's four feet from the mic.", price: "$15", hostNote: "Coming alone? Grab a seat at the long table — it's the friendliest one in the room." },
  // Thursday
  { dow: 4, start: [14, 0], end: [17, 0], kind: "private", room: "wood-room", visibility: "private", titles: ["Private event"], summary: "" },
  { dow: 4, start: [18, 0], end: [20, 0], kind: "networking", room: "sound-lounge", visibility: "public", titles: ["Friendly Feud Networking", "Third Place Thursdays", "Friendly Feud Networking"], summary: "Networking that isn't awkward: a game, a drink, and people you'd actually want to call back.", price: "$10", hostNote: "Everyone arrives alone to this one. That's the point." },
  { dow: 4, start: [20, 0], end: [22, 30], kind: "show", room: "wood-room", visibility: "public", titles: ["Thunder Road Refugees", "A Night of Jazz Standards", "Kid Charlemagne Live"], summary: "A full band in a room built for it. Eighty seats, the stage four feet away.", price: "$20" },
  // Friday
  { dow: 5, start: [11, 0], end: [13, 0], kind: "podcast-taping", room: "studio-a", visibility: "members", titles: ["Members' Podcast Hour"], summary: "Members record with the full three-camera setup — book a slot at the front desk." },
  { dow: 5, start: [18, 30], end: [22, 0], kind: "private", room: "sound-lounge", visibility: "private", titles: ["Private event"], summary: "" },
  { dow: 5, start: [20, 0], end: [23, 0], kind: "show", room: "wood-room", visibility: "public", titles: ["Friday Night at the Plex: Live Music", "The Lost Sinatra Sessions", "Winds & Spirits: A Jazz Night"], summary: "The headline night of the week. Doors at 7:30, music at 8.", price: "$25", hostNote: "Coming alone? Say hi to George at the door — everyone does." },
  // Saturday
  { dow: 6, start: [11, 0], end: [13, 0], kind: "workshop", room: "studio-a", visibility: "public", titles: ["Portraits at the Plex", "Songwriting Circle", "Home Recording Basics"], summary: "A hands-on morning in Studio A. Small group, real gear, coffee's on us.", price: "$35" },
  { dow: 6, start: [15, 0], end: [17, 0], kind: "screening", room: "wood-room", visibility: "public", titles: ["Cinema Salon", "Local Film Showcase", "Cinema Salon"], summary: "A screening and a conversation with the filmmaker afterward.", price: "$12" },
  { dow: 6, start: [19, 30], end: [22, 0], kind: "comedy", room: "wood-room", visibility: "public", titles: ["Did I Ever Tell You About the Time…", "Saturday Night Stand-Up", "Did I Ever Tell You About the Time…"], summary: "Storytelling comedy: true stories, told badly on purpose, in front of a room that's in on it.", price: "$20" },
  { dow: 6, start: [18, 0], end: [21, 0], kind: "networking", room: "sound-lounge", visibility: "members", titles: ["Collective Mixer"], summary: "Members only: drinks at the piano bar, new faces, and whoever George wants you to meet." },
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
        out.push({ id, title: "Private event", kind: "private", kindLabel: "Private", room: s.room, startISO: start.toISOString(), endISO: end.toISOString(), visibility: "private", sample: true });
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
