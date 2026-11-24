"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { pushDataLayerEvent } from "./AnalyticsBeacon";
import ForwardArrow from "./ForwardArrow";

/**
 * "Ask us anything" — the floating question box, bottom-right (Ed, 2026-11-24, George asked for
 * the one on realiiz.com). The "Live at SoundPlex" ticker moved bottom-left to make room.
 *
 * Answers come from /api/ask, grounded in SoundPlex's facts and the approved (zoning) wording,
 * and it knows which page the visitor is on. A question it can't answer offers the short form
 * (/start) or "send it to George" (name + email to the GoHighLevel webhook).
 *
 * Hidden until the server says it's switched on (GET /api/ask → { enabled }: the
 * ANTHROPIC_API_KEY is set in Vercel), and never in the members area or Studio.
 */

/** One question and its answer, and the page it was asked on. */
type Turn = { q: string; a: string; call: boolean; team: boolean; path?: string };

const GOLD = "#d4a030";

/**
 * The conversation follows you round the site (Ed, 2026-11-24): what's been asked, whether the
 * panel is open and anything half-typed are kept for this visit (sessionStorage, this tab), so a
 * new page, a reload or the widget re-mounting never loses them. A new visit starts fresh.
 */
const KEY = { turns: "sp-ask-turns", open: "sp-ask-open", draft: "sp-ask-draft", on: "sp-ask-enabled" } as const;
function load<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** "Send it to George": the dead-end question becomes a lead with an email to reply to. */
function TeamFollowup({ q, path }: { q: string; path: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");
  if (state === "done")
    return (
      <div className="mt-2 text-[12.5px] text-white/60">
        Got it{name.trim() ? `, ${name.trim()}` : ""}. George will reply at <span className="font-medium text-white">{email}</span>.
      </div>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!email.trim() || state === "busy") return;
        setState("busy");
        pushDataLayerEvent("ask_widget_followup", { page: path });
        try {
          const r = await fetch("/api/ask", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ q, path, followupEmail: email.trim(), followupName: name.trim() }),
          });
          const d = (await r.json()) as { ok?: boolean };
          setState(d.ok ? "done" : "err");
        } catch {
          setState("err");
        }
      }}
      className="mt-2"
    >
      <div className="text-[12.5px] text-white/60">Want George to answer this one? Leave your name and email.</div>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name"
          maxLength={60}
          className="w-[104px] shrink-0 rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-[16px] text-white placeholder:text-white/35 focus:border-[#d4a030]/70 focus:outline-none sm:text-[12.5px]"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          maxLength={120}
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-[16px] text-white placeholder:text-white/35 focus:border-[#d4a030]/70 focus:outline-none sm:text-[12.5px]"
        />
        <button
          type="submit"
          disabled={state === "busy" || !email.trim()}
          className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-black transition-opacity disabled:opacity-35"
          style={{ background: GOLD }}
        >
          {state === "busy" ? "Sending…" : "Send"}
        </button>
      </div>
      {state === "err" && <div className="mt-1 text-[12px] text-white/50">Couldn&apos;t send it just now. Try again in a moment.</div>}
    </form>
  );
}

/* Answers mention site paths ("the short form at /start"): make them real links. Longest first. */
const LINKABLE = [
  "/rooms/wood-room",
  "/rooms/studio-a",
  "/rooms/sound-lounge",
  "/rooms#podcast",
  "/studio-productions",
  "/contact-us",
  "/membership",
  "/websites",
  "/gallery",
  "/rooms",
  "/start",
  "/about",
  "/blog",
] as const;
const PATH_RE = new RegExp(`(${LINKABLE.join("|")})(?=[\\s.,;:!?)*'"\\]]|$)`, "g");

/** Plain words for a path, for the links and the "Now on …" line. */
const PAGE_NAMES: Record<string, string> = {
  "/": "the home page",
  "/rooms": "the rooms",
  "/rooms/wood-room": "the WoodRoom",
  "/rooms/studio-a": "Studio A",
  "/rooms/sound-lounge": "the SoundLounge",
  "/rooms#podcast": "podcasts",
  "/studio-productions": "Studio Productions",
  "/membership": "membership",
  "/websites": "websites",
  "/about": "about SoundPlex",
  "/contact-us": "contact",
  "/gallery": "the gallery",
  "/start": "the short form",
  "/blog": "the blog",
};
const pageName = (path: string) => PAGE_NAMES[path] ?? (path.startsWith("/blog/") ? "this post" : path.startsWith("/studio-productions/") ? "this production" : "this page");

