# Site-structure brief — SoundPlex

Filled 2026-10-04 (Ed + Claude) from COMPANY-FACTS.md, George's vision doc (Sept 2026),
AUDIENCE.md and the live site. Facts live in COMPANY-FACTS.md; this file is the skeleton.
Everything marked **OPEN** is listed there too.

Build note: the current repo is a 2026-09-02 snapshot of site-starter, pre-Studio/pre-events.
**Wave 2 starts from a fresh repo on site-starter-pro v2.3 and ports the SoundPlex work**
(hero v1+v2, Connection Wall, fonts, brand CSS, Nav/Footer, config, content). George and Ed
have both signed off on keeping the fly-through hero and the wall as the home's first two
sections; the hero's storyline is open for revision.

## 1. Site + goal

- **Business / site name:** SoundPlex (SoundPlex Studios) — soundplexstudios.com
- **The one job:** make someone feel they've found a place they want to belong — then give them
  one effortless next step. (George: "Find your people. Create your next chapter. Welcome to
  your third place.")
- **Primary call to action:** **Book a tour** → `/start` (the survey), which ends on George's
  tour calendar. Secondary: Join the Collective (`/membership`), See what's on
  (`/studio-productions`), Book a room (`/rooms`).
- **Primary audience:** per AUDIENCE.md — South Jersey / Philly creators and business
  professionals within ~30 min of Pennsauken; secondary, the local audience member.

## 2. The three offers (drive the IA — COMPANY-FACTS §7)

1. **Rent a room** — private hire (weddings, parties, workshops, shoots). `/rooms`.
2. **Studio Productions** — every public, ticketed thing at SoundPlex, by George or a member.
   `/studio-productions` (the events feed; live URL kept).
3. **The Plex Collective** — membership, $75/mo three-step model. `/membership`.

## 3. Pages (the routes) — wave 2

| Route | Purpose | Focus keyword / intent | Source of truth |
| --- | --- | --- | --- |
| `/` | Home: hero, wall, room transformations, what's on, Collective CTA, latest posts | `creative studio and event venue Pennsauken NJ` | Place JSON-LD here only |
| `/rooms` | Rooms index: the room-tour film + four room cards (rates shown) | `event space rental South Jersey` | `content/rooms/*.mdx` |
| `/rooms/wood-room` | Room page | `event venue Pennsauken NJ 80 guests` | " |
| `/rooms/studio-a` | Room page | `recording studio rental South Jersey` | " |
| ~~`/rooms/podcast-studio`~~ → `/rooms#podcast` | Podcast is a use (§8e); the `podcast studio Pennsauken NJ` intent (the live site's strongest) is carried by `/rooms#podcast` + the podcast posts for now — a `/podcast` landing is a polish-pass candidate | " |
| `/rooms/sound-lounge` | Room page | `private event space Pennsauken NJ` | " |
| `/studio-productions` | Public events: calendar + list, mood/kind/room filters | `live music comedy shows Pennsauken NJ` | `content/events/*.mdx` |
| `/studio-productions/<slug>` | Event page: when, room, producer, tickets button, host note, add-to-calendar | event title | " |
| `/membership` | The Plex Collective: three steps, who it's for, the wall again, join | `creative membership South Jersey` | hand-written, facts §5 |
| `/about` | George, the building (live History copy verbatim), the art, the reel | `SoundPlex Studios Pennsauken history` | hand-written |
| `/start` | The survey: "What brings you to SoundPlex?" → branches → GHL → thank-you + tour calendar | noindex | SURVEY-FLOW.md |
| `/contact-us` | Form (GHL webhook), map, address, hours, parking, phone, Google reviews | `SoundPlex Studios contact` | facts §1, §3 |
| `/blog` | Spotlight: index | `South Jersey podcast studio blog` | `content/blog/*.mdx` |
| `/blog/<slug>` | Posts (port the live spotlight posts) | per post | " |
| `/through-these-doors` | The song page, kept as-is | — (noindex optional) | ported |
| `/privacy`, `/terms` | Legal, live copy ported | — | ported |
| `/admin` | Studio (George + team): posts, events, rooms, members | noindex | template |

Redirects: see URL-MAP.md. `/events*` → `/studio-productions*`; `/sp-room/*` → `/rooms/*`;
`/sp-event/*` → `/studio-productions[/slug]`; funnels → `/membership`; legal → `/privacy`, `/terms`.

*No templated/doorway pages (Uniqueness Law). Four room pages are four hand-written pages
reading from four content files — not one template stamped four times.*

## 4. Layouts

**Home — REVISED 2026-10-28 (Ed: "clean, not overdone with fly-through"):** photo hero (WoodRoom
full, slow 14s push-in, "Find your people. *Create your next chapter.*", Book a tour + What's on
tonight, a live "on now / next" card from the Studio Productions calendar) → Three ways through the
door (rent a room · come to a show · join the Collective, photo cards) → This week at SoundPlex (next
4 public nights) → Connection Wall → the chain (Ideas → Opportunity) + Join → Google reviews (once
the Places key is in) + From the Spotlight. Room transformations dropped from the home. The scroll
fly-through is PARKED in the repo (FlythroughV2 etc.) — page.tsx says how to switch it back on.

**Home, in order (wave 2, superseded):**
1. **Hero — "Step inside"** (FlythroughV2): door → walk-in → the room fills; night chooser
   (workshop · live music · comedy at launch); Book a tour + Join the Collective. Storyline
   under revision with George.
2. **The Connection Wall** — real members with permission (placeholder cast until then).
3. **One Room, Endless Possibilities** — George's #3: one Wood Room frame, tap podcast /
   workshop / concert / screening / private party, the room transforms (same pipeline as the
   hero states). Each transformation → `/start` with that branch pre-selected.
4. **What's on** — next 3 public events from `/studio-productions`, "See everything →".
5. **The Plex Collective** — CTA band: the three-step model in one line each, Join →.
6. **From the Spotlight** — latest 3 posts.
7. **Footer** — closing line, Book a tour, Visit / Talk to us / Explore, newsletter (first name
   + email → GHL), legal.

**Internal-page shell:** `<Nav overlay>` only on `/` and `/rooms` (full-bleed film); solid
nav elsewhere → page header (eyebrow · title · lede) → content → one CTA band (Book a tour)
→ Footer.

**Room page:** hero photo (same angle as the transformations where possible) → one-paragraph
story → facts strip (size · capacity · ceilings · rate as printed) → what's included → gallery
→ "Book this room" → `/start?path=room&room=<slug>` → related upcoming events in this room.

**Event page:** poster → title, kind, date/time, room, "presented by" → body → tickets button
(label + URL from frontmatter; free / RSVP / sold-out states) → host note ("coming alone?") →
add to calendar (.ics) → Event JSON-LD (+ `offers` when there's a price, `location` with the
full address — extend the template's `eventJsonLd`).

**Blog post:** the template's post layout, unchanged.

## 5. Component plan

Follow AGENTS.md: `src/app/components/` is flat chrome + primitives, plus `widgets/`.
(Older docs mention `global/` and `ui/` folders — don't create them.)

- **Chrome (root):** Nav (overlay prop, lockup, NAV_CTA call button), MobileMenu (with close),
  Footer (closing line + newsletter form), JsonLd, Eyebrow, Reveal, ForwardArrow,
  OutboundArrow, BackArrow.
- **Widgets (`widgets/`):**
  - `FlythroughV2` + `vendor/scrub-engine` (hero) and `Flythrough` (rooms tour) — ported.
  - `ConnectionWall` — ported; data moves from `content/wall/members.ts` to
    `content/members/*.mdx` so Studio can edit it.
  - `RoomTransform` — new (home §3). Props: base frame, list of {label, image, href}.
  - `EventsCalendar` — new: month grid + list toggle, filters (mood prompts · kind · room),
    reads public events only. `EventRow` from template, extended.
  - `EventTickets` — new: button from `ticketUrl` + `ticketLabel` + `price`, states.
  - `AddToCalendar` — new: .ics download + Google link.
  - `UpcomingEvents` — new: next N, used on home, room pages, membership.
  - `CollectiveSteps` — new: the three-step model, used on home band and `/membership`.
  - `RoomFacts` / `RoomGallery` — new, props-driven.
  - `Survey` — new, client component, multi-step, posts to `/api/survey`.
  - `NewsletterForm`, `ContactForm` — new, post to `/api/newsletter`, `/api/contact`.
  - `GoogleReviews` — new, server component, Places API, cached (ISR), graceful when no key.
  - `TourCalendar` — new: GHL calendar embed by `TOUR_CALENDAR_ID`, on the survey thank-you.
- **API routes (`src/app/api/`):** `survey`, `contact`, `newsletter` — same-origin guard,
  honeypot, email sanity check from `lib/email.ts`, lazy env, POST to the matching
  `GHL_WEBHOOK_*`. Build passes with zero env (BUILD-ENV law).

## 6. Navigation & IA

- **Header:** About · Studio Productions · Rooms · Membership · **Call (609) 697-2077**
  (hollow gold). Mobile: same + close button.
- **Footer:** closing line + Book a tour · Visit (address → Maps, parking, hours) · Talk to us
  (phone, email, Facebook, Instagram) · Explore (nav + Spotlight) · Stay inspired (newsletter) ·
  © SoundPlex Studios · Privacy · Terms.
- **Breadcrumbs:** on room pages, event pages, posts (template `breadcrumbJsonLd`).

## 7. Content sources + Studio content types

| Type | Folder | Who edits | Notes |
| --- | --- | --- | --- |
| Posts | `content/blog` | George + team | template |
| Events | `content/events` | George + team | `eventSchema({ kinds: [...], with: ["tickets","venues","appearances"] })` + our extra fields: `visibility: public\|private`, `producer`, `ticketLabel`, `price`, `hostNote`, `mood[]`. `venue` dropdown fed from rooms. Private events never render publicly. |
| Rooms | `content/rooms` | George (rarely) | new type: name, slug, size, capacity, ceilings, rates, included[], gallery[], order |
| Members | `content/members` | George + team | new type: name, role, story, offer, looking, portrait, `permission`, `connections[]` {with, steps[3]}. Drives the wall. |

Event kinds (draft, from the live history): `show` · `comedy` · `talk` · `workshop` ·
`screening` · `open-mic` · `podcast-taping` · `networking` · `private`. **OPEN** — George confirms.
Recurring series (draft): SoundPlex Live Open Mic · Gourmet Mama Show · Corks Comedy
Connections · Psychedelic Parlor · Cinema Salon · Local Lens Broadcast · Friendly Feud ·
Plex Collective nights. No recurrence engine — each date is its own file; Studio's
"duplicate" covers it.

Blog cadence: **OPEN**. Six live spotlight posts to port.

## 8. Integrations (all placeholders until Ed supplies values — COMPANY-FACTS §3, §8)

`GHL_WEBHOOK_NEWSLETTER` · `GHL_WEBHOOK_SURVEY` · `GHL_WEBHOOK_CONTACT` · `TOUR_CALENDAR_ID` ·
`GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID` · `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` (template
relay; no Google JS) · Google Ads AW-17194875230 (keep conversion tracking — **OPEN**: how,
given the no-JS analytics stance) · Studio env block per `.env.example`.

## 8b. Interactive moments — the "zoom in" language (Ed, 2026-10-04)

The site already has one gesture: the camera moves you closer (the hero walks in, the wall
zooms to a face). Every interactive moment below uses that same gesture — tap a thing in a
photograph, the camera pushes in, and there's something real behind it. Tasteful means: a quiet
affordance (a small gold dot, the same as the wall's), never more than one or two per screen,
and every one lands on something with value — a buy button, a video, a date, a person. Rule:
if there's nothing real behind the tap yet, the dot doesn't exist.

| Where | Tap this | Camera pushes in to | Value behind it | Wave |
| --- | --- | --- | --- | --- |
| `/about` art section | a painting on the wall, in a real hallway photo | the piece, full frame | title, artist, size, medium, price, **Buy / Inquire** (every piece is for sale — live site) | 2 if George gives 3–5 pieces with prices; else 3 |
| Home, hero last state / `/rooms/wood-room` | the person on the stage | a short clip of them playing (sound on tap) | links to their event page or `/studio-productions` | 2 if one clip exists (the About reel has candidates); else 3 |
| Room pages | the piano (Yamaha white grand · K. Kawai · Baldwin) | the instrument | one sentence + "available for your event" | 2 (cheap, true) |
| `/about` history | the tin ceiling / the Victor-era corner | archive photo or the fact | the building story, kept vague per facts §2 | 3 (after the timeline) |
| Home, the wall | a face | the member's card | already built | 1 ✓ |
| `/studio-productions` | an event poster | the event page with the host's 20-second video | tickets | 2 (field exists; content is George's) |
| `/through-these-doors` | the door photo | the song plays | the lyrics | 2 (page is ported anyway) — George's #10 "hidden object" seed |
| `/membership` | a member portrait | the Collective's wall, filtered to that step | join | 2 |

Implementation note: one `Hotspot` primitive (gold dot + label on hover/focus, keyboard
reachable, `aria-label`) and one `Zoom` transition (the wall's plane-camera pattern,
generalised: `translate/scale` of a photo plane to a target rect, then the payload fades in).
Reduced-motion: cut, no glide. Phone: the dot is a 44px target; the payload goes full-width
below the photo instead of beside it.

## 8c. "Websites by SoundPlex" (Ed, 2026-10-04 — after the reseller agreement)

George resells Realiiz websites under Realiiz's program (private/Realiiz-SoundPlex-Partner-Agreement-v1.docx,
gitignored). On the site: one page, `/websites` (or under Studio Productions' services), using a
distilled version of Realiiz's own sales copy — the "better in person than online" argument, the
preview-first offer ("we build it, you pay when you love it"), the $6,000 Base Site and what's in
it, the add-ons. CTA → `/start`. **Survey gets a sixth Q1 option:** "I need a website for my
business" → path **website** (business, current site URL, what it should do, budget confirmed
against Schedule A, timeline, contact) → GHL survey webhook tagged `website-lead` → thank-you with
George's calendar. Lead-registration rule applies: these are George's leads (Tier A).

## 8d. "The 5th Dimension" — George's media agency (George → Ed, 2026-10-05; PARKED, come back later)

George sent a one-sheet: **"Enter the 5th Dimension — Multi-Dimensional Media Agency,"** branded
SoundPlex Studios, "Powered by Plex Collective talent." Tagline: "Your company should not be limited
to 3 dimensions. Art. Music. Business Development. All under one roof." Five numbered dimensions:

1. Story & Strategy — brand storytelling, ad creation
2. Content & Visibility — content creators, social media managers (George already has a person doing this)
3. Digital Experience — website developers, digital designers (**this is Realiiz, white-label, under the partner agreement**)
4. Production & Authority — video, film, podcasting
5. Connection & Experience — Plex Collective, events, workshop streaming

What it means: George becomes the agency front door; he already delivers most of 1, 2, 4, 5 himself
or through Collective talent; when a client needs a website, dimension 3 is fulfilled by Realiiz via
the white-label tier (Tier A, George merchant of record). So `/websites` (§8c) likely becomes one
dimension inside a broader agency page rather than a standalone offer, and the survey "website"
path may become an "agency" path with dimension picks. **Not decided yet — do not build.** Open
questions when we return: page vs. section of /membership or /studio-productions; URL (`/agency`?
`/5th-dimension`?); whether 5th Dimension is its own name/brand on the site or a SoundPlex service
line; what happens to the §8c page and the sixth survey option.

## 8e. Rooms — the final answer (Ed, 2026-10-28)

**Three rooms: WoodRoom · Studio A · SoundLounge.** No Studio B. **Podcast is a USE, not a room** —
the rig is set up fresh per booking in whichever room is free. So: `content/rooms/podcast-studio.mdx`
goes, `/rooms/podcast-studio` and `/sp-room/podcast` → 301 to `/rooms` (the podcast *use* gets its
own landing later if search wants it — the podcast posts are the site's strongest SEO). Each room
gets a `uses[]` list (podcast · workshop · concert · screening · party · wedding · shoot · recording
· meeting) and the fetched gallery (`/rooms/<room>-N.webp`). Renting = pick the room, then the use
(or the use first and "help me pick" — the survey handles both orders). Every room has its own
calendar (public events + private bookings + member reservations, §11).

## 9. Out of scope for wave 2 (named so they're not lost)

- ~~Members area (wave 3)~~ **pulled forward — see §11.**
- George's #2 personalised home, #4 SoundPlex TV, #8 Spark to Screen, #10 hidden objects
  (the song page is the seed), #11 living mural.
- Weddings night in the hero; more room transformations than the first five.
- Online room booking with availability (today: inquiry form; the calendar's private entries
  make real availability possible later).

## 10. Order of work (per AGENTS.md)

1. ~~AUDIENCE.md~~ done · 2. this brief · 3. **design interview → DESIGN-BRIEF.md** (the look is
already decided by the live brand + hero; the interview is short: confirm tokens, type, motion,
density) · 4. fresh repo from pro, port, redirects, smoke tests green · 5. content types + Studio
· 6. pages in this order: `/start`, `/contact-us`, `/rooms/*`, `/studio-productions`,
`/membership`, `/about`, home sections 3–6, blog port · 7. client review kit on · 8. cutover
checklist (URL-MAP.md).

**Wave 2 shipped to `main` 2026-10-28.** Next is §11.

## 11. "What's On" — the Studio Productions page, rebuilt (Ed + George, 2026-10-28)

Ed built a demo of these ideas in the Realiiz showroom (`realiiz-showroom`, `/venue`, dressed as a
fictional venue) and George loves it. **The demo is the LAYOUT, section by section. The mechanics
are decided here, not copied** — it's a mock-up, not a 1:1 map. Code to crib from:
`src/app/components/venue/*` and `src/lib/venue/*` in that repo (restyle to SoundPlex tokens; the
demo is Inter/Poppins on #050505 with gold #d6a33c — ours is Lora/Roboto/Poppins with `--color-signal`).

**Where it lives (Ed, 2026-10-28):** at `/studio-productions` (URL kept for ranking), but called
**"What's On"** everywhere a human reads it — nav, title, home section. Nav: About · What's On ·
Rooms · Membership. The home keeps the story (door → room → wall); its "What's on" section becomes a
compact Right-now board (Spotlight + the four small cards) that taps through. Members land here
after login. **Home hero:** Ed finds the current fly-through clunky — a simpler, nicer one goes
somewhere on the site later (parked; the home hero gets rethought in the polish pass).

### 11.1 The page — `/studio-productions`, top to bottom (URL kept)

1. **Nav** — "Book a room" (→ `/start?path=room`) + Log in / member avatar menu.
2. **Right now at SoundPlex Studios** — the board the page opens on; no hero. A Spotlight card for
   tonight's headline production, then **four cards: WoodRoom · Studio A · SoundLounge · Podcast.**
   Room cards: Now / Later for that room + ONE button chosen by who's looking and what the room is
   doing (Get tickets · I'm on my way · Check in · Book the whole room). **The Podcast card is not a
   room:** it shows the next open recording slot across all three rooms and one button, *Book a
   session* → the survey's podcast use with the room left to us ("we set up wherever is free").
3. **One list, three views, one filter bar** — List (Upcoming · Today · Weekend) · Calendar
   (day / week / month, hour grid 9 am–midnight) · Rooms (a timeline lane per room with a now-line;
   podcast sessions highlighted wherever they fall). Filters: kind, free, room. Replaces today's
   list/month widget; absorbs the mood chips as the kind filter.
4. **Visibility** — `public | members | private`. Public sees members-only events as "Members
   event" (with a lock) and private bookings as "Private event — room taken". Members see the real
   thing. Adds `members` to the event schema + Studio form.
5. **Event sheet** — tickets (George's flexible URL + label; member price shown when logged in),
   RSVP (members), add to calendar (.ics + Google), "coming alone?" host note.
6. **Members: who's here** — floor plan with up to 3 faces per room (+N), "In the building" list
   with a room filter, Check in / Move here / I'm on my way / I'm leaving, a "stay hidden" toggle;
   for visitors, the blurred "you're missing out" card with real counts and member perks.
   **Plus (not in the demo): reserve a room for yourself.** A member picks room + use + start/end;
   it goes on that room's calendar as a private entry (everyone else sees "room taken"). Rules,
   default until George says otherwise: can't overlap a public event or another reservation; George
   can cancel any from Studio; cap TBD (hours/week, advance notice).
7. **Live ticker** (bottom-right, movable, minimisable) — members see comings and goings (full name +
   photo) and events; the public sees ticket buys (first name + last initial, from GHL) and
   "starting in 20 min".
8. **The rooms strip** — "Every space has its own calendar." Three cards → `/rooms/<slug>`.
9. The demo's in-page "Book a room" sheet is NOT used — the guided survey is (§3, SURVEY-FLOW.md).

### 11.2 Where data lives — GHL for people and money, Supabase for what's live

- **GHL (system of record for people):** contacts, Plex membership status + the $75 subscription,
  tags, email, the tour calendar, ticket purchases, every form submission. Already running; Ed is admin.
- **Supabase (NEW project, SoundPlex's own — not Studio's):** `members` (id, ghl_contact_id, name,
  photo, hidden), `checkins` (member, room, in_at, out_at), `reservations` (member, room, use,
  start, end, status), `rsvps` (member, event_slug), `feed` (kind, text, photo, at, audience). Realtime
  on `checkins`, `reservations`, `feed` so the floor plan and ticker update live. Row-level security:
  members read presence + feed; write only their own rows. Member auth = Supabase magic link (same
  mechanism Studio uses, separate project, role `member`).
- **The join, one webhook each way:** GHL workflow on "tagged Plex member / subscription active" →
  `POST /api/members/sync` (creates the member row, sends the invite); on lapse → deactivates.
  GHL "purchase" workflow → `POST /api/feed` → public ticker. Members log in with the email George
  has in GHL; they never see two systems.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE` (server
  only), `GHL_SYNC_SECRET` (shared secret on the inbound webhooks). BUILD-ENV law: build passes with
  none of them set; the members half renders the visitor card.

### 11.2b Built (branch `whats-on`, 2026-10-28) — the demo, PORTED

Ed: "make it exactly like the demo — only the colors and fonts change." So the showroom's
components came across as they are: `WhatsOn`, `TonightBoard`, `FilterMenu`, `RoomPicker`,
`TimeGrid`, `LiveFeed`, `AccountMenu` (+ `Check`, `MeAvatar`, `src/lib/venue/{session,feed,greetings}`).
What changed: fonts (Poppins via `--font-poppins`, Lora for the italic), gold `#d4a030`, the name,
and the DATA — `src/lib/venue/data.ts` keeps the demo's shape but holds SoundPlex's 3 rooms,
SoundPlex's categories, George's real events (`fromCalItems` ← `getCalendarItems`) and the sample
week (`eventsAround` ← `samples.ts`, while `SHOW_SAMPLE_EVENTS`). SoundPlex additions: a Podcast
card as the board's fourth card; real events' tickets open George's ticket link (samples open the
demo checkout); "Book a room" goes to the guided survey; past productions under the page; nav keeps
"Studio Productions" (Ed). Honesty rules: no made-up "tickets left", headcounts or ticket-buyer
feed for real events — samples only. Members: the demo login (first name) and "who's here" stay as
a PREVIEW until the members wave (real accounts, §11.2). The Log in / avatar menu is in the nav.

### 11.3 Order of work

1. §8e rooms (drop podcast room, `uses[]`, galleries, redirects, survey room→use) — small, ships first.
2. Schema: `visibility: members`, Studio form, `EventCard` fields the board needs (end time, lock).
3. Section 2, the board (public buttons only), with the Podcast card.
4. Section 3, the three views + filter bar; section 5, the event sheet; section 8, the rooms strip.
5. Supabase project + tables + RLS + member auth (§11.2); `/api/members/sync`.
6. Section 6 (who's here, check-in, self-reserve) + section 7 (ticker) + member bits of 2 and 5.
7. Phone pass at 390 on every state; smoke tests for each section; brief + URL-MAP updated.
Each step is its own branch + PR.
