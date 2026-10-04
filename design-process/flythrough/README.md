# Homepage fly-through — how this was built and how to re-run it

Scroll-driven camera flight through the actual SoundPlex building, from Ed's on-site photos
(2026-09-02). Built with the `scroll-world` skill (`oso95/scroll-world`), **architecture A**
(one continuous forward take, no connectors).

**Currently at revision 1, FINAL pass (11 legs, 1080p).** See `REVISION-1.md` for Ed's
previz notes, "Revision 1" for what changed, and "Final pass" for the model findings.

## The one rule

Every leg is generated with:

- `--start-image` = **the previous leg's ACTUAL rendered last frame** (`frames/legNN_last.png`),
  never the photo — that's what makes the seam frame-identical.
- `--end-image` = **the next room's REAL photograph** (`waypoints/NN.jpg`) — that's what keeps
  each room the actual room instead of the model's idea of it.

So the model only ever invents the *walk between* rooms. The chain is therefore **strictly
sequential** — leg N cannot start until leg N−1 has rendered. Nothing here parallelises.

Reordering the route means re-rendering everything after the change. The legs are frame-locked
to each other.

## Files

| Path | What |
|---|---|
| `build-waypoints.sh` | Normalises the route photos to 1920×1080 and lifts shadows on the murky interiors. **Model input only** — the page posters come from the clips themselves, so the venue's real moody lighting survives to the visitor. |
| `waypoints/NN.jpg` | The 14 waypoint photos. **Leg N no longer runs waypoint N to N+1** — two merges broke that arithmetic, so `chain.sh` carries an explicit `route_end`/`route_dur`/`END_LABEL` table. wp02 and wp08 are built but off-route. |
| `waypoints/rNN.jpg` | Intermediate photos. **Currently unused** — see the content-filter note. |
| `prompts/legNN.txt` | Per-leg camera prompt. Shared style tail + the motion-handoff contract (verbatim clauses — don't paraphrase them). |
| `prompts/legNN.alt.txt` | De-triggered rewrite, used automatically from attempt 2. |
| `chain.sh` | The sequential runner. Retries, extracts each last frame, resumable. |
| `encode.sh` | Encodes for scrubbing (crf 20, `-g 8`, faststart, `-an`) and cuts each clip's first frame as its poster. |
| `raw/`, `frames/`, `logs/` | Gitignored — regenerable. |

## Running it

```bash
cd design-process/flythrough
bash build-waypoints.sh          # once, or after re-shooting a room
bash chain.sh                    # previz: seedance_2_0_mini @ 480p
bash encode.sh                   # -> public/flythrough/{vid,poster}
```

Resume after a failure (the chain stops rather than corrupting the seam):

```bash
FIRST=7 bash chain.sh            # picks up at leg 7; finished legs are skipped
FORCE_ALT=1 ...                  # start on the de-triggered prompt (leg already known to trip)
FORCE_KLING=1 ...                # skip straight to the other provider
```

Final pass on the full model — **needs a credit top-up**, see the cost note:

```bash
VMODEL=seedance_2_0 VRES=1080p VSUF=-final bash chain.sh
VSUF=-final bash encode.sh
```

## Cost (measured, not estimated)

Duration bills **per second**: `seedance_2_0_mini` @ 480p is 5 credits at 5s, 8 at 8s.
`kling3_0` is 7.5 / 12. `seedance_2_0` @ 1080p — the final pass — is **45 per 5s clip**.
Measured with `higgsfield generate cost` and confirmed against the balance, not estimated.

The revision-1 previz chain (11 legs, two of them 8s, three needing kling) came to
**68.5 credits**. A final pass at 1080p is roughly **11 × 45 ≈ 500**.

**`nsfw` rejections are refunded** — a re-rolled leg costs time, not credits. Only completed
clips are billed.

## The content filter — what actually tripped it

Seedance's filter reads the **reference frames**, not just the prompt. This building is hung
wall-to-wall with art, and several pieces trip it:

- `r06` — a large gold-framed classical reclining nude
- `r07`, `waypoints/04.jpg` — a "Strawberry Kush" cannabis poster
- `waypoints/04.jpg` — a Mucha art-nouveau reclining figure, psychedelic mushroom art
- `waypoints/12.jpg` — a gold-framed reclining nude oil painting
- `waypoints/14.jpg` — the Sound Lounge counter and glassware

Leg 3 returned `nsfw` on three straight attempts while carrying `r06`/`r07` as
`--image-references`, and went through on the first attempt once they were dropped. **The
intermediate references are disabled for that reason** — and nothing important is lost, because
`--end-image` still frame-locks the arrival; only the few metres of transit are now invented
rather than referenced.

The escalation ladder if a leg still sticks (skill's order):

1. Re-roll — the filter is partly non-deterministic.
2. `prompts/legNN.alt.txt` — describes the architecture and stops naming the artwork
   (automatic from attempt 2).
3. `kling3_0` with the same start/end frames — a different provider's filter. Expect a slight
   render-character shift on that one clip; the seam crossfade absorbs it. Note kling takes
   **no `--resolution`** and defaults sound **on** (`--sound off`).

## Known route hazard

**Leg 4 reverses direction** (leg 5 before revision 1 renumbered it). `waypoints/06.jpg`
looks back toward the foyer — roughly 180° from `waypoints/05.jpg`. Under architecture A a velocity reversal across a seam reads as a
rewind stutter. The prompt handles it as a **walking turn** (the camera yaws while still
travelling forward, never translating backward), which is safe because it happens *inside* one
leg, where there is no seam to break. Check that leg's last frame before chaining onward.


## Revision 1 (2026-09-02) — 13 legs to 11

What changed, and the one thing to understand before touching the route again.

### The cascade rule

**There is no such thing as re-rendering one leg in the middle.** Leg N's `--start-image`
IS leg N−1's rendered last frame, so changing any leg changes its last frame and every
leg after it must be re-rendered too. Revision 1 changed leg 1, so all 11 re-rendered.
Ed's note estimated 4–6 clips; the real cost was the full chain. Budget accordingly:
touching the opener costs a whole chain, touching the finale costs one clip.

### The changes

| Change | Result |
|---|---|
| Merged the walkway + porch into one 8s leg 1, arriving on closed doors | The porch is now transit, not a seam. Verified: dusk walkway → under the canopy → through the door → up the runner → settles on the closed doors. |
| Edited `5-foyer.jpg` shut (`5-foyer-doors-closed.jpg`, nano_banana_2, 2 credits) | Both doors closed, everything else identical. Leg 2 then opens them on camera between t=1.2 and t=2.4 — a much better reveal than the old open-door cut. |
| Merged the climb + landing into one 8s leg 6 | Stair foot → climb → crest → upstairs hallway, continuous. |
| Leg 3 settle strengthened + leg 4 opens holding that drift before the yaw | **Fixed.** Leg 4 shows no yaw at all through t=1.2. Rungs 1+2 were enough — the `woodroom-wide-2` intermediate anchor (rung 3) was NOT needed. |
| Leg 7 settle re-aimed at the corner doorway; leg 8 holds that framing | **Fixed.** No re-aim at the cut; the pan now continues within leg 8 rather than snapping at the boundary. |
| Finale names the stained-glass panel as architecture | **Restored** and visible through the settle. Passed on seedance attempt 1 — describing it as a window rather than by its imagery kept it clear of the content filter. |

### The door plaque: measured, not fixable by compositing

The plan was to composite `soundplex-lockup.png` onto the plaque in `wp01`. Measured first:
the plaque is **~16×30px** there and its lettering band **~13×4px**, partly occluded by the
foreground wooden door. The lockup is 490×69 (7:1), so at 13px wide it renders **under 2px
tall** — a smudge, not a wordmark. The composite was built, inspected, and discarded.

Ed's call (option 1): **de-emphasize, don't fake.** Leg 1's prompt now says "a small dark
sign panel beside the door, unreadable at this distance", and the model obligingly renders
a clean dark panel with no invented lettering. The brand moment is the nav logo over the
film, not the plaque. Don't reopen this without re-measuring.

### Cost

Chain 68.5 credits (11 legs, two at 8s — duration bills per second) + 2 for the photo edit.
Legs 8, 9 and 10 needed the kling escalation again, same `wp11`/`wp12`/`wp13` triggers as
before; everything else passed on seedance.


## Final pass (2026-09-03) — kling3_0 pro at 1080p

Rendered with `VMODEL=kling3_0 KMODE=pro VSUF=-final`. **178 credits.**

### Why kling, and the one leg that isn't

A head-to-head on leg 1 (same prompt, same start/end images) decided it:

| | `seedance_2_0` 1080p | `kling3_0 --mode pro` |
|---|---|---|
| Output | 1920×1080 | 1920×1080 |
| 8s leg / 5s leg | 72 / 45 | **14 / 8.75** |
| Frame-lock vs source | 22.3 dB | **32.6 dB** |
| Detail energy | 4.62 | 4.47 (a wash) |

Image quality is equivalent — the apparent sharpness advantage was just kling's tighter
framing. It wins on cost, frame-lock and pacing.

**But kling cannot perform the 180° walking turn.** On leg 4 it cross-dissolves between
the two walls instead of yawing through — visibly superimposing both rooms at t≈2.9 —
and it did so *with* an explicit "no dissolves, no cross-fades" clause in the prompt. That
is a capability limit, not a prompt gap. **Leg 4 is therefore `seedance_2_0` at 1080p**,
which renders the same shot as a genuine progressive yaw. Ten legs kling, one seedance.

Don't "fix" this by putting leg 4 back on kling. It has been tried twice.

### Dissolves: say so explicitly

kling will happily cross-fade between two rooms when a prompt only forbids *cuts* — a
dissolve is not a cut. Leg 2 (through the foyer doors) dissolved on the first attempt and
invented a bright void behind the doors. The fix, now in every prompt:

> Single continuous cinematic camera move, no cuts, no dissolves, no cross-fades — one
> unbroken dolly shot.

plus, for legs that physically cross a threshold (2, 5, 11), an explicit clause that the
door frame *passes the camera on both sides and disappears behind it*, and a description
of what is actually beyond the opening so the model doesn't invent one.

### Measured seams

| Seam | dB | | Seam | dB |
|---|---|---|---|---|
| 1→2 | 40.57 | | 6→7 | 41.57 |
| 2→3 | 39.60 | | 7→8 | 40.27 |
| 3→4 | **24.57** (into seedance) | | 8→9 | 41.09 |
| 4→5 | 37.94 (out of seedance) | | 9→10 | 42.12 |
| 5→6 | 39.31 | | 10→11 | 42.39 |

Nine of ten between 37.9 and 42.4 dB — roughly double the previz chain's ~20–22. The
cross-model pair around leg 4 sits in seedance's normal range and the crossfade covers it.
kling reproduces a seedance-authored start frame at 37.9 dB, so the handoff holds in both
directions.

### Filter behaviour flipped

Legs 8, 9 and 10 needed kling as an *escalation* during previz because Seedance rejected
their end-images. With kling primary they all passed on the first attempt. No leg needed
the fallback for content reasons in the final pass.

### Output

11 clips, 1920×1080, ~116 MB in `public/flythrough/vid/`. See TEMPLATE-BACKLOG item 8 —
these are committed binaries and want moving to object storage before the next re-render.