/* Links in answers move the page without a reload (next/link), so the panel stays open and the
   conversation carries on there. */
function linkify(text: string): ReactNode[] {
  return text.split(PATH_RE).map((part, i) =>
    (LINKABLE as readonly string[]).includes(part) ? (
      <Link key={i} href={part} className="group inline-flex items-center gap-0.5 font-medium text-[#e2b34e] underline decoration-[#d4a030]/40 underline-offset-2 hover:decoration-[#d4a030] [&_svg]:h-[1.05em] [&_svg]:w-[1.05em]">
        {part}
        <ForwardArrow />
      </Link>
    ) : (
      part
    ),
  );
}

/** The suggested questions for the page you're on (anything can still be asked from anywhere). */
function chipsFor(path: string): string[] {
  if (path === "/rooms/wood-room") return ["What can I film on the stage?", "What does the WoodRoom cost?", "How do I book it?"];
  if (path === "/rooms/studio-a") return ["Can I record with an engineer?", "What gear is in Studio A?", "What does it cost?"];
  if (path === "/rooms/sound-lounge") return ["What's the SoundLounge good for?", "What does it cost?", "Can I shoot a podcast here?"];
  if (path.startsWith("/rooms")) return ["Which room is right for me?", "How much is a podcast session?", "What's the minimum booking?"];
  if (path.startsWith("/membership")) return ["What do members get?", "How much is membership?", "Can I see the place first?"];
  if (path.startsWith("/studio-productions")) return ["What's being made here?", "Can I sit in on a recording?", "How do I produce my own?"];
  if (path.startsWith("/websites")) return ["What does a website cost?", "How does 'pay when you love it' work?", "What's included?"];
  if (path.startsWith("/start")) return ["Which room should I pick?", "What's the minimum booking?", "When will I hear back?"];
  if (path.startsWith("/about") || path.startsWith("/contact")) return ["What are your hours?", "Where do I park?", "Can I book a tour?"];
  if (path.startsWith("/gallery")) return ["Is the art for sale?", "Who are the artists?", "Can I show my work here?"];
  return ["What can I book a room for?", "How much is a podcast session?", "What is the Plex Collective?"];
}

