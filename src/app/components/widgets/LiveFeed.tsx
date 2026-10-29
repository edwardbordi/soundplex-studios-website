"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { roomOf, ticketsLeft, type VenueEvent } from "../../../lib/venue/data";
import { pushFeed, useFeed, type FeedItem } from "../../../lib/venue/feed";
import { useVenueSession } from "../../../lib/venue/session";

/**
 * LIVE AT HOLLOWBROOK — a quiet activity ticker, bottom-right (Ed, 2026-10-11).
 *
 * Small by default: one line that changes every few seconds. Tap to see the last few, drag the
 * handle to move it, minimise to a dot, or close it. What it shows depends on who's looking:
 *   members → members checking in / on their way / heading out (full name + photo), plus events
 *   everyone → tickets being bought (first name + last initial) and shows starting soon
 * Everything is simulated; nothing is real or sent.
 */

const GOLD = "#d4a030";
const BUYERS = ["Jess M.", "Daniel R.", "Kara P.", "Luis G.", "Megan T.", "Omar S.", "Beth W.", "Chris D.", "Ana V.", "Theo B."];
const POS_KEY = "sp-feed-pos";
/** How you left it (Ed, 2026-10-28): minimised stays minimised on every page until you open it
    again (this browser); closed stays closed for this visit (a new visit brings it back). */
const MODE_KEY = "sp-feed-mode";
const CLOSED_KEY = "sp-feed-closed";
type Pos = { right: number; bottom: number };

