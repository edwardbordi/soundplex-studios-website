/**
 * Hero v2 — "The room fills." See design-process/flythrough/HERO-V2.md.
 *
 * One room. The camera walks in (two existing legs), settles on the Wood Room wide, and
 * then — from that exact frame — the room fills, peaks and thins out, with George's three
 * phrases landing on the way. It's the homepage hero AND the live demo for Ed's talk:
 * he scrolls it on a phone, in this building, while he speaks (THE-DOOR-script.md).
 *
 * Leg 02 is re-rendered from a cleaned foyer photo (leg02-v2); leg 03 is the v1 render. `state-A.jpg` IS leg 03's last frame
 * (frames/leg03-final_last.png), so the film hands off to the first still with no cut.
 * B/C/D are independent Nano Banana Pro edits of that frame with people added — nobody
 * carries over between states on purpose: a frozen figure with a crowd appearing around
 * him looked fake; a montage of moments doesn't.
 *
 * Copy: George's "Leave with something started" as the D title; Ed's own lines everywhere
 * else. Every scene carries eyebrow + title + body.
 *
 * `dissolve` / `drift` / `focal` are the three per-section options added to the vendored
 * engine for this hero (opt-in; v1 doesn't use them). `focal` is where the people are, so
 * a phone's centre crop lands on them — values from design-process/flythrough/hero-v2-phone-crops.jpg.
 */

import type { RouteLeg } from "./flythrough-route";

export type RouteState = Omit<RouteLeg, "clip"> & {
  clip?: string;
  dissolve?: number;
  drift?: number;
  focal?: number;
};

const vid = (n: string) => `/flythrough/vid/leg${n}.mp4`;
const pos = (n: string) => `/flythrough/poster/${n}.jpg`;
const state = (k: string) => `/flythrough/states/state-${k}.jpg`;

/** Slow push on every still — nothing is ever static, nothing visibly zooms. */
const DRIFT = 0.03;
/** Fraction of each state's band spent dissolving in from the one before. */
const DISSOLVE = 0.6;

export const ROUTE_V2: RouteState[] = [
  // The door. Ed: "So — this is George's door." Then it opens. The copy is the talk's
  // (THE-DOOR-script.md): every line is a thing the visitor wants while they're here.
  // The WHAT lives in the first eyebrow + title ("third place"); the HOW in the last body.
  {
    id: "foyer",
    label: "The door",
    // leg02-v2: re-rendered from edits/foyer-v2.jpg (the cleaned, warmed foyer — sign and
    // conduit gone, light leaking round the doors) via START_OVERRIDE in chain.sh. v1's
    // leg02 is untouched. Leg 03 still lines up: both versions end on waypoint 04.
    still: pos("02-v2"),
    clip: vid("02-v2"),
    scroll: 1.2,
    // Frame 1 is built only from George's own words on soundplexstudios.com/membership
    // (Aug 2026): "Not just a creative venue. Not just a networking group… a true third
    // place… connection, conversations, collaboration, opportunity… momentum." He never
    // says "community" — neither do we. Founders and business professionals first.
    eyebrow: "Create. Connect. Perform. \u00b7 Pennsauken, NJ",
    title: "You have a home. You have work. *This is your third place.*",
    body: "Where founders and creators meet \u2014 and what starts when they do.",
    // Not "book a room" / "see the rooms": nobody gets in the car for a room (the talk).
    // The two things someone who felt it would do — come, or belong. Both go to /book
    // until there's an events page and a membership page.
    cta: {
      primary: { label: "Book a tour", href: "/book" },
      secondary: { label: "Join the Collective", href: "/book" },
    },
  },
  // Walk in past the walls and settle on the wide. Its last frame is state A.
  {
    id: "walk-in",
    label: "The walk in",
    still: pos("03"),
    clip: vid("03"),
    scroll: 1.4,
    eyebrow: "The walk in",
    title: "You\u2019ll feel it *before you\u2019ve said a word.*",
    body: "Every wall is covered in people who made something. Some of them stood in this very room.",
  },
  {
    id: "early",
    label: "Ideas",
    still: state("A"),
    scroll: 1.2,
    // No dissolve and no focal here: same pixels as the end of leg 03, and the same
    // object-position as the video, so the film → still hand-off is invisible.
    drift: DRIFT,
    eyebrow: "Ideas",
    title: "This is where *ideas are born.*",
    body: "Most of what gets made here started as a conversation nobody planned.",
  },
  {
    id: "someone",
    label: "Someone worth meeting",
    // B-4: the middle man re-done, TV and cables off the floor (blazer over a tee, lit by the room) — the first B's
    // was the one AI-looking figure in the film. New filename so no cache holds the old.
    still: state("B-4"),
    scroll: 1.7,
    dissolve: DISSOLVE,
    drift: DRIFT,
    focal: 0.55,
    eyebrow: "Someone worth meeting",
    title: "The right person, *twenty feet away.*",
    body: "Founders, producers, people who\u2019ve done the thing you\u2019re about to. Say hello.",
  },
  {
    id: "full",
    label: "Full house",
    // C-2: cable off the rug (edit of C; the TV was already behind the foreground).
    still: state("C-2"),
    scroll: 1.9,
    dissolve: DISSOLVE,
    drift: DRIFT,
    focal: 0.55,
    eyebrow: "Full house",
    title: "Nobody\u2019s checking *the time.*",
    body: "Twenty conversations going at once, and every one worth joining.",
  },
  {
    id: "stayed",
    label: "The ones who stayed",
    // D-2: TV and cables removed. A full re-render, tone-matched in LAB to the original D
    // so the dissolve from C holds its grade.
    still: state("D-2"),
    // Long enough that the page below doesn't cover the CTA early — the
    // `.sw-mount + .sw-after` gap fix takes 1vh off the tail.
    scroll: 2.4,
    // Shorter dissolve than the others: the band is long and the copy comes up over its
    // first 40%, so the picture has to have resolved by then — not still fading in.
    dissolve: 0.28,
    drift: DRIFT,
    focal: 0.55,
    eyebrow: "The Plex Collective",
    title: "And you leave with *something started.*",
    // No price here (Ed): the body is the push into the button. "Complimentary tour" is
    // the site's own offer (soundplexstudios.com/membership).
    body: "The first steps inside and you feel it. The tour is on us \u2014 come find out.",
    cta: {
      primary: { label: "Book a tour", href: "/book" },
      secondary: { label: "Join the Collective", href: "/book" },
    },
  },
];

