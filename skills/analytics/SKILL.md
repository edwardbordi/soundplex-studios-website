# Skill: analytics — first-party, server-side tracking

Turn on the template's built-in analytics architecture and understand what it
buys you. Use when a site is ready to measure real traffic — typically right
before launch or before paid ads go live.

## What ships in the template (already wired)

- **`src/app/api/t/route.ts`** — a first-party relay: the browser beacons tiny
  JSON to your own domain, and the server forwards it to GA4's Measurement
  Protocol. **Zero Google JavaScript ever loads in the browser.**
- **`src/app/components/AnalyticsBeacon.tsx`** — mounted in the root layout.
  Maintains a first-party client id (2-year cookie) and a per-tab session id,
  fires a `page_view` on every route change, and exposes
  `pushDataLayerEvent(name, params)` for custom events from any client
  component.
- Both **no-op silently** until the env vars exist — the template ships dark,
  per the BUILD-ENV law.

## Why this beats a normal gtag/GTM install

1. **Performance.** gtag.js + its network chatter is one of the biggest
   scripts on a typical small-business site. Removing it is worth real
   PageSpeed points — this architecture took a production site's mobile score
   from the 60s–70s to 97 *with analytics fully running*.
2. **Ad blockers.** Blockers kill requests to googletagmanager.com and
   google-analytics.com. They don't kill requests to your own domain, so you
   count the 20–40% of visitors a normal install silently loses.
3. **Ownership.** One tiny route you control, not a tag manager container of
   third-party scripts.

## Enable it (5 minutes)

1. GA4 → Admin → Data streams → your web stream → **Measurement Protocol API
   secrets** → Create. Note the secret and the stream's Measurement ID (G-…).
2. Set both in the host's env (and `.env.local` for local testing):
   `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`. **Server-side names — never
   `NEXT_PUBLIC_`.** The secret must not reach the browser.
3. Deploy. Verify in GA4 **Realtime** while clicking around the live site.

Custom events from any client component:

```ts
import { pushDataLayerEvent } from "@/app/components/AnalyticsBeacon";
pushDataLayerEvent("lead_submitted", { form: "contact" });
```

Mark conversions: GA4 → Admin → Events → toggle the event as a **key event**
(the Events list lags Realtime by up to ~24h — don't panic when it isn't
there immediately).

## The caveats (learned in production — read before ads)

- **Attribution.** Measurement Protocol events can show "(not set)" for
  source/medium in some GA4 acquisition reports. Page URLs (with their UTMs)
  are forwarded, which covers most reporting, but in the FIRST WEEK of any
  paid campaign do a spot check: click your own ad, convert, and confirm the
  attribution next day. If it's unacceptable for your reporting needs, the
  rollback is one swap: replace AnalyticsBeacon with a standard gtag snippet
  and eat the performance cost.
- **Realtime needs sessions.** The relay already sends `session_id` and
  `engagement_time_msec` with every event — don't strip them; GA4 drops
  events from Realtime and session reports without them.
- **This measures; it doesn't do ad-platform conversions.** See below.

## Ad-platform conversions: fire them from the CRM, not the browser

The strongest pattern for Meta/Google ad conversions is **server-side from
your CRM**, not browser pixels:

- Browser pixel (if used at all) handles PageView only — enough to build
  retargeting audiences. `src/app/components/MetaPixel.tsx` does exactly
  this, env-gated by `NEXT_PUBLIC_META_PIXEL_ID`.
- The **Lead/Purchase conversion fires from the CRM's workflow** via the ad
  platform's server API (e.g. Meta Conversions API) when the lead actually
  lands — matched on email/phone. This survives ad blockers and iOS privacy,
  and it can't double-count because there's exactly one source of truth.
- Never fire the same conversion from both browser and server without shared
  event ids — you'll double-count. Single-source beats deduplication.

## Verification checklist

- [ ] GA4 Realtime shows page_views from the live site
- [ ] A custom event arrives (fire one from a form or the console)
- [ ] PageSpeed still scores like the template should (the whole point)
- [ ] If running ads: week-1 attribution spot check done
