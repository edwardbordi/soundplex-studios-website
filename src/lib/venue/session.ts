"use client";

import { useSyncExternalStore } from "react";
import type { VenueEvent } from "./data";
import { membersConfigured } from "../members/env";

/**
 * The member session on What's On (SoundPlex). PREVIEW: a demo login (first name only) until
 * the members wave brings real accounts (Supabase magic link — SITE-STRUCTURE-BRIEF §11.2), shared by the header's account menu and the
 * calendar (they sit in different parts of the page). Remembered in this browser across the site.
 */
export type VenueSession = {
  member: boolean;
  loginOpen: boolean;
  showMe: boolean;
  /** The room you're checked into, if any. */
  checkedIn: string | null;
  /** The room you said you're heading to (not in the building yet). */
  onWay: string | null;
  rsvps: number;
  /** The "book a room for an event" form: open (with an optional room), or null. */
  enquiry: { room?: string } | null;
  /** The ticket checkout: the event being bought, or null. */
  tickets: VenueEvent | null;
  /** The visitor's first name, asked at the demo login so the demo speaks to them. */
  name: string;
  /** A real member's profile photo (Supabase storage URL), or "" for their initial. */
  photo: string;
};

const INITIAL: VenueSession = { member: false, loginOpen: false, showMe: true, checkedIn: null, onWay: null, rsvps: 0, name: "", photo: "", enquiry: null, tickets: null };

/**
 * Remembered across the whole site (Ed, 2026-10-28): who you are and where you are survive page
 * loads and refreshes, in this browser, until you log out. Only these fields are kept — never an
 * open sheet or a half-done checkout. (The members wave swaps this for a real signed-in session.)
 */
const KEY = "sp-member-session";
const KEPT = ["member", "name", "photo", "showMe", "checkedIn", "onWay", "rsvps"] as const;
function load(): VenueSession {
  if (typeof window === "undefined") return INITIAL;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return INITIAL;
    const saved = JSON.parse(raw) as Partial<VenueSession>;
    const out = { ...INITIAL };
    for (const k of KEPT) if (k in saved) (out as Record<string, unknown>)[k] = saved[k];
    return out;
  } catch {
    return INITIAL;
  }
}
function save(s: VenueSession) {
  try {
    if (!s.member) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(KEPT.map((k) => [k, s[k]]))));
  } catch {
    /* private mode / blocked storage: the session just lasts this page */
  }
}

let state = load();
const subs = new Set<() => void>();

export const MEMBER_SINCE = "Member since 2024";

/** Tidy what someone typed into a first name: one word, capitalised, short. */
export function cleanName(raw: string): string {
  const w = raw.trim().split(/\s+/)[0]?.slice(0, 20) ?? "";
  return w ? w[0].toUpperCase() + w.slice(1) : "";
}

/** Ed (Realiiz) gets his own photo when he demos it; everyone else gets their initial. */
export function photoFor(name: string): string | undefined {
  void name;
  return undefined; // the members wave: the member's own photo from their profile
}

export function setSession(patch: Partial<VenueSession>) {
  // REAL members (Ed, 2026-10-28): once the members project is connected, every "Log in" in the
  // UI (the account menu, the members preview, the board) goes to the real emailed-link sign-in
  // instead of the demo first-name prompt. MemberBridge then fills this session from Supabase.
  if (patch.loginOpen && membersConfigured() && typeof window !== "undefined") {
    const back = window.location.pathname + window.location.hash;
    window.location.assign(`/members/sign-in?next=${encodeURIComponent(back || "/studio-productions#members")}`);
    return;
  }
  state = { ...state, ...patch };
  save(state);
  subs.forEach((f) => f());
}

function subscribe(f: () => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

export function useVenueSession() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
}

/**
 * Get tickets (SoundPlex): a REAL event goes straight to George's ticket link (GHL payment link,
 * Eventbrite…); a SAMPLE opens the demo checkout so the preview still shows the flow.
 */
export function buyTickets(e: VenueEvent | null) {
  if (e && e.url && !e.sample && !e.url.startsWith("#")) {
    window.open(e.url, "_blank", "noopener,noreferrer");
    return;
  }
  setSession({ tickets: e });
}

/** Book a room (SoundPlex): the guided survey at /start, with the room already chosen. */
export function bookRoom(room?: string) {
  window.location.assign(`/start?path=room${room ? `&room=${room}` : ""}`);
}
