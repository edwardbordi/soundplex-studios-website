"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import ForwardArrow from "../components/ForwardArrow";
import { MEDIUMS, usd, type ArtPiece, type Medium } from "../../lib/gallery/art";
import { ROOMS, roomOf } from "../../lib/venue/data";

/**
 * The SoundPlex Gallery store (Ed, 2026-10-28 — "like an ecommerce store but nicer"). Not a grid of
 * SKUs: a hang. Pieces sit in a masonry wall at their own proportions, with a museum label under
 * each (title, artist, materials, size, price). Filter by kind or by the room it hangs in, sort,
 * hide what's sold. A piece opens in a side panel: big picture (tap to see it full screen), the
 * full label, Buy, and two softer ways in (ask a question, see it in person). Each piece is one of
 * a kind, so there's no cart: Buy goes straight to checkout for that piece.
 *
 * Shareable: the open piece is in the URL hash (/gallery#butterflies style, by slug), so a link
 * opens straight to it. Arrow keys step through pieces; Esc closes.
 */
type Sort = "featured" | "price-asc" | "price-desc" | "newest";
/**
 * The colored wall each piece hangs on (Ed: color, like the sketches, instead of all white). Two
 * tones from the art's own average color, deepened and muted (lib/gallery/art.ts `wall`), dark at
 * the top-left corner to lighter at the bottom-right. Drawings with no color of their own got a
 * hue from the sketch palette (rust, slate, umber, plum, moss, sand).
 */
const wallBg = (p: ArtPiece) => ({
  background: `linear-gradient(135deg, ${p.wall?.[0] ?? "#2a2622"}, ${p.wall?.[1] ?? "#6b6157"})`,
});

/** Target row height (px) for the justified wall; smaller on a phone. */
const ROW_H = 260;
const GAP = 12; // matches gap-3

/** Break pieces into rows that exactly fill `width`.
 *  - A row closes once adding a piece would bring it under the target height. If the row WITHOUT
 *    that last piece is closer to the target (and not over 125% of it), it closes there instead
 *    and the piece starts the next row. That keeps every row near the same height, so one very
 *    wide piece can't make a row tower over the rest (Ed: the Procession row).
 *  - Leftovers form a partial row held back behind "Show more · N more pieces". */
const rowH = (items: ArtPiece[], width: number) => (width - GAP * (items.length - 1)) / items.reduce((s, p) => s + p.width / p.height, 0);

function justify(list: ArtPiece[], width: number) {
  const target = width < 640 ? 190 : ROW_H;
  const rows: { items: ArtPiece[]; h: number; full: boolean }[] = [];
  let cur: ArtPiece[] = [];
  for (const p of list) {
    const next = [...cur, p];
    const h = rowH(next, width);
    if (h > target) {
      cur = next;
      continue;
    }
    const before = cur.length ? rowH(cur, width) : Infinity;
    if (cur.length && before <= target * 1.25 && before - target < target - h) {
      rows.push({ items: cur, h: before, full: true });
      cur = [p];
    } else {
      rows.push({ items: next, h, full: true });
      cur = [];
    }
  }
  // Leftovers always wait behind "Show more" (Ed tried folding them into the row above; it
  // squashed that row, and he preferred the button).
  if (cur.length) rows.push({ items: cur, h: target, full: false });
  return rows;
}

// One shape for every control (Ed): rounded squares, like the site's buttons. Never pills.
// Radio dots and status dots stay round; they're marks, not controls.


