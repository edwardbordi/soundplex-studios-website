#!/bin/bash
# Architecture A chain runner — STRICTLY SEQUENTIAL by design: leg N's start-image is
# leg N-1's ACTUAL rendered last frame, so nothing here can be parallelised.
# Per the brief, each leg's --end-image is the NEXT room's REAL photograph, which is what
# keeps every room true to the building instead of a model's idea of it.
# bash 3.2 safe (macOS): no associative arrays.
set -uo pipefail

MODEL="${VMODEL:-seedance_2_0_mini}"
RES="${VRES:-480p}"
SUF="${VSUF:-}"          # output suffix, e.g. "" for previz, "-final" for the full pass
# Leg 1 is part of the chain now (revision 1 seeds it from waypoints/01.jpg), so the
# default start is 1 — it used to be 2 because the old leg 1 was rendered by hand.
FIRST="${FIRST:-1}"
LAST="${LAST:-11}"
MAXTRY=3

pad() { printf '%02d' "$1"; }

# ── ROUTE TABLE (revision 1: 11 legs) ─────────────────────────────────────────
# Leg -> end waypoint, and leg -> duration in seconds. This used to be arithmetic
# (leg N ended on waypoint N+1); after the revision it isn't, because two legs were
# merged away and their intermediate waypoints left the route:
#   old leg 1 + 2 (walkway, porch)  -> new leg 1  (wp01 -> wp03, through the door)
#   old leg 7 + 8 (climb, landing)  -> new leg 6  (wp07 -> wp09, climb and crest)
# wp02 and wp08 are still built, just no longer arrived at. Labels, not numbers, are
# authoritative — see END_LABEL.
# Duration is billed per second (5s = 5 credits, 8s = 8), so the two merged legs are
# the only ones given 8: each now covers ground that used to be two clips.
route_end()   { case "$1" in 1) echo 03;; 2) echo 04;; 3) echo 05;; 4) echo 06;; 5) echo 07;;
                             6) echo 09;; 7) echo 10;; 8) echo 11;; 9) echo 12;; 10) echo 13;;
                             11) echo 14;; *) echo "";; esac; }
route_dur()   { case "$1" in 1) echo 8;; 6) echo 8;; *) echo 5;; esac; }
END_LABEL()   { case "$1" in 1) echo "foyer (closed doors)";; 2) echo "wood room entrance";;
                             3) echo "wood room wide";; 4) echo "wood room exit / the turn";;
                             5) echo "stair foot";; 6) echo "upstairs hallway";;
                             7) echo "Studio A";; 8) echo "lounge hall entrance";;
                             9) echo "gallery hall";; 10) echo "General Office doorway";;
                             11) echo "Sound Lounge";; *) echo "?";; esac; }

# Intermediate route photos were going to ride along as --image-references, to give the
# model the real geometry of the bits of corridor between waypoints for free. They are
# DISABLED: r06 is dominated by a gold-framed classical reclining nude and r07 by a
# "Strawberry Kush" poster, and feeding either to Seedance returned `nsfw` on all three
# attempts at leg 3. The filter reads reference frames, not just prompts.
# Nothing is lost that matters — the arrival is frame-locked by --end-image either way;
# only the few metres of transit are now invented rather than referenced.
refs_for() {
  case "$1" in
    *) echo "" ;;
  esac
}

# Escalation for a leg the content filter keeps rejecting: attempts 2+ swap in a
# de-triggered rewrite of the prompt if one exists (prompts/legNN.alt.txt).
# FORCE_ALT=1 starts a leg on the de-triggered prompt instead of working up to it — use it
# when resuming a leg whose base prompt has already been proven to trip the filter, so the
# retry budget isn't spent re-confirming that.
prompt_for() {
  if { [ "${FORCE_ALT:-0}" = 1 ] || [ "$2" -ge 2 ]; } && [ -s "prompts/leg$1.alt.txt" ]; then
    cat "prompts/leg$1.alt.txt"
  else
    cat "prompts/leg$1.txt"
  fi
}