const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000);
  return s < 45 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : "earlier";
};
const until = (d: Date, now: number) => {
  const m = Math.round((d.getTime() - now) / 60_000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
};

export default function LiveFeed({ events }: { events: VenueEvent[] }) {
  const { member } = useVenueSession();
  const all = useFeed();
  const feed = all.filter((f) => member || f.audience === "all");
  const [mode, setMode] = useState<"ticker" | "open" | "dot" | "closed">("ticker");
  const [pos, setPos] = useState<Pos | null>(null);
  const [seen, setSeen] = useState(0);
  const drag = useRef<{ x: number; y: number; start: Pos } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // Remembered position (this browser only).
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore once on mount
      if (p && typeof p.right === "number") setPos(p);
    } catch {}
    // (restore once on mount)
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(CLOSED_KEY) ? "closed" : localStorage.getItem(MODE_KEY);
    } catch {}
    if (saved === "closed" || saved === "dot" || saved === "ticker") setMode(saved);
    // Phones, first time: start as a small "Live" dot, so it never sits on top of the page.
    else if (window.matchMedia("(max-width: 640px)").matches) setMode("dot");
  }, []);
  /** Change the mode and remember it (open counts as the ticker; closed lasts this visit). */
  const keep = (m: "ticker" | "open" | "dot" | "closed") => {
    setMode(m);
    try {
      if (m === "closed") sessionStorage.setItem(CLOSED_KEY, "1");
      else localStorage.setItem(MODE_KEY, m === "dot" ? "dot" : "ticker");
    } catch {}
  };

  // Everyone: tickets selling and shows coming up. (Members' comings and goings are pushed by the
  // calendar's "who's here" simulation.)
  useEffect(() => {
    let n = 0;
    const tick = () => {
      const now = Date.now();
      const soon = events.filter((e) => e.visibility === "public" && e.start.getTime() > now && e.start.getTime() - now < 36 * 3_600_000);
      const live = events.filter((e) => e.visibility === "public" && e.start.getTime() <= now && e.end.getTime() > now);
      // Made-up ticket buyers only ever for SAMPLE events — never for George's real ones.
      const ticketed = soon.filter((e) => /\$/.test(e.price) && e.sample);
      n++;
      if (n % 3 === 0 && soon[0]) {
        const e = soon[0];
        const left = ticketsLeft(e, roomOf(e.room).capacity, new Date(now));
        pushFeed({ audience: "all", kind: "soon", text: `${e.title} starts in ${until(e.start, now)}${left !== null && left >= 0 ? ` · ${left} tickets left` : ""}` });
      } else if (n % 5 === 0 && live[0]) {
        pushFeed({ audience: "all", kind: "live", text: `${live[0].title} is on now in ${roomOf(live[0].room).name}` });
      } else if (ticketed.length) {
        const e = ticketed[Math.floor(Math.random() * ticketed.length)];
        const q = 1 + Math.floor(Math.random() * 3);
        pushFeed({ audience: "all", kind: "ticket", who: { name: BUYERS[Math.floor(Math.random() * BUYERS.length)] }, text: `got ${q} ticket${q > 1 ? "s" : ""} to ${e.title}` });
      }
    };
    const first = window.setTimeout(tick, 2500);
    const t = window.setInterval(tick, 9000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [events]);

  const unread = Math.max(0, feed.length - seen);
  const latest = feed[0];

  /* Drag by the handle: the box keeps its distance from the bottom-right corner. */
  const onDown = (e: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { x: e.clientX, y: e.clientY, start: { right: window.innerWidth - r.right, bottom: window.innerHeight - r.bottom } };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const r = box.current?.getBoundingClientRect();
    if (!d || !r) return;
    const right = Math.min(window.innerWidth - r.width - 8, Math.max(8, d.start.right - (e.clientX - d.x)));
    const bottom = Math.min(window.innerHeight - r.height - 8, Math.max(8, d.start.bottom - (e.clientY - d.y)));
    setPos({ right, bottom });
  };
  const onUp = () => {
    if (drag.current && pos) {
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(pos));
      } catch {}
    }
    drag.current = null;
  };

  if (mode === "closed" || !latest) return null;
  const style = pos ? { right: pos.right, bottom: pos.bottom } : undefined;
  const place = pos ? "" : "right-4 bottom-24 sm:bottom-5 sm:right-5";

  if (mode === "dot") {
    return (
      <button
        type="button"
        onClick={() => (keep("open"), setSeen(feed.length))}
        aria-label={`Live at SoundPlex${unread ? `, ${unread} new` : ""}`}
        className={`vo-pop fixed z-[65] flex h-10 items-center gap-2 rounded-full border border-white/12 bg-[#121212]/95 pl-3 pr-3.5 text-[12px] text-white/70 shadow-xl backdrop-blur ${place}`}
        style={style}
      >
        <LiveDot />
        Live
        {unread > 0 && <span className="rounded-full bg-white/10 px-1.5 tabular-nums text-white/80">{unread}</span>}
      </button>
    );
  }

  return (
    <div
      ref={box}
      role="region"
      aria-label="Live at SoundPlex"
      aria-live="polite"
      className={`vo-pop fixed z-[65] w-[300px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[8px] border border-white/10 bg-[#121212]/95 text-white shadow-2xl backdrop-blur ${place}`}
      style={style}
    >
      {/* Handle: drag to move; the buttons minimise or close. */}
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className="flex cursor-grab touch-none select-none items-center gap-2 border-b border-white/[0.06] px-3 py-2 active:cursor-grabbing"
      >
        <LiveDot />
        <span className="flex-1 font-[family-name:var(--font-poppins)] text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
          Live at SoundPlex
        </span>
        <IconBtn label={mode === "open" ? "Show less" : "Show more"} onClick={() => (keep(mode === "open" ? "ticker" : "open"), setSeen(feed.length))}>
          <path d={mode === "open" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
        </IconBtn>
        <IconBtn label="Minimise" onClick={() => (keep("dot"), setSeen(feed.length))}>
          <path d="M6 12h12" />
        </IconBtn>
        <IconBtn label="Close" onClick={() => keep("closed")}>
          <path d="M7 7l10 10M17 7 7 17" />
        </IconBtn>
      </div>
      {mode === "open" ? (
        <ul className="vo-scroll max-h-[260px] divide-y divide-white/[0.05] overflow-y-auto">
          {feed.slice(0, 8).map((f) => (
            <Row key={f.id} f={f} />
          ))}
        </ul>
      ) : (
        <div key={latest.id} className="vo-fade">
          <Row f={latest} />
        </div>
      )}
    </div>
  );
}

function Row({ f }: { f: FeedItem }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      {f.who?.photo ? (
        <Image src={f.who.photo} alt="" width={56} height={56} className="h-7 w-7 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.06]" aria-hidden="true">
          <KindIcon kind={f.kind} />
        </span>
      )}
      <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-white/70">
        {f.who && <span className="font-medium text-white/90">{f.who.name} </span>}
        {f.text}
        <span className="block text-[11px] text-white/35">{ago(f.at)}</span>
      </p>
    </div>
  );
}

function KindIcon({ kind }: { kind: FeedItem["kind"] }) {
  const p =
    kind === "ticket"
      ? "M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V4H4zM10 4v12"
      : kind === "live"
        ? "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M5 12a7 7 0 0 1 14 0"
        : "M12 7v5l3 2M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18";
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white/55" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ background: GOLD }} />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: GOLD }} />
    </span>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded-[4px] text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
