"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { HOTSPOTS } from "../../lib/gallery/hotspots";
import { ART, usd, type ArtPiece } from "../../lib/gallery/art";
import { PieceSheet } from "../gallery/Gallery";

/**
 * Shoppable photo layer (Ed, 2026-10-28): drop it inside any `relative` box that shows a photo
 * with `object-cover` (centered), pass the photo's src, and every piece of art for sale in that
 * photo becomes clickable. Nothing shows until you hover a piece; then:
 *   - the rest of the photo dims a touch, so the piece is lit (a spotlight)
 *   - a thin gold dashed line traces its exact frame (corners from lib/gallery/hotspots.ts), the
 *     dashes spaced per side so every corner gets a whole dash
 *   - a small museum card appears BESIDE the frame, on whichever side has open wall (below only
 *     if neither side has room): the piece's own photo in true color (the room light is magenta),
 *     title, artist, price
 * Click opens the same piece panel as the gallery, right here. Touch screens (no hover) show the
 * outlines faintly so people know they can tap.
 *
 * The cover math: the photo is scaled to cover the box and centered, so a photo pixel (x, y)
 * lands at x·scale − overflow/2. Measured with a ResizeObserver, so it tracks every screen size.
 */
const PAD = 2; // px the line sits outside the frame
const DASH = 5;
const GAP = 3;
const CARD_W = 236;

type Side = "right" | "left" | "below" | "above";
type Placed = { slug: string; p: ArtPiece; pts: [number, number][]; left: number; top: number; width: number; height: number; card?: Side };

/** `delayMs`: keep the spots switched off until the photo has settled (the home hero waits for
 *  the empty room to finish fading into the full one, so the spots match what's on screen). */