export default function Gallery({ pieces, intro }: { pieces: ArtPiece[]; intro?: React.ReactNode }) {
  const [medium, setMedium] = useState<Medium | "all">("all");
  const [room, setRoom] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  // "Featured this month": the piece marked `spotlight` (Butterflies, Ed), else the first featured
  // one. It hangs in the hero, so it's left out of the wall below (Ed: not shown twice).
  const spotlight = pieces.find((p) => p.spotlight && p.status === "available") ?? pieces.find((p) => p.featured && p.status === "available") ?? null;

  const shown = useMemo(() => {
    const list = pieces.filter(
      (p) =>
        p.slug !== spotlight?.slug &&
        (medium === "all" || p.medium === medium) &&
        (room === "all" || p.room === room) &&
        (!availableOnly || p.status === "available"),
    );
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "newest") sorted.sort((a, b) => b.year - a.year);
    // Featured (the default): featured first, and SOLD pieces to the end, so the first screen is
    // all buyable (Ed).
    // `last` pieces (The Lyrist) go after everything, sold ones included.
    else sorted.sort((a, b) => Number(!!a.last) - Number(!!b.last) || Number(a.status === "sold") - Number(b.status === "sold") || Number(!!b.featured) - Number(!!a.featured));
    return sorted;
  }, [pieces, medium, room, sort, availableOnly, spotlight?.slug]);

  const count = (m: Medium | "all") => pieces.filter((p) => m === "all" || p.medium === m).length;
  // The count line includes the featured piece up in the hero when it matches the view, so it
  // agrees with the chips (Ed: "All work 27" vs "26 pieces").
  const spotIn =
    !!spotlight &&
    (medium === "all" || spotlight.medium === medium) &&
    (room === "all" || spotlight.room === room) &&
    (!availableOnly || spotlight.status === "available");
  const total = shown.length + (spotIn ? 1 : 0);

  // The wall's measured width drives the justified rows (ResizeObserver; a sensible guess first).
  const wallRef = useRef<HTMLDivElement>(null);
  const [wallW, setWallW] = useState(1104);
  useEffect(() => {
    const el = wallRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWallW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [shown.length]);
  const rows = useMemo(() => justify(shown, wallW), [shown, wallW]);
  // "Show more" reveals the held-back partial row. Any filter change folds it away again.
  const [moreFor, setMoreFor] = useState("");
  const viewKey = `${medium}|${room}|${sort}|${availableOnly}`;
  const more = moreFor === viewKey;
  const setMore = (v: boolean) => setMoreFor(v ? viewKey : "");
  // A filter so narrow there's no full row at all: just show what there is, no button.
  const anyFull = rows.some((r) => r.full);
  const showAll = more || !anyFull;
  const held = showAll ? 0 : rows.filter((r) => !r.full).reduce((n, r) => n + r.items.length, 0);

  // The open piece lives in the URL hash, so a link can open straight to it.
  const show = useCallback((slug: string | null) => {
    setOpen(slug);
    const url = slug ? `#${slug}` : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
  }, []);
  useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      if (slug && pieces.some((p) => p.slug === slug)) setOpen(slug);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [pieces]);

  const index = open ? shown.findIndex((p) => p.slug === open) : -1;
  const current = open ? pieces.find((p) => p.slug === open) ?? null : null;
  const step = (d: 1 | -1) => {
    if (index < 0 || !shown.length) return;
    show(shown[(index + d + shown.length) % shown.length].slug);
  };

  return (
    <div>
      {/* The hero: the page's words on the left, the featured piece on the right. Compact, so
          the wall starts on the first screen. */}
      {/* items-start: the card's top lines up with the eyebrow on the left (Ed), not centered. */}
      <div className="mb-10 grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_29rem]">
        <div>{intro}</div>
        {spotlight && <Spotlight piece={spotlight} onOpen={() => show(spotlight.slug)} />}
      </div>

      {/* Toolbar: a segmented control for the kind of work, branded dropdowns, a switch. */}
      <div className="sticky top-[calc(var(--hdr-now,64px)-1px)] z-30 -mx-6 mb-10 bg-black px-6 py-3 before:absolute before:-top-4 before:bottom-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:border-b before:border-white/[0.06] before:bg-black before:content-['']">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex overflow-x-auto rounded-[6px] border border-white/10 bg-white/[0.03] p-1 [scrollbar-width:none]" role="group" aria-label="Kind of work">
            {([{ id: "all", label: "All work" }, ...MEDIUMS] as { id: Medium | "all"; label: string }[]).map((m) => {
              const on = medium === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMedium(m.id)}
                  className={`relative whitespace-nowrap rounded-[4px] px-4 py-1.5 font-[family-name:var(--font-poppins)] text-[13px] transition-colors ${on ? "bg-[#d4a030] text-black shadow-[0_4px_14px_-4px_rgba(212,160,48,0.6)]" : "text-white/65 hover:text-white"}`}
                >
                  {m.label}
                  <span className={`ml-1.5 tabular-nums ${on ? "text-black/55" : "text-white/35"}`}>{count(m.id)}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={availableOnly}
              onClick={() => setAvailableOnly((v) => !v)}
              className="flex h-10 items-center gap-2.5 rounded-[6px] border border-white/10 bg-white/[0.03] pl-2 pr-4 font-[family-name:var(--font-poppins)] text-[13px] text-white/75 transition-colors hover:border-white/25"
            >
              <span className={`relative h-6 w-10 rounded-[4px] transition-colors ${availableOnly ? "bg-[#d4a030]" : "bg-white/12"}`} aria-hidden>
                <span className={`absolute top-1 h-4 w-4 rounded-[3px] bg-white shadow transition-all ${availableOnly ? "left-5" : "left-1"}`} />
              </span>
              Available only
            </button>
            <Dropdown
              label="Room"
              value={room}
              onChange={setRoom}
              options={[{ value: "all", label: "Every room" }, ...ROOMS.map((r) => ({ value: r.id, label: r.name, note: `${pieces.filter((p) => p.room === r.id).length} pieces` }))]}
            />
            <Dropdown
              label="Sort"
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              options={[
                { value: "featured", label: "Featured" },
                { value: "newest", label: "Newest" },
                { value: "price-asc", label: "Price, low to high" },
                { value: "price-desc", label: "Price, high to low" },
              ]}
            />
          </div>
        </div>
      </div>

      <p className="mb-8 flex items-center gap-3 font-[family-name:var(--font-poppins)] text-[11.5px] uppercase tracking-[0.18em] text-white/40" aria-live="polite">
        <span className="h-px w-8 bg-[#d4a030]/50" />
        {total} {total === 1 ? "piece" : "pieces"} on the wall
      </p>

      {shown.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
          <p className="font-[family-name:var(--font-lora)] text-[18px] italic text-white/70">Nothing hanging that matches.</p>
          <button
            type="button"
            onClick={() => {
              setMedium("all");
              setRoom("all");
              setAvailableOnly(false);
            }}
            className="card-cta mt-3"
          >
            Show everything
          </button>
        </div>
      ) : (
        // JUSTIFIED ROWS (Ed: "some pics fit nice, some don't"). Every row is exactly the wall's
        // width, every piece at its true proportions, edge to edge: no crop, no leftover bands.
        // Measured, not CSS-guessed: pieces are added to a row until it would be shorter than the
        // target height, then the row is scaled to fill the width exactly. A last row that can't
        // fill is held back behind "Show more" (Ed), so the wall always ends on a full row.
        // Color: each piece's own tone glows under it on hover (its `wall` color).
        <div ref={wallRef}>
          <ul className="grid gap-y-7">
            {rows
              .filter((r) => r.full || showAll)
              .map((r, ri) => (
                <li key={ri} className="flex gap-3">
                  {r.items.map((p, i) => {
                    const w = (p.width / p.height) * r.h;
                    return (
                      <div key={p.slug} className={`min-w-0 ${r.full && i === r.items.length - 1 ? "flex-1" : "shrink-0"}`} style={r.full && i === r.items.length - 1 ? undefined : { width: w }}>
              <button type="button" onClick={() => show(p.slug)} className="group block w-full text-left" aria-label={`${p.title} by ${p.artist}, ${usd(p.price)}${p.status === "sold" ? ", sold" : ""}`}>
                <span
                  className="relative block overflow-hidden rounded-[2px] bg-[#0b0b0b] transition-[box-shadow,transform] duration-500 group-hover:-translate-y-1 group-hover:[box-shadow:0_22px_44px_-14px_var(--glow)]"
                  style={{ height: r.h, ["--glow" as string]: p.wall?.[1] ?? "#d4a030" }}
                >
                  <Image
                    src={`/gallery/${p.slug}.webp`}
                    alt={p.alt}
                    fill
                    sizes={`${Math.round(w * 1.6)}px`}
                    className={`object-cover transition-transform duration-700 group-hover:scale-[1.02] ${p.status === "sold" ? "opacity-55 grayscale-[35%]" : ""}`}
                  />
                  {p.status === "sold" ? (
                    <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-[3px] bg-black/70 px-2.5 py-1 font-[family-name:var(--font-poppins)] text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c0392b]" />
                      Sold
                    </span>
                  ) : null /* no "Featured" tags here: the hero's spotlight says it (Ed) */}
                </span>
                {/* The museum label. The title gets the whole width (narrow portraits were cutting
                    it to "The Gilded …", Ed); the price moves down beside the artist. */}
                <span className="mt-2.5 block font-[family-name:var(--font-poppins)] text-[14.5px] font-medium leading-snug text-white transition-colors [overflow-wrap:anywhere] group-hover:text-[#e2b34e]">{p.title}</span>
                <span className="mt-0.5 flex items-baseline justify-between gap-3">
                  <span className="truncate font-[family-name:var(--font-lora)] text-[13.5px] italic text-white/55">{p.artist}</span>
                  <span className={`shrink-0 font-[family-name:var(--font-poppins)] text-[13.5px] tabular-nums ${p.status === "sold" ? "text-white/35 line-through" : "text-[#d4a030]"}`}>{usd(p.price)}</span>
                </span>
              </button>
                      </div>
                    );
                  })}
                </li>
              ))}
          </ul>
          {held > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setMore(true)}
                className="group inline-flex items-center gap-2 rounded-[4px] border border-white/15 px-5 py-3 font-[family-name:var(--font-poppins)] text-[13.5px] text-white/85 transition-colors hover:border-[#d4a030]/60 hover:text-[#e2b34e]"
              >
                Show more
                <span className="text-white/40">
                  · {held} more {held === 1 ? "piece" : "pieces"}
                </span>
                <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-y-0.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {current && <PieceSheet piece={current} onClose={() => show(null)} onStep={step} canStep={shown.length > 1 && index >= 0} />}
    </div>
  );
}

/* ── The spotlight ─────────────────────────────────────────────────────── */

function Spotlight({ piece: p, onOpen }: { piece: ArtPiece; onOpen: () => void }) {
  return (
    // Compact, for the hero's right side: the piece on its own colored wall, the label beside it.
    <section aria-label="Featured piece" className="relative overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#0a0a0a]">
      <div className="relative grid grid-cols-[55%_1fr] items-stretch">
        <button type="button" onClick={onOpen} className="group relative grid min-h-[290px] place-items-center overflow-hidden p-5" style={wallBg(p)} aria-label={`Open ${p.title}`}>
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_0%,rgba(255,240,215,0.16),transparent_70%)]" />
          <Image
            src={`/gallery/${p.slug}.webp`}
            alt={p.alt}
            width={p.width}
            height={p.height}
            sizes="280px"
            priority
            // Fills the card at its own shape: full width, or 255px tall, whichever comes first.
            style={{ width: `min(100%, ${Math.round(255 * (p.width / p.height))}px)`, height: "auto" }}
            className="relative shadow-[0_14px_24px_-8px_rgba(0,0,0,0.55),0_3px_6px_rgba(0,0,0,0.25)] transition-transform duration-700 group-hover:-translate-y-1"
          />
        </button>
        <div className="flex flex-col p-5">
          <p className="font-[family-name:var(--font-poppins)] text-[10.5px] uppercase tracking-[0.2em] text-[#d4a030]">Featured this month</p>
          <h2 className="mt-2.5 font-[family-name:var(--font-poppins)] text-[24px] font-medium leading-tight text-white">{p.title}</h2>
          <p className="mt-1 font-[family-name:var(--font-lora)] text-[15px] italic text-white/65">
            {p.artist}, {p.year}
          </p>
          <p className="mt-2 text-[12.5px] text-white/40">
            {p.materials} · {p.size}
          </p>
          <p className="mt-auto pt-4 font-[family-name:var(--font-poppins)] text-[20px] tabular-nums text-[#d4a030]">{usd(p.price)}</p>
          <button
            type="button"
            onClick={onOpen}
            className="group mt-3 inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#d4a030] px-4 py-2.5 font-[family-name:var(--font-poppins)] text-[13px] font-semibold text-black transition-colors hover:bg-[#e2b34e]"
          >
            View and buy <ForwardArrow />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── A branded dropdown (no native listboxes, Ed) ──────────────────────── */

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; note?: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setHi(Math.max(0, options.findIndex((o) => o.value === value)));
        return setOpen(true);
      }
      setHi((h) => (h + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    }
    if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      pick(options[hi].value);
    }
  };

  return (
    <div ref={box} className="relative" onKeyDown={onKey}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setHi(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((v) => !v);
        }}
        className={`flex h-10 items-center gap-2 rounded-[6px] border bg-white/[0.03] pl-4 pr-3 font-[family-name:var(--font-poppins)] text-[13px] transition-colors ${open ? "border-[#d4a030]/60" : "border-white/10 hover:border-white/25"}`}
      >
        <span className="text-white/45">{label}</span>
        <span className="text-white">{current.label}</span>
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 text-white/55 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          id={id}
          role="listbox"
          aria-label={label}
          className="vo-fade absolute right-0 top-full z-40 mt-2 min-w-[14rem] overflow-hidden rounded-[10px] border border-white/10 bg-[#0f0f0f] p-1.5 shadow-[0_24px_50px_-14px_rgba(0,0,0,0.95)]"
        >
          {options.map((o, i) => {
            const sel = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={sel}>
                <button
                  type="button"
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(o.value)}
                  className={`flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors ${hi === i ? "bg-white/[0.06]" : ""}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className={`block font-[family-name:var(--font-poppins)] text-[13.5px] ${sel ? "text-[#e2b34e]" : "text-white/85"}`}>{o.label}</span>
                    {o.note && <span className="block text-[11.5px] text-white/40">{o.note}</span>}
                  </span>
                  {sel && (
                    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="#d4a030" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── The piece, opened ─────────────────────────────────────────────────── */

/** Also used by ShopSpots (the hotspots on room photos), so a painting clicked on a wall opens
 *  the same panel as in the gallery. */
export function PieceSheet({ piece: p, onClose, onStep, canStep }: { piece: ArtPiece; onClose: () => void; onStep: (d: 1 | -1) => void; canStep: boolean }) {
  const [zoom, setZoom] = useState(false);
  const [checkout, setCheckout] = useState<{ slug: string; pickup: boolean; done: boolean } | null>(null);
  const co = checkout?.slug === p.slug ? checkout : null; // a different piece starts fresh
  const sold = p.status === "sold";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoom) setZoom(false);
        else onClose();
      }
      if (!zoom && canStep && e.key === "ArrowRight") onStep(1);
      if (!zoom && canStep && e.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom, canStep, onClose, onStep]);

  const buy = () => {
    if (p.buyUrl && !p.sample) {
      window.location.assign(p.buyUrl);
      return;
    }
    setCheckout({ slug: p.slug, pickup: true, done: false });
  };

  return (
    <>
      <button type="button" aria-label="Close" onClick={onClose} className="vo-fade fixed inset-0 z-[80] bg-black/70 backdrop-blur-[3px]" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${p.title} by ${p.artist}`}
        className="fixed inset-y-0 right-0 z-[81] flex w-full max-w-[560px] flex-col overflow-y-auto border-l border-white/10 bg-[#0b0b0b] shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.9)] animate-[vo-slide_0.32s_ease-out]"
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#0b0b0b]/95 px-5 py-3 backdrop-blur">
          <p className="font-[family-name:var(--font-poppins)] text-[11px] uppercase tracking-[0.18em] text-white/50">The SoundPlex Gallery</p>
          <div className="flex items-center gap-1">
            {canStep && (
              <>
                <IconBtn label="Previous piece" onClick={() => onStep(-1)}>
                  <path d="M15 6l-6 6 6 6" />
                </IconBtn>
                <IconBtn label="Next piece" onClick={() => onStep(1)}>
                  <path d="M9 6l6 6-6 6" />
                </IconBtn>
              </>
            )}
            <IconBtn label="Close" onClick={onClose}>
              <path d="M6 6l12 12M18 6L6 18" />
            </IconBtn>
          </div>
        </div>

        {/* The picture, on a dark wall */}
        <button type="button" onClick={() => setZoom(true)} className="group relative block w-full overflow-hidden px-8 py-10" style={wallBg(p)} aria-label="See it full screen">
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_0%,rgba(255,240,215,0.16),transparent_70%)]" />
          <Image
            key={p.slug}
            src={`/gallery/${p.slug}.webp`}
            alt={p.alt}
            width={p.width}
            height={p.height}
            sizes="(min-width: 560px) 480px, 90vw"
            // As big as the panel allows at the piece's own shape (Ed: a wide relief came out
            // tiny): full width, unless that would make it taller than 50vh, then 50vh tall.
            style={{ width: `min(100%, calc(50vh * ${p.width / p.height}))`, height: "auto" }}
            className="vo-fade relative mx-auto block shadow-[0_16px_28px_-10px_rgba(0,0,0,0.5),0_3px_6px_rgba(0,0,0,0.25)]"
          />
          <span className="absolute bottom-3 right-3 rounded-[3px] bg-black/60 px-2.5 py-1 text-[11.5px] text-white/75 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            Full screen
          </span>
        </button>

        <div className="flex-1 px-6 pb-8 pt-6">
          {co ? (
            <Checkout piece={p} co={co} setCo={setCheckout} />
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-[family-name:var(--font-poppins)] text-[24px] font-medium leading-tight text-white">{p.title}</h2>
                  <p className="mt-1 font-[family-name:var(--font-lora)] text-[17px] italic text-white/70">
                    {p.artist}, {p.year}
                  </p>
                </div>
                <p className={`shrink-0 font-[family-name:var(--font-poppins)] text-[22px] tabular-nums ${sold ? "text-white/40 line-through" : "text-[#d4a030]"}`}>{usd(p.price)}</p>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-white/[0.08] py-5 text-[14px]">
                <Fact label="Medium" value={p.materials} />
                <Fact label="Size" value={p.size} />
                <Fact label="Hangs in" value={roomOf(p.room).name} />
                <Fact label="Status" value={sold ? "Sold" : p.status === "on-hold" ? "On hold" : "Available · one of a kind"} gold={!sold} />
              </dl>

              <div className="mt-6 grid gap-3">
                {sold ? (
                  <Link href={`/start?path=talk&from=gallery-${p.slug}`} className="evp__btn group justify-center">
                    Ask about similar work <ForwardArrow />
                  </Link>
                ) : (
                  <button type="button" onClick={buy} className="evp__btn group justify-center">
                    Buy this piece · {usd(p.price)} <ForwardArrow />
                  </button>
                )}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1">
                  {!sold && (
                    <Link href={`/start?path=talk&from=gallery-${p.slug}`} className="card-cta group inline-flex items-center gap-2">
                      Ask a question <ForwardArrow />
                    </Link>
                  )}
                  <Link href={`/start?path=collective&from=gallery-${p.slug}`} className="card-cta group inline-flex items-center gap-2">
                    See it in person <ForwardArrow />
                  </Link>
                </div>
              </div>

              <p className="mt-7 text-center font-[family-name:var(--font-lora)] text-[14.5px] italic text-white/50">
                Pick it up at SoundPlex, or ask us about delivery.
              </p>
            </>
          )}
        </div>
      </aside>

      {/* Full screen */}
      {zoom && (
        <button type="button" onClick={() => setZoom(false)} aria-label="Close full screen" className="vo-fade fixed inset-0 z-[90] grid cursor-zoom-out place-items-center bg-black/95 p-6">
          <Image src={`/gallery/${p.slug}.webp`} alt={p.alt} width={p.width} height={p.height} sizes="100vw" style={{ width: `min(94vw, calc(92vh * ${p.width / p.height}))`, height: "auto" }} className="block" />
        </button>
      )}
    </>
  );
}

