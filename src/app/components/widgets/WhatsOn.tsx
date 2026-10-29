"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { MEMBERS, ROOMS, catOf, eventsAround, fromCalItems, ics, roomOf, ticketPrice, type VenueEvent } from "../../../lib/venue/data";
import { bookRoom, buyTickets, cleanName, setSession, useVenueSession } from "../../../lib/venue/session";
import { membersConfigured } from "../../../lib/members/env";
import type { CalItem } from "../../../lib/events/constants";
import { clearMembersFeed, pushFeed } from "../../../lib/venue/feed";
import { greet } from "../../../lib/venue/greetings";
import MeAvatar from "./MeAvatar";
import TonightBoard from "./TonightBoard";
import TimeGrid from "./TimeGrid";
import RoomPicker from "./RoomPicker";
import ForwardArrow from "../ForwardArrow";
import FilterMenu from "./FilterMenu";
import Check from "./Check";
import CalTipLayer, { hideTip, showTip } from "./CalTip";

/**
 * STUDIO PRODUCTIONS / What's On — /studio-productions. PORTED from the Realiiz showroom demo
 * ("What's On", Hollowbrook) — Ed 2026-10-28: the demo's design exactly, only SoundPlex's colors,
 * fonts and data. Data: src/lib/venue/data.ts (George's real events + sample week while
 * SHOW_SAMPLE_EVENTS is on). Members: the demo login stays as a PREVIEW until the members wave
 * (real accounts — SITE-STRUCTURE-BRIEF §11.2).
 *
 * One events page, three ways to look at it (List, Month, Rooms), one set of filters, and a
 * live "Now / Next" strip. Events can be public, members-only or private: the public sees
 * that a room is booked, members see more. A demo member login opens "Who's here": a floor
 * plan with the members checked into each room right now, and check-in (in a real build: automatic by location in the members app, or a QR code).
 * Everything is generated from the visitor's own date; nothing is stored or sent.
 */

const ACCENT = "#d4a030";
type View = "list" | "calendar" | "rooms";
type CalMode = "day" | "week" | "month";
/** "When" only applies to the List; the calendar views always show everything. */
type Quick = "upcoming" | "today" | "weekend";
type Here = { name: string; photo?: string; room: string; you?: boolean };

const subscribe = (cb: () => void) => {
  const t = window.setInterval(cb, 30_000);
  return () => window.clearInterval(t);
};
const minuteNow = () => Math.floor(Date.now() / 60_000);

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);
const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined });
/** "8p", "10:30p", "11a": compact times for the month grid. */
const shortTime = (d: Date) => `${d.getHours() % 12 || 12}${d.getMinutes() ? `:${String(d.getMinutes()).padStart(2, "0")}` : ""}${d.getHours() < 12 ? "a" : "p"}`;
const fmtRange = (e: VenueEvent) => `${fmtTime(e.start)} – ${fmtTime(e.end)}`;
const fmtDay = (d: Date, today: Date) => {
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - t.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
};

