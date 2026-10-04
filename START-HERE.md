# Start Here 👋

New to this template? Read this once, top to bottom. It explains **what this is**, **how it
works**, the **gotchas**, and exactly how to go from the bare-bones skeleton you just cloned to a
**beautiful, finished website that runs its own SEO on autopilot.**

If you only remember one sentence: **the framework is fixed, the design is 100% yours, and the SEO
keeps working after you walk away.**

---

## 1. The 60-second version

You cloned a website skeleton. Right now it's deliberately plain — grey, generic, boring. That's on
purpose. What you *actually* got is not a look, it's a **machine underneath the look**:

- Every page is wired for Google **and** AI search (ChatGPT, Perplexity, etc.) from commit zero.
- A file-based blog, sitemap, RSS feed, robots, and structured data are all built in and stay correct.
- A set of **laws** (enforced by the build — see §7) make it *impossible* to ship a page that breaks
  the SEO rules. The site can only get more compliant over time, never drift.
- The structure is **agent-ready**: an AI coding agent can maintain and extend the site through
  human-reviewed pull requests without ever breaking the SEO laws.

Your job is to pour a real, beautiful, unique website *into* that machine. This guide shows you how.

---

## 2. What you need before you start

- **Node 22 or newer** (the CI uses 22 — match it). Check with `node -v`.
- A code editor (VS Code is fine) and basic comfort with a terminal.
- A **GitHub account** (each site is its own GitHub repo — you own it outright).
- That's it. No database, no CMS, no paid accounts, no secret tokens to install. Everything the site
  needs lives in this one repo. (That's the **Ownership Law** — §7.)

You do **not** need to be a developer. If you can edit text and follow steps, you can brand and ship
a site. The harder design/build work can be handed to an AI coding agent — but read on so you
understand what it's doing.

---

## 3. The mental model (read this — it prevents 90% of confusion)

### Framework vs. Design

Two layers live in this repo. **Keep them straight — it is the whole point.**

| | **Framework (FIXED)** | **Design (YOURS)** |
|---|---|---|
| What | SEO contract, blog engine, metadata/schema/sitemap/feed, the laws, CI | Colors, fonts, spacing, layout, components, pages, copy |
| Changes site-to-site? | **Never.** Don't fight it. | **Completely.** No two sites should look alike. |
| Where | `src/lib/seo.ts`, `src/lib/blog/`, `sitemap.ts`, `robots.ts`, CI | `globals.css`, `components/`, `page.tsx` files, content |

Rule of thumb: if it changes **how the site is wired for search**, it's framework — leave it. If it
changes **how the site looks or reads**, it's design — make it yours. The plain grey theme that ships
is a **disposable skeleton**. You are *meant* to throw all of it away.

### Built for agents (how delegation works)

The template is written so an AI coding agent can do real work on it safely: the laws are enforced
by the build, the skills encode the procedures, and every change lands as a **pull request you
review and merge** — an agent never edits the live site directly. Point whatever SEO or visibility
monitoring you use at the live site to decide what's worth fixing next; the agent handles the
on-site work, and off-site tasks (a Google Business Profile edit, earning a link) stay with a human.

---

## 4. From skeleton to live site — the happy path

### Step 1 — Create your repo from the template
On GitHub, click **"Use this template" → Create a new repository**. Name it after the site/client.
You now own a fresh, independent repo.

Then, while you're still on GitHub, connect the repo to Studio — one click, once per repo:
open https://github.com/apps/realiiz-studio/installations/new → *Only select repositories* → your
new repo → Install. That's how `/admin` reads and writes content, and Studio switches on its own
weekly update checks the first time it runs. (Full detail: README step 2.)

> ⚠️ **Installing lands you on a page showing two settings — copy them before you close it.**
> `REALIIZ_BROKER_URL` and `REALIIZ_SITE_SECRET` are this site's credential, and the secret is
> shown **once**. They go into the hosting project's environment variables (§ Step 8) and into your
> local `.env.local`.
>
> Closed the tab too soon? Nothing is lost while the site is still being built: on GitHub go to
> **Settings → Applications → Realiiz Studio → Configure** and press **Save** — you'll be brought
> back and issued a fresh secret. That stops working once the live site starts using its settings,
> which is the point at which you don't need the secret any more anyway.

### Step 2 — Clone it and run it
```bash
git clone <your-new-repo-url>
cd <your-repo>
npm install
npm run dev
```
Open http://localhost:3000. You'll see the plain skeleton running. Good — that means the machine
works. Now make it yours.

### Step 3 — Brand it (the 5-minute win)
Open **`src/lib/site-config.ts`** and fill in the real details: name, URL, description, contact,
social links, OG image path. Swap the icons and OG image in **`/public`**. Refresh — the whole site,
its metadata, and its structured data now say the right thing. This is the fastest proof that editing
one file changes everything.

### Step 4 — Run the process (don't skip to editing pages)
This is where a plain site becomes a *designed* one. See §5 — it's the heart of it.

### Step 5 — Verify, then open a PR
Before anything ships, run the three checks CI runs:
```bash
npm run lint
npx tsc --noEmit
npm run build
```
All three must pass. Then open a pull request. **Main is protected — you never commit straight to it**
(the **PR Law**). Review, merge, done. New to branches and PRs? **[`WORKFLOW.md`](./WORKFLOW.md)**
walks the whole thing as buttons in VS Code — no Git commands to memorize.

### Step 6 — Deploy
It's a standard Next.js app — deploy it anywhere (Vercel, Netlify, your own box). No special
infrastructure. You own the whole thing.

### Step 7 — Keep it improving
Point your rank/visibility monitoring at the live site, and delegate the fixes it surfaces to an AI
coding agent as pull requests you approve. The site is built so that loop can run indefinitely —
every improvement lands inside the laws, so quality only ratchets up.

---

## 5. The process: how a plain site becomes a beautiful one

**Don't start by editing pages.** Building a site here is a short, deliberate process — a step 0 plus
three steps, each with a document (and mostly a matching skill). A human can do this in Cowork, or an AI
coding agent can do it for you.

0. **Audience doc** → fill in `AUDIENCE.md`.
   *The reader, their pains in their own words, trigger events, objections, voice do/don't.* Every
   brief and every post downstream is addressed to this person — do it first, or the site speaks to
   no one in particular.

1. **Site-structure brief** → `design-process/SITE-STRUCTURE-BRIEF.md`
   *What pages exist, the home vs. internal layouts, the navigation, and which pieces are global /
   widgets. One focus keyword per page.* (Skill: `site-structure`.)

2. **Design interview → design brief** → answer `design-process/DESIGN-INTERVIEW.md`, which produces
   `design-process/DESIGN-BRIEF.md`.
   *Brand, voice, color system, type, spacing, the overall feel.* This is where "make it beautiful and
   unique" actually gets decided. (Skill: `site-design-interview`.)

3. **Build from the briefs** — the theme (`src/app/globals.css`), the components, the pages.
   (Skills: `theme`, `new-page`, `new-widget`, `write-post`.)

The **`skills/`** folder is the automation for all of the above — usable by you in Cowork *and* by an
AI coding agent. Reach for them; they encode the right way to do each step.

### Components: where things live
Build once, drop in everywhere:

- **`components/global/`** — chrome on (nearly) every page, defined once: **Nav, Footer.**
- **`components/widgets/`** — reusable blocks: hero, CTA, feature grid, testimonials, FAQ. Built once,
  driven by props, reused.
- **`components/ui/`** — small primitives (button, eyebrow).

If you're copy-pasting markup between pages, it's a **widget** — extract it. If it's on every page,
it's **global**.

---

## 5b. Showing it to the client (the review kit)

Ship the preview with the review kit on and the client can react to the site instead of writing you
an email about it. Set `PREVIEW_CHROME = true` in `src/lib/site-config.ts` and a small eye nub
appears on the edge of every page. Behind it:

- **Walkthrough** — a short video of you explaining what this preview is and what feedback you want.
  Put an mp4 at `public/preview/walkthrough.mp4` and set `PREVIEW_WALKTHROUGH_URL`. Includes a QR
  code so they can open the preview on their phone.
- **Home page versions** — a switch between design options, when you're showing more than one. Add
  them to `PREVIEW_VARIANTS`; leave it empty and the switch never appears.
- **Feedback** — they leave notes per page, approve the site, or withdraw an approval. Posts to
  `/api/feedback` → `FEEDBACK_WEBHOOK_URL`; with no webhook set it falls back to an email to
  `PREVIEW_FEEDBACK_EMAIL`.
- **Page speed** — live paint time plus your last PageSpeed snapshot (`PREVIEW_SCORES`).
- **Show what we still need** — outlines every spot waiting on the client. Mark one up with
  `data-needs="A photo of the team"` and optionally `data-needs-detail="Landscape, 1600px or wider"`.
  This is how you stop chasing people for assets one email at a time.

Everything is off until the reviewer switches it on, and each widget's code is only downloaded at
that point — so a cold visit, and Lighthouse, see the nub and nothing else.

**At launch:** set `PREVIEW_CHROME = false`, then delete the kit — `PreviewChrome`, `ReviewMenu`,
`ReviewIcons`, `NotesWidget`, `Walkthrough`, `VariantToggle`, `SpeedBadge`, `useEdgeDock`,
`previewPrefs`, `src/app/api/feedback`, any variant routes, the `PREVIEW_*` block in site-config,
the review block at the end of `globals.css`, and the `qrcode` dependency.

---

## 6. Adding content (the two things you'll do most)

**Add a page:** create a route folder + `page.tsx` under `src/app/`, declare the SEO contract, add the
right JSON-LD, and compose the page from widgets. (Skill: `new-page`; details in `AGENTS.md`.)

**Add a blog post:** copy `content/blog/hello-world.mdx` to `content/blog/<your-slug>.mdx` and fill
**every** frontmatter field (unique title, ~155-char description, excerpt, exactly 3 tags, hero image
+ alt, one focus keyword). It automatically flows into the blog index, sitemap, and RSS, and gets
canonical + OpenGraph + `BlogPosting` structured data. (Skill: `write-post`.) Write genuinely useful
content — that's what wins in both Google and AI search.

---

## 7. The laws (why the build stops you sometimes — and that's good)

These aren't suggestions. The build and CI **enforce** them, so a broken page can't ship. If a check
fails, it's usually one of these protecting you:

1. **SEO Contract Law** — every page declares a validated `PageSeo`; every post validated frontmatter.
   A missing or misspelled field **fails the build**. (No silently un-optimized pages.)
2. **Uniqueness Law** — **no templated / programmatic / doorway pages.** Every page is real, first-hand
   content. (Mass-produced "location pages" get you penalized — we don't do them.)
3. **Image Law** — no raw `<img>` for content; use `next/image`, every meaningful image has real `alt`.
4. **Schema Law** — every page emits the right structured data via the `src/lib/seo.ts` builders.
5. **PR Law** — all changes land via a human-reviewed pull request. Agents open PRs; they never commit
   to `main`.
6. **Ownership Law** — everything is in this repo. No external CMS/DB for content; installs with no
   private tokens; deploy anywhere. **You own it, forever, with no dependency on anyone.**

Full detail lives in **`AGENTS.md`** — the operating manual for humans and agents alike.

---

## 8. Gotchas (the things that trip people up)

- **The skeleton is *meant* to be ugly.** Don't ship the grey theme. If your site looks like the
  template, you haven't done step 4/5 yet.
- **Don't edit the framework to "fix" your design.** If you find yourself touching `src/lib/seo.ts` or
  the blog engine to change how something *looks*, stop — that's a design job, do it in the theme or a
  component.
- **`npm install`, not `npm ci`.** The lockfile can miss OS-specific packages (a Mac lock omits
  Linux-only deps and vice-versa). CI uses `npm install` on purpose for exactly this reason.
- **Node version matters.** Use Node 22+. An older Node can fail the build in confusing ways.
- **Run all three checks before a PR.** `lint`, `tsc --noEmit`, and `build`. "It runs on my machine"
  isn't the bar — the build is.
- **Fill *every* blog frontmatter field.** The schema is `.strict()`. One missing field fails the
  build. This is the SEO Contract Law doing its job.
- **No doorway pages, ever.** Tempted to auto-generate 50 near-identical city pages? Don't. That's the
  Uniqueness Law, and it exists because scaled thin content gets sites penalized.
- **Main is protected.** You branch → PR → review → merge. If a direct push is rejected, that's the
  guardrail working.
- **Staying updated is optional and opt-in.** You can `git remote add template …` to pull in later
  improvements as a PR you curate — but nothing is ever forced on your site. It's yours.

---

## 9. Where to go next

- **`AGENTS.md`** — the full operating manual + the laws, for you and for coding agents.
- **`WORKFLOW.md`** — shipping a change the easy way (branch → PR → merge) with VS Code buttons.
- **`README.md`** — quick reference for template setup and what's inside.
- **`design-process/`** — the three briefs that turn intent into a designed site.
- **`skills/`** — the automation for each step of the process (structure, design, theme, pages, posts).

That's the whole picture: **brand it, run the process to make it beautiful and unique, ship it through
a PR, and let your monitoring + coding agent keep it improving from there.** Welcome aboard. 🚀
