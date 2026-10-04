# Site-structure brief

Fill this in FIRST, before writing any code. It defines the site's skeleton — what exists and how it's
composed — separate from how it looks (that's the design brief). The `site-structure` skill can
generate a draft of this from a short conversation.

> Copy this file per project and fill the blanks. Delete the guidance italics.

## 1. Site + goal

- **Business / site name:** …
- **What the site is for (the one job it must do):** …
- **Primary call to action:** *(book a call / buy / get a quote / subscribe …)*
- **Primary audience:** …

## 2. Pages (the routes)

List every page. Mark each with its purpose and primary keyword/intent (for the SEO contract).

| Route | Purpose | Focus keyword / intent |
| --- | --- | --- |
| `/` | Home | … |
| `/about` | … | … |
| `/services` | … | … |
| `/blog` | Blog index | blog |
| `/contact` | … | … |
| … | … | … |

*No templated/doorway pages (Uniqueness Law) — every page is unique, first-hand content.*

## 3. Layouts — home vs. internal

- **Home layout:** *(which sections, in order — e.g. hero → social proof → services → CTA)*
- **Internal-page layout:** *(the shared shell for about/services/etc. — e.g. header band → content → CTA)*
- **Blog post layout:** *(uses the built-in post template; note any additions)*

## 4. Component plan — global vs. widget vs. template

Decide what's built once and reused (see AGENTS.md → Component architecture).

- **Global** *(every page — `components/global/`)*: Header/Nav, Footer, … 
- **Widgets** *(reusable blocks — `components/widgets/`)*: Hero, CTA, FeatureGrid, Testimonial/Review,
  FAQ, … *(which pages use each)*
- **UI primitives** *(`components/ui/`)*: Button, Eyebrow, …
- **Reused throughout:** *(e.g. a review widget that appears on home, services, and a landing page)*

## 5. Navigation & IA

- **Header nav items:** …
- **Footer groups/links:** …
- **Any secondary nav / breadcrumbs:** …

## 6. Content sources

- **Blog:** in-repo MDX (built in). Cadence: …
- **Any data-driven lists** *(services, team, projects)*: where does the data live (a repo data file)? …

## 7. Out of scope / later

- …
