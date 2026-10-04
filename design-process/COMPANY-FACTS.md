# Company facts — SoundPlex

The single source of truth for every fact the site states. `site-config.ts`, JSON-LD, the
footer, the contact page and the briefs read from HERE, not from memory. Anything marked
**OPEN** is unconfirmed — do not put it on the site until it's filled. **CONFLICT** means the
live site says two things; George picks.

Started 2026-10-04 (Ed + Claude). Sources: `site-config.ts`, `AUDIENCE.md`, the live WordPress
site (soundplexstudios.com — every page read 2026-10-04), George's vision doc (Sept 2026).

## 1. Entity + contact

| Fact | Value | Status |
| --- | --- | --- |
| Trade name | SoundPlex (lockup: SOUNDPLEX; live site uses "SoundPlex Studios" and "SoundPlex®") | confirmed |
| Legal entity (footer ©, Terms) | "SOUNDPLEX STUDIOS" as written in the live Terms (operates soundplexstudios.com; NJ law; notices to 6713 Rudderow Ave). Footer: "© 2026 SoundPlex. All Rights Reserved." Use as-is for now (Ed). | provisional — Ed to confirm LLC name with George |
| Address | 6713 Rudderow Ave, Pennsauken, NJ 08109 | confirmed |
| Phone | (609) 697-2077 · tel:+16096972077 | confirmed |
| Contact email | george@thesoundplex.com (note: different domain from the site) | confirmed (Ed) — does George own thesoundplex.com? **OPEN** |
| Hours | Monday–Saturday, 8 AM–10 PM (live footer) | confirmed |
| Parking | On-site behind and alongside the building; street parking; overflow at Pinsetter Bar & Bowl (2-min walk east) and Merchantville Walkway Parking (5-min walk) | confirmed (live popup) |
| Owner / host | George Koch | confirmed |
| Other staff | a "Steven" appears in a Google review; no team page | **OPEN** |
| Time zone | America/New_York | confirmed |
| Google rating | "Rated 4.9/5 Stars" (static text on live About) | confirm count |

## 2. Building history

Live site: originally a bottlecap factory → hub for the Victor Talking Machine Company (early
1900s) → RCA Victor (1929); recordings by Caruso, Toscanini, Rachmaninoff; Dick Clark in the
1950s. Studio A "originally built as Victor Records' Studio B". SoundLounge: "former offices of
Dick Clark and Victor Talking Machine Co." WoodRoom: "original 1890s wide-plank birch flooring".

George's vision doc also says "the historic Perkins Dairy". **Ed (2026-10-04): all of it is
true — old building, many tenants, exact timeline unknown.** Rule for the site: reuse the live
About history copy verbatim (George vetted it), keep every date vague, add nothing new.
**OPEN** — a proper timeline (bottlecaps → Victor → RCA → Perkins Dairy → …) is a polish item
before go-live, and the hidden-object stories wait for it.

Live counters (About): 213+ artists & creators · 10k creative hours · "since established: 2
years" (so opened ~2024). **OPEN** — confirm the opening date and whether those numbers are real.

## 3. Web presence + integrations (all live today)

| Thing | Value | Status |
| --- | --- | --- |
| Domain | soundplexstudios.com — WordPress 7.1 + Elementor + Yoast, Site Kit | confirmed |
| Facebook / Instagram | facebook.com/thesoundplex · instagram.com/thesoundplex | confirmed |
| Other socials | none on the live site | **OPEN** (YouTube? Spotify?) |
| CRM | GoHighLevel (LeadConnector) | confirmed |
| Room booking form | GHL form `2vwlTsQsaE4skyHhRxWD` (same on all 4 room pages) | confirmed |
| Contact form | GHL form `gvdLeu9LeodSOaheOHkp` | confirmed |
| Newsletter ("Stay Inspired!") | GHL form `D9r6KRBQH7mWym6gVvze` | confirmed |
| Reviews widget | GHL Reputation Hub `dPsv4bKyPW2sZ8hNlNFN` (membership page) | confirmed — one spam "policy infraction" entry is showing publicly; tell George |
| Membership checkout | GHL funnels: /audience → `IVV6ffhw1bRDMtl5AKzi`, /backstage, /centerstage → `3RH9AoBkZGvX1gpYfHNQ` | confirmed |
| Event payments | GHL payment links (link.fastpaydirect.com) | confirmed |
| Tour booking | NO calendar anywhere — "Schedule your complimentary tour" → /contact-us/ form | confirmed → **OPEN**: which calendar for wave 2 |
| Google Ads | AW-17194875230 (+ phone call conversion) | confirmed |
| Google tag | GT-MBT75JV (Site Kit container; no bare G- id visible) | confirmed — need the GA4 property id |
| Meta pixel / chat widget | none | confirmed |
| Google Business Profile / Place ID | Ed has access → paste the Maps share link; Place ID derived | **OPEN** |
| Google Places API key (reviews on site) | needs a Google Cloud project on George's account; `GOOGLE_PLACES_API_KEY` | **OPEN** placeholder |
| Search Console | Ed has access → export Performance › Pages + Queries, Web, last 16 months (CSV) | **OPEN** export |
| GA4 | Ed has access → Measurement ID (G-…) from Admin › Data streams; export Pages & screens 12 mo; note Ads vs organic split | **OPEN** export |
| Maps embed | Google Maps iframe | confirmed |
| Ambient audio toggle ("Sound OFF") | plays a fire crackle .wav site-wide | confirmed — drop or keep? **OPEN** |

