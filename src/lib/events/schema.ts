import { z } from "zod";
import { eventSchema, type EventFrontmatter } from "@realiizlabs/admin/events";

/**
 * Events (content/events/*.mdx) — "Studio Productions": everything public and ticketed at
 * SoundPlex, whether George produces it or a member does. See COMPANY-FACTS.md §6–7 and
 * SITE-STRUCTURE-BRIEF.md §7.
 *
 * Built on the package's event model with three of its groups switched on (the same list
 * is passed in src/lib/admin/content-types.ts) and SoundPlex's own fields added underneath.
 * The kinds list is ours, drawn from the live site's 45-event history.
 */

// Kinds, labels, rooms and moods live in ./constants (no imports there, so client components
// can use them). Re-exported here so server code keeps one import path.
import { EVENT_KINDS, KIND_LABELS, MOODS, type EventKind, type Mood } from "./constants";
export { EVENT_KINDS, KIND_LABELS, ROOM_SLUGS, ROOM_NAMES, MOODS } from "./constants";
export type { EventKind, Mood, EventCard } from "./constants";

export const EVENT_GROUPS_ON = ["tickets", "venues", "appearances"] as const;

// The package types its schema as a bare ZodType; at runtime it is a ZodObject (its shape
// is what Studio walks). The cast lets us add fields; the parse below proves it at build.
const base = eventSchema({
  kinds: [...EVENT_KINDS],
  with: [...EVENT_GROUPS_ON],
}) as unknown as z.ZodObject<z.ZodRawShape>;

export const EXTRA_FIELDS = z.object({
  /**
   * public = a Studio Production, shown everywhere. private = a rental or a member session:
   * never rendered on the public site, but on the same calendar so George (and later,
   * members) can see what's booked where. One data model serves both.
   */
  visibility: z.enum(["public", "members", "private"]).default("public").meta({
    label: "Visibility",
    help: "Public: shown to everyone, with its own page. Members: on What's On with a lock — details for logged-in members only. Private (rentals, bookings): the room just shows as taken.",
  }),
  /** Who's putting it on: SoundPlex, or a member's name. Rendered as "presented by". */
  producer: z.string().trim().max(80).optional().meta({
    label: "Presented by",
    placeholder: "SoundPlex, or a member's name",
  }),
  /** Tickets are flexible per event: any URL (GHL payment link, Eventbrite…) + a label. */
  ticketLabel: z.string().trim().max(40).optional().meta({
    label: "Ticket button says",
    placeholder: "Get tickets · RSVP · Free — just come",
  }),
  price: z.string().trim().max(40).optional().meta({
    label: "Price",
    placeholder: "$25 · Free · $10 at the door",
  }),
  /** A welcoming line for someone coming alone (George's #7). */
  hostNote: z.string().trim().max(240).optional().meta({
    label: "A note for someone coming alone",
    placeholder: "Come early — the first few people in the room are the ones you'll end up talking to.",
  }),
  /** A short host intro video, if there is one. */
  hostVideoUrl: z.string().url().optional().meta({ label: "Host video (URL)" }),
  mood: z
    .array(z.enum(MOODS.map((m) => m.value) as [Mood, ...Mood[]]))
    .default([])
    .meta({ label: "Kind of night", help: "Which prompts should find this event." }),
  /** Where the record came from — the WordPress import carries its old URL for redirects. */
  legacyUrl: z.string().url().optional().meta({ label: "Old site URL", help: "Set by the import; leave alone." }),
});

export const eventFrontmatterSchema = base.extend(EXTRA_FIELDS.shape);

type BaseFrontmatter = EventFrontmatter<(typeof EVENT_GROUPS_ON)[number], EventKind>;
/** What a parsed event looks like: the package's fields for our groups and kinds, plus ours. */
export type EventItem = BaseFrontmatter & z.infer<typeof EXTRA_FIELDS>;

export function kindLabel(e: Pick<EventItem, "kind" | "kindLabel">): string {
  if (e.kind === "other") return e.kindLabel || KIND_LABELS.other;
  return KIND_LABELS[e.kind as EventKind] ?? KIND_LABELS.other;
}
