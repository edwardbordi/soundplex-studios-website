# URL map — soundplexstudios.com → new site

Rule: **every URL Google has today either stays identical or 301s to its one best successor.**
No 404s at cutover. Priorities get re-ordered once Ed's Search Console export (Pages, 16 months)
shows which of these actually carry clicks.

Source: Yoast sitemaps read 2026-10-04. Redirects go in `next.config.ts` → `redirects()`,
`permanent: true` (308; Google treats as 301). WordPress trailing slashes: Next strips them, so
`/about/` and `/about` both resolve — list without the slash.

## Pages — keep exactly

| Live URL | New route | Notes |
| --- | --- | --- |
| `/` | `/` | hero v2 + wall + sections |
| `/about` | `/about` | live History copy ported verbatim |
| `/rooms` | `/rooms` | rooms index (the tour film + four room cards) |
| `/membership` | `/membership` | three-step model only |
| `/studio-productions` | `/studio-productions` | = the PUBLIC events feed (see COMPANY-FACTS §7) |
| `/contact-us` | `/contact-us` | form (→ GHL webhook), map, hours, parking, reviews |
| `/soundplex-spotlight` | `/soundplex-spotlight` → **301 → `/blog`** | the template's blog index is `/blog`; one redirect, zero loss. Alternative: make `/blog` live at `/soundplex-spotlight` — decide on SC data |

## Rooms — rename with 301s

| Live URL | New route |
| --- | --- |
| `/sp-room` | → `/rooms` |
| `/sp-room/woodroom` | → `/rooms/wood-room` |
| `/sp-room/studio-a` | → `/rooms/studio-a` |
| `/sp-room/podcast` | → `/rooms/podcast-studio` |
| `/sp-room/soundlounge` | → `/rooms/sound-lounge` |

## Events — ~45 past events at `/sp-event/<slug>`

| Live URL | New route |
| --- | --- |
| `/sp-event` | → `/studio-productions` |
| `/sp-event/<slug>` (all) | → `/studio-productions` by default; **per-slug** `→ /studio-productions/<slug>` only for events we import (upcoming ones + any past ones with clicks in SC) |
| `/events` (new template default) | → `/studio-productions` (and `/events/<slug>` → `/studio-productions/<slug>`) |

Upcoming at time of writing (import these as real events): `psychedelic-parlor-…-with-too-mush-love-2` (Oct 8), `cinema-salon-presents-the-cafone` (Oct 23), `carl-cox-philly-strut`, `friendly-feud-networking`.

## Blog posts

| Live URL | New route |
| --- | --- |
| `/sp-spotlight-podcast-studio-setup-what-your-business-needs` | → `/blog/podcast-studio-setup-what-your-business-needs` (port the post) |
| `/sp-spotlight-podcast-studio-rental-cost-whats-included` | → `/blog/podcast-studio-rental-cost-whats-included` (port) |
| the four older spotlight posts (Moorestown, Cherry Hill, How to Create a Podcast, Affordable Hourly Rates) | **OPEN** — URLs not in the post sitemap; pull from `/soundplex-spotlight` and port if they have clicks |
| `/sp-spotlight`, `/category/*`, `/tag/*`, `/author/*` | → `/blog` |

## Membership funnels (removed — COMPANY-FACTS §5)

| Live URL | New route |
| --- | --- |
| `/audience`, `/backstage`, `/centerstage` | → `/membership` |

## One-offs

| Live URL | New route | Notes |
| --- | --- | --- |
| `/through-these-doors` | **keep** `/through-these-doors` | the song page; port as-is (audio + lyrics). Later: the hidden-object entry point |
| `/ai-crossroads` | → `/studio-productions/ai-crossroads-of-humanity-and-machines` if imported, else → `/studio-productions` | past event landing |
| `/privacy-policy` | → `/privacy` | copy ported |
| `/terms-of-service` | → `/terms` | copy ported |
| `/disclaimers` | → `/terms` (or own page) | **OPEN** — read content first |

## New routes with no predecessor

`/start` (survey) · `/rooms/<room>` ×4 · `/studio-productions/<slug>` · `/blog/<slug>` · `/events*` (redirect only) · `/admin` (Studio, noindex) · `/v2` → `/` (already live)

## Not carried over

`/wp-content/uploads/*` image URLs (re-hosted under `/public`; image search loss is acceptable — **confirm on SC Images filter**), `/feed` variants (template has `/feed.xml`), Yoast sitemap sub-files (template emits one `/sitemap.xml`).

## Checklist at cutover

- [ ] Every row above in `redirects()`; test with `curl -I` for 308 + correct Location
- [ ] Submit new `/sitemap.xml` in Search Console; keep the old property, add the new if host changes
- [ ] GBP website link, Facebook/Instagram bio links → still `soundplexstudios.com` (no change)
- [ ] Google Ads landing pages (AW-17194875230) → check each ad's final URL resolves without a redirect chain
- [ ] Watch SC Coverage for 404s daily for two weeks