/**
 * One-of-a-kind checkout: no cart, one piece, pickup or delivery. A real piece goes straight to its
 * payment link from Buy and never reaches this; a SAMPLE piece shows the flow and ends on a
 * preview note, never a payment.
 */
function Checkout({
  piece: p,
  co,
  setCo,
}: {
  piece: ArtPiece;
  co: { slug: string; pickup: boolean; done: boolean };
  setCo: (c: { slug: string; pickup: boolean; done: boolean } | null) => void;
}) {
  if (co.done) {
    return (
      <div className="vo-fade py-4 text-center">
        <p className="font-[family-name:var(--font-poppins)] text-[11px] uppercase tracking-[0.18em] text-[#d4a030]">Preview</p>
        <p className="mt-3 font-[family-name:var(--font-poppins)] text-[20px] font-medium text-white">This is where checkout opens.</p>
        <p className="mx-auto mt-2 max-w-[24rem] text-[14px] leading-relaxed text-white/60">
          In the live gallery, this button takes you to secure payment for {p.title}, and George holds the piece for you. The pieces shown here are samples.
        </p>
        <button type="button" onClick={() => setCo(null)} className="card-cta mt-6">
          Back to the piece
        </button>
      </div>
    );
  }
  const opt = (pickup: boolean, title: string, note: string) => (
    <button
      type="button"
      onClick={() => setCo({ ...co, pickup })}
      className={`flex w-full items-start gap-3 rounded-[6px] border p-4 text-left transition-colors ${co.pickup === pickup ? "border-[#d4a030] bg-[#d4a030]/[0.06]" : "border-white/12 hover:border-white/30"}`}
    >
      <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${co.pickup === pickup ? "border-[#d4a030]" : "border-white/35"}`}>
        {co.pickup === pickup && <span className="h-2 w-2 rounded-full bg-[#d4a030]" />}
      </span>
      <span>
        <span className="block font-[family-name:var(--font-poppins)] text-[14.5px] font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-[13px] text-white/55">{note}</span>
      </span>
    </button>
  );
  return (
    <div className="vo-fade">
      <button type="button" onClick={() => setCo(null)} className="text-[13px] text-white/55 hover:text-white">
        ← Back to the piece
      </button>
      <h2 className="mt-4 font-[family-name:var(--font-poppins)] text-[22px] font-medium text-white">Checkout</h2>
      <div className="mt-4 flex items-center gap-4 rounded-[6px] border border-white/10 bg-white/[0.02] p-3">
        <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[3px] p-2" style={wallBg(p)}>
          <Image src={`/gallery/${p.slug}.webp`} alt="" width={p.width} height={p.height} sizes="64px" style={{ width: `min(100%, ${Math.round(48 * (p.width / p.height))}px)`, height: "auto" }} className="block shadow-[0_3px_6px_rgba(0,0,0,0.35)]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-[family-name:var(--font-poppins)] text-[15px] text-white">{p.title}</span>
          <span className="block font-[family-name:var(--font-lora)] text-[14px] italic text-white/60">{p.artist}</span>
        </span>
        <span className="font-[family-name:var(--font-poppins)] text-[16px] tabular-nums text-[#d4a030]">{usd(p.price)}</span>
      </div>
      <p className="mt-6 text-[12px] uppercase tracking-[0.16em] text-white/45">How you’ll get it</p>
      <div className="mt-2.5 grid gap-2.5">
        {opt(true, "Pick it up at SoundPlex", "Free. We’ll wrap it and have it ready.")}
        {opt(false, "Local delivery", "South Jersey and Philadelphia. We’ll quote it before you pay.")}
      </div>
      <div className="mt-6 flex items-baseline justify-between border-t border-white/[0.08] pt-4">
        <span className="text-[14px] text-white/60">Total</span>
        <span className="font-[family-name:var(--font-poppins)] text-[20px] tabular-nums text-white">
          {usd(p.price)}
          {!co.pickup && <span className="ml-1 text-[13px] text-white/50">+ delivery</span>}
        </span>
      </div>
      <button type="button" onClick={() => setCo({ ...co, done: true })} className="evp__btn group mt-5 w-full justify-center">
        Continue to secure checkout <ForwardArrow />
      </button>
    </div>
  );
}

function Fact({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <dt className="text-[11.5px] uppercase tracking-[0.16em] text-white/45">{label}</dt>
      <dd className={`mt-1 ${gold ? "text-[#e2b34e]" : "text-white"}`}>{value}</dd>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid h-9 w-9 place-items-center rounded-[6px] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white">
      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        {children}
      </svg>
    </button>
  );
}
