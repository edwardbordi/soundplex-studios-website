# AGENTS.md — how to build on this site (humans + agents)

A **site-starter**: a framework for fast, owned, AI-search-ready websites. Anyone building on it — a
person or an autonomous coding agent — reads this first and obeys it.

## The one idea: the FRAMEWORK is fixed, the DESIGN is yours

Two layers live in this repo. Keep them straight — it's the whole point.

- **The framework (FIXED — never changes site to site).** The SEO contract, the blog engine, the
  metadata/schema/sitemap/feed plumbing, the laws, the CI. This is the standard. Don't fight it.
- **The design (100% YOURS — changes completely every time).** Colors, fonts, spacing, layout,
  components, pages, copy — all of it. **No two sites built from this should look alike.** The default
  design that ships is a deliberately plain, disposable skeleton so you never mistake it for "the look."
  Replace every bit of it.

If it affects *how the site is wired for search and structure*, it's framework — leave it. If it
affects *how the site looks or reads*, it's design — make it yours.

## Don't start by editing pages — run the process

Building a new site is a **process**, not a file-tweak. In order:

0. **Audience doc** (`AUDIENCE.md`) — fill the blank in: the reader, their pains in their own words,
   trigger events, objections, voice. Everything downstream (structure, design, every post) is
   addressed to this person; without it the machine-checkable rules produce content that passes every
   gate and speaks to no one.
1. **Site-structure brief** (`design-process/SITE-STRUCTURE-BRIEF.md`) — what pages exist, the home vs.
   internal-page layouts, nav/IA, and which pieces are global / widgets / templates.
2. **Design interview** (`design-process/DESIGN-INTERVIEW.md`) — answer the questions → a
   **design brief** (`design-process/DESIGN-BRIEF.md`): brand, voice, color system, type, spacing, feel.
3. **Build the design** from those briefs — the theme (`src/app/globals.css`), the components, the
   pages — you, or an autonomous coding agent. Inside the framework's laws.

