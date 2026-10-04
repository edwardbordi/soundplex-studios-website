import { z } from "zod";
import { SITE_NAME } from "@/lib/site-config";

/**
 * Frontmatter schema for blog posts (content/blog/*.mdx).
 *
 * This is the single source of truth for what a post's frontmatter must contain.
 * It is parsed with `.safeParse` in the loader (lib/blog/posts.ts), which throws
 * a clear, file-named error on any failure — so broken or incomplete frontmatter
 * breaks the build rather than slipping through.
 *
 * `.meta({ label, placeholder, help })` on each field is what Studio (/admin, built on
 * @realiizlabs/admin) shows the person editing — plain English for a non-technical
 * client. Keep it LAST in each chain (after .optional()) so the form reads it off the
 * outer schema node.
 *
 * `.strict()` is intentional: unknown/misspelled keys are rejected loudly (e.g.
 * `desciption:` won't silently fall back to the meta-description default). Add a
 * field here first, then use it in content.
 *
 * NOTE on `focusKeyword`: it is an editorial north-star — the single primary
 * keyword a post is optimized for. It is stored and exposed for SEO QA, but it
 * must NEVER be rendered as `<meta name="keywords">` (that tag is dead/ignored by
 * search engines). The render layer should read it for QA/reporting only.
 */