export default function AskWidget() {
  const pathname = usePathname() ?? "/";
  // Client-only (AskWidgetLazy loads it with ssr: false), so reading the session here is safe.
  const [enabled, setEnabled] = useState(() => load<boolean>(KEY.on, false));
  const [open, setOpen] = useState(() => load<boolean>(KEY.open, false));
  const [q, setQ] = useState(() => load<string>(KEY.draft, ""));
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<Turn[]>(() => load<Turn[]>(KEY.turns, []).slice(-20));
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => save(KEY.turns, turns.slice(-20)), [turns]);
  useEffect(() => save(KEY.open, open), [open]);
  useEffect(() => save(KEY.draft, q), [q]);

  // One small GET on mount: stays hidden unless the server has the API key. Remembered for the
  // visit, so on the next page the button is there straight away instead of popping in.
  useEffect(() => {
    let alive = true;
    fetch("/api/ask")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setEnabled(Boolean(d?.enabled));
        save(KEY.on, Boolean(d?.enabled));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Escape or a click outside closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // Always show the bottom of the conversation: on a new answer, when the panel opens (a long
  // conversation kept from earlier pages), and on a new page, so that page's questions are in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const toBottom = () => el.scrollTo({ top: el.scrollHeight });
    toBottom();
    // Once more after layout settles (the panel's pop-in, wrapped answers).
    const raf = requestAnimationFrame(toBottom);
    return () => cancelAnimationFrame(raf);
  }, [turns, busy, open, pathname]);

  const chips = chipsFor(pathname);
  // Moved to another page mid-conversation: offer that page's questions under it.
  const lastPath = turns.at(-1)?.path;
  const newPage = turns.length > 0 && !busy && lastPath !== undefined && lastPath !== pathname;

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setQ("");
    setBusy(true);
    pushDataLayerEvent("ask_widget_question", { page: pathname });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: text, path: pathname, history: turns.slice(-4).map((t) => ({ q: t.q, a: t.a })) }),
      });
      const d = (await res.json()) as { answer?: string; call?: boolean; team?: boolean };
      setTurns((t) => [...t, { q: text, a: d.answer ?? "We couldn't fetch an answer just now, but George can.", call: Boolean(d.call ?? !d.answer), team: Boolean(d.team), path: pathname }]);
    } catch {
      setTurns((t) => [...t, { q: text, a: "We couldn't fetch an answer just now, but George can.", call: true, team: false, path: pathname }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  // Not in the members area (it has its own messages) or in Studio. Whole path segments only:
  // "/membership" starts with the letters "/members" but is a public page.
  const hidden = /^\/(members|admin)(\/|$)/.test(pathname);
  if (!enabled || hidden) return null;

  return (
    <div ref={panelRef} className="sp-ask fixed bottom-4 right-4 z-[66] flex flex-col items-end sm:bottom-5 sm:right-5">
      {open && (
        <div className="vo-pop mb-3 flex max-h-[min(480px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[10px] rounded-br-none border border-white/12 bg-[#121212]/97 text-white shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
            <div>
              <div className="font-[family-name:var(--font-poppins)] text-[14px] font-medium">Ask us anything</div>
              <div className="mt-0.5 text-[11.5px] text-white/50">Instant answers about the rooms, booking and membership. George follows up when it takes a person.</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="mt-0.5 rounded-md p-1 text-white/45 transition-colors hover:text-white">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="mx-scroll flex-1 space-y-3 overflow-y-auto px-4 py-3" style={{ ["--mx-scroll-bg" as string]: "#121212" }}>
            {turns.length === 0 && !busy && (
              <div>
                <div className="text-[12px] text-white/45">People often ask:</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => ask(c)}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-left text-[12.5px] text-white/70 transition-colors hover:border-[#d4a030]/60 hover:text-[#e2b34e]"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i}>
                <div className="ml-8 rounded-xl rounded-br-sm bg-[#d4a030]/12 px-3 py-2 text-[13px] text-white">{t.q}</div>
                <div className="mr-4 mt-2 text-[13.5px] leading-relaxed text-white/75">
                  {linkify(t.a)}
                  {t.call && (
                    <Link href="/start?from=ask" className="group mt-1.5 flex w-fit items-center gap-1 font-medium text-[#e2b34e] hover:underline">
                      Tell us what you need
                      <ForwardArrow />
                    </Link>
                  )}
                  {t.team && <TeamFollowup q={t.q} path={pathname} />}
                </div>
              </div>
            ))}
            {newPage && (
              <div className="border-t border-white/[0.08] pt-3">
                <div className="text-[12px] text-white/45">Now on {pageName(pathname)}. You could ask:</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => ask(c)}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-left text-[12.5px] text-white/70 transition-colors hover:border-[#d4a030]/60 hover:text-[#e2b34e]"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {busy && (
              <div className="flex items-center gap-2 text-[12.5px] text-white/50">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: GOLD }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: GOLD }} />
                </span>
                Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(q);
            }}
            className="border-t border-white/[0.08] px-2.5 py-2"
          >
            {/* One rounded box around the field and the send button, gold while typing. */}
            <div className="flex items-center gap-2 rounded-full border border-transparent py-1 pl-2.5 pr-1 transition-colors focus-within:border-[#d4a030]/70">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                maxLength={300}
                placeholder="Type your question…"
                style={{ outline: "none", boxShadow: "none" }}
                className="min-w-0 flex-1 bg-transparent text-[16px] text-white placeholder:text-white/35 focus:outline-none sm:text-[13.5px]"
              />
              <button
                type="submit"
                disabled={busy || !q.trim()}
                aria-label="Ask"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black transition-opacity disabled:opacity-35"
                style={{ background: GOLD }}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* The button: a gold speech bubble, its pinched corner pointing into the page. */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) pushDataLayerEvent("ask_widget_open", { page: pathname });
        }}
        aria-expanded={open}
        aria-label="Ask us anything"
        className="relative flex h-12 w-12 items-center justify-center rounded-[20px] rounded-br-[6px] text-black shadow-lg transition-transform duration-300 ease-out hover:scale-[1.04]"
        style={{ background: GOLD }}
      >
        {/* The "live" dot, as on realiiz.com: the thing that answers IS there 24/7. The members
            area's green, with a slow soft ping behind it. */}
        <span aria-hidden="true" className="absolute right-0 top-0 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4cc773] opacity-60" style={{ animationDuration: "3s" }} />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4cc773]" />
        </span>
        <span className="relative font-[family-name:var(--font-poppins)] text-[11px] font-semibold tracking-[0.14em]">ASK</span>
      </button>
    </div>
  );
}
