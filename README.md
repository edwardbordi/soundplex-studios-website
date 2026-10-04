# site-starter

A fast, owned, AI-search-ready website starter — Next.js (App Router) + Tailwind, everything in the
repo, no external CMS, installs with no private tokens. It ships an SEO **contract** (validated at
build time), a file-based MDX blog, an events calendar, sitemap/robots/RSS, per-page JSON-LD, and an
optional publishing dashboard (Studio) — so a new site is compliant from commit zero and can only
grow more compliant, never drift.

**New here? Read [`START-HERE.md`](./START-HERE.md) first** — the plain-English guide from bare
skeleton to a finished site that runs its own SEO on autopilot.

**Then [`AGENTS.md`](./AGENTS.md)** — the operating manual + the enforced laws, for humans and coding
agents alike.

**Requires Node 22+** (matches CI).

## Start a new site from this template

1. On GitHub, click **"Use this template" → Create a new repository** (this repo is marked a Template).
   No secrets or tokens to set up: the Studio package (`@realiizlabs/admin`) is a public npm
   package, so `npm install` works everywhere — locally, CI, Vercel — with zero configuration.
2. **Connect the repo to Studio** (one time per repo — do not skip). Whoever owns the repo opens
   https://github.com/apps/realiiz-studio/installations/new → *Only select repositories* → this
   repo → Install. That is how `/admin` reads and writes the site's content — no personal access
   token, nothing to copy. If the client owns the repo, this is the **only** GitHub step they ever
   do; send them that link.

   **Installing lands you on a page showing this site's two settings — copy them before closing
   it.** `REALIIZ_BROKER_URL` and `REALIIZ_SITE_SECRET` are the site's own credential; the secret is
   shown once. They go on the hosting project (step 7) and in `.env.local`. If you close the tab
   before copying, go to **Settings → Applications → Realiiz Studio → Configure** on GitHub and press
   **Save** to be brought back and issued a fresh one — that works right up until the live site
   starts using its settings.

   Everything else is automatic. The first time Studio runs on the site it switches on the repo's
   dependency checks itself (the app carries the Administration permission for exactly this), and
   from then on the site checks for a new Studio version **every Monday morning**, opens a checked
   pull request when there is one, and the owner installs it from the strip in `/admin` or
   **Settings → Studio** — which also shows a line confirming that weekly checks are on. Nobody
   touches GitHub again. To test an update right away: repo **Insights → Dependency graph →
   Dependabot → Check for updates**.
3. Clone your new repo, then:
   ```
   git config --global user.email you@example.com   # one-time, machine-wide; stamps the commit author (see WORKFLOW.md)
   npm install
   npm run dev
   ```
4. **Brand it:** edit `src/lib/site-config.ts` (name, URL, time zone, description, legal entity,
   contact, social, nav, OG image path). Replace the icons in `/public/logos/` with your own, and
   add a 1200×630 share image at the path `OG_IMAGE_PATH` points to (`/public/og/default.png` by
   default — the template does not ship one, so social cards 404 until you add it).
5. Add pages and posts per `AGENTS.md`. Verify with the same checks CI runs:
   `npm run lint && npx tsc --noEmit && npm run build && npm test` (the last one is the
   Playwright smoke suite; first run needs `npx playwright install chromium`).
6. Ship changes the easy way — branch → PR → merge, all from VS Code buttons: see
   [`WORKFLOW.md`](./WORKFLOW.md).
7. **Turn on Studio** (`/admin`, the client's publishing dashboard) when the site is live:
   - Set the env vars listed under "Studio" in `.env.example` on Vercel, including the
     `REALIIZ_BROKER_URL` and `REALIIZ_SITE_SECRET` from step 2. Those two are **this site's own**
     credential, not shared with any other site: with them the deployment holds no master key, and
     asks Realiiz for permission to save each change instead.
   - **Create a Deploy Hook** for the site: Vercel → Project → Settings → Git → Deploy Hooks →
     name `studio-nudge`, branch `main` → Create. Put the URL in `VERCEL_DEPLOY_HOOK_URL`
     (Production). One per site — hooks belong to a Vercel project. It powers the **Nudge the
     build** button owners see if a Studio update's rebuild ever stalls; without it they're told
     to call you instead.
   - Add this host's two auth URLs to the identity project.
   - Invite the owner from Settings → Team.

   Details in `AGENTS.md`.

   Studio ships with two content types: **Blog posts** and **Events**. Events start with the
   core fields (what, when, where, a link, a picture, cancelled / rescheduled). To add RSVP,
   capacity and private events (`tickets`), a named venue (`venues`) or host / recording /
   slides for talks and podcasts (`appearances`), pass the same list in two places:
   `eventRegistryDefaults({ with: ["tickets"] })` in `src/lib/admin/content-types.ts` and
   `eventSchema({ with: ["tickets"] })` in `src/lib/events/schema.ts`. The kinds list
   (talk, workshop, show, …) comes from the package; "other" plus a custom label covers the
   rest. Delete `content/events/sample-event.mdx` once you have a real event.

## Staying up to date with the template (optional)

```
git remote add template https://github.com/edwardbordi/site-starter-pro.git
git fetch template
# cherry-pick improvements you want, as a PR — never forced
```

## What's inside

- `src/lib/seo.ts` — the per-page SEO contract (`PageSeo` + `buildPageMetadata` + JSON-LD builders).
- `src/lib/blog/` — the MDX blog engine + `.strict()` frontmatter schema.
- `src/app/` — pages, layout, `sitemap.ts`, `robots.ts`, `feed.xml`, `manifest.ts`.
- `src/app/api/` — the first-party analytics relay (`/api/t`, GA4 Measurement Protocol, dormant
  without env vars), `/api/version` (Studio polls it after a publish), and `/api/check-site`, the
  example route showing the same-origin + SSRF-guard conventions in `src/lib/api-guard.ts`.
- `content/blog/` — posts (start from `hello-world.mdx`; `_template.mdx` is the blank).
- `src/lib/events/` + `content/events/` — the events calendar (`/events`), same pattern as the blog.
- `src/app/admin/` + `src/lib/admin/` — Studio, the publishing dashboard (dormant until configured).
  Five small files under `src/lib/admin/` (registry, env, `createStudio`, server actions, provider)
  plus thin pages under `src/app/admin/`; everything else comes from `@realiizlabs/admin`.
- `.github/dependabot.yml` — watches `@realiizlabs/admin` only; a new Studio version becomes a
  checked pull request that owners install from Studio itself (Settings → Studio).
- `tests/` — Playwright smoke tests for the public site and the `/admin` gate (`npm test`; CI runs them).
- `skills/` — written procedures (design interview, theme, new page, write post, analytics,
  publish) for a person or a coding agent to read before doing that kind of work. Not auto-loaded.
- `.env.example` — the ledger of every integration env var: what it is, who reads it, and what
  happens when it's absent. The template itself builds with none set.
- `AGENTS.md` — the laws + how to build. `CONTENT.md` is the blog/SEO authoring standard;
  `WORKFLOW.md` is the branch → PR → merge ritual.
