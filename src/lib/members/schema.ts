import { z } from "zod";

/**
 * Members (content/members/*.mdx) — the Connection Wall's people, one file each, editable
 * in Studio. George's rule is `permission`: a member appears on the public wall only when
 * they've agreed; connections show only when BOTH members have `permission: true`.
 *
 * Connections live on the member who tells the story (`connections[]`), pointing at the
 * other member's slug. The MDX body is optional longer copy for a future member page.
 */
export const connectionSchema = z.object({
  with: z.string().min(1).meta({ label: "Connected with (member slug)" }),
  steps: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]).meta({
    label: "How it went",
    help: "Three short steps: how it started → what happened → where it went.",
  }),
});

export const memberFrontmatterSchema = z
  .object({
    name: z.string().min(1).meta({ label: "Name" }),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase, hyphens only").meta({ label: "Slug" }),
    role: z.string().min(1).max(60).meta({ label: "Role", placeholder: "Founder, a skincare brand" }),
    story: z.string().min(1).max(200).meta({ label: "Their story", help: "One sentence. Who they are in this building." }),
    offer: z.string().min(1).max(160).meta({ label: "I offer" }),
    looking: z.string().min(1).max(160).meta({ label: "I'm looking for" }),
    portrait: z.string().optional().meta({ label: "Portrait", help: "4:5, black-and-white. Without one the wall shows initials." }),
    permission: z.boolean().default(false).meta({ label: "Has agreed to be on the wall", help: "Nothing shows until this is on." }),
    connections: z.array(connectionSchema).default([]).meta({ label: "Connections" }),
    order: z.number().int().default(99).meta({ label: "Wall order" }),
    /** Placeholder cast vs real member — placeholders are removed before launch. */
    placeholder: z.boolean().default(false).meta({ label: "Placeholder (not a real member)" }),
  })
  .strict();

export type MemberItem = z.infer<typeof memberFrontmatterSchema>;
