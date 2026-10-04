#!/bin/bash
# Encode the raw model renders for scroll-scrubbing, and cut each leg's first frame as
# its poster. Settings per the scroll-world skill (Step 6): native resolution (never
# upscale — encode what ffprobe reports), crf 20, SHORT GOP so a seek never has to decode
# far from a keyframe, faststart, and -an because the page mutes anyway.
# The engine fetches each clip as a Blob, so byte-range support on the host is irrelevant.
set -euo pipefail
SUF="${VSUF:-}"
OUTV="../../public/flythrough/vid"
OUTP="../../public/flythrough/poster"
mkdir -p "$OUTV" "$OUTP"

# The route got SHORTER in revision 1 (13 legs -> 11). Without this, leg12/leg13 from the
# old route would sit in public/ forever: unreferenced, still shipped, still in git.
# Clear the published set each run so it always mirrors raw/ exactly.
rm -f "$OUTV"/leg*.mp4 "$OUTP"/*.jpg

for f in raw/leg*${SUF}.mp4; do
  [ -e "$f" ] || continue
  b=$(basename "$f" .mp4); n=$(echo "$b" | sed 's/^leg//; s/'"${SUF}"'$//')
  ffmpeg -v error -y -i "$f" -an -vf "unsharp=5:5:0.8:5:5:0.0" \
    -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
    -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart \
    "$OUTV/leg${n}.mp4"
  # Poster = the clip's OWN first frame, so there's no jump when the video paints over it.
  ffmpeg -v error -y -ss 0 -i "$f" -frames:v 1 -q:v 4 "$OUTP/${n}.jpg"
  printf '%s  %s  %s\n' "$b" "$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$OUTV/leg${n}.mp4")" \
    "$(du -h "$OUTV/leg${n}.mp4" | cut -f1)"
done
echo "encoded -> $OUTV ; posters -> $OUTP"
