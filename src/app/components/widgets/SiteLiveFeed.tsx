"use client";

import { useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import LiveFeed from "./LiveFeed";
import { eventsAround, fromCalItems } from "../../../lib/venue/data";
import type { CalItem } from "../../../lib/events/constants";

/**
 * "Live at SoundPlex" on EVERY page (Ed, 2026-10-28) — mounted once in the root layout, fed the
 * same calendar as Studio Productions. Its activity is simulated (ticket buyers, check-ins), so
 * it only runs while the sample calendar is on; never inside Studio (/admin).
 */
const subscribe = (cb: () => void) => {
  const t = window.setInterval(cb, 60_000);
  return () => window.clearInterval(t);
};
const minuteNow = () => Math.floor(Date.now() / 60_000);

export default function SiteLiveFeed({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const path = usePathname();
  const minute = useSyncExternalStore(subscribe, minuteNow, () => 0);
  const day = minute ? new Date(minute * 60_000).toDateString() : "";
  const events = useMemo(
    () => (minute ? [...fromCalItems(items), ...(showSamples ? eventsAround(new Date(minute * 60_000)) : [])].sort((a, b) => a.start.getTime() - b.start.getTime()) : []),
    [day, items, showSamples], // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!showSamples || !minute || path?.startsWith("/admin")) return null;
  return <LiveFeed events={events} />;
}
