"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MEMBER_DISCOUNT, ROOMS, catOf, headcount, ics, money, priceNum, roomOf, teaserFor, ticketPrice, ticketsLeft, type VenueEvent } from "../../../lib/venue/data";
import { bookRoom, buyTickets, setSession, useVenueSession } from "../../../lib/venue/session";
import Check from "./Check";
import ForwardArrow from "../ForwardArrow";
import MeAvatar from "./MeAvatar";

/**
 * TONIGHT AT HOLLOWBROOK — the top of the venue demo (Ed, 2026-10-11).
 *
 * Built around the four reasons people land here:
 *   1. the public, deciding on a show tonight      → the Spotlight + "Get tickets"
 *   2. a member, deciding whether to head over     → each room's Now / Later, and "I'm on my way"
 *   3. a member who just wants to hang out         → no booking: "I'm on my way", then "Check in" at the door
 *      (checking in only happens in the building; once in, "Move here" switches rooms)
 *   4. anyone hosting a party, wedding, workshop   → "Book the whole room" / "Book a room for an event"
 * Members never reserve a room to use it: they check in where there's space. Booking the whole
 * room is a separate thing, for an event they're hosting (Ed, 2026-10-11).
 * Every room card shows one main button, picked by who's looking and what the room is doing.
 * Demo only: tickets, check-ins and booking requests are never charged, saved or sent.
 */

const GOLD = "#d4a030";
/** "You're here": bright gold (Ed, 2026-10-28 — no green on SoundPlex), the same on the border,
    the chip, the check and the bar. "On your way" stays the thinner mid-gold ring. */
/** Green = you: the status dot on your avatar in the menu, your ring on a room, your room's fill bar. */
const ME_GREEN = "#4cc773";
const POP = "font-[family-name:var(--font-poppins)]";
const DAY = 86_400_000;

type Person = { room: string; name?: string; photo?: string; you?: boolean };
type Props = {
  events: VenueEvent[];
  now: Date;
  title: (e: VenueEvent) => string;
  locked: (e: VenueEvent) => boolean;
  onOpen: (e: VenueEvent) => void;
  people: Person[];
  say: (m: string) => void;
};