for i in $(seq "$FIRST" "$LAST"); do
  N=$(pad "$i"); PREV=$(pad $((i-1))); ENDWP=$(route_end "$i"); DUR=$(route_dur "$i")
  OUT="raw/leg${N}${SUF}.mp4"
  if [ -s "$OUT" ]; then echo "[$N] already have $OUT — skip"; continue; fi

  # Leg 1 is the only leg seeded by a photograph; every other leg is seeded by the
  # previous leg's ACTUAL rendered last frame, which is what frame-locks the seam.
  if [ "$i" = 1 ]; then START="waypoints/01.jpg"; else START="frames/leg${PREV}${SUF}_last.png"; fi
  # START_OVERRIDE: seed ONE leg from a photograph instead of the previous frame — for a
  # leg that is the FIRST frame of a route (hero v2 opens on leg 2, from an edited foyer
  # photo; nothing precedes it, so nothing needs to lock to it). Use with FIRST=LAST.
  if [ -n "${START_OVERRIDE:-}" ]; then START="$START_OVERRIDE"; fi
  END="waypoints/${ENDWP}.jpg"
  if [ ! -s "$START" ]; then echo "[$N] FATAL: missing $START (leg $PREV must finish first)"; exit 1; fi
  if [ -z "$ENDWP" ]; then echo "[$N] FATAL: leg $i is not in the route table"; exit 1; fi
  if [ ! -s "$END" ];   then echo "[$N] FATAL: missing $END"; exit 1; fi

  ok=0
  for try in $(seq 1 $MAXTRY); do
    # Escalation ladder (the skill's order): base prompt -> de-triggered prompt ->
    # different provider. kling3_0 has its own content filter, which routinely passes
    # what Seedance blocks; at 7.5 credits it is barely dearer than the mini tier.
    # Its flags differ: NO --resolution (std returns 720p native), and sound defaults ON.
    # A single clip from another renderer shifts grain/motion character slightly — the
    # seam crossfade absorbs that, and it beats a missing leg.
    # Per-model flags. These are NOT interchangeable: kling takes --mode/--sound and has
    # no --resolution at all (std is 720p native, pro is 1080p), while seedance takes
    # --resolution and defaults generate_audio ON (the page mutes and encode strips it,
    # so asking for audio only costs render time). seedance_2_0 additionally needs
    # --mode std for anything above 720p.
    opts_for() {
      case "$1" in
        kling3_0)          echo "--mode ${KMODE:-std} --sound off" ;;
        seedance_2_0)      echo "--mode std --resolution $RES --generate-audio false" ;;
        *)                 echo "--resolution $RES --generate-audio false" ;;
      esac
    }
    # Rung 3 of the ladder is "hand it to the other provider", so which provider that IS
    # depends on which one is primary. Seedance-primary escalates to kling (its filter
    # passes the artwork that Seedance rejects); kling-primary escalates back to seedance
    # at matching quality. FORCE_FALLBACK=1 (FORCE_KLING still honoured) jumps straight there for a leg proven to
    # trip Seedance on both prompts, rather than re-confirming it for ten minutes.
    if { [ "${FORCE_FALLBACK:-${FORCE_KLING:-0}}" = 1 ] || [ "$try" -ge 3 ]; } && [ "${ALLOW_FALLBACK:-1}" = 1 ]; then
      case "$MODEL" in
        seedance_2_0_mini) TRYMODEL="kling3_0";     TRYOPTS="--mode ${KMODE:-std} --sound off" ;;
        kling3_0)          TRYMODEL="seedance_2_0"; TRYOPTS="--mode std --resolution 1080p --generate-audio false" ;;
        *)                 TRYMODEL="$MODEL";       TRYOPTS="$(opts_for "$MODEL")" ;;
      esac
    else
      TRYMODEL="$MODEL"; TRYOPTS="$(opts_for "$MODEL")"
    fi
    echo "[$N] try $try/$MAXTRY  $TRYMODEL  ${DUR}s  -> $(END_LABEL "$i")  (end=$END)"
    # shellcheck disable=SC2046
    higgsfield generate create "$TRYMODEL" \
      --prompt "$(prompt_for "$N" "$try")" \
      --start-image "$START" \
      --end-image "$END" \
      $(refs_for "$i") \
      --aspect_ratio 16:9 $TRYOPTS --duration "$DUR" \
      --wait --wait-timeout 15m --wait-interval 10s --json \
      > "logs/leg${N}${SUF}.try${try}.json" 2> "logs/leg${N}${SUF}.try${try}.err"
    cp "logs/leg${N}${SUF}.try${try}.json" "logs/leg${N}${SUF}.json" 2>/dev/null

    URL=$(python3 - "logs/leg${N}${SUF}.try${try}.json" <<'PY'
import json,sys
try: d=json.load(open(sys.argv[1]))
except Exception: print(""); raise SystemExit
def f(o):
    if isinstance(o,dict):
        if o.get('result_url'): return o['result_url']
        for v in o.values():
            r=f(v)
            if r: return r
    if isinstance(o,list):
        for v in o:
            r=f(v)
            if r: return r
    return ""
print(f(d) or "")
PY
)
    if [ -n "$URL" ]; then
      curl -sS -o "$OUT" "$URL" && [ -s "$OUT" ] && ok=1 && break
    fi
    echo "[$N] no result_url (status/nsfw/transient) — see logs/leg${N}${SUF}.json"
    grep -o '"status":"[a-z_]*"' "logs/leg${N}${SUF}.try${try}.json" 2>/dev/null | sort -u | head -3
  done

  if [ "$ok" != 1 ]; then
    echo "[$N] FAILED after $MAXTRY tries. Chain stops here (leg $((i+1)) needs this frame)."
    exit 2
  fi

  ffmpeg -v error -y -sseof -0.1 -i "$OUT" -frames:v 1 "frames/leg${N}${SUF}_last.png"
  echo "[$N] OK -> $OUT  ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s)"
done
echo "CHAIN COMPLETE ($FIRST..$LAST)"
