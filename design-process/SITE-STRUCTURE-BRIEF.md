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
| `/rooms/podcast-studio` | Room page | `podcast studio Pennsauken NJ` (the live site's strongest SEO theme) | " |
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

**Home, in order:**
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
| `/about` art section | a painting on the wall, in a real hallway photo | the piece, full frame | title, artist, size, medium, price, **Buy / Enquire** (every piece is for sale — live site) | 2 if George gives 3–5 pieces with prices; else 3 |
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

## 9. Out of scope for wave 2 (named so they're not lost)

- **Members area (wave 3):** invite-only login for active Plex members; live check-in ("I'm in
  Studio A"); who's booked where (private calendar entries by room); member directory. Needs
  a small database + visitor auth — its own app layer, outside the MDX-only model.
- George's #2 personalised home, #4 SoundPlex TV, #8 Spark to Screen, #10 hidden objects
  (the song page is the seed), #11 living mural.
- Weddings night in the hero; more room transformations than the first five.
- Online room booking with availability (today: enquiry form; the calendar's private entries
  make real availability possible later).

## 10. Order of work (per AGENTS.md)

1. ~~AUDIENCE.md~~ done · 2. this brief · 3. **design interview → DESIGN-BRIEF.md** (the look is
already decided by the live brand + hero; the interview is short: confirm tokens, type, motion,
density) · 4. fresh repo from pro, port, redirects, smoke tests green · 5. content types + Studio
· 6. pages in this order: `/start`, `/contact-us`, `/rooms/*`, `/studio-productions`,
`/membership`, `/about`, home sections 3–6, blog port · 7. client review kit on · 8. cutover
checklist (URL-MAP.md).
