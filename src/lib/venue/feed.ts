"use client";

import { useSyncExternalStore } from "react";

/**
 * The live activity feed for the SoundPlex demo (Ed, 2026-10-11): little "what's happening"
 * notes, shown to each viewer by who they are. Members see members (full name, photo) coming and
 * going; everyone sees ticket sales (first name + last initial) and shows starting soon.
 * In memory only, simulated.
 */
export type FeedItem = {
  id: number;
  audience: "members" | "all";
  kind: "checkin" | "onway" | "left" | "ticket" | "soon" | "live" | "message";
  text: string;
  /** Who it's about, when it's a person. */
  who?: { name: string; photo?: string };
  at: number;
};

let items: FeedItem[] = [];
let seq = 0;
const subs = new Set<() => void>();

export function pushFeed(f: Omit<FeedItem, "id" | "at">) {
  items = [{ ...f, id: ++seq, at: Date.now() }, ...items].slice(0, 30);
  subs.forEach((s) => s());
}

export function clearMembersFeed() {
  items = items.filter((i) => i.audience === "all");
  subs.forEach((s) => s());
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};
const EMPTY: FeedItem[] = [];
export const useFeed = () =>
  useSyncExternalStore(
    subscribe,
    () => items,
    () => EMPTY,
  );
