/**
 * The content-type registry for this site — the only per-site work /admin needs.
 *
 * Everything the form can learn from the Zod schema, it does (types, required,
 * constraints, messages, and now labels/placeholders via `.meta()` in
 * lib/blog/schema.ts). This file holds only what a schema cannot say about
 * itself: where files live, how they are named, which field is the body.
 *
 * `images` marks the picture fields: the form shows a drop zone, the browser
 * shrinks the file to WebP, and the save commits it under public/blog/ in the
 * same commit as the post (ADMIN-06).
 */

import { defineContentType } from "@realiizlabs/admin/forms";
import { eventRegistryDefaults, slugFilename } from "@realiizlabs/admin/events";
import { postFrontmatterSchema } from "../blog/schema";
import { eventFrontmatterSchema } from "../events/schema";

export const posts = defineContentType({
  id: "posts",
  label: "Blog posts",
  singular: "Blog post",
  schema: postFrontmatterSchema,
  folder: "content/blog",
  filename: (fm) => `${String(fm.slug)}.mdx`,
  body: null, // the MDX body is below the frontmatter, not a frontmatter field
  images: ["heroImage", "ogImage"],
  order: [
    "title",
    "slug",
    "excerpt",
    "publishedAt",
    "updatedAt",
    "author",
    "tags",
    "heroImage",
    "heroImageAlt",
    "featured",
  ],
  // What Google and social cards see, kept together and apart from the on-page fields.
  groups: [{ label: "Search & social", fields: ["seoTitle", "description", "focusKeyword", "ogImage", "canonical"] }],
});

/**
 * Events — the package's events model, core fields only. To add RSVP / capacity
 * / private (`tickets`), a named venue (`venues`) or host / recording / slides
 * (`appearances`), pass the same list here AND in src/lib/events/schema.ts:
 *   ...eventRegistryDefaults({ with: ["tickets", "venues"] })
 * Labels, help text and the kinds list come from the package.
 */
export const events = defineContentType({
  id: "events",
  label: "Events",
  singular: "Event",
  schema: eventFrontmatterSchema,
  folder: "content/events",
  filename: slugFilename,
  body: null, // the long description is the MDX body
  ...eventRegistryDefaults(),
});

export const contentTypes = { posts, events } as const;
export type ContentTypeId = keyof typeof contentTypes;

/** Where a published item lives on the public site, per type — a type with no page of its own is simply absent. */
export const PUBLIC_URLS: Record<string, (slug: string) => string | null> = {
  posts: (slug) => `/blog/${slug}`,
  events: (slug) => `/events/${slug}`,
};

/** The reverse map for the Studio pill on the public site: URL prefix → type. Derived, so a new type needs one edit. */
export const STUDIO_ROUTES: Record<string, string> = Object.fromEntries(
  Object.entries(PUBLIC_URLS).flatMap(([typeId, fn]) => { const u = fn("x"); return u ? [[u.slice(0, -1), typeId]] : []; }),
);
