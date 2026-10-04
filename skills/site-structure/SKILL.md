---
name: site-structure
description: Plan a new site's pages, layouts, and component split for this site-starter, producing the site-structure brief. Use at the start of a new site, alongside the design interview.
---

# site-structure

Define the site's skeleton — pages, layouts, and the global/widget/template split — before code.

## Steps

1. **Work through `design-process/SITE-STRUCTURE-BRIEF.md`:** the goal + primary CTA, the full page
   list (each with its focus keyword for the SEO contract), the home vs. internal layouts, the
   navigation/IA, and content sources.
2. **Decide the component split** (see AGENTS.md → Component architecture):
   - **Global** (`components/global/`): Header/Nav, Footer.
   - **Widgets** (`components/widgets/`): reusable blocks + which pages use each.
   - **UI primitives** (`components/ui/`).
3. **Write the filled brief.** Confirm the page list respects the **Uniqueness Law** — real, distinct
   pages only, no templated/doorway pages.
4. **Hand off:** the page list drives `new-page` (one per route); the widget list drives `new-widget`;
   the layouts + design brief drive the build.

## Principles

- One focus keyword/intent per page.
- Build once, reuse: anything repeated across pages is a widget, not copy-paste.
- Keep structure (this brief) separate from look (the design brief).
