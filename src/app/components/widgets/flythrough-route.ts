/**
 * The fly-through route — the homepage hero's script.
 *
 * Eleven legs of ONE continuous forward camera take through the actual SoundPlex
 * building at 6713 Rudderow Ave, generated from Ed's on-site photographs (2026-09-02).
 * Each leg was rendered with `--start-image` = the previous leg's real last frame and
 * `--end-image` = the NEXT room's real photograph, so every room you arrive in is the
 * room, not a model's idea of it — only the walk between rooms is generated.
 *
 * Order is the route order, and it is not arbitrary: it's the walk you'd actually take
 * from the back gate to the Sound Lounge. Don't reorder without re-rendering the chain —
 * the legs are frame-locked to each other and a swap breaks every seam after it. For the
 * same reason there is no such thing as re-rendering one leg in the middle: changing leg
 * N changes its last frame, which is leg N+1's start image, all the way to the end.
 *
 * REVISION 1 (Ed's previz notes) cut this from thirteen legs to eleven:
 *   - the porch beat is gone; leg 1 now runs the walkway, the door and the entrance hall
 *     in a single 8s move, arriving on CLOSED doors (the foyer photo was edited shut —
 *     with a door open you could see a room that isn't the Wood Room, so the cut read
 *     wrong). Leg 2 opens those doors on camera.
 *   - the separate stair-climb beat is gone; leg 6 climbs and crests onto the landing in
 *     one 8s move.
 * Section ids/labels are the stable handles here — the leg NUMBERS shifted, so anything
 * that referred to "leg 9" before the revision means a different shot now.
 *
 * Copy lands on five of the eleven; the rest are silent transit (every copy field in the
 * engine is optional). Voice per AUDIENCE.md: plainspoken, about what happens IN the
 * rooms, inviting — no event-space boilerplate, no claims without a room attached.
 */

export interface RouteLeg {
  id: string;
  label: string;
  still: string;
  clip: string;
  /** viewport-heights of scroll spent on this leg — the hero rooms get a longer dwell */
  scroll?: number;
  /** 0–1: settles the camera mid-scene, exactly where the copy peaks. Keep ≤ 0.6. */
  linger?: number;
  eyebrow?: string;
  title?: string;
  body?: string;
  tags?: string[];
  cta?: { primary?: { label: string; href: string }; secondary?: { label: string; href: string } };
}

const vid = (n: string) => `/flythrough/vid/leg${n}.mp4`;
const pos = (n: string) => `/flythrough/poster/${n}.jpg`;

export const ROUTE: RouteLeg[] = [
  {
    id: "approach",
    label: "The back walk",
    still: pos("01"),
    clip: vid("01"),
    // 8s of footage covering what used to be two legs — it needs the scroll distance to
    // match, or the merged move plays twice as fast as everything after it.
    scroll: 2.4,
    linger: 0.3,
    eyebrow: "6713 Rudderow Ave · Pennsauken, NJ",
    title: "Where creativity and community meet.",
    body: "Come up the back walk at dusk and keep going — the whole building is on the other side of that door.",
  },
  { id: "foyer", label: "The foyer", still: pos("02"), clip: vid("02"), scroll: 1.2 },
  {
    id: "woodroom",
    label: "The Wood Room",
    still: pos("03"),
    clip: vid("03"),
    scroll: 1.7,
    // the camera settles here before the turn in the next leg — half of the leg 3→4
    // smoothing fix, the other half being the prompts' shared drift clause
    linger: 0.45,
    eyebrow: "The Wood Room",
    title: "Floors from the 1890s. Sound like nowhere else.",
    body: "Book it for live shows, recording sessions, film shoots, or a gathering.",
    tags: ["Live shows", "Sessions"],
  },
  { id: "woodroom-out", label: "Turning back", still: pos("04"), clip: vid("04"), scroll: 1.3 },
  { id: "stairfoot", label: "The stairs", still: pos("05"), clip: vid("05"), scroll: 1.0 },
  // also 8s (climb + landing merged), so it also gets the wider scroll band
  { id: "upstairs", label: "Upstairs", still: pos("06"), clip: vid("06"), scroll: 2.2 },
  {
    id: "studio-a",
    label: "Studio A",
    still: pos("07"),
    clip: vid("07"),
    scroll: 1.8,
    linger: 0.45,
    eyebrow: "Studio A",
    title: "Recording history lives upstairs.",
    body: "Once a Victor Records studio — now recording, photo and video under restored 14-foot tin ceilings.",
    tags: ["Recording", "Photo & video"],
  },
  { id: "toward-hall", label: "Toward the hall", still: pos("08"), clip: vid("08"), scroll: 1.1 },
  {
    id: "gallery-hall",
    label: "The gallery hall",
    still: pos("09"),
    clip: vid("09"),
    scroll: 1.4,
    linger: 0.3,
    eyebrow: "In between",
    title: "The art doesn't stop between rooms.",
    body: "Every hallway is a gallery — the whole walk between studios is hung with paintings and photographs.",
  },
  { id: "doorway", label: "General Office", still: pos("10"), clip: vid("10"), scroll: 1.1 },
  {
    id: "sound-lounge",
    label: "The Sound Lounge",
    still: pos("11"),
    clip: vid("11"),
    // 2.6 rather than 2.0 to pay back the 1vh that `.sw-mount + .sw-after` takes off the
    // tail: closing the black gap pulls the page content up, which would otherwise cover
    // the CTA ~900px earlier and cut the finale's dwell by half.
    scroll: 2.6,
    // 0.25 rather than 0.5: the finale clip spends its first ~4s crossing the threshold,
    // and a heavy linger parked the camera in the doorway for the whole stretch where the
    // CTA is up. Easing it lets the camera actually get into the room the copy is
    // inviting you into, while still slowing where the words land.
    linger: 0.25,
    eyebrow: "The Sound Lounge",
    title: "Stay a while.",
    body: "The counter, the sofas, and the room the night carries on in after the set. Open Mon–Sat, 8AM–10PM.",
    cta: {
      primary: { label: "Book a room", href: "/book" },
      secondary: { label: "Join the SoundPlex", href: "/book" },
    },
  },
];
