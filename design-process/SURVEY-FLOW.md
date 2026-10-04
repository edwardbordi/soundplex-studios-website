# The survey — `/start` — "What brings you to SoundPlex?"

Every CTA on the site lands here (Book a tour, Book this room, Join the Collective, the room
transformations, the footer). One question per screen, back button always, progress dots,
phone-first. Modelled on Ed's existing multi-step intake pattern. Draft 2026-10-04 — every
question is a proposal for George to cut or reword.

Posts to `/api/survey` → `GHL_WEBHOOK_SURVEY` with `path`, every answer, and `source`
(which page/CTA started it, from the query string: `?path=room&room=wood-room`).

## Q1 — What brings you to SoundPlex? *(single choice; pre-selectable by query string)*

1. **I want to rent a room** — a private event, meeting, shoot or session → path **room**
2. **I'm coming to a show or event** → path **attend**
3. **I want to join the Plex Collective** → path **collective**
4. **I want to make something** — a podcast, video, live broadcast, or a show of my own → path **produce**
5. **Something else — I'd like to talk to George** → path **talk**

## Path: room

- Which room? *(cards with the photo: Wood Room · Studio A · Podcast Studio · Sound Lounge · Not sure yet)*
- What's the occasion? *(party or celebration · wedding · business meeting or workshop · photo/video shoot · recording session · other)*
- When? *(date picker + "flexible")* · How long? *(2 hrs · half day · full day · multi-day)*
- Roughly how many people?
- Anything we should know? *(optional, free text)*
- Contact: first name, last name, email, phone, business name *(optional)*
- **Thank-you:** "We'll check the calendar and come back within one business day." + tour
  calendar ("Want to see it first? Book a tour.")

## Path: attend

- What kind of night? *(the mood prompts — "Put me near live music" · "Make me laugh" ·
  "Teach me something" · "Let me meet people" · "Show me a film" · "Surprise me")*
- → shows the next 3 matching public events inline with their tickets buttons (no form
  needed to get value)
- "Want the monthly what's-on email?" → first name + email → **newsletter webhook**, not the
  survey one
- **Thank-you:** the events list + "Coming alone? Say hi to George at the door."
  (No tour calendar on this path by default — **OPEN**.)

## Path: collective

- What do you do? *(creator / artist · business owner · podcaster · musician · other)*
- What would you want from it? *(multi: a place to work and create · people to collaborate
  with · clients and visibility · a stage for my own events · production help)*
- Have you been to SoundPlex before? *(yes · no)*
- Contact: first name, last name, email, phone, business or project name
- **Thank-you:** the three steps in one line each + **tour calendar** ("Membership starts with
  a complimentary tour.") *(Day Pass mention — **OPEN**, see facts §5.)*

## Path: produce

- What are you making? *(podcast · video · live broadcast / stream · a live show to sell
  tickets to · not sure yet)*
- Where are you with it? *(just an idea · have a plan, need a room and a crew · already
  producing, need a better room)*
- Do you need a team, or just the room? *(room only · room + operator/engineer · the whole
  thing, from blueprint to finished media)*
- Contact: first name, last name, email, phone, business or show name
- **Thank-you:** tour calendar ("Every production here starts with a discovery conversation.")

## Path: talk

- What's on your mind? *(free text)*
- Contact: first name, last name, email, phone
- **Thank-you:** "George reads these himself." + tour calendar

## Shared rules

- Contact fields identical across paths; email sanity-checked (`lib/email.ts`), honeypot, same-origin.
- Phone optional everywhere except **room** (George calls back).
- The thank-you page is a real route (`/start/thanks?path=…`) so GA4 can count it; the tour
  calendar is `TourCalendar` (GHL embed by `TOUR_CALENDAR_ID`), hidden gracefully when unset.
- Nothing promised that isn't true: no "instant availability", no prices quoted in the flow
  except the room rates already published.

## Open

- George: wording of Q1's five options; whether **attend** and **talk** get the calendar.
- GHL: one webhook for all paths with a `path` field (recommended), or five.
- Day Pass: still offered? (facts §5)
