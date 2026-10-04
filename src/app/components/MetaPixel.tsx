"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Meta (Facebook) pixel — mount it once in a layout (site-wide, or scoped to
 * a route group's layout so every page under it (lander, steps,
 * breakdown, apply, book, thanks) is covered.
 *
 * Entirely env-gated: renders nothing and loads nothing unless
 * NEXT_PUBLIC_META_PIXEL_ID is set at build time. PageView fires on every
 * route change; fire conversion events from your forms via trackLead().
 */

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function ensurePixel(): Fbq | null {
  if (!PIXEL_ID) return null;
  if (window.fbq) return window.fbq;

  // Standard Meta base-code bootstrap, minus the IIFE wrapper.
  const fbq = function (this: unknown, ...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", PIXEL_ID);
  return fbq;
}

/** Fire a named pixel event from anywhere under the mount. No-op when unset. */
export function trackPixelEvent(
  event: string,
  params?: Record<string, string | number | boolean>,
) {
  if (!PIXEL_ID || typeof window === "undefined") return;
  ensurePixel()?.("track", event, params ?? {});
}

export default function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (!PIXEL_ID) return;
    // Load the pixel AFTER the page finishes painting — three tracking
    // scripts on the critical path were costing real mobile LCP. Anyone
    // who stays past first paint is tracked identically; Lead events are
    // unaffected (they fire minutes later, on submit). Client-side
    // navigations (readyState already complete) fire immediately.
    let cancelled = false;
    const fire = () => {
      if (!cancelled) ensurePixel()?.("track", "PageView");
    };
    if (document.readyState === "complete") {
      fire();
      return () => {
        cancelled = true;
      };
    }
    window.addEventListener("load", fire, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", fire);
    };
  }, [pathname]);

  return null;
}
