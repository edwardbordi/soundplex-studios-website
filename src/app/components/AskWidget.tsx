"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { pushDataLayerEvent } from "./AnalyticsBeacon";
import ForwardArrow from "./ForwardArrow";
import { BookFlow, RoomBookFlow, TextFlow, type BookableRoom } from "./AskActions";

/**
 * "Ask us anything" — the floating question box, bottom-right (Ed, 2026-11-24, George asked for
 * the one on realiiz.com). The "Live at SoundPlex" ticker moved bottom-left to make room.
 *
 * Answers come from /api/ask, grounded in SoundPlex's facts and the approved (zoning) wording,
 * and it knows which page the visitor is on. A question it can't answer offers the short form
 * (/start) or "send it to George" (name + email to the GoHighLevel webhook).
 *
 * Hidden until the server says it's switched on (GET /api/ask → { enabled }: the
 * ANTHROPIC_API_KEY is set in Vercel), and never in Studio. Inside the members area it's the
 * members' help desk (Ed, 2026-11-24): how the area works, membership, and booking a room on its
 * own calendar once ROOM_CALENDAR_IDS is set (see lib/highlevel/ask.ts).
 */

/**
 * One question and its answer, and the page it was asked on. `action` opens booking or texting
 * under the answer (the bot offered it, or the visitor tapped the button); `done` is how that
 * ended ("Booked: Thursday…"), kept so the flow doesn't reopen on the next page.
 */
type Turn = {
  q: string;
  a: string;
  call: boolean;
  team: boolean;
  path?: string;
  action?: "book" | "text" | "room";
  /** For a room booking: which room the chat already knows ("" = let them pick). */
  room?: string;
  done?: string;
  fromButton?: boolean;
  /** When it was asked (ms), for the time dividers and the saved chat. */
  at?: number;
};

/** A quiet time line above a turn: at the top of the chat, and again after a 30-minute gap. */
const GAP_MS = 30 * 60 * 1000;
const dividerLabel = (ms: number) => {
  const d = new Date(ms);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return sameDay ? `Today · ${time}` : `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${time}`;
};

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

