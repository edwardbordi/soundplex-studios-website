/**
 * The survey — "What brings you to SoundPlex?" — as data.
 *
 * Every CTA on the site lands on /start. One question per screen, a path chosen on the first
 * screen, a shared contact step at the end. Source of truth for the questions is
 * design-process/SURVEY-FLOW.md; this file is that document made executable. Change the
 * questions HERE, never in the widget — the widget renders whatever this says.
 *
 * Pre-selecting: `/start?path=room&room=wood-room` lands on the room path with the room
 * chosen (the room cards and transformations link this way). Unknown values are ignored.
 */

import { ROOM_USES } from "../rooms/uses";

export type PathId = "room" | "attend" | "collective" | "produce" | "website" | "talk";

export type Option = { value: string; label: string; note?: string };

export type Question =
  /** An option with value "other" opens a box for their own answer; `other` shapes that box. */
  | { id: string; kind: "single"; label: string; help?: string; options: Option[]; other?: { placeholder?: string; input?: "text" | "number"; suffix?: string } }
  | { id: string; kind: "multi"; label: string; help?: string; options: Option[] }
  | { id: string; kind: "text"; label: string; help?: string; placeholder?: string; optional?: boolean; input?: "text" | "url" | "number" }
  | { id: string; kind: "textarea"; label: string; help?: string; placeholder?: string; optional?: boolean }
  | { id: string; kind: "date"; label: string; help?: string; optional?: boolean };

export type Path = {
  id: PathId;
  /** The Q1 option text. */
  choice: string;
  /** One line under the choice. */
  choiceNote: string;
  questions: Question[];
  /** Phone required at the contact step? (George calls room inquiries back.) */
  phoneRequired: boolean;
  /** What the thank-you page says, and whether it shows George's calendar. */
  thanks: { title: string; body: string; calendar: boolean; calendarLead?: string };
};

/** Three rooms (SITE-STRUCTURE-BRIEF §8e). Podcast is a USE — see the `use` question. */
export const ROOMS: Option[] = [
  { value: "wood-room", label: "WoodRoom", note: "stage · 80 people · 2,800 sq ft" },
  { value: "studio-a", label: "Studio A", note: "recording · in the round · 80 people" },
  { value: "sound-lounge", label: "SoundLounge", note: "speakeasy · 50 people · 1,800 sq ft" },
  { value: "not-sure", label: "Not sure yet", note: "we’ll help you pick the right one" },
];

/**
 * What the survey knows about a room once one is chosen — passed in by /start (server) from
 * content/rooms, so the survey can say which room you're renting, show only that room's uses,
 * and mention its capacity. `ref` is the name as it reads mid-sentence: "the WoodRoom", "Studio A".
 */
export type RoomContext = { slug: string; name: string; ref: string; tagline: string; capacity?: string; uses: string[]; image: string; imageAlt: string };

/** What the room is for — the same list the room pages show (src/lib/rooms/uses.ts). */
export const USES: Option[] = ROOM_USES.map((u) => ({ value: u.id, label: u.label, ...(u.note ? { note: u.note } : {}) }));

