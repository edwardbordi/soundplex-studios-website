# Fly-through revision 1 — Ed's previz notes (2026-09-02)

Route drops from 13 legs to 11. All changes at previz tier first (~5 credits/clip);
nothing here touches the final pass until the revised previz is approved.

## Cuts

- **CUT leg 2 (the porch).** The leg 1→2 seam hops. Replace legs 1+2 with ONE leg:
  `wp01` (dusk walkway) → `wp03` (foyer) — the camera comes up the back walk and passes
  straight THROUGH the door in a single move. Consider `--duration 8` for this leg so the
  walkway + door-entry doesn't feel rushed. `wp02` leaves the route (keep the file).
- **CUT leg 7 (the climb / second stairs leg).** Keep leg 6 (stair foot). Merge the climb
  into the next leg: new leg runs `wp07` (stair foot) → `wp09` (upstairs hallway),
  prompt: climb the staircase and crest onto the landing in one continuous move.
  `wp08` leaves the route. [CONFIRMED cut = "The climb"; leg labels, not numbers, are
  authoritative if this reads off.]

## Source-photo edit (before re-rendering leg 3)

- **`waypoints/03.jpg` (foyer): close the back double doors.** Currently one door is open
  and the room beyond is visible — which is NOT the Wood Room, so the cut to leg 4 reads
  wrong. Edit the photo (nano_banana_2 image edit, ~2 credits, same workflow as the
  opener retouches): both doors closed, everything else identical. Then:
  - New merged leg 1 ARRIVES on closed doors (clean cliffhanger).
  - Leg 3's prompt: the camera approaches the closed double doors, THE DOORS SWING OPEN,
    and it passes through toward the Wood Room threshold (end-image `wp04` unchanged).
    Door-opening is a move the model already does well elsewhere in the film.

## Transition smoothing

- **Leg 4 → 5 seam (Wood Room reveal → the turn) is abrupt.** Try in this order:
  1. Free: widen the crossfade for that seam only / add `linger` on leg 4 so the camera
     settles before the turn begins.
  2. Prompt: strengthen leg 4's final-second settle clause + leg 5 opens by continuing
     that exact drift for a beat BEFORE the yaw starts.
  3. If still abrupt: add a real intermediate anchor — unused wide shots exist
     (`design-process/photos/` has `woodroom-wide-2` … `-5`; wide-2 is a straight-on
     stage view). Insert as a short 4s leg between them. Ed pre-approves the attempt
     order; stop at whichever rung fixes it.
- **Entering the "toward the hall" move after Studio A jumps.** After the piano orbit,
  the angle snaps to the back wall before settling into the zoom toward the far door.
  Fix at the seam: leg 9's settle clause must end already FACING the far corner doorway
  (not the back wall), and leg 10 opens continuing that drift — no new framing at the
  cut. Re-render leg 9 and/or 10 as needed.

## Sign legibility (the door plaque)

The SoundPlex plaque next to the porch door renders as fuzzy pseudo-lettering. Note that
in the revised route the close pass by the plaque is INVENTED transit (the porch anchor
is cut; `wp01` shows the door only at a distance), so fix in layers:

1. **Composite the real lockup (`public/logos/soundplex-lockup.png`) onto the plaque in
   `wp01`** — small but clean source beats fuzzy source; the model propagates what it's
   given. Perspective-warp to the plaque plane, keep it subtle.
2. **Prompt the merged leg 1** with "the small signage beside the door stays exactly as
   photographed, crisp and unchanged" (don't name what it says).
3. **Final pass at 1080p** sharpens whatever previz leaves soft. If the plaque STILL
   doesn't read after all three, options are: a brief re-added porch beat (one 4s leg
   anchored on the retouched `wp02`, which shows the sign large and could carry the
   composited logo crisply), or accept — it's set dressing, not a title card.

## Sound Lounge finale — restore the stained glass

The real room has a lit stained-glass window in the back wall between the velvet drapes
(clearly visible in `wp14`); the rendered leg drops it. Re-render the finale with the
prompt naming it as architecture — "the leaded stained-glass window glowing between the
heavy drapes on the far wall, exactly as photographed" — and verify the settle frame
keeps it. (Describe it as a window, not by its imagery/text, to stay clear of the
filter.) If Seedance keeps erasing it, it's on the end-image so the LAST frame should
carry it — check whether the loss is mid-leg only, and if so a slightly later settle
point may be the cheaper fix.

## Everything else

Legs at "the stairs" (foot), landing, Studio A orbit, gallery hall, General Office
doorway, Sound Lounge finale: **KEEP as-is.** The turn out of the Wood Room (old leg 5):
KEEP — transition INTO it is the only note (covered above).

## Estimated re-render list (previz tier)

merged leg 1 · leg 3 (new anchor + door opening) · merged stairs leg · legs 9/10 seam
(one or both) · possibly one new wood-room mid-leg = **4–6 clips ≈ 20–35 credits**, plus
one 2-credit photo edit. Update `flythrough-route.ts` (11 sections), re-run the affected
legs with the existing chain.sh (FIRST/LAST + FORCE flags as needed), re-encode, verify
seams in the headless pass as before.
