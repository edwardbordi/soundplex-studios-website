import { z } from "zod";

/**
 * Rooms (content/rooms/*.mdx) — the four rooms as data, one file each, editable in Studio.
 * Facts come from COMPANY-FACTS.md §4 (the live site's published numbers). The MDX body is
 * the room's one-paragraph story.
 */
export const roomFrontmatterSchema = z
  .object({
    name: z.string().min(1).meta({ label: "Name", placeholder: "WoodRoom" }),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase, hyphens only")
      .meta({ label: "Slug", help: "The web address: /rooms/<slug>" }),
    tagline: z.string().min(1).max(120).meta({ label: "One line", placeholder: "The stage. Eighty people, four feet away." }),
    /** Short description for cards and search. */
    description: z.string().min(1).max(230).meta({ label: "Description", help: "One or two sentences for cards and search engines." }),
    /** Numbers as printed on the live site. Strings on purpose — "2,800 sq ft", "up to 6". */
    size: z.string().optional().meta({ label: "Size", placeholder: "2,800 sq ft" }),
    capacity: z.string().optional().meta({ label: "Capacity", placeholder: "80" }),
    ceilings: z.string().optional().meta({ label: "Ceilings", placeholder: "15 ft, exposed joists" }),
    /** Published rates, as the site prints them. Each line is one rate. */
    rates: z.array(z.string()).default([]).meta({ label: "Rates", help: "One per line, as printed: “$550/hr · meetings & productions”." }),
    included: z.array(z.string()).default([]).meta({ label: "What's included", help: "One item per line." }),
    bestFor: z.array(z.string()).default([]).meta({ label: "Best for", help: "One per line: concerts, workshops, screenings…" }),
    heroImage: z.string().min(1).meta({ label: "Hero image" }),
    heroImageAlt: z.string().min(1).meta({ label: "Hero image alt" }),
    gallery: z.array(z.string()).default([]).meta({ label: "Gallery", help: "Image paths under public/rooms/." }),
    /** Display order on /rooms. */
    order: z.number().int().default(99).meta({ label: "Order" }),
    /** The old WordPress URL, for the redirect map. */
    legacyUrl: z.string().url().optional().meta({ label: "Old site URL" }),
    focusKeyword: z.string().min(1).meta({ label: "Focus keyword", help: "Never rendered — the page's one search intent." }),
  })
  .strict();

export type RoomItem = z.infer<typeof roomFrontmatterSchema>;
