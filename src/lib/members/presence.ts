"use client";

import { useEffect, useSyncExternalStore } from "react";
import { membersBrowser } from "./browser";

/**
 * Who's at the Plex right now (Ed, 2026-10-30), for the check-in dot on member avatars.
 * Read from public.check_ins. The database only returns live check-ins (4 h "here", 1 h "on my
 * way") of members who chose "Show me to other members", plus your own.
 * One shared copy per tab, refreshed every 30 s while anything shows it, and at once when you
 * check in or out (PRESENCE_EVENT).
 */
export type Presence = { room: string; kind: "here" | "on_way" };
export const PRESENCE_EVENT = "sp-members-presence";

const EMPTY = new Map<string, Presence>();
let map: Map<string, Presence> = EMPTY;
const subs = new Set<() => void>();
let timer: number | null = null;

async function refresh() {
  const sb = membersBrowser();
  if (!sb) return;
  const { data, error } = await sb.from("check_ins").select("member_id, room, kind");
  if (error) return;
  map = new Map(((data ?? []) as { member_id: string; room: string; kind: Presence["kind"] }[]).map((r) => [r.member_id, { room: r.room, kind: r.kind }]));
  subs.forEach((f) => f());
}

const onEvent = () => void refresh();

function subscribe(f: () => void) {
  subs.add(f);
  if (subs.size === 1) {
    void refresh();
    timer = window.setInterval(refresh, 30_000);
    window.addEventListener(PRESENCE_EVENT, onEvent);
  }
  return () => {
    subs.delete(f);
    if (!subs.size) {
      if (timer) window.clearInterval(timer);
      timer = null;
      window.removeEventListener(PRESENCE_EVENT, onEvent);
    }
  };
}

/** Everyone visible at the Plex: member id → where. */
export function usePresence(): Map<string, Presence> {
  const m = useSyncExternalStore(
    subscribe,
    () => map,
    () => EMPTY,
  );
  // Back on the tab after a while: catch up straight away.
  useEffect(() => {
    const back = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", back);
    return () => document.removeEventListener("visibilitychange", back);
  }, []);
  return m;
}