The **skills/** folder holds the written procedures for this (usable by you in Cowork and by an autonomous coding agent): a
design interview, a structure planner, a theme generator, a new-page scaffolder, a write-post helper, a
new-widget scaffolder.

### ⚠️ These are NOT auto-loaded skills — you have to go and read them

`skills/` is a plain folder. It is **not** `.claude/skills/`, nothing registers it, and no tool fires
on its own. If you don't read the file, none of the process in it happens — and the failure is silent,
because writing a post without the skill still produces a post. Just a worse one.

**So route on intent, before doing the work:**

| The person wants to | Read this FIRST |
|---|---|
| Design or theme a new site | `skills/site-design-interview/SKILL.md` → `skills/theme/SKILL.md` |
| Plan the site's pages / IA | `skills/site-structure/SKILL.md` |
| Add a **new page** | `skills/new-page/SKILL.md` |
| Build a reusable component | `skills/new-widget/SKILL.md` |
| Write, draft or plan a **blog post** | `skills/write-post/SKILL.md` |

## Component architecture — what's actually there

**`src/app/components/` is flat, plus one `widgets/` folder.** (An earlier version of this file
described a `global/` / `ui/` / `widgets/` split and only `widgets/` existed — which sent agents off
creating folders that fought the real tree. This section describes reality; follow the tree you see.)

- **Site chrome** (root of `components/`): `Nav.tsx`, `MobileMenu.tsx`, `Footer.tsx` — on every page,
  defined once, read `NAV_LINKS` from `lib/site-config.ts`.
- **Content helpers** (root): `JsonLd.tsx`, `LegalPage.tsx`.
- **Primitives** (root): `Eyebrow.tsx`, `Reveal.tsx`, `SectionRail.tsx`, the arrows.
- **`components/widgets/`** — reusable, **props-driven** content blocks dropped into many pages: hero,
  CTA, feature grid, testimonials, FAQ. Built once, parameterized, reused.

The rule that matters: if you're copy-pasting markup between pages, it's a **widget** — extract it into
`widgets/`. New one-off helpers land flat in `components/`, like their neighbours.

## The laws

**Enforced mechanically** (the build fails): laws 1 (post frontmatter — zod `.strict()`; page `PageSeo`
is a TypeScript interface checked by `tsc` on every call), 6 and 7.
**Policy, enforced by the reviewer**: laws 2, 3, 4, 5 — nothing in CI checks these, so they need a
human on the PR. (Making 3 and 4 mechanical is on `TEMPLATE-BACKLOG.md`.)

1. **SEO Contract Law.** Every page declares a validated `PageSeo` via `buildPageMetadata`
   (`src/lib/seo.ts`); every post a validated frontmatter (`src/lib/blog/schema.ts`). `.strict()`
   schemas — a missing/misspelled frontmatter field **fails the build**.
2. **Uniqueness Law.** No templated / programmatic / doorway pages. Every page is unique, first-hand
   content — what wins in Google *and* AI search.
3. **Image Law.** No raw `<img>` for content — use `next/image`; every meaningful image has real `alt`
   (posts: `heroImageAlt`).
4. **Schema Law.** Every page emits the right JSON-LD via the `src/lib/seo.ts` builders (or the blog's
   `BlogPosting`).
5. **PR Law.** All changes land via a human-reviewed PR. An agent opens a PR; it never commits to
   `main`. ⚠️ Branch protection does NOT survive a repo transfer — re-apply it (see `WORKFLOW.md`).
6. **Ownership Law.** Everything is in this repo. No external CMS/DB for content; static/SSG; installs
   with no private tokens; deployable anywhere.
   *Amendment (2026-09-08, publishing dashboard):* **content ownership is untouched** — content is
   MDX in this repo and always will be. What the optional `/admin` dashboard adds is *identity*
   (external, Supabase) and a *per-site GitHub token* for writing PRs; both live only in server env.
   The site builds, deploys and serves with neither, and the dashboard is one of four equal
   writers (github.com, GitHub Desktop, Cowork, `/admin`). Delete `/admin` and nothing breaks.
7. **BUILD-ENV Law.** The build must succeed with no environment variables set. Anything needing a
   secret reads it **lazily, inside the request handler** — never at module scope — so CI and preview
   builds run env-naked. Document every variable in `.env.example`.

## How to add a PAGE

Route folder + `page.tsx` under `src/app/`, then declare the contract:
```ts
import { buildPageMetadata } from "../../lib/seo";
export const metadata = buildPageMetadata({ title: "…", description: "…", path: "/x", focusKeyword: "…" });
```
Add page JSON-LD with a `src/lib/seo.ts` builder → `<JsonLd data={…} />`. Compose the page from widgets.
Write unique content.

## How to add a BLOG POST

Copy `content/blog/_template.mdx` → `content/blog/<slug>.mdx` (filename = `slug` — nothing checks
this, so copy-paste it). Files starting `_` are ignored by the loader. Fill EVERY
frontmatter field (unique `title`, `description` ~155 chars, `excerpt`, exactly 3 `tags`, `heroImage`,
`heroImageAlt`, one `focusKeyword`). It auto-flows into the index, sitemap, RSS, and gets canonical +
OpenGraph + `BlogPosting` JSON-LD. Write genuinely useful, cited content.

## How to add an EVENT

Same pattern: copy `content/events/_template.mdx` → `content/events/<slug>.mdx`, fill the
fields (every one is explained in the template), commit to a branch. Or use `/admin` → Events.
Underscore files are skipped; `sample-event.mdx` is a placeholder to delete.

## /admin — Studio, the publishing dashboard

`/admin` ("Studio") lets the site's owner (and anyone they invite) publish blog posts and
events without seeing GitHub. It ships in the template, dormant until the env vars in
`.env.example` under "Studio" are set. **Everything is the package** — `@realiizlabs/admin/studio`
(server: readers, actions, session, auth handlers) and `@realiizlabs/admin/studio-ui` (every
page body and component). This repo keeps only five files under `src/lib/admin/` and thin pages:

- `content-types.ts` — the registry (folder, filename rule, field order, groups, image
  fields, sidebar icon) + `PUBLIC_URLS`. Adding a content type = one entry here (plus its
  `PUBLIC_URLS` line); never a new page. Field labels/help live in the schema as `.meta()`.
- `env.ts` — every variable, read lazily (BUILD-ENV law). Server-only keys hit only this file.
- `studio.ts` — the single `createStudio(...)` call: env, cookies, baseUrl, revalidate,
  `SITE_NAME`, `SITE_TIMEZONE`.
- `actions.ts` — `"use server"` one-line wrappers, one per Studio action (Next only compiles
  server actions in app code, so they must be declared here).
- `StudioProvider.tsx` — the client wrapper that hands the registry and actions to the package.
- `src/app/admin/**` — pages that load data with `studio.readers` and render `Studio*`
  components; `[type]/…` routes serve every registered type; `auth/*/route.ts` re-export
  `studio.authHandlers`. `/admin/account` is Settings; `/admin/help` is the searchable Help center.

Fixes to Studio behaviour or looks go in the package and are published to npm (public,
source-available license). Sites pick them up through Dependabot: `.github/dependabot.yml`
watches only `@realiizlabs/admin` and opens one checked PR per release; Studio shows it to
owners as an update strip and under Settings → Studio, and **Update** merges it. Dependabot
runs weekly (Monday 9am ET) and only on repos where the dependency graph is on — README step 2,
two commands, once per new repo. Locally: `npm install @realiizlabs/admin@latest`.

**The repo is the source of truth and the dashboard is one of four writers** (github.com,
GitHub Desktop, an agent, `/admin`). `/admin` lists and opens content from `main` via the
GitHub API at request time — never from the deployed filesystem — and always branches from
current `main`. Nothing it does bypasses the PR. Delete `/admin` and the site still works.

**Images** are shrunk to WebP in the browser (`@realiizlabs/admin/media`), sent as base64
in the save action, re-checked by the package (WebP under the type's public folder, ≤ 800 KB
each, ≤ 3.5 MB per save) and committed under `public/<type>/` in the same commit as the MDX.

**Events** (`src/lib/events/`, `content/events/`, `/events`): the package's `eventSchema()`
with core fields only. Groups (`tickets`, `venues`, `appearances`) are per-site config —
pass the same `with: [...]` list to `eventSchema` and `eventRegistryDefaults`. `SITE_TIMEZONE`
in `site-config.ts` is the zone dates are read in when an event names none.

**Onboarding a site** (five minutes): the repo's owner installs the Realiiz Studio GitHub App
on the repo and updates are enabled (README step 2), set the env vars in Vercel — the shared
`GITHUB_APP_ID` + `GITHUB_APP_PRIVATE_KEY`, plus a per-project Deploy Hook in
`VERCEL_DEPLOY_HOOK_URL` (README step 7 — it powers "Nudge the build" when a rebuild stalls) —
add this host's `/admin/auth/callback` and `/admin/auth/accept` to the identity project's
Redirect URLs, then invite the owner from Settings → Team. Roles: `staff` (your agency — every
site), `owner` (the client — publishes, manages their team, brands Studio), `editor` (publishes).

**GitHub access is the app, not a token.** Studio reaches the repo as the `realiiz-studio[bot]`
installation (Contents, Pull requests, Commit statuses, Checks, Deployments, Administration); the
package mints a repo-scoped token per hour from the app's private key. The client owns the repo
and installs the app once; Realiiz owns the key. Administration is what lets Studio switch on
the repo's Dependabot checks itself (`studio.readers.studioSetup()`, called by the account page
and before every update lookup) — there are no GitHub one-timers to run by hand. The gated layout asks `studio.readers.repoAccess()` before reading the repo: when the app isn't installed yet it renders `StudioAwaitingInstall` (the owner's install button) instead of a 500 — the one expected gap between Realiiz configuring a site and the client's click. `GITHUB_CONTENT_TOKEN` (a PAT) is the fallback
when the app values are absent. All of them, and the identity service-role key, are server-only
env: grep for them must only ever hit `src/lib/admin/env.ts`.

## Brand a new site

Edit **`src/lib/site-config.ts`** (name, URL, description, contact, social, OG image). Replace the
theme tokens in `src/app/globals.css`, the components, and the pages. Swap the icons/OG image in
`/public`. Studio picks up `SITE_NAME` and `/public/logos/favicon.svg` automatically; the owner can
override both from Settings → Business once signed in.

## Verify before you open a PR (the checks CI runs)

```
npm run lint
npx tsc --noEmit
npm run build
```
All three must pass. Never claim done on an unrun or failing check.