export const PATHS: Path[] = [
  {
    id: "room",
    choice: "I want to rent a room",
    choiceNote: "A podcast, a party, a workshop, a shoot — any of the three rooms.",
    phoneRequired: true,
    questions: [
      { id: "room", kind: "single", label: "Which room?", help: "Podcasts go in any of them — pick a favorite, or let us set up wherever is free.", options: ROOMS },
      { id: "use", kind: "single", label: "What’s it for?", options: USES },
      { id: "date", kind: "date", label: "When?", help: "A date, or leave it blank if you’re flexible.", optional: true },
      {
        id: "duration",
        kind: "single",
        label: "How long?",
        help: "Roughly is fine. If you know the exact hours, pick the last one.",
        options: [
          { value: "1h", label: "An hour" },
          { value: "2h", label: "Two hours" },
          { value: "3-4h", label: "Three or four hours" },
          { value: "half-day", label: "Half a day", note: "about five hours" },
          { value: "full-day", label: "All day" },
          { value: "multi", label: "More than a day" },
          { value: "other", label: "I know exactly how many hours" },
        ],
        other: { placeholder: "6", input: "number", suffix: "hours" },
      },
      { id: "headcount", kind: "text", label: "Roughly how many people?", input: "number", placeholder: "40" },
      { id: "notes", kind: "textarea", label: "Anything we should know?", placeholder: "Catering, a stage, a quiet room for a speaker…", optional: true },
    ],
    thanks: {
      title: "We’ll check the calendar.",
      body: "You’ll hear back within one business day. Want to see the room first? Book a tour below and George will walk you through.",
      calendar: true,
      calendarLead: "Book a tour",
    },
  },
  {
    id: "attend",
    choice: "I’m coming to a show or event",
    choiceNote: "Music, comedy, talks, screenings — tell us your kind of night.",
    phoneRequired: false,
    questions: [
      {
        id: "mood",
        kind: "multi",
        label: "What kind of night?",
        help: "Pick as many as you like.",
        options: [
          { value: "music", label: "Put me near live music" },
          { value: "comedy", label: "Make me laugh" },
          { value: "learn", label: "Teach me something" },
          { value: "people", label: "Let me meet people" },
          { value: "film", label: "Show me a film" },
          { value: "surprise", label: "Surprise me" },
        ],
      },
    ],
    thanks: {
      title: "You’re on the list.",
      body: "We’ll send you what’s on, once a month, matched to what you picked. Coming alone? Say hi to George at the door — everyone does.",
      calendar: false,
    },
  },
  {
    id: "collective",
    choice: "I want to join the Plex Collective",
    choiceNote: "Membership — a place to work, people to work with.",
    phoneRequired: false,
    questions: [
      {
        id: "who",
        kind: "single",
        label: "What do you do?",
        options: [
          { value: "creator", label: "I’m a creator or artist" },
          { value: "owner", label: "I run a business" },
          { value: "podcaster", label: "I make a podcast" },
          { value: "musician", label: "I’m a musician" },
          { value: "other", label: "Something else" },
        ],
      },
      {
        id: "want",
        kind: "multi",
        label: "What would you want from it?",
        help: "Pick as many as you like.",
        options: [
          { value: "place", label: "A place to work and create" },
          { value: "people", label: "People to collaborate with" },
          { value: "clients", label: "Clients and visibility" },
          { value: "stage", label: "A stage for my own events" },
          { value: "production", label: "Help producing my content" },
        ],
      },
      {
        id: "been",
        kind: "single",
        label: "Have you been to SoundPlex before?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "Not yet" },
        ],
      },
    ],
    thanks: {
      title: "Membership starts with a tour.",
      body: "Membership, the Creator Blueprint, then Amplify — but first, come see the place. The tour is on us.",
      calendar: true,
      calendarLead: "Book your complimentary tour",
    },
  },
  {
    id: "produce",
    choice: "I want to make something",
    choiceNote: "A podcast, video, live broadcast, or a show of my own.",
    phoneRequired: false,
    questions: [
      {
        id: "what",
        kind: "single",
        label: "What are you making?",
        options: [
          { value: "podcast", label: "A podcast" },
          { value: "video", label: "Video" },
          { value: "broadcast", label: "A live broadcast or stream" },
          { value: "show", label: "A live show I’ll sell tickets to" },
          { value: "unsure", label: "Not sure yet" },
        ],
      },
      {
        id: "stage",
        kind: "single",
        label: "Where are you with it?",
        options: [
          { value: "idea", label: "Just an idea" },
          { value: "plan", label: "I have a plan — I need a room and a crew" },
          { value: "producing", label: "Already producing — I need a better room" },
        ],
      },
      {
        id: "team",
        kind: "single",
        label: "Do you need a team, or just the room?",
        options: [
          { value: "room", label: "Just the room" },
          { value: "operator", label: "The room plus an operator or engineer" },
          { value: "everything", label: "The whole thing — from blueprint to finished media" },
        ],
      },
    ],
    thanks: {
      title: "Every production here starts with a conversation.",
      body: "A discovery session with George: what you’re making, who it’s for, what it needs. Pick a time.",
      calendar: true,
      calendarLead: "Book a discovery session",
    },
  },
  {
    id: "website",
    choice: "I need a website for my business",
    choiceNote: "We build it first. You pay when you love it.",
    phoneRequired: false,
    questions: [
      { id: "business", kind: "text", label: "What’s the business?", placeholder: "Name and what you do" },
      { id: "site", kind: "text", label: "Current website, if there is one", input: "url", placeholder: "yourbusiness.com", optional: true },
      {
        id: "goal",
        kind: "multi",
        label: "What should the new site do for you?",
        help: "Pick as many as you like.",
        options: [
          { value: "found", label: "Get found on Google" },
          { value: "book", label: "Book more appointments or sell" },
          { value: "look", label: "Look as good as we are in person" },
          { value: "self", label: "Run our own events and blog" },
          { value: "replace", label: "Replace a site we’re embarrassed by" },
        ],
      },
      {
        id: "budget",
        kind: "single",
        label: "A complete site starts at $6,000.",
        help: "Up to ten pages, built on our platform, with your own publishing dashboard.",
        options: [
          { value: "ok", label: "That works" },
          { value: "talk", label: "I’d need to talk about it" },
        ],
      },
      {
        id: "when",
        kind: "single",
        label: "When do you need it?",
        options: [
          { value: "asap", label: "As soon as possible" },
          { value: "quarter", label: "This quarter" },
          { value: "exploring", label: "Just exploring" },
        ],
      },
    ],
    thanks: {
      title: "We build it first. You pay when you love it.",
      body: "Next is a short discovery call: your business, your customers, what the site has to do. Then we build a preview and show it to you live.",
      calendar: true,
      calendarLead: "Book a discovery call",
    },
  },
  {
    id: "talk",
    choice: "Something else",
    choiceNote: "I’d like to talk to George.",
    phoneRequired: false,
    questions: [{ id: "message", kind: "textarea", label: "What’s on your mind?", placeholder: "A few lines is plenty." }],
    thanks: {
      title: "George reads these himself.",
      body: "Expect a reply within a day or two. If you’d rather just come by, pick a time below.",
      calendar: true,
      calendarLead: "Book a time",
    },
  },
];

export const Q1 = {
  label: "What brings you to SoundPlex?",
  help: "One answer. You can always come back.",
};

export function pathById(id: string | null | undefined): Path | undefined {
  return PATHS.find((p) => p.id === id);
}

/** The contact step is the same on every path; phone is required only where George calls back. */
export const CONTACT_FIELDS = [
  { id: "firstName", label: "First name", autocomplete: "given-name", type: "text" },
  { id: "lastName", label: "Last name", autocomplete: "family-name", type: "text" },
  { id: "email", label: "Email", autocomplete: "email", type: "email" },
  { id: "phone", label: "Phone", autocomplete: "tel", type: "tel" },
] as const;
