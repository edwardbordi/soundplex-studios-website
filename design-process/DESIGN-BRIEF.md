# Design brief — SoundPlex

Filled 2026-10-04 from the design interview (Ed, with George's vision doc) and the Sept 2026
brand-match brief. Source of truth for the look. The `@theme` tokens in `globals.css` already
implement the color + type below (extracted from the live site 2026-09-02); the `theme` skill
step is a confirmation pass, not a redesign.

## Feeling

- **Three words:** inspiring · invited · at home.
- **Reference:** the live site itself (soundplexstudios.com) — "look just like his site now, a
  bit more interactive." Not a redesign. The upgrade is photography, a few camera moves, and
  moments you can touch.
- **Avoid:** nightclub (neon gradients, glow, purple UI); agency portfolio (cold, huge type,
  no people); renders where a photograph could exist; anything that feels like a brand
  presenting itself rather than a place letting you in.
- **First five seconds:** you're at the door, it opens, and you're inside. The feeling is the
  building's — warm, lived-in, full of people who made something.

## Color system (dark only)

| Token | Value | Used for |
| --- | --- | --- |
| ink (primary text) | `#ffffff` | headlines, body on black |
| ink-2 | `#e6e6e6` | secondary text |
| bone (background) | `#000000` | every page |
| bone-2 / paper (surfaces) | `#0b0b0b` / `#111111` | cards, menu panel |
| signal (accent) | `#d4a030` | THE accent: buttons, labels, hotspots, active chips, the wall's threads |
| signal-light | `#f0d040` | hover state of the accent |
| signal-strong / amber | `#c07000` | deep end of the logo gradient; rare |
| slate (muted) | `#a3a3a3` | captions, legal, muted copy |
| line | `#262626` | hairline borders |

- Magenta `#7a3cff` / electric blue `#3d9cff` exist as tokens because the rooms are lit that
  way — they appear **inside photographs only**, never as UI colour.
- **Mode:** dark only. No light theme, no toggle.
- **Contrast:** AA minimum. Gold on black passes for text ≥ 0.66rem at weight 500 (labels);
  body copy is never gold. Black on gold for the primary button.

## Type

- **Labels / buttons / nav / eyebrows:** Poppins 500, uppercase, letterspaced 0.12–0.18em,
  small (0.62–0.85rem).
- **Headlines:** Poppins 500 for the setup line + **Lora italic 400** for the payload line
  (the hero and footer pattern: "You have a home. You have work. / *This is your third
  place.*"). The italic is the emphasis — same size, same white, never a colour change.
- **Display (About, page titles):** Lora italic.
- **Body:** Roboto 400, 1–1.1rem, line-height 1.5–1.6, max 40–60ch.
- **Card titles:** Roboto Slab 700.
- **Scale:** big only in the hero and the page-top line; restrained everywhere else. One
  headline per screen on phones.

## Layout & density

- **Density:** airy everywhere. Long scrolls, one idea per screen on phones, lots of black
  between sections. Don't tighten rooms/events for above-the-fold.
- **Corners:** 3px (`--radius: 3px`) on buttons, chips, cards. Portrait frames: square with a
  6px dark mat and a 1px gold ring (the wall).
- **Motion:**
  - Scroll-scrubbed camera: **home hero only** (plus the existing room-tour film on `/rooms`).
    Nothing else scrubs. Revisit only if a real need appears.
  - The site's one interactive gesture: **tap → the camera pushes in** (the wall's plane
    zoom, generalised). Used for hotspots: art you can buy, a clip you can play, an instrument,
    a poster → event. Max a few per page; a small gold dot is the affordance; if there's
    nothing real behind it, no dot.
  - Everything else: plain fades on reveal (`Reveal`), 200ms colour transitions, arrows that
    nudge on hover. No parallax, no marquees, no floating decoration (tried, rejected).
  - `prefers-reduced-motion`: cuts instead of glides, stills instead of scrubs.
- **Sound:** none by default and **no site-wide sound toggle** (the live site's ambient
  crackle is dropped). Audio plays only when someone presses play on a video or the song.
- **Containers:** prose 680px, content 1152px (`max-w-6xl`), hero/rooms film full-bleed.
  Phone gutters 16–24px. Check everything at 390px.
- **Events calendar:** list on phones with the month grid one tap away; grid on desktop.

## Voice

- **Tone:** plain, warm, short sentences, second person. No hype, no superlatives, nothing
  promised that isn't true. George's own words wherever we have them.
- **Person:** "we" = SoundPlex speaking. "I" only where George introduces himself (About, the
  survey's "talk to George" path).
- **Always:** third place · the Plex Collective (or "the Collective") · Studio Productions ·
  the room names as written (WoodRoom, Studio A, Podcasting Studios, SoundLounge — confirm
  spacing with George; the site currently writes Wood Room / Sound Lounge).
- **Never:** "community" (George doesn't use it) · "state-of-the-art" · "world-class" ·
  "immersive" · "experience" as a noun · exclamation marks in UI.

## Imagery

- **Style:** real photography of the real building and real people; the venue's own stage
  light (magenta/blue) is the colour. Candid over posed. Black-and-white 4:5 for portraits
  (the wall). AI-assisted edits only to extend real frames (the hero states), never to invent
  a room.
- **Assets in hand:** lockup PNG, SVG logo, favicon/app icon, the About reel (mp4), room
  galleries on the live site, 12 placeholder portraits. **Needed:** OG image 1200×630, real
  member portraits with permission, 3–5 artworks with prices, one stage clip (facts §9b).

## Home page — required sections (in order)

1. Hero — "Step inside" (FlythroughV2; night chooser; Book a tour · Join the Collective)
2. The Connection Wall
3. One Room, Endless Possibilities (room transformations → `/start`)
4. What's on (next 3 public productions)
5. The Plex Collective (three steps, Join)
6. From the Spotlight (3 posts)
7. Footer (closing line · Book a tour · newsletter)

## Notes

- The hero's storyline is being revised with George; the design of it is settled.
- The header stays: About · Studio Productions · Rooms · Membership · Call button.
- Client review kit (`PREVIEW_CHROME`) on during wave 2; off at launch.
