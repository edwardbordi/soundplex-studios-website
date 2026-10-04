# SoundPlex Studios — fly-through hero brief (Claude Code + /scroll-world)

Scope for this engagement: the client likes their existing site (soundplexstudios.com). Keep their
colors, fonts and style exactly. The ONLY initial change is the homepage hero — replace it with a
scroll-driven fly-through of the actual building. No Pinterest pass, no invented art direction, and
NO Higgsfield still-image generation: every scene starts from a REAL photo of the building.

Facts verified from soundplexstudios.com (2026-09-02): 6713 Rudderow Ave, Pennsauken NJ 08109 ·
(609) 697-2077 · Mon–Sat 8AM–10PM · @thesoundplex (FB/IG). Do not invent review scores or numbers.

## Inputs — DONE (photos shot by Ed on-site, 2026-09-02)

Real photos live in `design-process/photos/`, numbered in route order at 3200px. The chain:

| # | File | Role |
|---|---|---|
| 1 | `2-backdoor-dusk-clean.jpg` | **Opening: dusk walkway approach** — retouched (GPT Image 2): leaning gate, milk can, AC unit and puddles removed, concrete cleaned (source IMG_3529, ~7:55pm) |
| 2 | `3-backdoor-clean.jpg` | Covered porch, SoundPlex-signed door ahead — retouched (Nano Banana) to match: floor cleaned, clutter removed |
| 3 | `5-foyer.jpg` | Foyer, red runner, green room glimpsed through open doors |
| 4 | `6-woodroom-outer-doorway.jpg` → `7-woodroom-foyer.jpg` → `8-woodroom-entrance.jpg` | Progression into the Wood Room |
| 5 | `9-woodroom-wide.jpg` | **Wood Room midpoint anchor** (interior wide — split the room into two legs around this frame) |
| 6 | `10-woodroom-exit.jpg` | Wood Room exit view, back toward foyer |
| 7 | `11-stairs.jpg` → `12-stairs-secondstory.jpg` | Stair climb, both angles |
| 8 | `13-halway-to-studio-a.jpg` | Upstairs hallway into Studio A |
| 9 | `14-studio-a.jpg` | Studio A wide (grand piano, chandelier) |
| 10 | `15-entrance-to-sound-lounge-hallway.jpg` | Hallway entrance off Studio A |
| 11 | `16-soundlounge-hallway-part1.jpg` → `17-soundlounge-hallway-part2.jpg` | Art-lined hallway (dark — lift shadows in prep before feeding to video gen) |
| 12 | `18-soundlounge-doorway.jpg` | "GENERAL OFFICE" doorway into the Sound Lounge |
| 13 | `19-soundlounge.jpg` | Finale: Sound Lounge wide (bar, chandeliers). Empty version — populated retake possible on an event night |

NOT in the chain (kept as reference only): `1-back.jpg` (flat daylight, fence blocks the approach),
`2-backdoor.jpg` (daylight version of the opener), `2-backdoor-dusk.jpg` and `3-backdoor.jpg`
(un-retouched originals of frames 1–2) and `4-backdoor-closeup.jpg` (photographer reflected in the
door glass).

⚠️ Lighting continuity note for the shot plan: the opener is DUSK; the porch/foyer stills were shot
earlier with brighter ambient light. The leg prompts should carry the evening story through —
"evening, warm interior light" — and the crossfades + interiors' own moody lighting absorb the rest.

- **Brand tokens — EXTRACTED from the live site (computed styles + Elementor globals + logo
  sampling, 2026-09-02).** Use these for the scroll engine's chrome (`--sw-bg`, `--sw-ink`,
  `--sw-accent`, fonts) and any page styling, so the hero reads as the same site:
  - Background: pure black `#000000` (dark theme site) · text on dark: white `#FFFFFF`
  - Brand gold (logo gradient): bright `#F0D040` → mid `#D4A030` → deep amber `#C07000` — THE
    accent; use the mid tone for buttons/active states
  - Secondary accents used on the site: electric blue `#3D9CFF`, purple `#7A3CFF` (echoes the
    venue's stage lighting — use sparingly)
  - Headlines: **Lora italic** (variable, weight 400) — the elegant serif in "Where Creativity
    and Community Meet"
  - Body: Roboto 400 · secondary headings: Roboto Slab
  - Buttons: **Poppins 500, UPPERCASE, 3px radius, ~20px/30px padding**, white on transparent/
    gold
  - (Ignore Elementor's unused defaults `#6EC1E4`/`#61CE70` — kit leftovers, not the brand.)
- Lighting note for the plan review: downstairs rooms carry blue/purple event lighting, upstairs
  is warmer — that contrast is the venue's real character; the camera prompts should embrace it,
  not normalize it.

## The Claude Code prompt (paste in a session opened in this repo)

> Check out this repo and use /scroll-world to transform the homepage hero into a flight scrolling
> animation of the real SoundPlex building. Use the real photos in design-process/photos/ as the
> scene stills — they are numbered in route order (see the chain table in
> design-process/GENERATION-PROMPT.md) — do NOT generate replacement stills; the rooms must be the
> actual rooms. Architecture A (continuous forward take), following that numbered route. To keep every room true to its photo, generate
> each leg with --start-image = the previous leg's actual last frame and --end-image = the NEXT
> room's real photo, so the seams frame-lock to reality and the model only invents the transit
> between rooms. Theme the engine's CSS variables to match soundplexstudios.com's existing colors
> and fonts exactly. Tell me your plan on what the shots will look like before generating anything,
> with the estimated credit cost. Run the first full pass on seedance_2_0_mini (previz) before
> spending full-model credits.

## Process notes

- Video generation is the ONLY Higgsfield spend (~N legs for N scenes; no connectors in
  architecture A; no image gens). Budget re-rolls: interiors — especially the cinema salon (wine,
  dim light) — trip Seedance's content filter; the skill's gotchas cover the fallback (re-roll →
  strip trigger words → kling3_0 for the stubborn clip).
- Review the shot plan AND the photo order fed to the skill before approving generation.
- **Deliverable — DECIDED (Ed, 2026-09-02): (b) first** — the fly-through hero inside this
  Next.js preview mirroring their current design, deployed at a preview URL as the pitch.
  **(a) maybe later** — the same animation embeds into the existing WordPress homepage as a
  self-contained bundle (scrub engine is framework-agnostic vanilla JS) if the client only wants
  the hero. Tell Claude Code it's building (b).