GHL webhook URLs for the new survey/contact/newsletter forms: **OPEN** (Ed to pull from the GHL
account; the template posts to inbound webhooks, it does not embed GHL forms).

## 4. Rooms (all four, complete — Ed). Rates are published and stay published.

| Room | New slug (old URL) | Size | Capacity | Rate as printed | Notes |
| --- | --- | --- | --- | --- | --- |
| WoodRoom | `wood-room` (/sp-room/woodroom/) | 2,800 sq ft, 15-ft ceilings, exposed joists, 1890s birch floor | 80 | $550/hr meetings & productions · $150/hr photo/video/audio recording | live sound system, Yamaha white baby grand, lounge seating; "includes lobby and Green Room"; aka "The WoodRoom/D Studio" |
| Studio A | `studio-a` (/sp-room/studio-a/) | 2,200 sq ft, 14-ft restored tin ceilings | 80 | $350/hr meetings & events · $125/hr photo/video/audio · $125/hr with engineer (via radrecording.com) | K. Kawai ebony baby grand, mounted LED TV, in-the-round seating; "originally Victor Records' Studio B" |
| Podcasting Studios | `podcast-studio` (/sp-room/podcast/) | not published | **CONFLICT** 5 vs "up to 6 guests" | **CONFLICT** $250/hr vs $225/hr; "free with Center Stage" (60 min/month) | automated 3-camera switching, lighting, operator support, live-streaming, up to 6 backdrops ($250 one-time setup) |
| SoundLounge | `sound-lounge` (/sp-room/soundlounge/) | 1,800 sq ft, 14-ft tin ceilings | 50 | $275/hr meetings & events · $125/hr photo/video | kitchen, shower, lockers, oak piano bar, Baldwin upright, two LED TVs, 1920s speakeasy lighting; "former offices of Dick Clark" |

Live-site bugs to NOT carry over: "$$" typos; SoundLounge "Book This Room" links to google.com;
podcast rate/capacity conflicts above. Engineer: none named; Studio A engineering is outsourced
to RAD Recording. **OPEN**: engineer/producer names for Studio Productions.

