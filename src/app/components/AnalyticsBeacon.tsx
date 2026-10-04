"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party analytics beacon — replaces the gtag.js loader entirely.
 *
 * ZERO Google JavaScript ships to the browser: pageviews and events go as
 * one tiny fetch to our own /api/t (first-party, ad-blocker-resistant),
 * which relays server-to-server to GA4 via the Measurement Protocol.
 * This was the last mobile-score lever — the tag scripts were the
 * remaining main-thread cost (proven by the accidental no-analytics
 * deploy scoring 99).
 *
 * Identity: client_id in a first-party cookie (_fp_cid, 2 years),
 * session_id per tab (sessionStorage). Full page URL rides along so UTM
 * attribution data reaches GA4 (see server-side-analytics-relay.md for
 * the attribution caveat + spot-check).
 *
 * `pushDataLayerEvent` keeps its historical name/signature so call sites
 * (ApplySurvey, YourAnswers) are unchanged. The component keeps its name
 * so app/layout.tsx is unchanged. Rollback to browser gtag = git revert.
 */

function getClientId(): string {
  const match = document.cookie.match(/(?:^|;\s*)_fp_cid=([^;]+)/);
  if (match) return match[1];
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}.${Math.floor(Math.random() * 1e9)}`;
  // 2 years, first-party, Lax — survives Safari's script-cookie limits
  // better than JS cookies from third-party tags ever did.
  document.cookie = `_fp_cid=${id}; Max-Age=63072000; Path=/; SameSite=Lax`;
  return id;
}

function getSessionId(): string {
  try {
    let sid = window.sessionStorage.getItem("_fp_sid");
    if (!sid) {
      sid = String(Date.now());
      window.sessionStorage.setItem("_fp_sid", sid);
    }
    return sid;
  } catch {
    return String(Date.now());
  }
}

function send(name: string, params?: Record<string, string | number | boolean>) {
  try {
    const payload = JSON.stringify({
      client_id: getClientId(),
      session_id: getSessionId(),
      page_location: window.location.href,
      page_referrer: document.referrer || undefined,
      events: [{ name, params }],
    });
    // sendBeacon survives page unloads (e.g. the survey's redirect right
    // after the lead event); fetch keepalive is the fallback.
    if (!navigator.sendBeacon?.("/api/t", new Blob([payload], { type: "application/json" }))) {
      void fetch("/api/t", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    /* analytics never breaks the page */
  }
}

/** Pageview beacon on load + every client-side navigation. */
export default function AnalyticsBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    send("page_view");
  }, [pathname]);
  return null;
}

/** No-op kept so app/layout.tsx doesn't need restructuring (the GTM-era
    <noscript> iframe has no equivalent here). */
export function AnalyticsBeaconNoScript() {
  return null;
}

/**
 * Send a custom event. Same name + signature as the GTM/gtag-era helper —
 * call sites are unchanged.
 */
export function pushDataLayerEvent(
  event: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;
  send(event, params);
}
