"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import ForwardArrow from "./ForwardArrow";
import { eventsAround, fromCalItems, MEMBERS, roomOf, ROOMS, type VenueEvent } from "../../lib/venue/data";
import { buyTickets, setSession, useVenueSession } from "../../lib/venue/session";
import { membersConfigured } from "../../lib/members/env";
import type { CalItem } from "../../lib/events/constants";

/**
 * The two mega menus in the header (Ed, 2026-10-28 — "something like the mega menu on the
 * fencing site"): ROOMS (each room, a big photo that follows your hover, what's in it right
 * now, Book a room) and STUDIO PRODUCTIONS (the page's sections + the next show, ticket button
 * and all). Everything else in the nav stays a plain link.
 *
 * Behavior: opens after a short hover pause (crossing the nav never pops it), or on click /
 * Enter of the chevron; closes on leave, Esc, or a click outside. The label itself is still a
 * link to the page. Phones don't get these (MobileMenu has the same content as accordions).
 * Live bits read the same calendar the site's live widget uses (passed down from the layout's
 * Nav), so this adds no data fetching.
 */

const OPEN_DELAY = 140;
const CLOSE_DELAY = 180;

/* ── shared live data ─────────────────────────────────────────────────────── */

const subscribe = (cb: () => void) => {
  const t = window.setInterval(cb, 60_000);
  return () => window.clearInterval(t);
};
const minuteNow = () => Math.floor(Date.now() / 60_000);

export function useVenueNow(items: CalItem[], showSamples: boolean) {
  const minute = useSyncExternalStore(subscribe, minuteNow, () => 0);
  const day = minute ? new Date(minute * 60_000).toDateString() : "";
  const events = useMemo(
    () =>
      minute
        ? [...fromCalItems(items), ...(showSamples ? eventsAround(new Date(minute * 60_000)) : [])].sort((a, b) => a.start.getTime() - b.start.getTime())
        : [],
    [day, items, showSamples], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return { now: minute ? new Date(minute * 60_000) : null, events };
}

const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** One line on what a room is doing right now. */
export function roomStatus(room: string, events: VenueEvent[], now: Date | null): { live: boolean; text: string } {
  if (!now) return { live: false, text: "" };
  const here = events.filter((e) => e.room === room);
  const on = here.find((e) => e.start <= now && e.end > now);
  if (on) return { live: true, text: on.visibility === "public" ? `${on.title} · till ${time(on.end)}` : `In use till ${time(on.end)}` };
  const next = here.find((e) => e.start > now && sameDay(e.start, now));
  if (next) return { live: false, text: next.visibility === "public" ? `Free now · ${next.title} at ${time(next.start)}` : `Free now · booked from ${time(next.start)}` };
  return { live: false, text: "Free the rest of the day" };
}

/** The show to sell: on now, else the next public, ticketed-or-not show (not drop-in hours). */
export function nextShow(events: VenueEvent[], now: Date | null) {
  if (!now) return null;
  const shows = events.filter((e) => e.visibility === "public" && !e.ambient && e.end > now);
  return shows.find((e) => e.start <= now) ?? shows[0] ?? null;
}
export const showLabel = (e: VenueEvent, now: Date) =>
  e.start <= now ? "On now" : sameDay(e.start, now) ? (e.start.getHours() >= 17 ? "Up next tonight" : "Up next today") : "Next show";
const showWhen = (e: VenueEvent, now: Date) => {
  const day = sameDay(e.start, now) ? (e.start.getHours() >= 17 ? "Tonight" : "Today") : e.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${day} · ${time(e.start)}`;
};

/** Room pages + the podcast set-up. Taglines from content/rooms/*.mdx. */
const ROOM_MENU = [
  { id: "wood-room", href: "/rooms/wood-room", tagline: "The stage. Eighty people, four feet away." },
  { id: "studio-a", href: "/rooms/studio-a", tagline: "Victor’s old Studio B, in the round." },
  { id: "sound-lounge", href: "/rooms/sound-lounge", tagline: "A 1920s speakeasy, with a piano bar." },
] as const;
const PODCAST = { href: "/rooms#podcast", photo: "/rooms/podcast-temp.webp", tagline: "Three cameras, mics and an operator, set up in any free room." };

/* ── the dropdown shell ───────────────────────────────────────────────────── */

function Mega({ label, href, children }: { label: string; href: string; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();

  const later = (v: boolean, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(v), ms);
  };
  // A plain state change, so it can be handed to the panel's contents during render (React
  // won't allow a function that touches a ref there). Any pending hover timer is cleared by the
  // effect below whenever the menu closes.
  const close = () => setOpen(false);
  useEffect(() => {
    if (!open) clearTimeout(timer.current);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && close();
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    // Not `relative`: the panel hangs off the header itself, full width under it.
    <div
      ref={wrap}
      className="flex items-center"
      onMouseEnter={() => later(true, OPEN_DELAY)}
      onMouseLeave={() => later(false, CLOSE_DELAY)}
    >
      <Link href={href} className={`nav-link ${open ? "text-[#d4a030]" : ""}`} onClick={close}>
        {label}
      </Link>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label} menu`}
        onClick={() => {
          clearTimeout(timer.current);
          setOpen((v) => !v);
        }}
        className="-ml-1 grid h-7 w-6 place-items-center text-white/55 transition-colors hover:text-[#d4a030]"
      >
        <svg aria-hidden width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180 text-[#d4a030]" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {/* The page behind dims and blurs while the menu is open, so the menu reads as the one
          thing on screen (Ed). In a portal under the header (z 55 < header 60). */}
      {open &&
        createPortal(
          <div aria-hidden className="vo-fade fixed inset-0 z-[55] bg-black/60 backdrop-blur-[6px]" />,
          document.body,
        )}
      {open && (
        <div id={id} className="vo-pop absolute inset-x-0 top-full z-[70] px-6 pt-2">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[10px] border border-white/[0.1] bg-[#0b0b0b] shadow-[0_28px_60px_-20px_rgba(0,0,0,0.9)]">
            {children(close)}
          </div>
        </div>
      )}
    </div>
  );
}