Testimonials in use: DJ Bennie James ("A unique, warm & inviting playground for creative
minds…"); Dave Macey ("Great venue for new artists…").

## 5. The Plex Collective (membership) — as published

Framing (George's own words, keep): "Most people have a home and a workplace — but few have a
true third place… Not just a creative venue. Not just a networking group. Not just content
production. The Plex Collective is a guided ecosystem where creativity is shaped into momentum."
"The environment sparks it. The team shapes it. The blueprint directs it. The result is
opportunity."

Three-step model (newer, top of page):
1. **Membership** — "$75/month · 3 month minimum" → access to: creative environment,
   entrepreneurial community, events & networking, Local Lens opportunities, creative
   collaboration, discovery sessions.
2. **The Creator Blueprint** (not "Creative") — "Call for pricing" → your story, positioning,
   audience, content direction, visibility strategy.
3. **Amplify Services** — "Pricing menu provided during visit" → à la carte: Amplify your
   Story / Strategy / Content / Exposure / Experience. Podcasting, video, live broadcasts,
   social content workshops, creative direction, Idea Lab, focus groups.

**Decision (Ed, 2026-10-04): the new /membership leads with the three-step model and the old
Audience / Backstage / Center Stage tiers are REMOVED entirely.** The three GHL checkout funnels
(/audience, /backstage, /centerstage) are not linked from the new site; redirect those three URLs
to /membership. Side effects to resolve: the podcast page's "free with Center Stage" line goes;
the $75 membership needs a join mechanism (today every button → /contact-us form) — **OPEN**:
does $75 get a GHL checkout like the old tiers had, or is it "book a tour first"?
"Complimentary tour" and "free Plex Collective Day Pass" both exist — confirm both. Annual
pricing: none. Member count: none published.

Definitions still missing (appear only as bullets on the live site): **Local Lens**,
**Discovery session**, **Creator Blueprint**, **Idea Lab**. **OPEN** — one sentence each from George.

Member-only area (wave 3) — defined (Ed, 2026-10-04). All three, together:
- **Live check-in** — a member taps "I'm in Studio A / the SoundLounge…" on their phone; shows
  as present until they check out or a timeout.
- **Who's booked where** — the calendar's private entries (rentals + member sessions), today
  and upcoming, by room.
- **Member directory** — every member, what they do, what they offer / are looking for (the
  Connection Wall's data, full list, members-only fields allowed).
Access: every active Plex member gets a login, **by invitation only** from George or an admin on
his team, after they've verified the membership is active. No self-signup. (Template note: this
is visitor auth + live state — outside the Ownership Law's MDX-only model; needs a small
database. Scope it as its own app layer, not a content type.)
Connection Wall real members with permission: **OPEN** (placeholder cast live today).

## 6. Events — as published

Live "Studio Productions" page is actually the events listing (filter tabs: Workshops / All),
custom post type `sp-event`, ~45 past events. Each shows date, kind, title, room, time.
Payments via GHL payment links (e.g. AI Crossroads $25). Recurring series visible in the
history: SoundPlex Live Open Mic, Gourmet Mama Show, Corks Comedy Connections, Psychedelic
Parlor, Cinema Salon, Local Lens Broadcast, Jeffrey Gaines, Kid Charlemagne, Plex Collective
nights, Friendly Feud networking.

| Fact | Value | Status |
| --- | --- | --- |
| Who posts events | George AND others, via Studio (/admin) — editor role for the others | confirmed (Ed) |
| Tickets / RSVP | Flexible per event: a URL field (GHL payment link, Eventbrite, anything) + button label; free/RSVP/sold-out states. Template `tickets` group gives rsvpUrl/capacity/closed/private — we add `ticketLabel` + `price` | confirmed (Ed) |
| Recurring series + cadence | Claude to draft from the 45-event history; George confirms | drafting |
| Event kinds for the site | Claude to draft from history (show · comedy · talk · workshop · screening · open-mic · podcast-taping · networking · private); George confirms | drafting |
| Hero "nights" first three | business workshop (built) · live music · comedy | confirmed (Ed) |
| "Studio Productions" | = the public events feed, URL kept (see §7) | decided |

## 7. The three offers (Ed, 2026-10-04) — the IA follows this

1. **Rent a room** — private hire: weddings, parties, business workshops, shoots. NOT public
   events. Lives on `/rooms` + `/rooms/<room>`; CTA = booking enquiry (→ /start, rooms branch).
2. **Studio Productions** — every PUBLIC, ticketed thing happening at SoundPlex, whether George
   produces it or a member does (concerts, comedy, talks, screenings, open mic…). This IS the
   events feed. Keep the live URL `/studio-productions/` (ranking history); `/events` → 301 to it.
   Each event carries `producer` (SoundPlex | member name) for "presented by".
3. **The Plex Collective** — membership ($75 three-step). Members can do 1 and 2 for their own
   business.

Calendar rule: events have `visibility: public | private`. Public = productions, shown
site-wide. Private = rentals and member sessions — never on the public site, but on the same
calendar so George (wave 2, in Studio) and members (wave 3, logged in) see what's booked in
which room. One data model serves both.

Still **OPEN**: what the production SERVICES are (Amplify menu, podcast production, video) —
they live on /membership as step 3 for now; definitions of Local Lens, Discovery session,
Creator Blueprint, Idea Lab are George's to write.

## 8. Funnel (wave 2) — decided (Ed, 2026-10-04)

Three forms, each POSTing server-side to its own GHL inbound webhook (template pattern:
`/api/<form>` route, same-origin guard, honeypot, lazy env; never GHL's iframe embeds). Env
vars, all documented in `.env.example`, all placeholders until Ed pulls them from GHL:

| Form | Where | Fields | Env var | Status |
| --- | --- | --- | --- | --- |
| Newsletter | footer, every page | first name, email | `GHL_WEBHOOK_NEWSLETTER` | **OPEN** URL |
| Survey — "What brings you to SoundPlex?" | `/start` (every CTA lands here) | multi-step, branching, modelled on Ed's existing multi-step intake pattern. Q1 = the offers: Rent a room for a private event · Come to a production · Join the Plex Collective · Produce something of my own (podcast / video / show) · Something else, just talk to George. Rent-a-room branch asks room, date, headcount, occasion. | `GHL_WEBHOOK_SURVEY` | **OPEN** URL; branch questions to draft |
| Contact | `/contact-us` | name, email, phone, message | `GHL_WEBHOOK_CONTACT` | **OPEN** URL |

Survey thank-you page: ONE tour-booking calendar embed (GHL calendar), `TOUR_CALENDAR_ID`
— **OPEN**, Ed supplies later; placeholder until then. Whether every branch ends on the
calendar or some end on a plain thank-you: **OPEN** (default: all show the calendar).

Primary CTA label: live site "Schedule your complimentary tour"; ours "Book a tour" — confirm.

## 9. Content assets on the live site worth keeping

SoundPlex-Reel.mp4 (About page video) · "Through These Doors" song + lyrics page (tribute to
George and the building — a natural "hidden object") · the parking photo · room galleries (URLs
in the audit) · the SVG logo (/2025/01/soundplex_logo-1.svg) · six spotlight blog posts
(podcast-studio local SEO: Moorestown, Cherry Hill, Pennsauken, how-to, rates).

## 9b. Interactive-moment inventory needed from George

For the hotspots in SITE-STRUCTURE-BRIEF §8b: 3–5 artworks currently on the walls (title,
artist, size, medium, price, a straight-on photo) · one 15–30s performance clip of someone on
the Wood Room stage (with permission) · the three pianos' one-liners · any host intro videos
for upcoming events. **OPEN**.

## 10. Legal

Decision (Ed): port the live Terms (last updated March 3, 2025, NJ governing law) and Privacy
copy as-is into /terms and /privacy; keep /terms-of-service and /privacy-policy as 301s.
/disclaimers — check content, likely merge. Entity name updated when George confirms.

## Open items (running list)

- [x] Contact email — george@thesoundplex.com
- [ ] Does George own thesoundplex.com (redirect it?)
- [x] Legal entity: "SoundPlex Studios" per live Terms (provisional)
- [ ] Building history: all true; reuse live copy, keep vague; proper timeline before go-live
- [ ] Opening date; are 213+ / 10k real
- [ ] Podcast studio: $225 or $250; capacity 5 or 6
- [x] Membership: three-step model only; old tiers removed; funnel URLs → /membership
- [ ] $75 membership join mechanism (checkout vs tour-first)
- [ ] Definitions: Local Lens, Discovery session, Creator Blueprint, Idea Lab
- [x] Studio Productions = public events feed (George + members), URL kept
- [ ] Production services menu / people — lives in /membership step 3 until defined
- [x] Events: George + others post via Studio; tickets = flexible URL + label per event
- [ ] Events: recurring series + kinds list (Claude drafts, George confirms)
- [x] Hero nights: workshop · live music · comedy
- [x] Member-only area defined: check-in + bookings-by-room + directory; invite-only logins
- [ ] GHL: 3 webhook URLs (newsletter / survey / contact) + `TOUR_CALENDAR_ID` — placeholders for now
- [ ] Survey: branch questions per path; which branches end on the calendar
- [ ] Ed: SC export (Pages + Queries), GA4 G- id + Pages export, GBP Maps share link, Places API key
- [ ] Other socials
- [ ] Ambient audio toggle — keep or drop
- [x] Legal copy: port live Terms + Privacy verbatim
- [ ] Tell George: spam entry showing in the live reviews widget
- [ ] George: 3–5 artworks w/ prices, one stage clip, piano lines, host videos (for hotspots)
