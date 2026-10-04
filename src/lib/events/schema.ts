import { eventSchema, type EventFrontmatter } from "@realiizlabs/admin/events";

/**
 * Events (content/events/*.mdx) — the package's events model with the core
 * fields only: what, when, where, a link, a picture, cancelled / rescheduled.
 *
 * Need more? Switch groups on in src/lib/admin/content-types.ts AND here, e.g.
 *   eventSchema({ with: ["tickets"] })            → RSVP link, capacity, closed, private
 *   eventSchema({ with: ["venues"] })             → a named venue
 *   eventSchema({ with: ["appearances"] })        → host, recording, slides (talks, podcasts)
 * The kinds list (workshop, show, talk, …) comes from the package; "other" plus
 * a custom label covers anything not on it.
 */
export const eventFrontmatterSchema = eventSchema();

export type EventItem = EventFrontmatter;