const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const dur = (ms: number) => {
  const m = Math.max(1, Math.round(ms / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m} min`;
};
const when = (e: VenueEvent, now: Date) => {
  if (sameDay(e.start, now)) return `${e.start.getHours() >= 17 ? "Tonight" : "Today"} · ${time(e.start)}`;
  if (sameDay(e.start, new Date(now.getTime() + DAY))) return `Tomorrow · ${time(e.start)}`;
  return `${e.start.toLocaleDateString("en-US", { weekday: "long" })} · ${time(e.start)}`;
};

export default function TonightBoard({ events, now, title, locked, onOpen, people, say }: Props) {
  const s = useVenueSession();
  const member = s.member;
  // Checkout is shared, so the calendar's event panel can open it too.
  const ticketFor = s.tickets;
  const setTicketFor = (e: VenueEvent | null) => buyTickets(e); // real → ticket link; sample → demo checkout
  const [checkSheet, setCheckSheet] = useState(false);
  const [watch, setWatch] = useState<VenueEvent | null>(null);
  const [inView, setInView] = useState(false);
  const box = useRef<HTMLElement>(null);

  // The phone's sticky button only shows while this section is on screen.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => setInView(en.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cap = (e: VenueEvent) => roomOf(e.room).capacity;
  const left = (e: VenueEvent) => ticketsLeft(e, cap(e), now);
  const live = (room: string) => events.find((e) => e.room === room && e.start <= now && e.end > now);
  const later = (room: string) => events.find((e) => e.room === room && e.start > now && sameDay(e.start, now));
  const inRoom = (room: string) => people.filter((p) => p.room === room).length;
  const countIn = (room: string) => {
    const n = live(room);
    const c = roomOf(room).capacity;
    return n ? Math.min(c, Math.max(inRoom(room), headcount(n, c, now))) : inRoom(room);
  };
  const canEnter = (e: VenueEvent) => e.visibility !== "private" || (member && !!e.invited);

  /* The spotlight: the next show you can buy a ticket for (later today, else on now, else the next one). */
  const ticketed = events.filter((e) => left(e) !== null && e.end > now);
  const spot =
    ticketed.find((e) => e.start > now && sameDay(e.start, now)) ?? ticketed.find((e) => e.start <= now) ?? ticketed.find((e) => e.start > now);
  const spotLabel = !spot ? "" : spot.start <= now ? "On now" : sameDay(spot.start, now) ? (spot.start.getHours() >= 17 ? "Up next tonight" : "Up next today") : "Next show";

  const busy = ROOMS.filter((r) => live(r.id)).length;
  /** Podcast card: rooms with nothing on right now (the rig goes wherever is free). */
  const free = ROOMS.filter((r) => !live(r.id));

  const checkIn = (room: string) => {
    const moving = !!s.checkedIn;
    setSession({ checkedIn: room, onWay: null });
    setCheckSheet(false);
    say(moving ? `Moved to ${roomOf(room).name}` : `Checked in: ${roomOf(room).name}. (In real life, your phone checks you in when you arrive.)`);
  };
  const headOver = (room: string) => {
    setSession({ onWay: room });
    setCheckSheet(false);
    say(`On your way to ${roomOf(room).name}. Members there can see you're coming.`);
  };
  /* One main action per room, by viewer and state. */
  /** The card's main button and the small line under it. Every card gets both slots, so buttons line up. */
  function action(room: string): [React.ReactNode, React.ReactNode] {
    const n = live(room);
    const l = later(room);
    const nextTickets = l && left(l) !== null ? l : undefined;
    const full = countIn(room) >= roomOf(room).capacity;
    const here = s.checkedIn === room;
    const login = <SubLink onClick={() => setSession({ loginOpen: true })}>Members: sign in to come hang out</SubLink>;

    if (member) {
      // A ticketed show is a show: members buy a ticket like everyone else.
      if (n && n.visibility === "public" && left(n) !== null) return [<Btn key="m" onClick={() => setTicketFor(n)}>Get tickets · {ticketPrice(n, true)}</Btn>, null];
      if (n && !canEnter(n)) return [<Note key="m">Private event · free at {time(n.end)}</Note>, null];
      // Anything else with space: just check in and hang out. No booking needed.
      // Not in the building: "I'm on my way". At the door: "I'm here · check in". Inside: "Move here".
      const coming = s.onWay === room;
      const main = here ? (
        <Btn ghost onClick={() => (setSession({ checkedIn: null }), say("Checked out. See you next time."))}>
          <Check className="h-4 w-4 text-[#ffd27a]" /> You&apos;re here · check out
        </Btn>
      ) : full ? (
        <Note>Full right now</Note>
      ) : s.checkedIn ? (
        <Btn ghost onClick={() => checkIn(room)}>Move here</Btn>
      ) : coming ? (
        <Btn onClick={() => checkIn(room)}>I&apos;m here · check in</Btn>
      ) : (
        <Btn onClick={() => headOver(room)}>I&apos;m on my way</Btn>
      );
      const sub = coming ? (
        <SubLink onClick={() => (setSession({ onWay: null }), say("No problem. Maybe next time."))}>On your way · not coming after all?</SubLink>
      ) : nextTickets ? (
        <SubLink onClick={() => setTicketFor(nextTickets)}>
          Tickets for {time(nextTickets.start)} · {ticketPrice(nextTickets, true)} <ForwardArrow />
        </SubLink>
      ) : !n ? (
        <SubLink onClick={() => bookRoom(room)}>Hosting? Book the whole room <ForwardArrow /></SubLink>
      ) : null;
      return [main, sub];
    }

    // The public: tickets first, then booking; members are always one tap from logging in.
    if (n && n.visibility === "public") {
      if (left(n) !== null) return [<Btn key="m" onClick={() => setTicketFor(n)}>Get tickets · {n.price}</Btn>, login];
      return [<Note key="m">Free · just walk in</Note>, login];
    }
    if (nextTickets) return [<Btn key="m" onClick={() => setTicketFor(nextTickets)}>Tickets for {time(nextTickets.start)} · {nextTickets.price}</Btn>, login];
    if (n) return [<Note key="m">{n.visibility === "members" ? "Members only right now" : `Private event · free at ${time(n.end)}`}</Note>, login];
    return [
      <Btn key="m" ghost onClick={() => bookRoom(room)}>
        Book it for your event <ForwardArrow />
      </Btn>,
      login,
    ];
  }

  return (
    <section ref={box} id="tonight" aria-label="Tonight at SoundPlex" className="scroll-mt-28">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`${POP} flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em]`} style={{ color: GOLD }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: GOLD }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: GOLD }} />
            </span>
            Right now · {time(now)}
          </p>
          <h2 className={`${POP} mt-2 text-3xl font-medium tracking-tight sm:text-4xl`}>
            {now.getHours() >= 17 || now.getHours() < 4 ? "Tonight" : "Today"}{" "}
            <span className="font-[family-name:var(--font-lora)] font-medium italic">at SoundPlex</span>
          </h2>
        </div>
        <p className="text-[13px] text-white/50">
          {busy} of {ROOMS.length} rooms in use{member && people.length ? ` · ${people.length} members in` : ""}
        </p>
      </div>

      {/* ── 1. Spotlight: the next show to buy a ticket for ── */}
      {spot && (
        <article className="mt-5 grid overflow-hidden rounded-[8px] border border-[#d4a030]/40 bg-[#0b0b0b] md:grid-cols-[1.15fr_1fr]">
          <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[300px]">
            {teaserFor(spot) ? (
              <Teaser key={spot.id} src={teaserFor(spot)!.clip} poster={teaserFor(spot)!.poster} label={`${spot.title}, a sneak peek`} />
            ) : (
              <Image src={roomOf(spot.room).photo} alt={roomOf(spot.room).name} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" priority />
            )}
            {/* The photo melts into the card, no hard edge (Ed): into the text side on desktop, into
                the copy below on phones. #0b0b0b = the card's own background. */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#0b0b0b_0%,rgba(11,11,11,0.55)_22%,transparent_50%)] md:bg-[linear-gradient(to_right,transparent_50%,rgba(11,11,11,0.6)_78%,#0b0b0b_100%)]" />
            <span className={`${POP} absolute left-3 top-3 rounded-[4px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black`} style={{ background: GOLD }}>
              {spotLabel}
            </span>
            {teaserFor(spot) && (
              <button
                type="button"
                onClick={() => setWatch(spot)}
                className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/65 py-1.5 pl-2 pr-3.5 text-[12.5px] font-semibold backdrop-blur transition-colors hover:bg-black/85"
              >
                <PlayIcon /> {spot.start <= now ? "Watch live" : "Sneak peek"}
                <SoundIcon />
              </button>
            )}
          </div>
          <div className="flex flex-col p-5 sm:p-7">
            <p className="flex items-center gap-2 text-[12.5px] text-white/60">
              <span className="h-2 w-2 rounded-full" style={{ background: catOf(spot.category).color }} />
              {catOf(spot.category).name} · {roomOf(spot.room).name}
            </p>
            <h3 className={`${POP} mt-2 text-3xl font-semibold leading-tight tracking-tight`}>{spot.title}</h3>
            <p className="mt-1.5 text-[15px] font-medium" style={{ color: GOLD }}>
              {when(spot, now)}
              {spot.start > now ? ` · starts in ${dur(spot.start.getTime() - now.getTime())}` : ` · until ${time(spot.end)}`}
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/70">{spot.blurb}</p>
            {(left(spot) ?? -1) >= 0 && <Seats e={spot} leftCount={left(spot) ?? 0} member={member} />}
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
              <button
                type="button"
                onClick={() => setTicketFor(spot)}
                className={`${POP} rounded-[4px] px-5 py-3 text-[14px] font-semibold text-black transition-colors hover:bg-[#e2b34e]`}
                style={{ background: GOLD }}
              >
                Get tickets · {ticketPrice(spot, member)}
              </button>
              <button type="button" onClick={() => onOpen(spot)} className="text-[14px] text-white/65 underline underline-offset-4 hover:text-white">
                Details
              </button>
            </div>
          </div>
        </article>
      )}

      {/* ── 2. The room board: now, later, one button ── */}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROOMS.map((r) => {
          const n = live(r.id);
          const l = later(r.id);
          const on = !!n;
          const youHere = member && s.checkedIn === r.id;
          const youComing = member && s.onWay === r.id;
          const count = countIn(r.id);
          const [main, sub] = action(r.id);
          return (
            <li
              key={r.id}
              // You're here: no loud border — the card goes a shade lighter (like the calendar's
              // today) with a thin gold line across the top. Live rooms: a faint warm edge.
              // Your room looks like every other card (Ed, option A): the green ring on your face,
              // the green fill bar and the "You're here" button already say it.
              className="relative flex flex-col overflow-hidden rounded-[8px] border bg-[#0f0f0f] max-sm:flex-row"
              style={{ borderColor: on ? `${GOLD}2e` : "rgba(255,255,255,0.08)" }}
            >
              <div className="relative aspect-[16/9] shrink-0 max-sm:aspect-auto max-sm:w-[6.5rem]">
                <Image src={r.photo} alt={r.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px" className={`object-cover ${on ? "" : "opacity-55"}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <p className={`${POP} absolute bottom-2.5 left-3 text-[11.5px] font-medium uppercase tracking-[0.14em] max-sm:hidden`}>{r.name}</p>
                <p className="absolute bottom-2.5 right-3 text-[11px] text-white/60 max-sm:hidden">holds {r.capacity}</p>
                {/* Live: a quiet dark-glass tag, top right. */}
                {on && (
                  <span className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-[3px] bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur max-sm:hidden">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: GOLD }} />
                    Live
                  </span>
                )}
                {/* Who's in there (members): faces, not a code. You first with a gold ring, then up to
                    two others, then "+N" for everyone else counted in the room. */}
                {member && count > 0 && (
                  <Faces me={youHere || youComing ? s.name : ""} meComing={youComing && !youHere} others={people.filter((p) => p.room === r.id && !p.you)} total={count} />
                )}
                {n && teaserFor(n) && canEnter(n) && !locked(n) && (
                  <button
                    type="button"
                    onClick={() => setWatch(n)}
                    aria-label={`Watch live from ${r.name}`}
                    className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/70 py-1 pl-1.5 pr-2.5 text-[11px] font-semibold backdrop-blur transition-colors hover:bg-black/90"
                  >
                    <PlayIcon small /> Watch
                  </button>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5">
                <p className={`${POP} -mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/80 sm:hidden`}>
                  {r.name} <span className="font-normal normal-case tracking-normal text-white/40">· holds {r.capacity}</span>
                </p>
                {/* Now */}
                <div>
                  <Label>Now</Label>
                  {n ? (
                    <>
                      <button type="button" onClick={() => onOpen(n)} className={`${POP} mt-0.5 flex max-w-full items-center gap-1.5 text-left text-[15.5px] font-semibold leading-snug hover:underline`}>
                        <span className="truncate">{title(n)}</span>
                        {locked(n) && <Lock />}
                      </button>
                      <div className="mt-1.5 flex items-center gap-2 text-[12px]">
                        <PeopleIcon />
                        <span className="truncate text-white/55">
                          {count > 0 && <><span className="tabular-nums text-white/85">{count} here</span> · room for {r.capacity - count} · </>}till {time(n.end)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className={`${POP} mt-0.5 text-[15.5px] font-semibold text-white/60`}>Open</p>
                      {member && (
                        <p className="mt-1.5 flex items-center gap-2 text-[12px] text-white/55">
                          <PeopleIcon />
                          {count ? `${count} here` : "Nobody here yet"} · room for {r.capacity - count}
                          {s.onWay === r.id && <span style={{ color: GOLD }}>· you&apos;re coming</span>}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Later tonight */}
                {/* The divider is the room's fill: how many are in, against what it holds. */}
                <div className="-mt-px flex items-center gap-2.5 px-4" role="img" aria-label={`${count} of ${r.capacity} people`}>
                  <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
                      style={{ width: `${Math.min(100, (count / r.capacity) * 100)}%`, background: youHere ? ME_GREEN : GOLD }}
                    />
                  </div>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-white/45">
                    {count} / {r.capacity}
                  </span>
                </div>
                <div className="-mt-0.5">
                  <Label>Later</Label>
                  {l ? (
                    <button type="button" onClick={() => onOpen(l)} className="mt-0.5 flex w-full items-baseline gap-2 text-left text-[13.5px] hover:text-white">
                      <span className="shrink-0 tabular-nums text-white/55">{time(l.start)}</span>
                      <span className="truncate text-white/85">{title(l)}</span>
                      {(left(l) ?? -1) >= 0 && <span className="ml-auto shrink-0 text-[12px] text-white/45">{left(l)} left</span>}
                    </button>
                  ) : (
                    <p className="mt-0.5 text-[13.5px] text-white/45">{n ? `Free after ${time(n.end)}` : "Free the rest of the night"}</p>
                  )}
                </div>

                <div className="mt-auto pt-1">
                  {main}
                  <div className="mt-2 flex h-5 items-center justify-center">{sub}</div>
                </div>
              </div>
            </li>
          );
        })}

        {/* ── Podcast (SoundPlex): not a room — the rig is set up fresh in whichever room is free.
            Same card as the rooms, so it lines up: Now = where you could record right now. ── */}
        {(
            <li className="flex flex-col overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#0f0f0f] max-sm:flex-row">
              <div className="relative aspect-[16/9] shrink-0 max-sm:aspect-auto max-sm:w-[6.5rem]">
                <Image src="/rooms/podcast-temp.webp" alt="A podcast setup: microphones around a round table, cameras on tripods" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px" className="object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <p className={`${POP} absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.14em] max-sm:hidden`}><MicIcon />Podcast</p>
                <p className="absolute bottom-2.5 right-3 text-[11px] text-white/60 max-sm:hidden">any room</p>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5">
                <p className={`${POP} -mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/80 sm:hidden`}>
                  Podcast <span className="font-normal normal-case tracking-normal text-white/40">· any room</span>
                </p>
                <div>
                  <Label>Free to record now</Label>
                  <p className={`${POP} mt-0.5 truncate text-[15.5px] font-semibold ${free.length ? "" : "text-white/60"}`}>{free.length ? free.map((r) => r.short).join(" · ") : "Every room’s busy"}</p>
                  <p className="mt-1.5 text-[12px] text-white/55">Three cameras, mics and an operator</p>
                </div>
                <div className="relative -mt-px h-[2px] overflow-hidden rounded-full bg-white/[0.08]" aria-hidden="true" />
                <div className="-mt-0.5">
                  <Label>The rate</Label>
                  <p className="mt-0.5 text-[13.5px] text-white/85">$250/hr · up to 6 at the table</p>
                </div>
                <div className="mt-auto pt-1">
                  <Btn onClick={() => window.location.assign("/start?path=room&use=podcast")}>
                    Book a session <ForwardArrow />
                  </Btn>
                  <div className="mt-2 flex h-5 items-center justify-center">
                    <SubLink onClick={() => window.location.assign("/rooms#podcast")}>How it works</SubLink>
                  </div>
                </div>
              </div>
            </li>
        )}
      </ul>

      {/* ── Phone: one sticky button while this section is on screen ── */}
      {inView && !ticketFor && (
        <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-black/90 p-3 backdrop-blur sm:hidden">
          {checkSheet && (
            <div className="vo-pop mb-2 grid grid-cols-2 gap-2">
              {ROOMS.map((r) => (
                <button key={r.id} type="button" onClick={() => (s.checkedIn ? checkIn(r.id) : headOver(r.id))} className="rounded-[4px] border border-white/20 py-2.5 text-[13.5px] font-semibold">
                  {r.name}
                </button>
              ))}
            </div>
          )}
          {member ? (
            s.checkedIn ? (
              <button type="button" onClick={() => setCheckSheet((v) => !v)} className={`${POP} w-full rounded-[4px] border border-[#d4a030]/60 py-3 text-[14px] font-semibold`} style={{ color: GOLD }}>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#ffd27a]" /> Checked in · {roomOf(s.checkedIn).name}
                </span>
              </button>
            ) : (
              s.onWay ? (
                <button type="button" onClick={() => checkIn(s.onWay!)} className={`${POP} w-full rounded-[4px] py-3 text-[14px] font-semibold text-black`} style={{ background: GOLD }}>
                  I&apos;m here · check in to {roomOf(s.onWay).name}
                </button>
              ) : (
                <button type="button" onClick={() => setCheckSheet((v) => !v)} className={`${POP} w-full rounded-[4px] py-3 text-[14px] font-semibold text-black`} style={{ background: GOLD }}>
                  {checkSheet ? "Where are you heading?" : `Heading over, ${s.name}? I'm on my way`}
                </button>
              )
            )
          ) : spot ? (
            <button type="button" onClick={() => setTicketFor(spot)} className={`${POP} w-full rounded-[4px] py-3 text-[14px] font-semibold text-black`} style={{ background: GOLD }}>
              Get tickets · {spot.title} · {time(spot.start)}
            </button>
          ) : null}
        </div>
      )}

      {watch && (
        <WatchSheet
          e={watch}
          now={now}
          onClose={() => setWatch(null)}
          price={ticketPrice(watch, member)}
          onTickets={left(watch) !== null ? () => (setWatch(null), setTicketFor(watch)) : undefined}
        />
      )}
      {ticketFor && (
        <TicketSheet
          e={ticketFor}
          now={now}
          leftCount={left(ticketFor) ?? 0}
          name={s.name}
          member={member}
          onLogin={() => (setTicketFor(null), setSession({ loginOpen: true }))}
          onClose={() => setTicketFor(null)}
        />
      )}
      
    </section>
  );
}

/* ───────────────────────────── Video ───────────────────────────── */
/** A silent looping clip. Autoplays unless the visitor prefers reduced motion. */
function Teaser({ src, poster, label }: { src: string; poster: string; label: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.play().catch(() => {});
  }, []);
  return <video ref={v} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} className="absolute inset-0 h-full w-full object-cover" />;
}

/** The big player: opened by a tap, so it can start with sound (falls back to muted if the browser says no). */
function SoundVideo({ src, poster }: { src: string; poster: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    el.muted = false;
    el.play().catch(() => {
      el.muted = true;
      el.play().catch(() => {});
    });
  }, []);
  return <video ref={v} src={src} poster={poster} loop playsInline controls className="h-full w-full object-cover" />;
}

function WatchSheet({ e, now, price, onClose, onTickets }: { e: VenueEvent; now: Date; price: string; onClose: () => void; onTickets?: () => void }) {
  const t = teaserFor(e);
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  if (!t) return null;
  const isLive = e.start <= now && e.end > now;
  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-black/85 p-4" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label={`${e.title} video`} onClick={(ev) => ev.stopPropagation()} className="vo-pop w-full max-w-3xl">
        <div className="relative aspect-video overflow-hidden rounded-[8px] bg-black">
          <SoundVideo src={t.clip} poster={t.poster} />
          <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-[4px] bg-black/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            {isLive && <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: GOLD }} />}
            {isLive ? `Live · ${roomOf(e.room).name}` : "Sneak peek"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={`${POP} text-xl font-semibold`}>{e.title}</p>
            <p className="text-[13.5px] text-white/60">
              {isLive ? `On now in ${roomOf(e.room).name}, until ${time(e.end)}` : `${when(e, now)} · ${roomOf(e.room).name}`}
            </p>
          </div>
          <div className="flex gap-2">
            {onTickets && (
              <button type="button" onClick={onTickets} className={`${POP} rounded-[4px] px-4 py-2.5 text-[14px] font-semibold text-black`} style={{ background: GOLD }}>
                Get tickets · {price}
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-[4px] border border-white/25 px-4 py-2.5 text-[14px] font-semibold hover:border-white/60">
              Close
            </button>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-white/40">Demo clip, made up for this page. In a real build: the venue&apos;s teaser, or a live feed from the room.</p>
      </div>
    </div>
  );
}

/* ───────────────────────────── Tickets ───────────────────────────── */
function TicketSheet({
  e,
  now,
  leftCount,
  name,
  member,
  onLogin,
  onClose,
}: {
  e: VenueEvent;
  now: Date;
  leftCount: number;
  name: string;
  member: boolean;
  onLogin: () => void;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(2);
  const [done, setDone] = useState(false);
  const base = priceNum(e);
  const each = Math.round(base * (member ? 1 - MEMBER_DISCOUNT : 1) * 100) / 100;
  const pct = Math.round(MEMBER_DISCOUNT * 100);
  const max = Math.max(1, Math.min(6, leftCount));
  const code = `SP-${e.id.length.toString(36).toUpperCase()}${(e.start.getDate() * 37).toString(36).toUpperCase()}`;
  const addToCal = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics(e)], { type: "text/calendar" }));
    a.download = `${e.title.replace(/\W+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Sheet onClose={onClose} label={`Tickets for ${e.title}`}>
      {!done ? (
        <>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-white/50">Tickets</p>
          <h3 className={`${POP} mt-1 text-2xl font-semibold`}>{e.title}</h3>
          <p className="mt-1 text-[14px] text-white/65">
            {when(e, now)} · {roomOf(e.room).name}
          </p>
          <div className="mt-5 flex items-center justify-between rounded-[6px] border border-white/10 p-3.5">
            <span className="text-[14px]">
              General admission{" "}
              {member ? (
                <span className="text-white/50">
                  · <s className="text-white/35">{e.price}</s> <span className="font-semibold text-white">{money(each)}</span> each
                </span>
              ) : (
                <span className="text-white/50">· {e.price} each</span>
              )}
            </span>
            <span className="flex items-center gap-2">
              <Step onClick={() => setQty((q) => Math.max(1, q - 1))} label="One fewer">
                −
              </Step>
              <span className="w-5 text-center tabular-nums">{qty}</span>
              <Step onClick={() => setQty((q) => Math.min(max, q + 1))} label="One more">
                +
              </Step>
            </span>
          </div>
          <p className="mt-2 text-[12.5px] text-white/45">{leftCount} left · up to 6 per order</p>
          {member ? (
            <p className="mt-3 flex items-center gap-2 rounded-[4px] bg-[#d4a030]/10 px-3 py-2 text-[13px]" style={{ color: GOLD }}>
              <Check className="h-4 w-4" /> Member price: {pct}% off, you save {money(Math.round((base - each) * qty * 100) / 100)}
            </p>
          ) : (
            <p className="mt-3 text-[13px] text-white/55">
              Members pay {money(Math.round(base * (1 - MEMBER_DISCOUNT) * 100) / 100)}.{" "}
              <button type="button" onClick={onLogin} className="font-semibold underline underline-offset-2" style={{ color: GOLD }}>
                Sign in
              </button>
            </p>
          )}
          <button
            type="button"
            onClick={() => setDone(true)}
            className={`${POP} mt-5 w-full rounded-[4px] py-3 text-[15px] font-semibold text-black`}
            style={{ background: GOLD }}
          >
            Get {qty} ticket{qty > 1 ? "s" : ""} · {money(Math.round(each * qty * 100) / 100)}
          </button>
          <p className="mt-2 text-center text-[12px] text-white/40">Demo: no payment is taken and nothing is sent.</p>
        </>
      ) : (
        <>
          <h3 className={`${POP} text-2xl font-semibold`}>You&apos;re in{name ? `, ${name}` : ""}.</h3>
          <p className="mt-1 text-[14px] text-white/60">Show this at the door. It&apos;s in your email too (in a real build).</p>
          <div className="relative mt-5 rounded-[8px] border border-dashed border-[#d4a030]/60 bg-[#d4a030]/[0.06] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>
              SoundPlex Studios · Admit {qty}
            </p>
            <p className={`${POP} mt-2 text-xl font-semibold`}>{e.title}</p>
            <p className="mt-1 text-[14px] text-white/70">
              {when(e, now)} · {roomOf(e.room).name}
            </p>
            <p className="mt-4 font-mono text-[13px] tracking-[0.2em] text-white/60">{code}</p>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={addToCal} className="flex-1 rounded-[4px] border border-white/20 py-2.5 text-[14px] font-semibold hover:border-white/50">
              Add to calendar
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-[4px] py-2.5 text-[14px] font-semibold text-black" style={{ background: GOLD }}>
              Done
            </button>
          </div>
          <p className="mt-3 text-center text-[12px] text-white/40">Demo ticket. Nothing was charged.</p>
        </>
      )}
    </Sheet>
  );
}

/* ───────────────────────────── Bits ───────────────────────────── */
function Sheet({ onClose, label, children }: { onClose: () => void; label: string; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/65 sm:items-center sm:p-4" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="vo-pop vo-scroll relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[12px] border border-white/12 bg-[#0e0e0e] p-6 sm:rounded-[8px]"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-white/50 hover:text-white">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function Step({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid h-8 w-8 place-items-center rounded-[4px] border border-white/20 text-lg leading-none hover:border-white/50">
      {children}
    </button>
  );
}

function Seats({ e, leftCount, member }: { e: VenueEvent; leftCount: number; member: boolean }) {
  const c = roomOf(e.room).capacity;
  const sold = c - leftCount;
  return (
    <div className="mt-4 max-w-sm">
      <div className="flex justify-between text-[12.5px]">
        <span className="text-white/60">{leftCount <= 10 ? `Only ${leftCount} tickets left` : `${leftCount} of ${c} tickets left`}</span>
        {member ? (
          <span className="text-white/45">
            <s className="text-white/30">{e.price}</s> <span style={{ color: GOLD }}>{ticketPrice(e, true)} member price</span>
          </span>
        ) : (
          <span className="text-white/40">{e.price} each</span>
        )}
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${(sold / c) * 100}%`, background: GOLD }} />
      </div>
    </div>
  );
}