const EYEBROW = "font-[family-name:var(--font-poppins)] text-[10.5px] font-medium uppercase tracking-[0.18em]";
// `group` so the arrow inside nudges right on hover, like every other arrow button on the site.
const GOLD_BTN =
  "group inline-flex items-center gap-2 rounded-[4px] bg-[#d4a030] px-4 py-2.5 font-[family-name:var(--font-poppins)] text-[13px] font-semibold text-black transition-colors hover:bg-[#e2b34e]";
const QUIET = "group inline-flex items-center gap-1.5 text-[13px] text-white/70 transition-colors hover:text-[#e2b34e]";

/* ── Rooms ────────────────────────────────────────────────────────────────── */

export function RoomsMega({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const { now, events } = useVenueNow(items, showSamples);
  const [active, setActive] = useState<string>("wood-room");
  const room = active === "podcast" ? null : roomOf(active);
  const status = room ? roomStatus(room.id, events, now) : null;
  const free = ROOMS.filter((r) => !roomStatus(r.id, events, now).live);

  return (
    <Mega label="Rooms" href="/rooms">
      {(close) => (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <ul className="p-3">
              {ROOM_MENU.map((m) => {
                const r = roomOf(m.id);
                const st = roomStatus(r.id, events, now);
                const on = active === r.id;
                return (
                  <li key={r.id}>
                    <Link
                      href={m.href}
                      onClick={close}
                      onMouseEnter={() => setActive(r.id)}
                      onFocus={() => setActive(r.id)}
                      className={`group flex items-center gap-3 rounded-[6px] px-4 py-3 transition-colors ${on ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={`block font-[family-name:var(--font-poppins)] text-[15px] font-medium ${on ? "text-[#d4a030]" : "text-white"}`}>{r.name}</span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-white/50">
                          Holds {r.capacity}
                          {st.text && <> · <span className={st.live ? "text-white/80" : ""}>{st.text}</span></>}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href={PODCAST.href}
                  onClick={close}
                  onMouseEnter={() => setActive("podcast")}
                  onFocus={() => setActive("podcast")}
                  className={`group flex items-center gap-3 rounded-[6px] px-4 py-3 transition-colors ${active === "podcast" ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className={`block font-[family-name:var(--font-poppins)] text-[15px] font-medium ${active === "podcast" ? "text-[#d4a030]" : "text-white"}`}>Podcast</span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-white/50">Any free room · $250/hr</span>
                  </span>
                </Link>
              </li>
            </ul>

            {/* The hovered room, big. */}
            <div className="relative min-h-[300px]">
              <Image
                key={active}
                src={room ? room.photo : PODCAST.photo}
                alt=""
                fill
                sizes="560px"
                className="vo-pop object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0b0b0b_0%,rgba(11,11,11,0.35)_22%,transparent_45%),linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.35)_45%,transparent_70%)]" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className={`${EYEBROW} text-[#d4a030]`}>{room ? room.name : "Podcast"}</p>
                <p className="mt-1.5 max-w-[26rem] font-[family-name:var(--font-poppins)] text-[19px] font-medium leading-snug text-white">
                  {room ? ROOM_MENU.find((m) => m.id === room.id)?.tagline : PODCAST.tagline}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                  {room ? (
                    <>
                      <span className="rounded-[3px] bg-white/[0.12] px-2.5 py-1 text-white/85 backdrop-blur">Holds {room.capacity}</span>
                      {status?.text && (
                        <span className="flex items-center gap-1.5 rounded-[3px] bg-black/50 px-2.5 py-1 text-white/85 backdrop-blur">
                          <span className={`h-1.5 w-1.5 rounded-full ${status.live ? "animate-pulse bg-[#d4a030]" : "bg-white/40"}`} />
                          {status.text}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="rounded-[3px] bg-white/[0.12] px-2.5 py-1 text-white/85 backdrop-blur">$250/hr · up to 6 at the table</span>
                      {now && (
                        <span className="rounded-[3px] bg-black/50 px-2.5 py-1 text-white/85 backdrop-blur">
                          {free.length ? `Free now: ${free.map((r) => r.short).join(" · ")}` : "Every room’s busy right now"}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {/* Book sits WITH the room it books (Ed): straight right from a room in the list
                    lands here without crossing the others, so the label holds still. */}
                <Link
                  href={active === "podcast" ? "/start?path=room&use=podcast" : `/start?path=room&room=${active}`}
                  onClick={close}
                  className={`${GOLD_BTN} mt-4`}
                >
                  {active === "podcast" ? "Book a session" : `Book ${room?.name}`}
                  <ForwardArrow />
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.08] px-7 py-4">
            <Link href="/rooms" onClick={close} className={QUIET}>
              Compare all rooms <ForwardArrow />
            </Link>
            <Link href="/start?path=collective&from=nav" onClick={close} className={`${QUIET} ml-auto`}>
              Rather see it first? Book a tour <ForwardArrow />
            </Link>
          </div>
        </>
      )}
    </Mega>
  );
}

/* ── Membership ───────────────────────────────────────────────────────────── */

const MEMBER_LINKS = [
  { href: "/membership", name: "How it works", sub: "Membership, the Creator Blueprint, then Amplify" },
  { href: "/membership#wall", name: "Meet the members", sub: "Who’s in the Collective and how they connect" },
  { href: "/studio-productions#members", name: "Who’s here now", sub: "Members in the building, room by room" },
  { href: "/start?path=collective&from=nav", name: "Book a tour", sub: "Membership starts with a visit. The tour is on us." },
];

export function MembershipMega() {
  const s = useVenueSession();
  const faces = MEMBERS.slice(0, 6);
  const logIn = () => {
    // Real members: straight to sign-in (then the members area). Preview: the demo login on Studio Productions.
    if (membersConfigured() || document.getElementById("members")) setSession({ loginOpen: true });
    else window.location.assign("/studio-productions#members");
  };
  // Signed in, "who's here" is the members area; signed out, the teaser on Studio Productions.
  const whoHref = s.member && membersConfigured() ? "/members" : "/studio-productions#members";
  const links = MEMBER_LINKS.map((l) => (l.href === "/studio-productions#members" ? { ...l, href: whoHref } : l));

  return (
    <Mega label="Membership" href="/membership">
      {(close) => (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <ul className="p-3">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={close} className="group block rounded-[6px] px-4 py-3 transition-colors hover:bg-white/[0.05]">
                    <span className="block font-[family-name:var(--font-poppins)] text-[15px] font-medium text-white transition-colors group-hover:text-[#d4a030]">{l.name}</span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-white/50">{l.sub}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Who's here: members see the faces; everyone else sees them blurred, and the way in. */}
            <div className="relative flex min-h-[300px] flex-col justify-end overflow-hidden p-6">
              <Image src="/flythrough/states/state-C-2.jpg" alt="" fill sizes="560px" className="object-cover opacity-45" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0b0b0b_0%,rgba(11,11,11,0.4)_25%,transparent_50%),linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.5)_55%,rgba(0,0,0,0.2)_100%)]" />
              <div className="relative">
                <p className={`${EYEBROW} text-[#d4a030]`}>{s.member ? `Welcome back${s.name ? `, ${s.name}` : ""}` : "The Plex Collective"}</p>
                <div className={`mt-3 flex -space-x-2.5 ${s.member ? "" : "blur-[3px]"}`} aria-hidden>
                  {faces.map((m) => (
                    <Image key={m.name} src={m.photo} alt="" width={80} height={80} className="h-10 w-10 rounded-full object-cover ring-2 ring-black" />
                  ))}
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1c1c1c] text-[12px] font-semibold text-white/80 ring-2 ring-black">+</span>
                </div>
                <p className="mt-3 max-w-[24rem] font-[family-name:var(--font-poppins)] text-[18px] font-medium leading-snug text-white">
                  {s.member ? "See who’s in the building, check in, and say you’re on your way." : "Members see who’s in the building, check in, and meet the people making things here."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                  {s.member ? (
                    <Link href={whoHref} onClick={close} className={GOLD_BTN}>
                      See who’s here <ForwardArrow />
                    </Link>
                  ) : (
                    <>
                      <Link href="/start?path=collective&from=nav" onClick={close} className={GOLD_BTN}>
                        Book your free tour <ForwardArrow />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          logIn();
                        }}
                        className={QUIET}
                      >
                        Members’ sign in <ForwardArrow />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.08] px-7 py-4">
            <span className="text-[13px] text-white/55">You have a home. You have work. This is your third place.</span>
            <Link href="/membership" onClick={close} className={`${QUIET} ml-auto`}>
              How the Collective works <ForwardArrow />
            </Link>
          </div>
        </>
      )}
    </Mega>
  );
}

/* ── Studio Productions ───────────────────────────────────────────────────── */

const SECTIONS = [
  { href: "/studio-productions#tonight", name: "Tonight", sub: "What’s on in every room, right now" },
  { href: "/studio-productions#calendar", name: "Calendar", sub: "Month, week, day and room by room" },
  { href: "/studio-productions#past", name: "Past productions", sub: "Shows, tapings and screenings we’ve hosted" },
  // Members / who's here moved to the Membership menu (Ed, 2026-10-28).
  { href: "/start?path=room&from=productions", name: "Produce your own", sub: "Book a room for your show, taping or screening" },
];

export function ProductionsMega({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const { now, events } = useVenueNow(items, showSamples);
  const show = nextShow(events, now);
  const inUse = ROOMS.filter((r) => roomStatus(r.id, events, now).live).length;

  return (
    <Mega label="Studio Productions" href="/studio-productions">
      {(close) => (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <ul className="p-3">
              {SECTIONS.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    onClick={() => {
                      close();
                      // Already on Studio Productions: tell the page which section (and, for
                      // Calendar, which view) to show; a same-page hash link may not say so itself.
                      const hash = s.href.split("#")[1];
                      if (hash && window.location.pathname === "/studio-productions") window.dispatchEvent(new CustomEvent("sp:view", { detail: hash }));
                    }}
                    className="group flex items-center gap-3 rounded-[6px] px-4 py-3 transition-colors hover:bg-white/[0.05]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-[family-name:var(--font-poppins)] text-[15px] font-medium text-white transition-colors group-hover:text-[#d4a030]">{s.name}</span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-white/50">{s.sub}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* The next show, ready to buy. */}
            <div className="relative min-h-[300px]">
              {show && now ? (
                <>
                  <Image src={roomOf(show.room).photo} alt="" fill sizes="560px" className="object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0b0b0b_0%,rgba(11,11,11,0.35)_22%,transparent_45%),linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.45)_50%,transparent_75%)]" />
                  <span className={`${EYEBROW} absolute left-5 top-5 rounded-[4px] bg-[#d4a030] px-2.5 py-1 text-black`}>{showLabel(show, now)}</span>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-[12.5px] text-white/60">{roomOf(show.room).name}</p>
                    <p className="mt-1 truncate font-[family-name:var(--font-poppins)] text-[21px] font-semibold leading-tight text-white">{show.title}</p>
                    <p className="mt-1 text-[13.5px] text-[#d4a030]">
                      {showWhen(show, now)}
                      {show.price ? ` · ${show.price}` : ""}
                    </p>
                    <div className="mt-4 flex items-center gap-5">
                      {show.price && show.price !== "Free" ? (
                        <button
                          type="button"
                          onClick={() => {
                            close();
                            buyTickets(show);
                          }}
                          className={GOLD_BTN}
                        >
                          Get tickets <ForwardArrow />
                        </button>
                      ) : null}
                      <Link href={show.slug ? `/studio-productions/${show.slug}` : "/studio-productions#tonight"} onClick={close} className={QUIET}>
                        Details <ForwardArrow />
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid h-full place-items-center p-8 text-center text-[14px] text-white/55">
                  {now ? "Nothing on the calendar yet. Check back soon." : ""}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.08] px-7 py-4">
            {now && (
              <span className="flex items-center gap-2 text-[13px] text-white/55">
                <span className={`h-1.5 w-1.5 rounded-full ${inUse ? "animate-pulse bg-[#d4a030]" : "bg-white/35"}`} />
                {inUse} of {ROOMS.length} rooms in use right now
              </span>
            )}
            <Link href="/studio-productions" onClick={close} className={QUIET}>
              See everything <ForwardArrow />
            </Link>
            <Link href="/start?path=room" onClick={close} className={`${QUIET} ml-auto`}>
              Hosting? Book the whole room <ForwardArrow />
            </Link>
          </div>
        </>
      )}
    </Mega>
  );
}
