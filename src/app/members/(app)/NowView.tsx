"use client";

import Image from "next/image";
import Link from "next/link";
import type { CalItem } from "../../../lib/events/constants";
import { MEMBERS, ROOMS, catOf, roomOf, type VenueEvent } from "../../../lib/venue/data";
import { setSession, useVenueSession } from "../../../lib/venue/session";
import { Avatar } from "./MemberShell";
import { EYEBROW, Em, PANEL, PageHead, eventTitle, fmtDay, fmtRange, isLive, toggleRsvp, useEvents, useNow, useRsvps } from "./shared";

/**
 * Now (Ed, 2026-10-29): the members' home. One tap to check in (or move rooms, or say you're on
 * your way), who's in which room, and what's on next with one-tap RSVPs.
 * Who's here is SAMPLE people until live check-ins (the next build); you appear for real.
 */
const SAMPLE_HERE = MEMBERS.slice(0, 6).map((m, i) => ({ ...m, room: ROOMS[i % ROOMS.length].id }));

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function NowView({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const now = useNow();
  const s = useVenueSession();
  const rsvps = useRsvps();
  const events = useEvents(items, showSamples, now);
  const first = s.name || "there";

  if (!now) return <div className="h-96" aria-hidden="true" />;

  const liveIn = (room: string) => events.find((e) => e.room === room && !e.ambient && isLive(e, now)) ?? events.find((e) => e.room === room && isLive(e, now));
  const upcoming = events.filter((e) => e.end > now && e.visibility !== "private" && !e.ambient).slice(0, 5);
  const here = s.checkedIn;
  const sampleIn = (room: string) => SAMPLE_HERE.filter((m) => m.room === room);

  return (
    <>
      <PageHead
        eyebrow={now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        title={
          <>
            {greeting(now)}, <Em>{first}.</Em>
          </>
        }
        sub={here ? `You’re checked into ${roomOf(here).name}${s.showMe ? "" : " (hidden from other members)"}.` : s.onWay ? `On your way to ${roomOf(s.onWay).name}.` : "You’re not checked in. Tap a room when you arrive."}
        // Check out lives in the top bar now, on every page (Ed, 2026-10-30).
      />

      {/* Check in */}
      <section aria-label="Check in" className="grid gap-4 sm:grid-cols-3">
        {ROOMS.map((r) => {
          const mine = here === r.id;
          const live = liveIn(r.id);
          const people = sampleIn(r.id).length + (mine ? 1 : 0);
          return (
            <div key={r.id} className={`group relative overflow-hidden rounded-[8px] rounded-bl-none border ${mine ? "border-(--mx-ok)" : "border-(--mx-line)"} bg-[#050505]`}>
              <div className="relative h-36 sm:h-40">
                <Image src={r.photo} alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-4 bottom-3 text-white">
                  <p className="font-[family-name:var(--font-poppins)] text-[19px] font-medium">{r.name}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[13px] text-white/75">
                    <span className={`h-2 w-2 rounded-full ${live ? "bg-[#e0559b]" : "bg-[#4cc773]"}`} aria-hidden="true" />
                    {live ? `${eventTitle(live)} · until ${live.end.toLocaleTimeString("en-US", { hour: "numeric", minute: live.end.getMinutes() ? "2-digit" : undefined })}` : "Free right now"}
                  </p>
                </div>
                {mine && <span className="absolute right-3 top-3 rounded-[4px] bg-[#4cc773] px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#06210f]">You’re here</span>}
              </div>
              <div className="flex items-center gap-2 bg-(--mx-raised) p-3">
                <span className="text-[13px] text-(--mx-muted)">{people ? `${people} member${people === 1 ? "" : "s"} here` : "Nobody yet"}</span>
                <span className="ml-auto flex gap-2">
                  {!mine && s.onWay !== r.id && !here && (
                    <button type="button" onClick={() => setSession({ onWay: r.id })} className="rounded-[4px] px-2.5 py-1.5 text-[13px] text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)">
                      On my way
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={mine}
                    onClick={() => setSession({ checkedIn: r.id, onWay: null })}
                    className={`rounded-[4px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${mine ? "bg-[#4cc773]/15 text-(--mx-ok)" : "bg-(--mx-gold) text-[#141414] hover:brightness-110"}`}
                  >
                    {mine ? "Checked in" : here ? "Move here" : "Check in"}
                  </button>
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Who's here */}
        <section className={`${PANEL} p-5 sm:p-6`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-[family-name:var(--font-poppins)] text-[18px] font-medium">Who’s here</h2>
            <Link href="/members/directory" className="text-[13.5px] text-(--mx-gold-text) hover:underline">
              All members
            </Link>
          </div>
          <div className="mt-4 space-y-5">
            {ROOMS.map((r) => {
              const ppl = sampleIn(r.id);
              const mine = here === r.id;
              if (!ppl.length && !mine) return null;
              return (
                <div key={r.id}>
                  <p className={EYEBROW}>{r.name}</p>
                  <ul className="mt-2 space-y-2">
                    {mine && (
                      <li className="flex items-center gap-3">
                        <span className="rounded-full ring-2 ring-(--mx-ok) ring-offset-2 ring-offset-(--mx-bg)">
                          <Avatar photo={s.photo} name={s.name} size={34} />
                        </span>
                        <span className="text-[14.5px]">
                          You {!s.showMe && <span className="text-(--mx-faint)">(hidden)</span>}
                        </span>
                      </li>
                    )}
                    {ppl.map((m) => (
                      <li key={m.name} className="flex items-center gap-3">
                        <span className="relative h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full">
                          <Image src={m.photo} alt="" fill sizes="34px" className="object-cover" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[14.5px]">
                            {m.name} {m.last}
                          </span>
                          <span className="block text-[12.5px] text-(--mx-muted)">{m.role}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-5 border-t border-(--mx-line) pt-4 text-[12.5px] text-(--mx-faint)">Sample people for now. Live check-ins from every member are coming next.</p>
        </section>

        {/* Coming up */}
        <section className={`${PANEL} p-5 sm:p-6`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-[family-name:var(--font-poppins)] text-[18px] font-medium">Coming up</h2>
            <Link href="/members/calendar" className="text-[13.5px] text-(--mx-gold-text) hover:underline">
              Full calendar
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-(--mx-line)">
            {upcoming.map((e) => (
              <EventRow key={e.id} e={e} now={now} going={rsvps.includes(e.id)} />
            ))}
            {!upcoming.length && <li className="py-6 text-[14px] text-(--mx-muted)">Nothing on the calendar yet.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}

export function EventRow({ e, now, going }: { e: VenueEvent; now: Date; going: boolean }) {
  const live = isLive(e, now);
  const cat = catOf(e.category);
  return (
    <li className="flex items-center gap-4 py-3.5">
      <div className="w-[4.5rem] shrink-0 text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-(--mx-faint)">{e.start.toLocaleDateString("en-US", { month: "short" })}</p>
        <p className="font-[family-name:var(--font-poppins)] text-[24px] font-medium leading-none">{e.start.getDate()}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-[15px] font-medium">
          {live && <span className="shrink-0 rounded-[3px] bg-[#e0559b] px-1.5 py-px text-[10.5px] font-bold uppercase tracking-wider text-white">Live</span>}
          <span className="truncate">{eventTitle(e)}</span>
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-(--mx-muted)">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} aria-hidden="true" />
            {fmtDay(e.start, now)}, {fmtRange(e)}
          </span>
          <span>· {roomOf(e.room).name}</span>
          {e.visibility === "members" && <span className="text-(--mx-gold-text)">· Members</span>}
        </p>
      </div>
      {e.visibility === "private" ? (
        <span className="shrink-0 text-[12.5px] text-(--mx-faint)">Room booked</span>
      ) : (
      <button
        type="button"
        onClick={() => toggleRsvp(e.id)}
        aria-pressed={going}
        className={`shrink-0 rounded-[4px] border px-3 py-1.5 text-[13px] font-medium transition-colors ${going ? "border-(--mx-ok) bg-[#4cc773]/12 text-(--mx-ok)" : "border-(--mx-line-strong) text-(--mx-soft) hover:border-(--mx-gold) hover:text-(--mx-text)"}`}
      >
        {going ? "Going ✓" : "RSVP"}
      </button>
      )}
    </li>
  );
}