/**
 * Who's in a room, as faces (members only): you first with a gold ring (a fainter ring while
 * you're on your way), then up to two other members' portraits, then "+N" for the rest counted
 * in the room. Top-left of the room photo.
 */
function Faces({ me, meComing, others, total }: { me: string; meComing: boolean; others: Person[]; total: number }) {
  const faces = others.slice(0, me ? 2 : 3);
  const extra = Math.max(0, total - (me ? 1 : 0) - faces.length);
  const label = `${me ? (meComing ? "You're on your way · " : "You're here · ") : ""}${total} ${total === 1 ? "person" : "people"} in the room`;
  return (
    <div className="vo-pop absolute left-2.5 top-2.5 flex items-center max-sm:hidden" title={label} aria-label={label}>
      <div className="flex -space-x-2">
        {me && (
          // Green ring = you, same green as the status dot on your avatar in the menu (Ed).
          <span className={`relative z-10 grid rounded-full ring-2 ${meComing ? "ring-[#4cc773]/45" : "ring-[#4cc773]"}`}>
            <MeAvatar name={me} size={26} />
          </span>
        )}
        {faces.map((p) =>
          p.photo ? (
            <Image key={p.name} src={p.photo} alt="" width={52} height={52} className="h-[26px] w-[26px] rounded-full object-cover ring-2 ring-black/70" />
          ) : (
            <span key={p.name} className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#2a2a2a] text-[11px] font-semibold ring-2 ring-black/70">
              {(p.name ?? "?")[0]}
            </span>
          ),
        )}
      </div>
      {extra > 0 && <span className="ml-1.5 rounded-[3px] bg-black/55 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white/90 backdrop-blur">+{extra}</span>}
    </div>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function Btn({ onClick, ghost, children }: { onClick: () => void; ghost?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${POP} group flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-[4px] px-3 py-2 text-[13px] leading-none font-semibold transition-colors ${ghost ? "bg-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:text-[#e2b34e]" : "text-black hover:bg-[#e2b34e]"}`}
      style={ghost ? undefined : { background: GOLD }}
    >
      {children}
    </button>
  );
}

function SubLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="group flex w-full items-center justify-center gap-1 truncate text-center text-[12.5px] text-white/55 transition-colors hover:text-white">
      {children}
    </button>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="flex min-h-[40px] items-center justify-center text-center text-[13px] font-medium text-white/55">{children}</p>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className={`${POP} text-[10px] font-medium uppercase tracking-[0.18em] text-[#d4a030]/80`}>{children}</p>;
}

function Lock() {
  return (
    <svg aria-label="Locked" viewBox="0 0 24 24" className="inline h-3.5 w-3.5 shrink-0 text-white/45" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function PlayIcon({ small }: { small?: boolean }) {
  return (
    <span className={`grid place-items-center rounded-full text-black ${small ? "h-4 w-4" : "h-6 w-6"}`} style={{ background: GOLD }} aria-hidden="true">
      <svg viewBox="0 0 10 10" className={small ? "h-2 w-2" : "h-2.5 w-2.5"}>
        <path d="M2.5 1.5v7l6-3.5z" fill="currentColor" />
      </svg>
    </span>
  );
}

function SoundIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-label="with sound" className="h-4 w-4 text-white/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-white/55" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </svg>
  );
}
