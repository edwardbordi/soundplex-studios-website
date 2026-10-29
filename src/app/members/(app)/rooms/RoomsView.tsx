"use client";

import Image from "next/image";
import Link from "next/link";
import type { CalItem } from "../../../../lib/events/constants";
import { ROOMS, bookRoomHref } from "../../../../lib/venue/data";
import { setSession, useVenueSession } from "../../../../lib/venue/session";
import { Em, PANEL, PageHead, eventTitle, fmtRange, isLive, useEvents, useNow } from "../shared";

/**
 * Rooms (members): each room with what's on now, the rest of today, and two actions: check in,
 * or book it (the guided form, room pre-filled). Member room reservations (George's rules) will
 * replace "Book" once they're set.
 */
export default function RoomsView({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const now = useNow();
  const s = useVenueSession();
  const events = useEvents(items, showSamples, now);

  if (!now) return <div className="h-96" aria-hidden="true" />;

  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();

  return (
    <>
      <PageHead
        eyebrow="Rooms"
        title={
          <>
            Your <Em>rooms.</Em>
          </>
        }
        sub="What’s happening in each room today. Check in when you arrive, or book one for your own session."
      />
      <div className="space-y-6">
        {ROOMS.map((r) => {
          const today = events.filter((e) => e.room === r.id && e.end > now && e.start.getTime() < endOfDay);
          const live = today.find((e) => isLive(e, now) && !e.ambient) ?? today.find((e) => isLive(e, now));
          const mine = s.checkedIn === r.id;
          return (
            <section key={r.id} className={`${PANEL} grid overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]`}>
              <div className="relative min-h-52 bg-[#050505]">
                <Image src={r.photo} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-5 bottom-4 text-white">
                  <p className="font-[family-name:var(--font-poppins)] text-[24px] font-medium">{r.name}</p>
                  <p className="text-[13px] text-white/70">Up to {r.capacity} people</p>
                </div>
              </div>
              <div className="flex flex-col p-5 sm:p-6">
                <p className="flex items-center gap-2 text-[14.5px]">
                  <span className={`h-2.5 w-2.5 rounded-full ${live ? "bg-[#e0559b]" : "bg-[#4cc773]"}`} aria-hidden="true" />
                  {live ? (
                    <span>
                      Now: <span className="font-medium">{eventTitle(live)}</span> <span className="text-(--mx-muted)">· {fmtRange(live)}</span>
                    </span>
                  ) : (
                    <span className="font-medium">Free right now</span>
                  )}
                </p>
                <p className="mt-5 text-[12px] uppercase tracking-[0.16em] text-(--mx-faint)">Rest of today</p>
                <ul className="mt-2 flex-1 space-y-1.5 text-[14px]">
                  {today.filter((e) => e !== live).map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <span className="w-36 shrink-0 text-(--mx-muted)">{fmtRange(e)}</span>
                      <span className="truncate">{eventTitle(e)}</span>
                    </li>
                  ))}
                  {today.filter((e) => e !== live).length === 0 && <li className="text-(--mx-muted)">Nothing else booked today.</li>}
                </ul>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={mine}
                    onClick={() => setSession({ checkedIn: r.id, onWay: null })}
                    className={`rounded-[4px] px-4 py-2 text-[14px] font-semibold ${mine ? "bg-[#4cc773]/15 text-(--mx-ok)" : "bg-(--mx-gold) text-[#141414] hover:brightness-110"}`}
                  >
                    {mine ? "You’re here" : s.checkedIn ? "Move here" : "Check in here"}
                  </button>
                  <Link href={bookRoomHref(r.id)} className="rounded-[4px] border border-(--mx-line-strong) px-4 py-2 text-[14px] text-(--mx-soft) hover:border-(--mx-gold) hover:text-(--mx-text)">
                    Book this room
                  </Link>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
