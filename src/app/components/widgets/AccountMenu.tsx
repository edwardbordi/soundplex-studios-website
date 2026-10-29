"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ROOMS } from "../../../lib/venue/data";
import { MEMBER_SINCE, setSession, useVenueSession } from "../../../lib/venue/session";
import MeAvatar from "./MeAvatar";
import { membersBrowser } from "../../../lib/members/browser";
import { membersConfigured } from "../../../lib/members/env";

/**
 * Top-right account area for the SoundPlex demo, like a SaaS app: "Log in" when signed
 * out; an avatar with a menu once you're in (Ed, 2026-10-10).
 */
const GOLD = "#d4a030";

export default function AccountMenu() {
  const s = useVenueSession();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!s.member) {
    return (
      <button
        type="button"
        onClick={() => {
          // Real members: straight to the emailed-link sign-in (setSession routes loginOpen there).
          // Preview: the demo login lives on Studio Productions; from any other page, go there first.
          if (membersConfigured() || document.getElementById("members")) setSession({ loginOpen: true });
          else window.location.assign("/studio-productions#members");
        }}
        aria-label="Sign in"
        className="nav-link flex h-9 items-center gap-2 px-1"
      >
        {/* Desktop: just the words (Ed, 2026-10-29: more room). Phones keep the icon, where the words are hidden. */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 lg:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
        <span className="max-sm:hidden">Sign in</span>
      </button>
    );
  }

  const room = ROOMS.find((r) => r.id === s.checkedIn);
  // On Studio Productions: scroll to the section. Anywhere else: go there.
  const go = (id: string) => {
    setOpen(false);
    // Real members: who's here and RSVPs live in the members area.
    if (membersConfigured()) {
      window.location.assign(id === "calendar" ? "/members/calendar" : "/members");
      return;
    }
    // On the page, What's On handles it ("calendar" also switches to the Calendar view).
    if (document.getElementById(id)) window.dispatchEvent(new CustomEvent("sp:view", { detail: id }));
    else window.location.assign(`/studio-productions#${id}`);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${s.name}`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center rounded-full p-1 text-white transition-[box-shadow] hover:shadow-[0_0_0_3px_rgba(212,160,48,0.35)]"
      >
        <span className="relative h-8 w-8 shrink-0 rounded-full ring-2" style={{ ["--tw-ring-color" as string]: GOLD }}>
          <MeAvatar name={s.name} photo={s.photo} size={32} />
          {room && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#050505] bg-[#4cc773]" aria-hidden="true" />}
        </span>
      </button>

      {open && (
        <div role="menu" className="vo-pop absolute right-0 top-full z-[70] mt-2 w-[19rem] overflow-hidden rounded-[8px] border border-white/12 bg-[#141414] text-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 p-4">
            <MeAvatar name={s.name} photo={s.photo} size={44} />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold">Welcome back, {s.name}</span>
              <span className="block text-[12.5px] text-white/50">{MEMBER_SINCE}</span>
            </span>
          </div>
          {/* Check in from anywhere (Ed, 2026-10-28): pick a room, move, or check out. */}
          <div className="border-b border-white/10 px-4 py-3 text-[13px]">
            <div className="flex items-center justify-between gap-2">
              {room ? (
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#4cc773]" /> Checked in · {room.name}
                </span>
              ) : s.onWay ? (
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#d4a030]" /> On your way · {ROOMS.find((r) => r.id === s.onWay)?.name}
                </span>
              ) : (
                <span className="text-white/55">Check in to a room</span>
              )}
              {room && (
                <button type="button" onClick={() => setSession({ checkedIn: null })} className="text-[12.5px] text-white/55 hover:text-white">
                  Check out
                </button>
              )}
            </div>
            {/* Sized to their names (not three equal thirds), so "SoundLounge" fits whole. */}
            <div className="mt-2.5 flex gap-1.5" role="group" aria-label="Check in to a room">
              {ROOMS.map((r) => {
                const here = s.checkedIn === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={here}
                    onClick={() => setSession({ checkedIn: r.id, onWay: null })}
                    title={here ? `You’re in ${r.name}` : `Check in to ${r.name}`}
                    className={`flex-auto whitespace-nowrap rounded-[4px] border px-2 py-1.5 text-[12px] transition-colors ${here ? "border-[#4cc773]/60 bg-[#4cc773]/15 text-white" : "border-white/12 text-white/70 hover:border-[#d4a030]/60 hover:text-white"}`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>
          <ul className="py-1.5 text-[14px]">
            {membersConfigured() && (
              <li>
                <Link href="/members" role="menuitem" onClick={() => setOpen(false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-[#e2b34e] hover:bg-white/[0.06]">
                  <Ico d="M3 12h4l3-8 4 16 3-8h4" />
                  Open members area
                </Link>
              </li>
            )}
            {membersConfigured() && (
              <li>
                <Link href="/members/account" role="menuitem" onClick={() => setOpen(false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.06]">
                  <Ico d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10" />
                  My profile &amp; password
                </Link>
              </li>
            )}
            <li>
              <button type="button" role="menuitem" onClick={() => go("members")} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.06]">
                <Ico d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
                Who&apos;s here now
              </button>
            </li>
            <li>
              <button type="button" role="menuitem" onClick={() => go("calendar")} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.06]">
                <Ico d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4" />
                <span className="flex-1">My RSVPs</span>
                <span className="rounded-full bg-white/10 px-2 text-[12px] text-white/70">{s.rsvps}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={s.showMe}
                onClick={() => setSession({ showMe: !s.showMe })}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.06]"
              >
                <Ico d={s.showMe ? "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6" : "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"} />
                <span className="flex-1">Show me to other members</span>
                <span className={`relative h-5 w-9 rounded-full transition-colors ${s.showMe ? "bg-[#d4a030]" : "bg-white/20"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${s.showMe ? "left-[18px]" : "left-0.5"}`} />
                </span>
              </button>
            </li>
          </ul>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setSession({ member: false, checkedIn: null, onWay: null });
              // Real members: end the Supabase session too.
              void membersBrowser()?.auth.signOut();
            }}
            className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[14px] text-white/70 hover:bg-white/[0.06] hover:text-white"
          >
            <Ico d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/** A small, clean line icon for the menu (inherits the text colour). */
function Ico({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-white/55" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