export const postFrontmatterSchema = z
  .object({
    /** Post title — the H1 readers see. Required. Also the <title> fallback when seoTitle is empty. */
    title: z.string().min(1, "title is required and must be non-empty")
      .meta({ label: "Title (H1)", placeholder: "The headline at the top of the post", help: "The big headline at the top of the post, and what shows in the blog list. Say what the post is about in plain words — this can be as long as it needs to be." }),

    /**
     * Search title — what Google and the browser tab show. Optional; falls back to
     * `title`. Kept separate because a good H1 often runs 70–90 characters while
     * Google truncates around 60. The site appends " — {SITE_NAME}" on render.
     */
    seoTitle: z.string().max(90, "seoTitle must be at most 90 characters").optional()
      .meta({ label: "Search title", placeholder: "Shorter version for Google and the browser tab (blank = same as title)", recommended: [50, 60], suffix: ` — ${SITE_NAME}`, help: "What Google and the browser tab show instead of the headline. Keep it under about 60 characters including the site name, or Google cuts it off. Leave blank to use the Title." }),

    /**
     * Meta description for SEO and social cards. Required.
     * Target ~155 chars (Google's snippet limit) — see AGENTS.md. The schema
     * enforces only a generous 230-char hard cap so existing posts pass; ~155
     * is the documented editorial target, not a machine-enforced limit.
     */
    description: z
      .string()
      .min(1, "description is required and must be non-empty")
      .max(230, "description must be at most 230 characters (target ~155 — see AGENTS.md)")
      .meta({ label: "Meta description", placeholder: "One or two sentences for Google and social previews (about 155 characters)", help: "The one- or two-sentence summary Google shows under your link in search results, and what social sites use when someone shares the post. Aim for 120–155 characters." }),

    /** Publication date. Accepts a YAML date or ISO string; coerced to a Date. Required. */
    publishedAt: z.coerce.date({ message: "publishedAt is required and must be a valid date" })
      .meta({ label: "Publish date", help: "The date shown on the post and used to order the blog list, newest first. Set it to today for a new post." }),

    /** Last-updated date. Coerced to a Date when present. Optional. */
    updatedAt: z.coerce.date({ message: "updatedAt must be a valid date" }).optional()
      .meta({ label: "Last updated", placeholder: "Leave blank unless you are revising a published post", help: "Only for revisions. Set it when you meaningfully update a published post — readers and Google both see it. Leave blank otherwise." }),

    /** Author name. Required. */
    author: z.string().min(1, "author is required and must be non-empty")
      .meta({ label: "Author", placeholder: "Your name as it should appear on the post", help: "The name shown as the writer, on the post and in the blog list." }),

    /** URL segment for /blog/[slug]. Required; must be a kebab-case slug. */
    slug: z
      .string()
      .min(1, "slug is required")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "slug must be a lowercase kebab-case URL segment (e.g. my-first-post)",
      )
      .meta({ label: "Web address (slug)", placeholder: "e.g. my-first-post — lowercase words joined by hyphens", help: "The last part of the post's link: yoursite.com/blog/THIS. Lowercase words joined by hyphens, no spaces. Changing it after publishing breaks any links people already shared." }),

    /** Short blurb shown on index cards. Required. */
    excerpt: z.string().min(1, "excerpt is required and must be non-empty")
      .meta({ label: "Excerpt", placeholder: "One sentence shown on the blog index card", help: "The short teaser shown on the blog list page under the title, before someone clicks through. Not used by Google — that's the Meta description." }),

    /**
     * Exactly 3 lowercase tags (house standard — see AGENTS.md). Group content;
     * tag pages are a future feature. Each must be lowercase kebab/alphanumeric.
     */
    tags: z
      .array(
        z
          .string()
          .min(1, "tags must be non-empty")
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "tags must be lowercase (letters, digits, hyphens) — e.g. ai, lead-gen",
          ),
      )
      .length(3, "exactly 3 tags are required")
      .meta({ label: "Tags", placeholder: "exactly three, e.g. ai, lead-gen, strategy", help: "Three short topics for the post, lowercase with hyphens (like ai-agents). Readers use them to find related posts." }),

    /**
     * Header image path (/blog/<slug>.webp). Required — see AGENTS.md.
     * Also serves as the OG/social thumbnail via the ogImage fallback.
     */
    heroImage: z.string().min(1, "heroImage is required and must be a non-empty path")
      .meta({ label: "Header image", placeholder: "/blog/my-first-post.webp", help: "The large picture at the top of the post and on the blog list card. For now, the path of an image already on the site, like /blog/my-post.webp." }),

    /**
     * Alt text for the hero image (accessibility + image SEO). Optional today so existing posts pass;
     * the page SEO contract makes it required going forward. Wire into the hero <img alt> + populate.
     */
    heroImageAlt: z.string().min(1, "heroImageAlt must be non-empty when present").optional()
      .meta({ label: "Header image description", placeholder: "What the image shows, for screen readers and search", help: "A sentence describing the picture, for readers using a screen reader and for Google Images. Say what's in it, not \"image of\"." }),

    /** Social-share image path/URL. Optional. */
    ogImage: z.string().min(1, "ogImage must be a non-empty path").optional()
      .meta({ label: "Social share image", placeholder: "Leave blank to reuse the header image", help: "The picture shown when someone shares the link on LinkedIn, X or in a chat app. Leave blank to reuse the header image." }),

    /** Canonical URL override (absolute). Optional. */
    canonical: z.string().url("canonical must be an absolute URL").optional()
      .meta({ label: "Canonical URL", placeholder: "Only if this post was published somewhere else first", help: "Advanced. Only if this article was first published somewhere else — paste the original address so Google credits that one. Otherwise leave blank." }),

    /**
     * Marks the single post surfaced by the home-page Featured Read section.
     * Optional; absent is treated as false. Keep at most one post `featured`.
     */
    featured: z.boolean().optional()
      .meta({ label: "Featured post", help: "Pins this post to the top of the blog. Usually only one post at a time." }),

    /**
     * Single primary keyword this post targets. Required.
     * Editorial/SEO-QA only — never emitted as a meta keywords tag.
     */
    focusKeyword: z.string().min(1, "focusKeyword is required and must be non-empty")
      .meta({ label: "Focus keyword", placeholder: "The one search phrase this post is written to rank for", help: "The search phrase this post is written to rank for, like \"ai agent teams\". Never shown to readers — it's for tracking SEO results." }),
  })
  .strict();

/** Validated, typed frontmatter (dates are real Date objects after coercion). */
export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;