export default function ShopSpots({ src, delayMs = 0 }: { src: string; delayMs?: number }) {
  const map = HOTSPOTS[src];
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [open, setOpen] = useState<ArtPiece | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [live, setLive] = useState(delayMs === 0);

  useEffect(() => {
    if (live) return;
    // Reduced motion skips the fade (globals.css), so there's nothing to wait for.
    const wait = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : delayMs;
    const t = window.setTimeout(() => setLive(true), wait);
    return () => window.clearTimeout(t);
  }, [live, delayMs]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!map) return null;

  let placed: Placed[] = [];
  if (size && live) {
    const scale = Math.max(size.w / map.w, size.h / map.h);
    const offX = (map.w * scale - size.w) / 2;
    const offY = (map.h * scale - size.h) / 2;
    placed = map.spots.flatMap((s) => {
      const p = ART.find((a) => a.slug === s.slug);
      if (!p) return [];
      const raw = s.corners.map(([x, y]) => [x * scale - offX, y * scale - offY] as [number, number]);
      const xs = raw.map((q) => q[0]);
      const ys = raw.map((q) => q[1]);
      const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const my = (Math.min(...ys) + Math.max(...ys)) / 2;
      if (mx < 0 || my < 0 || mx > size.w || my > size.h) return []; // cropped off
      const pts = raw.map(([x, y]) => [x + Math.sign(x - mx) * PAD, y + Math.sign(y - my) * PAD] as [number, number]);
      const left = Math.min(...pts.map((q) => q[0]));
      const top = Math.min(...pts.map((q) => q[1]));
      return [{ slug: s.slug, p, pts, left, top, width: Math.max(...pts.map((q) => q[0])) - left, height: Math.max(...pts.map((q) => q[1])) - top, card: s.card }];
    });
  }
  const lit = placed.find((x) => x.slug === hot) ?? null;
  const maskId = `spot-${src.replace(/\W+/g, "-")}`;

  return (
    <>
      <div ref={box} className="pointer-events-none absolute inset-0 z-20">
        {/* The spotlight: everything but the hovered piece dims a touch. */}
        {size && (
          <svg aria-hidden className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${lit ? "opacity-100" : "opacity-0"}`} viewBox={`0 0 ${size.w} ${size.h}`}>
            <defs>
              <mask id={maskId}>
                <rect width={size.w} height={size.h} fill="white" />
                {lit && <polygon points={lit.pts.map((q) => q.join(",")).join(" ")} fill="black" />}
              </mask>
            </defs>
            <rect width={size.w} height={size.h} fill="black" fillOpacity={0.42} mask={`url(#${maskId})`} />
          </svg>
        )}

        {placed.map((x) => {
          const { p, pts, left, top, width, height } = x;
          const on = hot === x.slug;
          const sold = p.status === "sold";
          // Card side: the spot's own choice (set per piece in hotspots.ts, wherever the wall is
          // open in that photo), if it fits on screen; else right, left, below, in that order.
          const fits: Record<Side, boolean> = {
            right: size!.w - (left + width) > CARD_W + 28,
            left: left > CARD_W + 28,
            below: size!.h - (top + height) > 104,
            above: top > 104,
          };
          const side: Side = x.card && fits[x.card] ? x.card : fits.right ? "right" : fits.left ? "left" : "below";
          const cardTop = Math.min(Math.max(top + height / 2 - 40, 12), size!.h - 92);
          const centerX = Math.min(Math.max(left + width / 2 - CARD_W / 2, 12), size!.w - CARD_W - 12);
          const cardStyle =
            side === "right"
              ? { left: left + width + 14, top: cardTop }
              : side === "left"
                ? { left: left - 14 - CARD_W, top: cardTop }
                : side === "above"
                  ? { left: centerX, top: top - 12 - 80 }
                  : { left: centerX, top: top + height + 12 };
          // Each side gets its own dash spacing so it starts and ends on a whole dash.
          const edges = pts.map((a, i) => {
            const b = pts[(i + 1) % pts.length];
            const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
            const n = Math.max(1, Math.round((len + GAP) / (DASH + GAP)));
            const d = Math.max(1, (len - (n - 1) * GAP) / n);
            return { a, b, dash: `${d.toFixed(2)} ${GAP}` };
          });
          return (
            <div key={x.slug}>
              <button
                type="button"
                onClick={() => setOpen(p)}
                onMouseEnter={() => setHot(x.slug)}
                onMouseLeave={() => setHot((h) => (h === x.slug ? null : h))}
                onFocus={() => setHot(x.slug)}
                onBlur={() => setHot((h) => (h === x.slug ? null : h))}
                aria-label={`${p.title} by ${p.artist}, ${sold ? "sold" : usd(p.price)}: view${sold ? "" : " and buy"}`}
                className="group pointer-events-auto absolute outline-none"
                style={{ left, top, width, height }}
              >
                <svg aria-hidden className={`absolute inset-0 h-full w-full overflow-visible transition-opacity duration-300 ${on ? "opacity-100" : "opacity-0 [@media(hover:none)]:opacity-50"}`} viewBox={`0 0 ${width} ${height}`}>
                  <polygon points={pts.map(([px, py]) => `${px - left},${py - top}`).join(" ")} fill="none" stroke="#d4a030" strokeWidth={4} className="opacity-30 blur-[3px]" />
                  {edges.map((e, i) => (
                    <line key={i} x1={e.a[0] - left} y1={e.a[1] - top} x2={e.b[0] - left} y2={e.b[1] - top} stroke="#e2b34e" strokeWidth={1} strokeDasharray={e.dash} />
                  ))}
                </svg>
              </button>
              {/* The museum card: the piece in true color, its name, its price. */}
              <div
                aria-hidden
                className={`pointer-events-none absolute flex items-center gap-3 rounded-[6px] border border-white/10 bg-black/85 p-2 pr-3.5 shadow-[0_14px_34px_-8px_rgba(0,0,0,0.75)] backdrop-blur transition-all duration-250 ${on ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
                style={{ ...cardStyle, width: CARD_W }}
              >
                <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-[2px] bg-[#111]">
                  <Image src={`/gallery/${p.slug}.webp`} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-[family-name:var(--font-poppins)] text-[13.5px] font-medium text-white">{p.title}</span>
                  <span className="block truncate font-[family-name:var(--font-lora)] text-[12.5px] italic text-white/60">{p.artist}</span>
                  <span className={`mt-1 block font-[family-name:var(--font-poppins)] text-[13px] tabular-nums ${sold ? "text-white/45" : "text-[#e2b34e]"}`}>{sold ? "Sold" : `${usd(p.price)} · View →`}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {open && <PieceSheet piece={open} onClose={() => setOpen(null)} onStep={() => {}} canStep={false} />}
    </>
  );
}
