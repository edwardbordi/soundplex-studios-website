"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The Ask widget's code ships in its own chunk, not the first-load bundle.
const AskWidget = dynamic(() => import("./AskWidget"), { ssr: false });

/** Same check as AskWidget's askKnownOn, inlined so importing it doesn't pull the widget into this chunk. */
function askKnownOn(): boolean {
  try {
    return sessionStorage.getItem("sp-ask-enabled") === "true";
  } catch {
    return false;
  }
}

/**
 * Mounts the Ask widget a moment after the page appears, so its code never slows the first
 * paint. It stays hidden until its feature check says it's on.
 *
 * Not tied to the window "load" event or to the browser being idle (Ed, 2026-11-24): pages with
 * video, the map, the booking calendar or a running animation kept the button waiting.
 */
export default function AskWidgetLazy() {
  const [ready, setReady] = useState(false);

  // A fixed short beat after the page appears, not "when the browser is idle": pages with a
  // running animation (the membership "Not rocket science" run) kept the browser busy, so the
  // button waited for the animation to end (Ed, 2026-11-24).
  // Already on earlier this visit: no delay, so it doesn't blink on every new page.
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), askKnownOn() ? 0 : 700);
    return () => clearTimeout(timer);
  }, []);

  return ready ? <AskWidget /> : null;
}
