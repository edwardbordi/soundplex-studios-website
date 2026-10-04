import { NextResponse } from "next/server";

/**
 * First-party analytics relay ("/api/t") — the server-side tagging
 * endpoint. The browser sends one tiny beacon per pageview/event to THIS
 * domain (first-party: ad-blockers and tracking protection don't eat it,
 * and zero Google JavaScript ships to the page); this route forwards
 * server-to-server to GA4 via the Measurement Protocol.
 *
 * Env (server-side): GA4_MEASUREMENT_ID + GA4_API_SECRET. Missing config
 * → the route no-ops with 204: analytics can never break the site.
 *
 * ⚠ Attribution caveat (documented in server-side-analytics-relay.md):
 * MP-fed GA4 loses some automatic acquisition attribution. We preserve
 * full page_location (with UTMs) + stable client_id/session_id, and the
 * post-launch spot-check compares per-ad attribution against a live
 * campaign before this is fully trusted. Rollback = restore the gtag
 * loader in GoogleTagManager.tsx.
 */

const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";

/** GA4 event-name rules: alphanumeric + underscores, ≤40 chars. */
const NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;

interface BeaconEvent {
  name: string;
  params?: Record<string, string | number | boolean>;
}

interface BeaconBody {
  client_id?: string;
  session_id?: string;
  page_location?: string;
  page_referrer?: string;
  events?: BeaconEvent[];
}

export async function POST(req: Request) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  // Unconfigured or malformed → quiet 204; the page must never care.
  if (!measurementId || !apiSecret) return new NextResponse(null, { status: 204 });

  let body: BeaconBody;
  try {
    body = (await req.json()) as BeaconBody;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const clientId = typeof body.client_id === "string" ? body.client_id.slice(0, 64) : "";
  if (!clientId) return new NextResponse(null, { status: 204 });

  const events = (body.events ?? [])
    .filter((e) => typeof e?.name === "string" && NAME_RE.test(e.name))
    .slice(0, 5)
    .map((e) => ({
      name: e.name,
      params: {
        // session + engagement make events count toward sessions/realtime
        session_id: String(body.session_id ?? "").slice(0, 32) || undefined,
        engagement_time_msec: 100,
        // full URL carries the UTMs — the attribution lifeline
        page_location: String(body.page_location ?? "").slice(0, 1000) || undefined,
        page_referrer: String(body.page_referrer ?? "").slice(0, 1000) || undefined,
        ...(e.params ?? {}),
      },
    }));
  if (events.length === 0) return new NextResponse(null, { status: 204 });

  // Fire-and-forget with a hard timeout — a slow Google never slows us.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    await fetch(
      `${MP_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, events }),
        signal: controller.signal,
      },
    );
  } catch {
    /* relay failure is invisible by design */
  } finally {
    clearTimeout(timer);
  }
  return new NextResponse(null, { status: 204 });
}
