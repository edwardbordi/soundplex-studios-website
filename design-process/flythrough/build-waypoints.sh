#!/bin/bash
# Build the canonical waypoint set for the fly-through chain.
# Normalizes every route photo to 1920x1080 (all sources are already true 16:9) and
# gently lifts shadows on the murky interiors so Seedance can READ the geometry it has
# to continue. Lifted copies are MODEL INPUT ONLY — the page posters use the originals,
# so the venue's real moody lighting survives to the visitor.
set -euo pipefail
SRC="design-process/photos/prepped-16x9"
OUT="design-process/flythrough/waypoints"
mkdir -p "$OUT"

NORM="scale=1920:1080:flags=lanczos"
# shadows/mids up, white point pinned so chandeliers don't blow out
LIFT="curves=all='0/0 0.25/0.38 0.6/0.66 1/1'"

# wp<NN>|<source file>|<lift? yes/no>
# NOTE (revision 1): wp02 (porch) and wp08 (second stairs angle) are no longer route
# waypoints — the porch leg and the climb leg were merged away. They are still built
# because they cost nothing and remain useful as references / a possible re-added beat.
# wp03 is the DOORS-CLOSED edit of the foyer, not the original: with a door open the room
# behind it is visible and it isn't the Wood Room, so the cut read wrong. Leg 2 now opens
# those doors on camera.
ROUTE="
01|2-backdoor-dusk-clean.jpg|no
02|3-backdoor-clean.jpg|no
03|5-foyer-doors-closed.jpg|no
04|8-woodroom-entrance.jpg|no
05|9-woodroom-wide.jpg|no
06|10-woodroom-exit.jpg|no
07|11-stairs.jpg|no
08|12-stairs-secondstory.jpg|no
09|13-halway-to-studio-a.jpg|no
10|14-studio-a.jpg|yes
11|15-entrance-to-sound-lounge-hallway.jpg|no
12|17-soundlounge-hallway-part2.jpg|no
13|18-soundlounge-doorway.jpg|no
14|19-soundlounge.jpg|yes
"
# intermediate photos passed as --image-references, not as paid waypoints
REFS="
r06|6-woodroom-outer-doorway.jpg|no
r07|7-woodroom-foyer.jpg|no
r16|16-soundlounge-hallway-part1.jpg|yes
"

emit() {
  echo "$1" | while IFS='|' read -r id file lift; do
    [ -z "$id" ] && continue
    if [ "$lift" = "yes" ]; then VF="$NORM,$LIFT"; else VF="$NORM"; fi
    ffmpeg -v error -y -i "$SRC/$file" -vf "$VF" -q:v 2 "$OUT/$id.jpg"
    y=$(ffmpeg -v error -i "$OUT/$id.jpg" -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - 2>/dev/null | grep -o '=[0-9.]*$' | tr -d '=')
    printf '%-5s %-46s lift=%-3s YAVG=%s\n' "$id" "$file" "$lift" "$y"
  done
}
emit "$ROUTE"
emit "$REFS"
