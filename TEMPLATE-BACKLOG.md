# Template backlog — known gaps, in priority order

Distilled from the 2026-08-06 self-audit and the lessons of the first two client sites built from
this template. Items here are acknowledged, not yet done. When one lands, delete its row.

| # | Gap | Why it matters | Sketch of the fix |
|---|---|---|---|
| 1 | **No tests.** CI runs lint → tsc → build and stops. | "A broken page can't ship" is the template's promise; today a broken page ships fine as long as it type-checks. | Playwright smoke suite (every static route 200s, 404 returns 404 by status not copy, feed.xml + sitemap respond) + a `smoke` CI job. |
| 2 | **No `seo:check`.** `focusKeyword` is required everywhere and verified nowhere. | The field's whole value proposition is unchecked prose. | `npm run seo:check`: keyword appears in title/slug/description/opening/one heading; warn >160-char descriptions; fail duplicate titles. Wire into CI. |
| 3 | **Law 4 (Schema) is reviewer-enforced only.** | Mechanically checkable, currently prose. | CI grep: every non-blog `page.tsx` renders `<JsonLd`. |
| 4 | **Law 1 CI grep missing.** Pages comply by convention, not enforcement. | One new page without `buildPageMetadata` reintroduces the gap silently. | CI grep: every `page.tsx` calls `buildPageMetadata` (blog/[slug] exempt — dynamic metadata). |
| 5 | **`heroImageAlt` is `.optional()`** while three docs call it required. | The `alt=""` fallback on the blog hero is reachable. | Drop `.optional()` in `src/lib/blog/schema.ts` (one character; do it before a site accrues posts without it). |
| 6 | **Schema drift**: `heroImage` path shape and date-only `publishedAt` documented, not enforced. | Cheap now, expensive after posts exist. | `.regex(/^\/blog\/[a-z0-9-]+\.webp$/)` on heroImage; `YYYY-MM-DD` regex before date coercion. |
| 7 | **`npm install` vs `npm ci` in CI** — deliberate (cross-OS lockfile scar), but CI no longer tests the lockfile. | A transitive dep can float between local and CI. | Keep `install` in the template; switch a client site to `ci` once its lockfile is regenerated on Linux. |
| 8 | **The component library never came back.** The template ships two widgets (`Hero`, `Testimonials`); the most recent client build grew to ~20 widgets and ~33 components, none of which were backported. | Every new site re-solves hours-of-operation, reviews, FAQ, CTA bands and section furniture from scratch — and each re-solve is a chance to get the SEO or a11y details wrong that the template is supposed to guarantee. | Port them generically, in the batches below. **Strip everything client-specific on the way in**: no brand names, no real copy, no client towns or services, no logos. Each arrives with neutral props, a sensible empty state, and a line in `CONTENT.md`. |

### Backlog 8 — what to port, in order

Batches are ordered by how often a build needs them.

1. **Business hours** — `OpenNow`, `HoursPopover`, `HoursTable`. Driven by a hours
   structure in `site-config`, not hard-coded days. Wants the open/closed logic to be
   timezone-correct and to handle holidays being absent gracefully.
2. **Review-mode kit** — `PreviewChrome`, `NotesWidget`, `VariantToggle`, `Walkthrough`,
   `previewPrefs`, `SpeedBadge`. This is the build-and-review layer used on every project
   and it belongs in the template rather than being copied forward by hand. It must stay
   entirely absent from a production build — the existing components do this by env flag;
   keep that and test it.
3. **Social proof** — `Reviews`, `ReviewsGrid`, `ReviewIcons`, `ReviewMenu`, `TrustStrip`.
   Takes reviews from content files; no hard-coded quotes, no platform logos in the repo.
4. **Section furniture** — `SectionHeading`, `PageHeader`, `JumpChips`, `CtaBand`,
   `InnerCtaBand`, `HowItWorks`, `ServicesGrid`, `Faq`, `FaqAsk`. The pieces every page is
   assembled from. `Faq` must keep emitting FAQ schema (Law 4).
5. **Navigation and hero variants** — `BarNav`, `NavB`, `NavLinks`, `UtilityBar`,
   `CallButton`, `HeroLight`, `HeroScene`, `IntroPlayer`, `ScrollScrubVideo`. Variants, so
   a build picks one rather than rewriting the nav each time.
6. **Local-service pieces** — `ServiceArea`, `ServiceAreaMap`, `ServiceAreaPicker`, and a
   generic lead form in place of the bespoke estimate form. Towns and services come from
   config; the map needs a no-API-key fallback.

Done in the 2026-09 pass (kept here so the history reads in one place): Original branding stripped
from `public/logos/`; one-post visuals removed; dev-cache + `_`-file fixes in the posts loader;
`_template.mdx`; blog pagination; `outputFileTracingIncludes`; skip link + `<main>` landmark;
Organization `@id`; 404 page; mobile menu; `.env.example` + BUILD-ENV law; `next/image` conversions;
homepage metadata; laws split into build-enforced vs reviewer-enforced; skills README corrected;
branch-protection transfer warning; source-verification steps in write-post; `AUDIENCE.md`.