/**
 * The nights. Each is a full route (same door and walk in, its own B/C/D states and copy).
 * A night is only offered in the chooser once `ready` — nothing is promised that isn't built.
 *
 * Switching is a plain link (`/?night=music`): the engine registers window listeners
 * with no teardown, so a fresh page is the honest way to mount a different route.
 */
export type Night = {
  id: string;
  label: string;
  route: RouteState[];
  ready: boolean;
};

const mstate = (k: string) => `/flythrough/states/music-${k}.jpg`;

/** Live Music — same door, same walk in, a band on the stage. States pending. */
const ROUTE_MUSIC: RouteState[] = [
  ROUTE_V2[0],
  ROUTE_V2[1],
  { ...ROUTE_V2[2] },
  {
    ...ROUTE_V2[3],
    still: mstate("B"),
    eyebrow: "Soundcheck",
    title: "The band\u2019s *setting up.*",
    body: "Get here early. The first few people in the room are the ones you\u2019ll end up talking to.",
  },
  {
    ...ROUTE_V2[4],
    still: mstate("C"),
    eyebrow: "Showtime",
    title: "Four feet from *the stage.*",
    body: "No barrier, no balcony, no bad seat. The band can see you too.",
  },
  {
    ...ROUTE_V2[5],
    still: mstate("D"),
    eyebrow: "After the set",
    title: "Stay for *the part after.*",
    body: "The band packs down, the room thins out, and the conversations start. This is the bit you came for.",
  },
];

// `ready` flips once the night's states are in public/flythrough/states/. (A letterboard
// over the door was tried and dropped — the chooser already says "tonight", and the
// photograph is better with nothing hung on it.)
export const NIGHTS: Night[] = [
  { id: "workshop", label: "Business workshop", route: ROUTE_V2, ready: true },
  { id: "music", label: "Live music", route: ROUTE_MUSIC, ready: false },
  { id: "wedding", label: "A wedding", route: ROUTE_V2, ready: false },
  { id: "comedy", label: "Comedy", route: ROUTE_V2, ready: false },
  { id: "podcast", label: "A podcast recording", route: ROUTE_V2, ready: false },
  { id: "screening", label: "A screening", route: ROUTE_V2, ready: false },
  { id: "launch", label: "A product launch", route: ROUTE_V2, ready: false },
  { id: "dinner", label: "A private dinner", route: ROUTE_V2, ready: false },
];

/** The last chip, always live: the night nobody listed. Goes to the contact page. */
export const OTHER_NIGHT = { label: "Other", href: "/book" };

export function nightById(id?: string | null): Night {
  return NIGHTS.find((n) => n.id === id && n.ready) ?? NIGHTS[0];
}

