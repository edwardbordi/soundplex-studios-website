# Hero v2 — "The room fills"

**Build brief for Claude Code. Deadline Thursday 2026-09-24, demoed on a phone.**
Ed runs every git/npm command. Branch `hero-v2` → PR. Never commit to `main`.

> **Status 2026-09-22 — shipped as the homepage.** `/` is hero v2 + the Connection Wall;
> the original room-tour film moved to `/rooms`; `/v2` redirects to `/`. States on disk are
> versioned (`state-B-4`, `state-C-2`, `state-D-2` — TV and cables removed; A keeps them so
> the film hand-off stays seamless). The chooser shows all nights by default
> (`?preview=ready` hides the unbuilt ones). Music night states still pending.

## What it is

One room. The camera walks in (existing footage), settles on the Wood Room wide, and then —
from that exact frame — the room fills with people, peaks, and thins out, with three phrases
landing on the way. It's the homepage hero AND the live demo for Ed's talk
(`THE-DOOR-script.md`): he scrolls it on a phone, in this building, while he speaks.

## The sequence

| # | id | Source | Scroll band | Copy |
|---|---|---|---|---|
| 1 | `foyer` | existing `leg02` (doors open on camera) | 1.2 | — |
| 2 | `walk-in` | existing `leg03` (settle on the wide) | 1.4 | — |
| 3 | `early` | `public/flythrough/states/state-A.jpg` | 1.2 | **Come with an idea.** |
| 4 | `someone` | `state-B.jpg` | 1.4 | **Meet someone unexpected.** |
| 5 | `full` | `state-C.jpg` | 1.6 | *(none — silent peak)* |
| 6 | `stayed` | `state-D.jpg` | 2.4 (+ hold) | **Leave with something started.** + CTA `Plan your visit` → `/book` |

Total ≈ 9.2 vh of scroll (was ~19). Tune bands after Ed rehearses against them.

`state-A.jpg` **is** `frames/leg03-final_last.png` (16:9, 1920×1080) — so leg 03's last frame
and section 3's still are the same pixels and there is no cut. B/C/D are independent Nano
Banana Pro edits of that frame with people added; nobody carries over between states (a
frozen figure with a crowd appearing around him looked fake — a montage of moments doesn't).
Contact sheet: `hero-v2-contact.jpg`. Phone-crop check: `hero-v2-phone-crops.jpg`.

Legs 01 and 04–11 leave the route. Keep the files.

## Engine changes (vendor/scrub-engine.js — three small additions)

The engine already handles a section with `still` and no `clip` (keeps the poster, drifts
it). Three per-section options are needed so the four states behave as one night rather
than four slides:

1. **`crossfade` per section.** Global is 0.08 (a seam hider for frame-locked video). The
   dissolves between states A→B→C→D want ~0.45 of the band — a real cross-dissolve you can
   scrub back and forth. Read `s.crossfade ?? CROSSFADE` at the seam.
2. **`drift` per section.** The still's push is `1.03 + local * 0.14` (14 % — built for a
   poster fallback). States want ~3 %: `1.01 + local * (s.drift ?? 0.14)`. Set `drift: 0.03`
   on all four. Nothing is ever static; nothing visibly zooms.
3. **`focal` per section → `object-position`.** Phones show the centre ~26 % of a 16:9
   frame. Each still declares where its people are: `focal: 0.5 | 0.66 | 0.55 | 0.55` for
   A/B/C/D. Apply as `object-position: ${focal*100}% 44%` on that section's `<img>` (the
   existing mobile rule uses `center 44%`). Desktop can keep centre or use the same value —
   both look right on these four.

Comment each change in the vendor file — it's the skill's engine "kept verbatim", so the
diff should say why it isn't any more.

## Copy

- Three phrases only, verbatim (George's). No eyebrow, no body text on the states.
- C carries nothing. The line in the talk that lands there needs the screen full and silent.
- D: title + CTA `Plan your visit` → `/book`. Secondary CTA: none for Thursday.
- The section-0 copy fade (`smooth(1 - pr/0.62)`) applies to `foyer`, which has no copy —
  confirm nothing renders there.
- Reduced motion: show `state-D` with its copy. No clips load (engine already does this).

## Below the hero

Unchanged. Post-film headline stays. Marquee: **not for Thursday.**

## Checks

- 390 px first. Every state at phone width with the focal applied.
- `npm run lint` · `npx tsc --noEmit` · `npm run build` before the PR.
- Screen-record the first working version immediately (venue wifi is not a plan).
- The `.sw-mount + .sw-after { margin-top:-100vh }` gap fix depends on the last band being
  long enough — `stayed` is 2.4 for that reason. Check the CTA isn't covered early.

## Fallback set

If anything about the added people fails review on a real phone: four edits of a real
crowd photo (seated POV, audience at a show) exist in Ed's outputs — same mechanic, real
faces, less "conversation". Use only if needed.