export default function WhatsOn({ items = [], showSamples = false }: { items?: CalItem[]; showSamples?: boolean }) {
  const minute = useSyncExternalStore(subscribe, minuteNow, () => 0);
  const ready = minute > 0;
  const now = useMemo(() => new Date(minute * 60_000), [minute]);
  const todayKey = ready ? dayKey(now) : "";
  // George's real calendar (from the server) + the sample week while SHOW_SAMPLE_EVENTS is on.
  const events = useMemo(
    () => (ready ? [...fromCalItems(items), ...(showSamples ? eventsAround(new Date(minute * 60_000)) : [])].sort((a, b) => a.start.getTime() - b.start.getTime()) : []),
    [todayKey, items, showSamples], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [view, setView] = useState<View>("list");
  const [quick, setQuick] = useState<Quick>("today"); // opens on what's left of today
  const [free, setFree] = useState(false);
  const [cats, setCats] = useState<string[]>([]);
  const [room, setRoom] = useState("all");
  const session = useVenueSession();
  const { member, loginOpen, showMe } = session;
  // Real members (Ed, 2026-10-29): "Who's here" lives in the members area now. This page keeps
  // the blurred teaser for everyone; a signed-in member gets a door into /members instead of the
  // full floor plan. (Without the members project, the demo login still shows the full version.)
  const fullWho = member && !membersConfigured();
  const setLoginOpen = (v: boolean) => setSession({ loginOpen: v });
  const [open, setOpen] = useState<VenueEvent | null>(null);
  const [rsvp, setRsvp] = useState<string[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [calMode, setCalMode] = useState<CalMode>("month");
  const [calOffset, setCalOffset] = useState(0); // days from today, for Day and Week
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [toast, setToast] = useState("");
  const toastT = useRef<number | undefined>(undefined);

  const [toastFace, setToastFace] = useState(false);
  const say = (m: string, ms = 2600, face = false) => {
    setToast(m);
    setToastFace(face);
    window.clearTimeout(toastT.current);
    toastT.current = window.setTimeout(() => setToast(""), ms);
  };

  /* ── What each viewer may see ── */
  const locked = (e: VenueEvent) => (e.visibility === "members" && !member) || (e.visibility === "private" && !(member && e.invited));
  const title = (e: VenueEvent) =>
    e.visibility === "private" && !(member && e.invited) ? "Private event" : e.visibility === "members" && !member ? "Members event" : e.title;

  /* ── Filters: what (category, free) and where (room) apply to every view ── */
  const matches = (e: VenueEvent) => {
    if (cats.length && !cats.includes(e.category)) return false;
    if (room !== "all" && e.room !== room) return false;
    if (free && !/free/i.test(e.price)) return false;
    return true;
  };
  /* ── When: List only. Overlap with a time window, so a show running past midnight counts. ── */
  const inQuickWindow = (e: VenueEvent) => {
    if (e.end <= now) return false;
    const day0 = new Date(now);
    day0.setHours(0, 0, 0, 0);
    const at = (days: number, h: number) => new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + days, h);
    const overlaps = (a: Date, b: Date) => e.start < b && e.end > a;
    if (quick === "today") return overlaps(now, at(1, 4)); // the rest of today, late shows included
    if (quick === "weekend") {
      const dow = now.getDay(); // Fri 5 pm → Sun midnight; on Sat/Sun, the rest of this weekend
      const toFri = dow === 6 ? -1 : dow === 0 ? -2 : 5 - dow;
      return overlaps(new Date(Math.max(now.getTime(), at(toFri, 17).getTime())), at(toFri + 3, 0));
    }
    return e.start.getTime() < now.getTime() + 21 * 86_400_000;
  };
  const filtered = events.filter(matches);

  /* ── Who's here (members) ── */
  const [here, setHere] = useState<Here[]>([]);
  const [whoRoom, setWhoRoom] = useState("all"); // "In the building" filter
  useEffect(() => {
    if (!member) return;
    // Seed the building with members in rooms that have something on.
    const busy = ROOMS.map((r) => r.id);
    const seed: Here[] = MEMBERS.slice(0, 8).map((m, i) => ({ name: m.name, photo: m.photo, room: busy[(i * 3) % busy.length] }));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the demo building fills up once you log in
    setHere(seed);
    // Then people come and go. The news goes to the members' live feed (full name + photo).
    let current = seed;
    const full = (name: string) => {
      const m = MEMBERS.find((x) => x.name === name);
      return { name: m ? `${m.name} ${m.last}` : name, photo: m?.photo };
    };
    const t = window.setInterval(() => {
      const inside = new Set(current.map((p) => p.name));
      const away = MEMBERS.filter((m) => !inside.has(m.name));
      if (away.length && (current.length < 6 || Math.random() < 0.55)) {
        const m = away[Math.floor(Math.random() * away.length)];
        const r = ROOMS[Math.floor(Math.random() * ROOMS.length)];
        if (Math.random() < 0.3) {
          pushFeed({ audience: "members", kind: "onway", who: full(m.name), text: `is on the way to ${r.name}` });
          return;
        }
        current = [...current, { name: m.name, photo: m.photo, room: r.id }];
        pushFeed({ audience: "members", kind: "checkin", who: full(m.name), text: `checked into ${r.name}` });
      } else {
        const leaving = current[Math.floor(Math.random() * current.length)];
        if (!leaving) return;
        current = current.filter((p) => p.name !== leaving.name);
        pushFeed({ audience: "members", kind: "left", who: full(leaving.name), text: "headed out" });
      }
      setHere(current);
    }, 7000);
    return () => window.clearInterval(t);
  }, [member]);
  // Logging out hides members' news from the feed.
  useEffect(() => {
    if (!member) clearMembersFeed();
  }, [member]);
  const me: Here | undefined = member && session.checkedIn ? { name: "You", room: session.checkedIn, you: true } : undefined;
  const sample: Here[] = MEMBERS.slice(0, 7).map((m, i) => ({ name: m.name, photo: m.photo, room: ROOMS[i % ROOMS.length].id }));
  // You always see yourself (dimmed when hidden); the public sees a blurred sample.
  const shown = member ? [...(me ? [me] : []), ...here] : sample;
  const checkIn = (r: string) => {
    setSession({ checkedIn: r, onWay: null });
    say(`You're checked into ${roomOf(r).name}${showMe ? "" : " (quietly)"}`);
  };

  // Arriving with a section in the address (/studio-productions#members from the avatar menu's
  // "Who's here", #tonight, #calendar-views…): those sections only exist once the clock is known,
  // so the browser's own jump misses them. Scroll there as soon as they're drawn.
  // #calendar (the menu's "Calendar", Ed) means more than "scroll to the section": it switches to
  // the Calendar view and lands on the view controls. Works on arrival, and when the menu is used
  // while already on this page (NavMega/MobileMenu also fire "sp:view", since a same-page hash
  // link doesn't always raise hashchange).
  useEffect(() => {
    if (!ready) return;
    const go = (raw: string) => {
      const id = raw.replace(/^#/, "");
      if (!id) return;
      let target = id;
      if (id === "calendar") {
        setView("calendar");
        target = "calendar-views";
      }
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" })),
      );
    };
    go(window.location.hash);
    const onHash = () => go(window.location.hash);
    const onView = (e: Event) => go((e as CustomEvent<string>).detail);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("sp:view", onView);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("sp:view", onView);
    };
  }, [ready]);

  const download = (e: VenueEvent) => {
    const blob = new Blob([ics(e)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${e.title.replace(/\W+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!ready) {
    return <div className="h-[640px] animate-pulse rounded-[8px] bg-white/[0.04]" aria-label="Loading the calendar" />;
  }

  return (
    <div className="space-y-6">
      {/* ── Right now: every room at a glance ── */}
      <TonightBoard events={events} now={now} title={title} locked={locked} onOpen={setOpen} people={fullWho ? shown : []} say={say} />

      {/* ── Controls: one calm bar. View on the left; when (List only), room and filter on the right. ── */}
      <div id="calendar-views" className="scroll-mt-32 pt-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Seg
            label="Calendar view"
            value={view}
            onChange={(v) => setView(v as View)}
            options={[
              ["list", "List"],
              ["calendar", "Calendar"],
              ["rooms", "Rooms"],
            ]}
          />
          {view === "list" && (
            <Seg
              label="When"
              value={quick}
              onChange={(v) => setQuick(v as Quick)}
              options={[
                ["upcoming", "Upcoming"],
                ["today", now.getHours() >= 17 ? "Tonight" : "Today"],
                ["weekend", "This weekend"],
              ]}
            />
          )}
          <div className="flex items-center gap-2 max-sm:w-full sm:ml-auto">
            <RoomPicker value={room} onChange={setRoom} />
            <FilterMenu cats={cats} setCats={setCats} free={free} setFree={setFree} />
          </div>
        </div>
        {/* Active filters, only when there are some. */}
        {(cats.length > 0 || free || room !== "all") && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-white/55">
            <span className="text-white/40">Showing</span>
            {cats.map((c) => (
              <Chip key={c} onClear={() => setCats(cats.filter((x) => x !== c))}>
                <span className="h-[6px] w-[6px] rounded-full" style={{ background: catOf(c).color }} />
                {catOf(c).name}
              </Chip>
            ))}
            {free && <Chip onClear={() => setFree(false)}>Free only</Chip>}
            {room !== "all" && <Chip onClear={() => setRoom("all")}>{roomOf(room).name}</Chip>}
            <button
              type="button"
              onClick={() => {
                setCats([]);
                setFree(false);
                setRoom("all");
              }}
              className="text-white/45 underline-offset-4 hover:text-white hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── The views ── */}
      {view === "list" && <ListView onUpcoming={quick !== "upcoming" ? () => setQuick("upcoming") : undefined} items={filtered.filter((e) => !e.ambient && inQuickWindow(e))} now={now} title={title} locked={locked} onOpen={setOpen} rsvp={rsvp} member={member} />}
      {view === "calendar" && (
        <CalendarView
          mode={calMode}
          setMode={setCalMode}
          dayOffset={calOffset}
          setDayOffset={setCalOffset}
          monthOffset={monthOffset}
          setMonthOffset={setMonthOffset}
          events={filtered.filter((e) => !e.ambient)}
          now={now}
          picked={pickedDay}
          setPicked={setPickedDay}
          title={title}
          locked={locked}
          onOpen={setOpen}
        />
      )}
      {view === "rooms" && <RoomsView events={filtered} now={now} offset={dayOffset} setOffset={setDayOffset} title={title} locked={locked} onOpen={setOpen} />}

      {/* ── Members: who's here ── */}
      <section id="members" className="scroll-mt-28 rounded-[8px] border border-white/10 bg-[#0e0e0e] p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-poppins)] font-medium text-[0.7rem] uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
              Members · live
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-poppins)] text-3xl font-semibold tracking-tight">Who&apos;s at SoundPlex</h3>
          </div>
          {fullWho && (
            <p className="text-[14px] text-white/60">
              {shown.length} {shown.length === 1 ? "person" : "people"} checked in
            </p>
          )}
        </div>

        <div className="relative mt-6">
          <div className={`grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] ${fullWho ? "" : "pointer-events-none select-none blur-[6px]"}`} aria-hidden={!fullWho}>
            {/* The floor plan (rooms placed as they sit in the building); a stack of rooms on phones. */}
            <div className="grid min-w-0 gap-2.5 self-start sm:relative sm:block sm:aspect-[100/64]">
              {ROOMS.map((r) => {
                const people = shown.filter((p) => p.room === r.id);
                const onNow = events.find((e) => e.room === r.id && e.start <= now && e.end > now);
                const c = onNow ? ACCENT : undefined;
                return (
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`See who's in ${r.name}`}
                    onClick={() => setWhoRoom(whoRoom === r.id ? "all" : r.id)}
                    onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), setWhoRoom(whoRoom === r.id ? "all" : r.id))}
                    className={`vo-room flex min-h-[7.5rem] cursor-pointer flex-col justify-between overflow-hidden rounded-[8px] border bg-white/[0.035] p-3.5 transition-[filter,box-shadow] hover:brightness-125 sm:absolute sm:min-h-0 ${whoRoom === r.id ? "shadow-[inset_0_0_0_1px_#d4a030]" : ""}`}
                    style={{
                      ["--l" as string]: `${r.plan.x}%`,
                      ["--t" as string]: `${(r.plan.y / 64) * 100}%`,
                      ["--w" as string]: `${r.plan.w}%`,
                      ["--h" as string]: `${(r.plan.h / 64) * 100}%`,
                      borderColor: c ? `${c}66` : "rgba(255,255,255,0.1)",
                      background: `linear-gradient(180deg, ${c ? `${c}33` : "rgba(0,0,0,0.55)"}, rgba(8,8,8,0.92) 75%), url(${r.photo}) center / cover`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{r.name}</p>
                        <p className="mt-0.5 truncate text-[12.5px] text-white/55">{onNow ? `${title(onNow)} · until ${fmtTime(onNow.end)}` : "Nothing booked · open"}</p>
                      </div>
                      {onNow && (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-[3px] bg-black/30 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: c }}>
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: c }} />
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {/* Up to 3 faces; more than that: 2 faces and "+N". */}
                      <div className="flex shrink-0 -space-x-2">
                        {people.slice(0, people.length > 3 ? 2 : 3).map((p) => (
                          <Avatar key={p.name} p={p} dim={p.you && !showMe} me={session.name} />
                        ))}
                        {people.length > 3 && (
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#2a2a2a] text-[12px] font-semibold tabular-nums text-white/85 ring-2 ring-[#0e0e0e]">
                            +{people.length - 2}
                          </span>
                        )}
                      </div>
                      <p className="min-w-0 truncate text-[12.5px] text-white/60">
                        {!people.length
                          ? "Nobody checked in"
                          : people.length > 3
                            ? `${people.slice(0, 2).map((p) => p.name).join(", ")} and ${people.length - 2} more`
                            : people.map((p) => p.name).join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Everyone in the building: a fixed-height panel that scrolls, so 100 members never
                stretch the page. On desktop it's exactly as tall as the floor plan. */}
            <div className="relative min-h-0">
              <div className="flex max-h-[22rem] flex-col rounded-[8px] border border-white/10 bg-white/[0.03] lg:absolute lg:inset-0 lg:max-h-none">
                <p className="flex items-center justify-between px-4 pb-2 pt-4 font-[family-name:var(--font-poppins)] text-[0.65rem] font-medium uppercase tracking-[0.18em] text-white/50">
                  In the building
                  <span className="tabular-nums tracking-normal text-white/40">
                    {whoRoom === "all" ? shown.length : `${shown.filter((p) => p.room === whoRoom).length} of ${shown.length}`}
                  </span>
                </p>
                <div className="px-4 pb-2">
                  <RoomPicker value={whoRoom} onChange={setWhoRoom} full />
                </div>
                <ul className="vo-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-4 pt-1">
                {shown.filter((p) => whoRoom === "all" || p.room === whoRoom).map((p) => {
                  const role = MEMBERS.find((m) => m.name === p.name)?.role ?? (showMe ? "Visible to members" : "Only you can see this");
                  return (
                    <li key={p.name} className="vo-pop flex items-center gap-3">
                      <Avatar p={p} dim={p.you && !showMe} me={session.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">{p.name}</span>
                        <span className="block truncate text-[12px] text-white/50">{role}</span>
                      </span>
                      <span className="shrink-0 text-[12px] text-white/60">{roomOf(p.room).short}</span>
                    </li>
                  );
                })}
                {whoRoom !== "all" && !shown.some((p) => p.room === whoRoom) && (
                  <li className="py-2 text-[13px] text-white/45">Nobody in {roomOf(whoRoom).name} right now.</li>
                )}
              </ul>
              </div>
            </div>
          </div>
          {member && !fullWho && (
            <div className="absolute inset-0 grid place-items-center">
              {/* A signed-in member: the live view is in the members area. */}
              <div className="mx-4 w-full max-w-[30rem] rounded-[8px] border border-white/15 bg-[#050505]/92 p-6 text-center backdrop-blur sm:p-7">
                <p className="flex items-center justify-center gap-2 font-[family-name:var(--font-poppins)] text-[0.65rem] font-medium uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: ACCENT }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: ACCENT }} />
                  </span>
                  Live right now
                </p>
                <p className="mt-4 font-[family-name:var(--font-poppins)] text-[20px] font-semibold leading-snug">
                  Welcome back{session.name ? `, ${session.name}` : ""}.
                  <span className="block text-white/55">See who’s here, room by room.</span>
                </p>
                <Link href="/members" className="group mx-auto mt-5 inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-[4px] px-5 font-[family-name:var(--font-poppins)] text-[14px] font-semibold text-[#050505] transition-colors hover:bg-[#e2b34e]" style={{ background: ACCENT }}>
                  Open the members area
                  <ForwardArrow />
                </Link>
                <p className="mt-3 text-[11.5px] text-white/35">Check in, RSVP and find other members there.</p>
              </div>
            </div>
          )}
          {!member && (
            <div className="absolute inset-0 grid place-items-center">
              {/* The "you're missing out" card for visitors: real numbers, blurred faces, member perks. */}
              <div className="mx-4 w-full max-w-[30rem] rounded-[8px] border border-white/15 bg-[#050505]/92 p-6 text-center backdrop-blur sm:p-7">
                <p className="flex items-center justify-center gap-2 font-[family-name:var(--font-poppins)] text-[0.65rem] font-medium uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: ACCENT }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: ACCENT }} />
                  </span>
                  Live right now
                </p>
                <div className="mt-4 flex justify-center -space-x-2" aria-hidden="true">
                  {sample.slice(0, 5).map((p) => (
                    <Image key={p.name} src={p.photo ?? ""} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover blur-[3px] ring-2 ring-[#050505]" />
                  ))}
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#2a2a2a] text-[12px] font-semibold text-white/80 ring-2 ring-[#050505]">
                    +{Math.max(3, sample.length - 2)}
                  </span>
                </div>
                <p className={`mt-4 font-[family-name:var(--font-poppins)] text-[20px] font-semibold leading-snug`}>
                  {sample.length + 4} members are here right now.
                  <span className="block text-white/55">You could be one of them.</span>
                </p>
                <ul className="mx-auto mt-4 max-w-xs space-y-1.5 text-left text-[13.5px] text-white/70">
                  {["See who's in each room, live", "Drop in to any open studio, no booking", "Members-only nights and member ticket prices"].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a030]" />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => window.location.assign("/start?path=collective&from=whats-on")}
                    className="h-10 whitespace-nowrap rounded-[4px] px-5 font-[family-name:var(--font-poppins)] text-[14px] font-semibold text-[#050505] transition-colors hover:bg-[#e2b34e]"
                    style={{ background: ACCENT }}
                  >
                    Become a member
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginOpen(true)}
                    className="h-10 whitespace-nowrap rounded-[4px] border border-white/25 px-5 font-[family-name:var(--font-poppins)] text-[14px] font-medium text-white/85 transition-colors hover:border-white/60"
                  >
                    Already a member? Sign in
                  </button>
                </div>
                <p className="mt-3 text-[11.5px] text-white/35">Members check in automatically when they arrive, or with one tap in the app.</p>
              </div>
            </div>
          )}
        </div>

        {fullWho && (
          <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold">
                Check in <span className="font-normal text-white/50">(in real life: automatic when you arrive, or one tap in the members app)</span>
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Seg
                  label="Check in to a room"
                  value={me?.room ?? ""}
                  onChange={(v) => checkIn(v)}
                  options={ROOMS.map((r) => [r.id, r.name] as [string, string])}
                />
                {me && (
                  <button
                    type="button"
                    onClick={() => setSession({ checkedIn: null })}
                    className="flex h-9 items-center gap-2 rounded-[4px] border border-white/20 px-3.5 font-[family-name:var(--font-poppins)] text-[13px] font-medium text-white/80 transition-colors hover:border-white/50 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    Check out
                  </button>
                )}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-[14px]">
              <span className="text-white/70">Show me to other members</span>
              <button
                type="button"
                role="switch"
                aria-checked={showMe}
                onClick={() => setSession({ showMe: !showMe })}
                className={`relative h-6 w-11 rounded-full transition-colors ${showMe ? "bg-[#d4a030]" : "bg-white/20"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${showMe ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </label>
          </div>
        )}
      </section>

      {/* ── Event details ── */}
      {open && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/50" onClick={() => setOpen(null)} role="presentation">
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={title(open)}
            onClick={(e) => e.stopPropagation()}
            className="vo-slide vo-scroll h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#101010] p-6 sm:p-8"
          >
            <button type="button" onClick={() => setOpen(null)} className="float-right text-[14px] text-white/60 hover:text-white" aria-label="Close">
              ✕
            </button>
            <p className="flex items-center gap-2 text-[13px] text-white/60">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: catOf(open.category).color }} />
              {catOf(open.category).name}
              {open.visibility !== "public" && (
                <span className="rounded-[3px] border border-white/20 px-2 py-0.5 text-[11px] uppercase tracking-wider">
                  {open.visibility === "members" ? "Members only" : open.invited && member ? "Private · you're invited" : "Private"}
                </span>
              )}
            </p>
            <h3 className="mt-3 font-[family-name:var(--font-poppins)] text-3xl font-semibold leading-tight tracking-tight">{title(open)}</h3>
            <dl className="mt-5 space-y-2 text-[15px]">
              <div className="flex gap-3">
                <dt className="w-16 text-white/45">When</dt>
                <dd>
                  {fmtDay(open.start, now)}, {fmtRange(open)}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 text-white/45">Where</dt>
                <dd>{roomOf(open.room).name}</dd>
              </div>
              {!locked(open) && open.price && (
                <div className="flex gap-3">
                  <dt className="w-16 text-white/45">Cost</dt>
                  <dd>
                    {member && /\$/.test(open.price) ? (
                      <>
                        <s className="text-white/40">{open.price}</s> <span className="font-semibold text-[#d4a030]">{ticketPrice(open, true)}</span>{" "}
                        <span className="text-white/55">member price</span>
                      </>
                    ) : (
                      open.price
                    )}
                  </dd>
                </div>
              )}
            </dl>
            {locked(open) ? (
              <div className="mt-6 rounded-[6px] border border-white/12 bg-white/[0.04] p-4 text-[14px] text-white/75">
                {open.visibility === "members" ? (
                  <>
                    Details are for members.{" "}
                    <button type="button" onClick={() => (setOpen(null), setLoginOpen(true))} className="font-semibold underline underline-offset-2" style={{ color: ACCENT }}>
                      Sign in
                    </button>{" "}
                    to see them and RSVP.
                  </>
                ) : (
                  <>This room is booked for a private event. Want it for yours? Rooms can be booked for parties, shoots and team days.</>
                )}
              </div>
            ) : (
              <>
                <p className="mt-6 text-[15px] leading-relaxed text-white/75">{open.blurb}</p>
                {open.hostNote && (
                  <p className="mt-4 text-[14px] leading-relaxed text-white/70">
                    <span className="font-[family-name:var(--font-poppins)] text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: ACCENT }}>Coming alone? </span>
                    {open.hostNote.replace(/^Coming alone\?\s*/i, "")}
                  </p>
                )}
                {open.slug && (
                  <Link href={`/studio-productions/${open.slug}`} className="mt-4 inline-block text-[14px] text-white/70 underline underline-offset-4 hover:text-white">
                    Full details
                  </Link>
                )}
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {!locked(open) && (
                <>
                  {/\$/.test(open.price) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(null);
                        buyTickets(open);
                      }}
                      className="rounded-[4px] px-5 py-2.5 text-[14px] font-semibold text-[#050505]"
                      style={{ background: ACCENT }}
                    >
                      Get tickets · {ticketPrice(open, member)}{member && " member price"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const nextRsvp = rsvp.includes(open.id) ? rsvp.filter((x) => x !== open.id) : [...rsvp, open.id];
                        setRsvp(nextRsvp);
                        setSession({ rsvps: nextRsvp.length });
                        say(rsvp.includes(open.id) ? "RSVP removed" : "You're on the list (demo)");
                      }}
                      className="rounded-[4px] px-5 py-2.5 text-[14px] font-semibold text-[#050505]"
                      style={{ background: ACCENT }}
                    >
                      {rsvp.includes(open.id) ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Check /> You&apos;re going
                        </span>
                      ) : (
                        "RSVP"
                      )}
                    </button>
                  )}
                  <button type="button" onClick={() => download(open)} className="rounded-[4px] border border-white/20 px-5 py-2.5 text-[14px] font-semibold hover:border-white/50">
                    Add to calendar
                  </button>
                </>
              )}
              {open.visibility === "private" && !open.invited && (
                <button type="button" onClick={() => bookRoom(open.room)} className="rounded-[4px] border border-white/20 px-5 py-2.5 text-[14px] font-semibold hover:border-white/50">
                  Book a room
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ── Demo login: just a first name, so the demo can greet them ── */}
      {loginOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" onClick={() => setLoginOpen(false)} role="presentation">
          <form
            role="dialog"
            aria-modal="true"
            aria-label="Member login"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const name = cleanName(new FormData(e.currentTarget).get("name")?.toString() ?? "");
              if (!name) return;
              setSession({ member: true, loginOpen: false, name });
              // A fresh, personal greeting each time; no jump down the page.
              say(greet(name), 4500, true);
            }}
            className="vo-pop w-full max-w-sm rounded-[8px] border border-white/12 bg-[#101010] p-6"
          >
            <h3 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold">Member login</h3>
            <p className="mt-2 text-[14px] text-white/60">
              Preview: tell us your first name and we&apos;ll show you the members&apos; view. (Real member logins are on the way: a one-tap link by email, no passwords.)
            </p>
            <label className="mt-4 block text-[13px] font-semibold text-white/70" htmlFor="vo-name">
              Your first name
            </label>
            <input
              id="vo-name"
              name="name"
              autoFocus
              required
              maxLength={20}
              autoComplete="given-name"
              placeholder="e.g. George"
              className="mt-1.5 w-full rounded-[6px] border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/30 focus:border-[#d4a030] focus:outline-none"
            />
            <button type="submit" className="mt-3 w-full rounded-[4px] py-2.5 font-[family-name:var(--font-poppins)] text-[15px] font-semibold text-[#050505]" style={{ background: ACCENT }}>
              See the members’ view
            </button>
            <p className="mt-3 text-center text-[12px] text-white/40">Your name stays in this browser tab. Nothing is sent or saved.</p>
          </form>
        </div>
      )}

      {/* Your own actions get a quiet confirmation, bottom-centre. Everyone else's news is the live feed. */}
      {toast && (
        <p
          role="status"
          className="vo-pop fixed bottom-24 left-1/2 z-[90] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-[6px] border border-white/12 bg-[#141414]/95 px-3.5 py-2 text-[13px] text-white/85 shadow-xl backdrop-blur sm:bottom-6"
        >
          {toastFace && session.name ? <MeAvatar name={session.name} size={22} /> : <Check className="h-4 w-4 shrink-0 text-[#d4a030]" />}
          {toast}
        </p>
      )}
      {/* "Live at SoundPlex" now lives in the root layout (SiteLiveFeed), on every page. */}
      {/* The calendar's branded hover card (Month / Week / Day). */}
      <CalTipLayer />
    </div>
  );
}

/* ───────────────────────────── List ───────────────────────────── */
function ListView({
  items,
  now,
  title,
  locked,
  onOpen,
  rsvp,
  member,
  onUpcoming,
}: {
  onUpcoming?: () => void;
  items: VenueEvent[];
  now: Date;
  title: (e: VenueEvent) => string;
  locked: (e: VenueEvent) => boolean;
  onOpen: (e: VenueEvent) => void;
  rsvp: string[];
  member: boolean;
}) {
  const groups: { key: string; day: Date; items: VenueEvent[] }[] = [];
  for (const e of items) {
    const k = dayKey(e.start);
    const g = groups.find((x) => x.key === k);
    if (g) g.items.push(e);
    else groups.push({ key: k, day: e.start, items: [e] });
  }
  if (!groups.length)
    return onUpcoming ? (
      <div className="border-y border-white/[0.08] py-10 text-center">
        <p className="text-[15px] text-white/70">Nothing else on {now.getHours() >= 17 ? "tonight" : "today"}.</p>
        <button
          type="button"
          onClick={onUpcoming}
          className="group mx-auto mt-3 flex items-center gap-1.5 font-[family-name:var(--font-poppins)] text-[13.5px] font-medium text-[#d4a030]"
        >
          See what&apos;s coming up <ForwardArrow />
        </button>
      </div>
    ) : (
      <Empty />
    );
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="sticky top-[118px] z-10 -mx-1 border-b border-white/[0.08] bg-[#050505]/95 px-1 pb-2 pt-3 font-[family-name:var(--font-poppins)] text-[12px] font-medium uppercase tracking-[0.18em] text-white/55 backdrop-blur">
            {fmtDay(g.day, now)}
          </h3>
          <ul className="divide-y divide-white/[0.06]">
            {g.items.map((e) => {
              const c = catOf(e.category);
              const isNow = e.start <= now && e.end > now;
              return (
                <li key={e.id}>
                  <button type="button" onClick={() => onOpen(e)} className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-[6px] px-2 py-3 text-left transition-colors hover:bg-white/[0.035] sm:gap-4">
                    <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                    <span className="w-16 shrink-0 text-[13.5px] tabular-nums text-white/45 sm:w-20">{fmtTime(e.start)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`truncate text-[15.5px] font-medium ${locked(e) ? "italic text-white/50" : "text-white/90"}`}>{title(e)}</span>
                        {locked(e) && <Lock />}
                        {isNow && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: ACCENT }} />
                            Now
                          </span>
                        )}
                        {rsvp.includes(e.id) && <span className="inline-flex items-center gap-1 text-[12px] text-[#ffd27a]">
                            <Check className="h-3.5 w-3.5" /> going
                          </span>}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-white/40">
                        <span className="max-sm:hidden">{c.name} · </span>
                        {roomOf(e.room).name} · until {fmtTime(e.end)}
                        {!locked(e) && e.price && <span className="sm:hidden"> · {e.price}</span>}
                      </span>
                    </span>
                    <span className="w-20 shrink-0 text-right text-[13.5px] tabular-nums text-white/60 max-sm:hidden">{locked(e) ? "" : member && /\$/.test(e.price) ? <span className="text-[#d4a030]">{ticketPrice(e, true)}</span> : e.price}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ───────────────────────────── Calendar: Day / Week / Month ───────────────────────────── */
function CalendarView({
  mode,
  setMode,
  dayOffset,
  setDayOffset,
  monthOffset,
  setMonthOffset,
  events,
  now,
  picked,
  setPicked,
  title,
  locked,
  onOpen,
}: {
  mode: CalMode;
  setMode: (m: CalMode) => void;
  dayOffset: number;
  setDayOffset: (n: number) => void;
  monthOffset: number;
  setMonthOffset: (n: number) => void;
  events: VenueEvent[];
  now: Date;
  picked: string | null;
  setPicked: (k: string | null) => void;
  title: (e: VenueEvent) => string;
  locked: (e: VenueEvent) => boolean;
  onOpen: (e: VenueEvent) => void;
}) {
  const anchor = new Date(now);
  anchor.setHours(0, 0, 0, 0);
  anchor.setDate(anchor.getDate() + dayOffset);
  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() - anchor.getDay());
  const week = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  const monthFirst = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);

  const heading =
    mode === "day"
      ? anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      : mode === "week"
        ? `${week[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${week[6].toLocaleDateString("en-US", week[6].getMonth() === week[0].getMonth() ? { day: "numeric" } : { month: "short", day: "numeric" })}, ${week[6].getFullYear()}`
        : monthFirst.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const step = (dir: 1 | -1) =>
    mode === "month" ? setMonthOffset(monthOffset + dir) : setDayOffset(dayOffset + dir * (mode === "week" ? 7 : 1));
  const goToday = () => {
    setDayOffset(0);
    setMonthOffset(0);
  };
  const showDay = (d: Date) => {
    const t0 = new Date(now);
    t0.setHours(0, 0, 0, 0);
    setDayOffset(Math.round((d.getTime() - t0.getTime()) / 86_400_000));
    setMode("day");
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold">{heading}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Seg
            label="Calendar range"
            value={mode}
            onChange={(v) => setMode(v as CalMode)}
            options={[
              ["day", "Day"],
              ["week", "Week"],
              ["month", "Month"],
            ]}
          />
          <NavBtn onClick={() => step(-1)} label={`Previous ${mode}`}>
            ‹
          </NavBtn>
          <button type="button" onClick={goToday} className="h-8 rounded-[4px] border border-white/15 px-3 text-[13px] hover:border-white/40">
            Today
          </button>
          <NavBtn onClick={() => step(1)} label={`Next ${mode}`}>
            ›
          </NavBtn>
        </div>
      </div>
      {mode === "month" ? (
        <MonthView events={events} now={now} offset={monthOffset} picked={picked} setPicked={setPicked} title={title} locked={locked} onOpen={onOpen} />
      ) : (
        <TimeGrid
          days={mode === "day" ? [anchor] : week}
          events={events}
          now={now}
          title={title}
          locked={locked}
          onOpen={onOpen}
          onPickDay={mode === "week" ? showDay : undefined}
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Month ───────────────────────────── */
function MonthView({
  events,
  now,
  offset,
  picked,
  setPicked,
  title,
  locked,
  onOpen,
}: {
  events: VenueEvent[];
  now: Date;
  offset: number;
  picked: string | null;
  setPicked: (k: string | null) => void;
  title: (e: VenueEvent) => string;
  locked: (e: VenueEvent) => boolean;
  onOpen: (e: VenueEvent) => void;
}) {
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const startPad = first.getDay();
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(startPad).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];
  while (cells.length % 7) cells.push(null);
  const byDay = (d: Date) => events.filter((e) => sameDay(e.start, d));
  const pickedDay = cells.find((c) => c && dayKey(c) === picked) ?? null;

  return (
    <div>
      <div className="grid grid-cols-7 overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#080808]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="border-b border-white/[0.08] px-3 py-2.5 font-[family-name:var(--font-poppins)] text-[0.62rem] font-medium uppercase tracking-[0.2em] text-white/40">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`x${i}`} className="min-h-[5.5rem] border-b border-r border-white/[0.05] bg-black/40 sm:min-h-[8.5rem]" />;
          const list = byDay(d);
          const isToday = sameDay(d, now);
          const past = d < new Date(new Date(now).setHours(0, 0, 0, 0));
          const sel = picked === dayKey(d);
          return (
            <div
              key={dayKey(d)}
              role="button"
              tabIndex={0}
              aria-label={d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              onClick={() => setPicked(sel ? null : dayKey(d))}
              onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), setPicked(sel ? null : dayKey(d)))}
              className={`flex min-h-[5.5rem] cursor-pointer flex-col border-b border-r p-1.5 outline-none ${isToday ? "border-transparent" : "border-white/[0.05]"} transition-colors hover:bg-white/[0.03] focus-visible:shadow-[inset_0_0_0_1px_rgba(212,160,48,0.6)] sm:min-h-[8.5rem] sm:p-2.5 ${
                // Today: no border, no gold — just a slightly lighter shade of black/grey than the
                // other days (Ed); the gold date circle does the rest. Picked: the same, a touch less.
                isToday
                  ? "bg-white/[0.085]"
                  : sel
                    ? "bg-white/[0.035]"
                    : ""
              } ${past ? "opacity-45" : ""}`}
            >
              {/* The date, always top-left. */}
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-[family-name:var(--font-poppins)] text-[13px] tabular-nums leading-none ${isToday ? "font-semibold text-[#050505]" : "text-white/75"}`}
                style={isToday ? { background: ACCENT } : undefined}
              >
                {d.getDate()}
              </span>
              {/* Events: a small dot for the category, the time, the title. Calm, no boxes. */}
              <span className="mt-1.5 hidden flex-col gap-px sm:flex">
                {list.slice(0, 3).map((e) => {
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={(ev) => (ev.stopPropagation(), onOpen(e))}
                      onMouseEnter={(ev) => showTip(e, title(e), ev.currentTarget)}
                      onMouseLeave={hideTip}
                      onFocus={(ev) => showTip(e, title(e), ev.currentTarget)}
                      onBlur={hideTip}
                      className="flex w-full items-start gap-[5px] rounded-[3px] px-0.5 py-[3px] text-left transition-colors hover:bg-white/[0.07]"
                    >
                      <span className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: catOf(e.category).color }} />
                      <span className="w-[30px] shrink-0 pt-px text-[10px] tabular-nums lowercase text-white/40">{shortTime(e.start)}</span>
                      {/* Long titles: two lines at most, then "…" — the full title on hover (Ed). */}
                      <span
                        className={`line-clamp-2 min-w-0 text-[12px] leading-tight [overflow-wrap:anywhere] ${locked(e) ? "italic text-white/45" : "text-white/85"}`}
                      >
                        {title(e)}
                      </span>
                    </button>
                  );
                })}
                {list.length > 3 && <span className="px-1 pt-0.5 text-[10.5px] font-medium tracking-wide text-white/40">+{list.length - 3} more</span>}
              </span>
              <span className="mt-1.5 flex flex-wrap gap-1 sm:hidden">
                {list.slice(0, 4).map((e) => (
                  <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: catOf(e.category).color }} />
                ))}
              </span>
            </div>
          );
        })}
      </div>
      {pickedDay && (
        <div className="vo-pop mt-4 rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
          <p className="font-semibold">{pickedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <ul className="mt-2 divide-y divide-white/[0.07]">
            {byDay(pickedDay).map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => onOpen(e)} className="flex w-full items-center gap-3 py-2.5 text-left hover:text-white">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: catOf(e.category).color }} />
                  <span className="w-28 text-[13px] tabular-nums text-white/60">{fmtRange(e)}</span>
                  <span className="flex-1 text-[15px]">{title(e)}</span>
                  {locked(e) && <Lock />}
                  <span className="text-[13px] text-white/50">{roomOf(e.room).name}</span>
                </button>
              </li>
            ))}
            {!byDay(pickedDay).length && <li className="py-2 text-[14px] text-white/50">Nothing on that day.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Rooms ───────────────────────────── */
const OPEN_H = 9;
const CLOSE_H = 24;
function RoomsView({
  events,
  now,
  offset,
  setOffset,
  title,
  locked,
  onOpen,
}: {
  events: VenueEvent[];
  now: Date;
  offset: number;
  setOffset: (n: number) => void;
  title: (e: VenueEvent) => string;
  locked: (e: VenueEvent) => boolean;
  onOpen: (e: VenueEvent) => void;
}) {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() + offset);
  const span = CLOSE_H - OPEN_H;
  // Hours since the start of the shown day (so midnight at the end of the day is 24, not 0).
  const pos = (d: Date) => (((d.getTime() - day.getTime()) / 3_600_000 - OPEN_H) / span) * 100;
  const isToday = offset === 0;
  const nowPct = pos(now);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold">{fmtDay(day, now)}</h3>
        <div className="flex gap-1.5">
          <NavBtn onClick={() => setOffset(offset - 1)} label="Previous day">
            ‹
          </NavBtn>
          <button type="button" onClick={() => setOffset(0)} className="h-8 rounded-[4px] border border-white/15 px-3 text-[13px] hover:border-white/40">
            Today
          </button>
          <NavBtn onClick={() => setOffset(offset + 1)} label="Next day">
            ›
          </NavBtn>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[8px] border border-white/[0.08] bg-[#080808]">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[8.5rem_1fr] border-b border-white/[0.08]">
            <div />
            <div className="relative h-9">
              {Array.from({ length: span + 1 }, (_, i) => OPEN_H + i)
                .filter((h) => h % 2 === 1 || h === 24)
                .map((h) => (
                  <span key={h} className={`absolute top-2.5 text-[10.5px] ${h === 24 ? "-translate-x-full pr-1" : "-translate-x-1/2"} tabular-nums lowercase text-white/35`} style={{ left: `${((h - OPEN_H) / span) * 100}%` }}>
                    {h === 24 ? "12a" : h > 12 ? `${h - 12}p` : h === 12 ? "12p" : `${h}a`}
                  </span>
                ))}
            </div>
          </div>
          {ROOMS.map((r, ri) => {
            const list = events.filter((e) => e.room === r.id && sameDay(e.start, day));
            return (
              <div key={r.id} className="grid grid-cols-[8.5rem_1fr] border-b border-white/[0.05] last:border-0">
                <div className="flex flex-col justify-center px-4">
                  <span className="font-[family-name:var(--font-poppins)] text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">{r.name}</span>
                  <span className="text-[11px] text-white/35">holds {r.capacity}</span>
                </div>
                <div className="relative h-16">
                  {Array.from({ length: span }, (_, i) => (
                    <span key={i} className="absolute inset-y-0 w-px bg-white/[0.035]" style={{ left: `${(i / span) * 100}%` }} />
                  ))}
                  {list.map((e) => {
                    const c = catOf(e.category);
                    const l = Math.max(0, pos(e.start));
                    const w = Math.min(100, pos(e.end)) - l;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onOpen(e)}
                        onMouseEnter={(ev) => showTip(e, title(e), ev.currentTarget)}
                        onMouseLeave={hideTip}
                        onFocus={(ev) => showTip(e, title(e), ev.currentTarget)}
                        onBlur={hideTip}
                        className="absolute inset-y-2.5 overflow-hidden rounded-[5px] bg-white/[0.085] px-2.5 text-left text-[12px] leading-tight transition-colors hover:bg-white/[0.13]"
                        style={{ left: `calc(${l}% + 1px)`, width: `calc(${w}% - 2px)` }}
                      >
                        {/* One line, "…" when it doesn't fit; the hover card shows the full title (Ed). */}
                        <span className="flex min-w-0 max-w-full items-center gap-1.5 pt-1.5">
                          <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: c.color }} />
                          <span className={`min-w-0 truncate font-medium ${locked(e) ? "italic text-white/50" : "text-white/90"}`}>{title(e)}</span>
                        </span>
                        <span className="block truncate pl-[12px] text-white/40">{fmtRange(e)}</span>
                      </button>
                    );
                  })}
                  {isToday && nowPct >= 0 && nowPct <= 100 && (
                    <span className="pointer-events-none absolute inset-y-0 z-10 w-px" style={{ left: `${nowPct}%`, background: ACCENT }}>
                      {ri === 0 && <span className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-[12.5px] text-white/45">Every room, side by side. The gold line is now. Private bookings show as booked, without the details.</p>
    </div>
  );
}

function Avatar({ p, dim, me }: { p: Here; dim?: boolean; me?: string }) {
  if (p.you) {
    // You: your own photo or initial, ringed in the brand colour (faded when hidden from others).
    return (
      <span title={dim ? "You (hidden from other members)" : "You"} className={`inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ${dim ? "opacity-50 ring-white/30" : "ring-[#4cc773]"}`}>
        <MeAvatar name={me ?? "You"} size={36} />
      </span>
    );
  }
  return <Image src={p.photo ?? ""} alt={p.name} title={p.name} width={40} height={40} className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[#0e0e0e]" />;
}

/** The page's one toggle style: a dark track, the active option filled in soft gold. */
function Seg({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="no-scrollbar flex max-w-full shrink-0 overflow-x-auto rounded-[6px] bg-white/[0.05] p-1" role="tablist" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          role="tab"
          aria-selected={value === v}
          type="button"
          onClick={() => onChange(v)}
          className={`whitespace-nowrap rounded-[4px] px-3.5 py-1.5 font-[family-name:var(--font-poppins)] text-[13.5px] font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-[#d4a030] ${
            value === v ? "bg-[#d4a030]/[0.16] text-[#d4a030]" : "text-white/55 hover:text-white"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Chip({ onClear, children }: { onClear: () => void; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-white/80">
      {children}
      <button type="button" onClick={onClear} aria-label="Remove filter" className="text-white/40 hover:text-white">
        ✕
      </button>
    </span>
  );
}

function NavBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid h-8 w-8 place-items-center rounded-[4px] border border-white/15 text-lg leading-none hover:border-white/40">
      {children}
    </button>
  );
}

function Lock() {
  return (
    <svg aria-label="Locked" viewBox="0 0 24 24" className="inline h-3.5 w-3.5 shrink-0 text-white/45" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function Empty() {
  return <p className="rounded-[8px] border border-white/10 bg-white/[0.03] p-8 text-center text-white/55">Nothing matches those filters. Try clearing one.</p>;
}