/** One row in the "+" menu: an outline icon and a label (gold for the main one, booking). */
function MenuItem({ onClick, icon, gold, children }: { onClick: () => void; icon: ReactNode; gold?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/[0.06] ${gold ? "text-[#e2b34e]" : "text-white/80 hover:text-white"}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 shrink-0 ${gold ? "" : "text-white/50"}`}>
        {icon}
      </svg>
      {children}
    </button>
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
function chipsFor(path: string, member = false): string[] {
  // Inside the members area: a help desk.
  if (member) {
    if (path.startsWith("/members/messages")) return ["How do I block someone?", "Who can message me?", "How do I turn off the chime?"];
    if (path.startsWith("/members/settings")) return ["How do I change my photo?", "What does the public wall show?", "How do notifications work?"];
    if (path.startsWith("/members/rooms") || path.startsWith("/members/calendar")) return ["Book a room for me", "What are the house rules?", "What's on this week?"];
    return ["How do I check in?", "Book a room for me", "Put the app on my phone"];
  }
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
  const [hlOn, setHlOn] = useState(false);
  const [me, setMe] = useState<{ firstName: string; lastName: string; phone: string } | null>(null);
  const [rooms, setRooms] = useState<BookableRoom[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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
    // Booking and texting George need HighLevel set up; only offer the buttons when it is.
    fetch("/api/ask/text")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setHlOn(Boolean(d?.enabled));
      })
      .catch(() => {});
    // Signed in to the members area? Then it's the members' help desk: their name and number for
    // the forms, and the rooms they can book here (those with a calendar).
    fetch("/api/ask/me")
      .then((r) => r.json())
      .then((d: { member?: { firstName: string; lastName: string; phone: string } | null; rooms?: BookableRoom[] }) => {
        if (!alive) return;
        setMe(d.member ?? null);
        setRooms(d.rooms ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Escape or a click outside closes it (the ⋯ menu first, if it's open).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menuRef.current) {
        setMenuOpen(false);
        setConfirmNew(false);
      } else setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && !(target as Element).closest?.("[aria-label^='More:']")) {
        setMenuOpen(false);
        setConfirmNew(false);
      }
      if (!panelRef.current?.contains(target)) setOpen(false);
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
    // Always the very bottom of the chat (Ed, 2026-11-24), "Book this room" included.
    const last = turns.at(-1);
    const flowNode = last?.action && !last.done ? el.querySelector<HTMLElement>(`[data-turn="${turns.length - 1}"]`) : null;
    const toBottom = () => el.scrollTo({ top: el.scrollHeight });
    toBottom();
    // Once more after layout settles (the panel's pop-in, wrapped answers).
    const raf = requestAnimationFrame(toBottom);
    // A form fills in after it opens (George's open times load a moment later): keep following it
    // to the bottom as it grows, for a couple of seconds or until they scroll themselves.
    let ro: ResizeObserver | undefined;
    let stop: number | undefined;
    const quit = () => {
      ro?.disconnect();
      el.removeEventListener("wheel", quit);
      el.removeEventListener("touchmove", quit);
    };
    if (flowNode && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(toBottom);
      ro.observe(flowNode);
      el.addEventListener("wheel", quit, { passive: true });
      el.addEventListener("touchmove", quit, { passive: true });
      stop = window.setTimeout(quit, 2500);
    }
    return () => {
      cancelAnimationFrame(raf);
      if (stop) window.clearTimeout(stop);
      quit();
    };
  }, [turns, busy, open, pathname]);

  // Signed in, inside the members area: the members' help desk.
  const memberMode = Boolean(me) && /^\/members(\/|$)/.test(pathname);
  const chips = chipsFor(pathname, memberMode);
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
      const d = (await res.json()) as { answer?: string; call?: boolean; team?: boolean; action?: "book" | "text" | "room" | null; room?: string };
      setTurns((t) => [
        ...t,
        {
          q: text,
          a: d.answer ?? "We couldn't fetch an answer just now, but George can.",
          call: Boolean(d.call ?? !d.answer),
          team: Boolean(d.team),
          path: pathname,
          at: Date.now(),
          ...(d.action ? { action: d.action } : {}),
          ...(d.action === "room" ? { room: d.room ?? "" } : {}),
        },
      ]);
    } catch {
      setTurns((t) => [...t, { q: text, a: "We couldn't fetch an answer just now, but George can.", call: true, team: false, path: pathname, at: Date.now() }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  /** ⋯ → New chat: clear it all (after "Start over?"), back to the opening screen. */
  const newChat = () => {
    pushDataLayerEvent("ask_new_chat", { page: pathname });
    setTurns([]);
    setQ("");
    setMenuOpen(false);
    setConfirmNew(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  /** ⋯ → Save this chat: a plain-text copy, downloaded. Nothing is sent anywhere. */
  const saveChat = () => {
    pushDataLayerEvent("ask_save_chat", { page: pathname });
    const now = new Date();
    const lines = [
      "SoundPlex Studios · Ask us anything",
      `Saved ${now.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`,
      "soundplexstudios.com · (609) 697-2077",
      "",
      ...turns.flatMap((t) => [
        `${t.at ? `[${new Date(t.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}] ` : ""}You: ${t.q}`,
        `SoundPlex: ${t.a}`,
        ...(t.done ? [`✓ ${t.done}`] : []),
        "",
      ]),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `soundplex-chat-${now.toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMenuOpen(false);
  };

  /** The buttons under the conversation: open booking or texting straight away, no question needed. */
  const startAction = (action: "book" | "text" | "room") => {
    pushDataLayerEvent(action === "book" ? "ask_book_open" : action === "room" ? "ask_room_open" : "ask_text_open", { page: pathname });
    const base = { call: false, team: false, path: pathname, action, fromButton: true, at: Date.now() };
    setTurns((t) => [
      ...t,
      action === "book"
        ? { ...base, q: "Book a time with George", a: "Here are George's open times. Pick one and you're booked." }
        : action === "room"
          ? { ...base, q: "Book a room", a: "Pick the room, how long, and a time. It books under your name.", room: "" }
          : { ...base, q: "Text George", a: "Leave your number and a message, and George will text you back." },
    ]);
  };
  /**
   * "Book this room" on the members Rooms page (Ed, 2026-11-24): open the chat straight into booking
   * that room. Its own calendar when it has one (ROOM_CALENDAR_IDS), otherwise a time with George.
   */
  const bookRoom = (room: string, name: string) => {
    // "Studio A", but "the WoodRoom" and "the SoundLounge".
    const ref = /^studio\b/i.test(name) ? name : `the ${name}`;
    setOpen(true);
    setMenuOpen(false);
    pushDataLayerEvent("ask_room_button", { page: pathname, room });
    const base = { call: false, team: false, path: pathname, fromButton: true, at: Date.now() };
    setTurns((t) => [
      ...t.filter((x) => !(x.action && !x.done && x.fromButton)), // one open form at a time
      rooms.some((r) => r.slug === room)
        ? { ...base, q: `Book ${ref}`, a: "Pick how long and a time. It books under your name.", action: "room" as const, room }
        : hlOn
          ? { ...base, q: `Book ${ref}`, a: `Room booking isn't in the chat just yet. Pick a time with George and he'll set ${ref} up for you.`, action: "book" as const }
          : { ...base, q: `Book ${ref}`, a: `Room booking isn't online just yet. Call or text George at (609) 697-2077 and he'll set ${ref} up for you.` },
    ]);
  };
  const bookRoomRef = useRef(bookRoom);
  useEffect(() => {
    bookRoomRef.current = bookRoom;
  });
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ room: string; name: string }>).detail;
      if (d?.room) bookRoomRef.current(d.room, d.name ?? "room");
    };
    window.addEventListener("sp:ask-book-room", on);
    return () => window.removeEventListener("sp:ask-book-room", on);
  }, []);

  /** A booking or text finished: keep how it ended in the conversation. */
  const finish = (i: number, summary: string) => setTurns((t) => t.map((x, j) => (j === i ? { ...x, done: summary } : x)));
  /** Changed their mind: close the form, back to the chat (the buttons and the question box return). */
  const cancel = (i: number) => {
    pushDataLayerEvent("ask_action_cancel", { page: pathname });
    // Opened with the button and closed again: take it out of the conversation altogether (a
    // "Here are George's open times" with nothing under it reads like something broke). Offered by
    // the bot: keep its answer, just close the form.
    setTurns((t) => (t[i]?.fromButton ? t.filter((_, j) => j !== i) : t.map((x, j) => (j === i ? { ...x, action: undefined } : x))));
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  // Is a booking or text form open right now? (Then the quick buttons step aside.)
  const flowOpen = turns.some((t) => t.action && !t.done);
  // "+" shows when it has something to offer: talking to George, or the chat's New chat / Save.
  const plusUseful = (hlOn && !flowOpen) || turns.length > 0;

  // Never in Studio (it has its own help). Whole path segments only.
  const hidden = /^\/admin(\/|$)/.test(pathname);
  if (!enabled || hidden) return null;

  return (
    <div ref={panelRef} className="sp-ask fixed bottom-4 right-4 z-[66] flex flex-col items-end sm:bottom-5 sm:right-5">
      {open && (
        // Taller while a booking or text form is open (and the subtitle steps aside), so the form fits.
        <div
          className={`vo-pop mb-3 flex ${flowOpen ? "max-h-[min(580px,80vh)]" : "max-h-[min(480px,70vh)]"} w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[10px] rounded-br-none border border-white/12 bg-[#121212]/97 text-white shadow-2xl backdrop-blur`}
        >
          <div className="relative flex items-start justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
            <div>
              <div className="font-[family-name:var(--font-poppins)] text-[14px] font-medium">{memberMode ? `Member help${me?.firstName ? `, ${me.firstName}` : ""}` : "Ask us anything"}</div>
              {/* Only on the opening screen: once you're chatting it's two lines of repeat. */}
              {turns.length === 0 && (
                <div className="mt-0.5 text-[11.5px] text-white/50">
                  {memberMode
                    ? `How the members area works, your membership${rooms.length ? ", and booking a room" : ""}. George follows up when it takes a person.`
                    : "Instant answers about the rooms, booking and membership. George follows up when it takes a person."}
                </div>
              )}
            </div>
            <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-1 text-white/45 transition-colors hover:text-white">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="mx-scroll relative flex-1 space-y-3 overflow-y-auto px-4 py-3" style={{ ["--mx-scroll-bg" as string]: "#121212" }}>
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
              <div key={i} data-turn={i}>
                {/* A quiet time line: at the top, and again after a 30-minute gap. */}
                {t.at && (i === 0 || !turns[i - 1].at || t.at - (turns[i - 1].at ?? 0) > GAP_MS) && (
                  <div className="mb-2.5 text-center text-[11px] tracking-[0.04em] text-white/35">{dividerLabel(t.at)}</div>
                )}
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
                  {t.action &&
                    !t.done &&
                    (t.action === "book" ? (
                      <BookFlow path={pathname} onDone={(s) => finish(i, s)} onCancel={() => cancel(i)} />
                    ) : t.action === "room" ? (
                      <RoomBookFlow
                        path={pathname}
                        room={t.room ?? ""}
                        rooms={rooms}
                        memberName={[me?.firstName, me?.lastName].filter(Boolean).join(" ")}
                        onDone={(s) => finish(i, s)}
                        onCancel={() => cancel(i)}
                      />
                    ) : (
                      <TextFlow path={pathname} onDone={(s) => finish(i, s)} onCancel={() => cancel(i)} prefill={me ? { firstName: me.firstName, phone: me.phone } : undefined} />
                    ))}
                  {t.done && (
                    <div className="mt-2 flex items-start gap-2 rounded-[8px] border border-[#4cc773]/35 bg-[#4cc773]/[0.08] px-3 py-2 text-[12.5px] text-white/85">
                      <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4cc773]" aria-hidden="true">
                        <path d="M3.5 8.3 6.5 11l6-6.2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t.done}
                    </div>
                  )}
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

          {/* Straight to a person, on every page (as realiiz.com's "Text Ed"): book a time with
              George from his real calendar, or have him text you back. Only when HighLevel is set up. */}
          {hlOn && !flowOpen && turns.length === 0 && (
            <div className="flex gap-2 border-t border-white/[0.08] px-3 py-2">
              <button
                type="button"
                onClick={() => startAction(memberMode && rooms.length ? "room" : "book")}
                className="flex-auto whitespace-nowrap rounded-[6px] border border-[#d4a030]/50 px-3 py-1.5 text-[12.5px] font-medium text-[#e2b34e] transition-colors hover:bg-[#d4a030]/10"
              >
                {memberMode && rooms.length ? "Book a room" : "Book a time with George"}
              </button>
              <button
                type="button"
                onClick={() => startAction("text")}
                className="flex-auto whitespace-nowrap rounded-[6px] border border-white/15 px-3 py-1.5 text-[12.5px] text-white/75 transition-colors hover:border-white/35 hover:text-white"
              >
                Text George
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(q);
            }}
            className="relative border-t border-white/[0.08] px-2.5 py-2"
          >
            {/* "+" (Ed, 2026-11-24, like a chat app's): everything that isn't a question, in one
                place: talk to George, and the chat's own New chat / Save. Keeps the panel clean. */}
            {menuOpen && (
              <div ref={menuRef} role="menu" className="vo-pop absolute bottom-[calc(100%-4px)] left-2.5 z-10 w-60 overflow-hidden rounded-[8px] border border-white/12 bg-[#1b1b1b] py-1 text-[13px] shadow-2xl">
                {confirmNew ? (
                  <div className="px-3 py-2.5">
                    <div className="text-white/80">Start over? This clears the chat.</div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <button type="button" onClick={newChat} className="rounded-[6px] bg-[#d4a030] px-3 py-1.5 text-[12.5px] font-semibold text-black">
                        Start over
                      </button>
                      <button type="button" onClick={() => setConfirmNew(false)} className="text-[12.5px] text-white/50 hover:text-white">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {memberMode && rooms.length > 0 && !flowOpen && (
                      <MenuItem
                        onClick={() => {
                          setMenuOpen(false);
                          startAction("room");
                        }}
                        gold
                        icon={<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M15 12h.01" />}
                      >
                        Book a room
                      </MenuItem>
                    )}
                    {hlOn && !flowOpen && (
                      <>
                        <MenuItem
                          onClick={() => {
                            setMenuOpen(false);
                            startAction("book");
                          }}
                          gold={!(memberMode && rooms.length > 0)}
                          icon={<path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />}
                        >
                          Book a time with George
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            setMenuOpen(false);
                            startAction("text");
                          }}
                          icon={<path d="M5 18l-1 3 3.5-1.5A9 9 0 1 0 3 12a8.9 8.9 0 0 0 2 6Z" />}
                        >
                          Text George
                        </MenuItem>
                      </>
                    )}
                    {turns.length > 0 && (
                      <>
                        {hlOn && !flowOpen && <div className="my-1 border-t border-white/[0.08]" />}
                        <MenuItem onClick={() => setConfirmNew(true)} icon={<path d="M12 5v14M5 12h14" />}>
                          New chat
                        </MenuItem>
                        <MenuItem onClick={saveChat} icon={<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />}>
                          Save this chat
                        </MenuItem>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
            {/* One rounded box around the field and the send button, gold while typing. */}
            <div className="flex items-center gap-1.5 rounded-full border border-transparent py-1 pl-1 pr-1 transition-colors focus-within:border-[#d4a030]/70">
              {plusUseful && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen((m) => !m);
                    setConfirmNew(false);
                  }}
                  aria-label="More: book a time, text George, new chat, save this chat"
                  aria-expanded={menuOpen}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${menuOpen ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`h-[18px] w-[18px] transition-transform duration-200 ${menuOpen ? "rotate-45" : ""}`}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                maxLength={300}
                placeholder="Type your question…"
                style={{ outline: "none", boxShadow: "none" }}
                className="min-w-0 flex-1 bg-transparent px-1.5 text-[16px] text-white placeholder:text-white/35 focus:outline-none sm:text-[13.5px]"
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
