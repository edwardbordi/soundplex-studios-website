# Content standard — blog posts & SEO

The authoring + SEO standard for blog posts. The zod schema
([`src/lib/blog/schema.ts`](src/lib/blog/schema.ts)) enforces *structure* at build time; this doc is
the human-readable source of truth for the *conventions* on top of it (lengths, formats,
policy-required fields, and the SEO/QA intent). It's part of the **framework** — the standard is
fixed; what you write is yours.

Posts live in [`content/blog/`](content/blog/) as `*.mdx` files. The filename (minus `.mdx`) **must
equal the `slug`**. They're loaded + validated by [`src/lib/blog/posts.ts`](src/lib/blog/posts.ts)
and rendered by [`src/app/blog/[slug]/page.tsx`](src/app/blog/[slug]/page.tsx). Everything below is
also summarized in [`AGENTS.md`](AGENTS.md) → "How to add a BLOG POST".

---

## Frontmatter spec

| Field | Required | Format / rule |
|---|---|---|
| `title` | **Yes** | Editorial headline — the `<h1>`. Also the `<title>`/OG title **fallback** when `seoTitle` is empty. |
| `seoTitle` | No | Search title for Google and the browser tab (max 90; **target 50–60 including the `— {SITE_NAME}` suffix**). A good H1 often runs 70–90 chars; Google truncates around 60, so give the tab its own shorter line. Blank = same as `title`. |
| `description` | **Yes** | Meta description. **Target ~155 characters**; schema enforces a **230-char hard max** (see below). |
| `publishedAt` | **Yes** | **Date-only string**, `"YYYY-MM-DD"` (e.g. `"2026-06-28"`). |
| `author` | **Yes** | Author name (e.g. `"Jane Doe"`). |
| `slug` | **Yes** | Lowercase kebab-case, `^[a-z0-9]+(?:-[a-z0-9]+)*$`. **Must match the filename.** |
| `excerpt` | **Yes** | Short blurb shown on the `/blog` index cards. One or two sentences. |
| `tags` | **Yes** | **Exactly 3**, each lowercase (`^[a-z0-9]+(?:-[a-z0-9]+)*$`). Enforced by the schema. |
| `heroImage` | **Yes** | Image path at `/blog/<slug>.webp` (see below). Enforced by the schema. |
| `heroImageAlt` | **Yes** | Real alt text for the hero (Image Law). |
| `focusKeyword` | **Yes** | Internal SEO-QA north-star (see below). Never rendered. |
| `updatedAt` | Optional | `"YYYY-MM-DD"`. Add **only** when a post is genuinely revised after publish; surfaces an "Updated" date. |
| `featured` | Optional | Boolean. Powers the home-page Featured Read (see below). |
| `ogImage` | Optional | Only to **override** the social image; defaults to `heroImage`. |
| `canonical` | Optional | Absolute URL; only to override the default `/blog/<slug>`. |

> The schema is `.strict()` — **unknown/misspelled keys fail the build** (e.g. `desciption:`), so
> there's no silent fallback. Add a field to the schema first, then use it.

### What the schema enforces vs. what's documented-only

The schema ([`src/lib/blog/schema.ts`](src/lib/blog/schema.ts)) is the build-time gate — these rules
**break the build** if violated, so they're checkable, not vibes:

- **`heroImage` required** (non-empty path) and **`heroImageAlt` required**.
- **`tags`: exactly 3**, each lowercase kebab/alphanumeric, non-empty.
- **`description`: 1–230 characters** (hard max; the ~155 target is editorial, not enforced).
- **`featured`: optional boolean.**
- **`focusKeyword` required** (validated, but never rendered — QA-only).
- All other required fields (`title`, `publishedAt`, `author`, `slug`, `excerpt`) per the table
  above; unknown keys rejected (`.strict()`).

Documented-only (conventions this doc sets, **not** machine-enforced): the **~155-char description
target**, `publishedAt` as a **date-only** string, the **`/blog/<slug>.webp`** hero path convention,
**≤1 `featured`** post at a time, the **focus-keyword placement** guidance, and the
**data-honesty rule**.

### Copy-paste template

```yaml
---
title: "Your Editorial Headline — With an Optional Subtitle"
description: "~155-char meta description that reads naturally and contains the focus keyword. Written for the search snippet, not stuffed."
publishedAt: "2026-06-28"
author: "Author Name"
slug: "your-post-slug"
excerpt: "The index-card hook — a sentence or two that earns the click. Distinct from the meta description."
tags: ["tag-one", "tag-two", "tag-three"]
heroImage: "/blog/your-post-slug.webp"
heroImageAlt: "Describe the hero image for screen readers and search."
focusKeyword: "your focus keyword"
---
```

Optional fields, only when needed:

```yaml
updatedAt: "2026-07-15"   # only if revised after publish
featured: true            # only on the single home-page Featured Read post
# ogImage: "/blog/your-post-slug-og.webp"   # only to override the social image
# canonical: "https://..."                   # only to override the default canonical
```

---

## Field conventions & decisions

### Meta description — target ~155 characters
Google truncates the displayed snippet around 155–160 characters. **Aim for ~155.** Write it as the
search result you'd want to read — natural, benefit-led, with the focus keyword present once. The
schema enforces a **230-character hard max** as a guardrail; ~155 is the editorial target you write
to.

### heroImage — required, and it doubles as the social thumbnail
Every post **must** ship a `heroImage`: a file at `/blog/<slug>.webp` (in
[`public/blog/`](public/blog/)). Beyond the on-page hero, it **auto-serves as the OpenGraph/Twitter
social thumbnail** via the `ogImage` fallback (`ogImage ?? heroImage`). So you only set a separate
`ogImage` when you want the social card to differ from the on-page hero. If a post has no hero at all,
OG falls back to the site default (`OG_IMAGE_PATH` in [`src/lib/site-config.ts`](src/lib/site-config.ts))
— avoid relying on that. `.webp` is the convention (small, fast); give every hero real `heroImageAlt`
(Image Law).

### focusKeyword — the SEO north-star, never a meta tag
`focusKeyword` declares the **single primary thing the post is optimized for**. It is **internal
SEO-QA only** and is **NEVER** rendered as a `<meta name="keywords">` tag (that tag is dead and
ignored by search engines). The render layer doesn't output it at all.

The actual optimization is making the focus keyword **appear naturally** across the on-page signals:
the **`title`** (and therefore the `<h1>`), the **`slug`**, the **`description`**, the **opening
paragraph**, and at least one **section heading**. Natural usage, not stuffing — if it doesn't read
like normal prose, rework it.

### tags — exactly 3, lowercase
Three lowercase tags per post. They group content (tag pages are a future feature). Reuse existing
tags where they fit rather than minting near-duplicates.

### featured — the Featured Read flag
`featured: true` marks the post surfaced by the home-page **Featured Read** section (a single
confident feature, not a carousel). Convention: **at most one post** carries `featured: true` at a
time. It's a schema-optional boolean; absence is treated as `false`.

---

## SEO / metadata / structured data — generated automatically

Good frontmatter is all you need; the route does the rest. From
[`src/app/blog/[slug]/page.tsx`](src/app/blog/[slug]/page.tsx):

- **`<title>`** — `"{seoTitle ?? title} — {SITE_NAME}"` (the `— {SITE_NAME}` suffix is added by the route;
  `SITE_NAME` comes from [`src/lib/site-config.ts`](src/lib/site-config.ts)).
- **Meta description** — `description`.
- **Canonical** — `/blog/<slug>` (or the `canonical` override).
- **OpenGraph** — `type: "article"`, with `seoTitle ?? title`, description, url, `publishedTime`, `modifiedTime`
  (= `updatedAt ?? publishedAt`), `authors`, and image (`ogImage ?? heroImage`, resolved to an
  absolute URL).
- **Twitter** — `summary_large_image` with the same title/description/image.
- **JSON-LD** — a per-post **`BlogPosting`** schema is emitted (headline, description,
  `datePublished`, `dateModified`, `author` → Person, `publisher` → your Organization + logo, image,
  url, `mainEntityOfPage`). The site-wide Organization schema lives separately in the root layout.
- **Dates** render via [`src/lib/blog/format.ts`](src/lib/blog/format.ts) (fixed `en-US`, UTC) as
  e.g. "June 28, 2026". An "Updated" date shows only when `updatedAt` differs from `publishedAt`.

Authors don't touch any of this — write the frontmatter well and it's correct.

---

## Inline visual components

Posts may embed **custom MDX components** — React components registered in the blog's
`mdx-components` map and then referenced as JSX tags directly in the `.mdx` body (e.g.
`<Chart />`). They render as islands inside the otherwise server-rendered post; interactive ones are
`"use client"`. When adding components: build with the site's actual design tokens and conventions,
respect `prefers-reduced-motion`, and keep them responsive.

---

## Data-honesty rule

This rule is **policy, not machine-checkable** — the schema can't verify a chart's proportions, so it
lives on author + reviewer discipline.

**Any chart, graphic, or data visualization must represent its cited figures accurately — show the
real number even when it's visually awkward.**

- A 6% value renders at 6% — never inflated, rounded up, or rescaled to "look better."
- Proportional visuals (bars, funnels, splits) must stay proportional to the true figures.
- Distorting data for aesthetics is **prohibited.**

The article's credibility depends on the numbers being true. When a real number is hard to render
cleanly, fix the *design*, not the *number*.
