/**
 * The content-type registry for this site — the only per-site work /admin needs.
 *
 * Everything the form can learn from the Zod schema, it does (types, required,
 * constraints, messages, labels/placeholders via `.meta()`). This file holds only what
 * a schema cannot say about itself: where files live, how they are named, which field
 * is the body.
 *
 * SoundPlex has four types: Blog posts, Events (Studio Productions), Rooms, Members (the
 * Connection Wall). George and his team edit all four.
 */

import { defineContentType } from "@realiizlabs/admin/forms";
import { eventRegistryDefaults, slugFilename } from "@realiizlabs/admin/events";
import { postFrontmatterSchema } from "../blog/schema";
import { eventFrontmatterSchema, EVENT_GROUPS_ON, ROOM_SLUGS } from "../events/schema";
import { roomFrontmatterSchema } from "../rooms/schema";
import { memberFrontmatterSchema } from "../members/schema";

export const posts = defineContentType({
  id: "posts",
  label: "Blog posts",
  singular: "Blog post",
  schema: postFrontmatterSchema,
  folder: "content/blog",
  filename: (fm) => `${String(fm.slug)}.mdx`,
  body: null,
  images: ["heroImage", "ogImage"],
  order: ["title", "slug", "excerpt", "publishedAt", "updatedAt", "author", "tags", "heroImage", "heroImageAlt", "featured"],
  groups: [{ label: "Search & social", fields: ["seoTitle", "description", "focusKeyword", "ogImage", "canonical"] }],
});

const eventDefaults = eventRegistryDefaults({ with: [...EVENT_GROUPS_ON] });

export const events = defineContentType({
  id: "events",
  label: "Studio Productions",
  singular: "Event",
  schema: eventFrontmatterSchema,
  folder: "content/events",
  filename: slugFilename,
  body: null,
  ...eventDefaults,
  // Our fields slot in after the package's core order; the groups keep the package's.
  order: [...eventDefaults.order, "visibility", "producer", "mood"],
  groups: [
    { label: "Tickets", fields: ["url", "ticketLabel", "price", "rsvpUrl", "capacity", "closed", "private"] },
    { label: "For the room", fields: ["hostNote", "hostVideoUrl", "host", "recordingUrl", "slidesUrl"] },
    ...eventDefaults.groups.filter((g) => !["Tickets & RSVP", "Appearance details"].includes(g.label)),
    { label: "Import", fields: ["legacyUrl"] },
  ],
  options: { venue: () => [...ROOM_SLUGS] },
});

export const rooms = defineContentType({
  id: "rooms",
  label: "Rooms",
  singular: "Room",
  icon: "venues",
  schema: roomFrontmatterSchema,
  folder: "content/rooms",
  filename: (fm) => `${String(fm.slug)}.mdx`,
  body: null,
  images: ["heroImage"],
  order: ["name", "slug", "tagline", "description", "size", "capacity", "ceilings", "rates", "included", "bestFor", "order"],
  groups: [
    { label: "Pictures", fields: ["heroImage", "heroImageAlt", "gallery"] },
    { label: "Search", fields: ["focusKeyword", "legacyUrl"] },
  ],
});

export const members = defineContentType({
  id: "members",
  label: "Connection Wall",
  singular: "Member",
  icon: "users",
  schema: memberFrontmatterSchema,
  folder: "content/members",
  filename: (fm) => `${String(fm.slug)}.mdx`,
  body: null,
  images: ["portrait"],
  order: ["name", "slug", "role", "story", "offer", "looking", "portrait", "permission", "order"],
  groups: [
    { label: "Connections", fields: ["connections"] },
    { label: "Housekeeping", fields: ["placeholder"] },
  ],
});

export const contentTypes = { posts, events, rooms, members } as const;
export type ContentTypeId = keyof typeof contentTypes;

/** Where a published item lives on the public site, per type — a type with no page of its own is simply absent. */
export const PUBLIC_URLS: Record<string, (slug: string) => string | null> = {
  posts: (slug) => `/blog/${slug}`,
  events: (slug) => `/studio-productions/${slug}`,
  rooms: (slug) => `/rooms/${slug}`,
  members: () => null,
};

/** The reverse map for the Studio pill on the public site: URL prefix → type. Derived, so a new type needs one edit. */
export const STUDIO_ROUTES: Record<string, string> = Object.fromEntries(
  Object.entries(PUBLIC_URLS).flatMap(([typeId, fn]) => {
    const u = fn("x");
    return u ? [[u.slice(0, -1), typeId]] : [];
  }),
);
