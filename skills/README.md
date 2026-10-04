# Skills

Written procedures for building on this starter — usable by a person in Cowork **and** by an autonomous coding agent.
Each encodes the framework's laws + the design process so any builder follows the standard.

### ⚠️ These are NOT auto-loaded skills

This is a plain folder. It is **not** `.claude/skills/`, nothing registers it, no `/command` fires it,
and no tool reads it on its own. **The agent (or person) has to open and read the SKILL.md before
doing the work it covers** — and the failure mode is silent, because doing the work without the skill
still produces output. Just worse output that skips the process the skill encodes.

Route on intent (this table also lives in `AGENTS.md`):

| Task | Read first |
| --- | --- |
| Design/theme a new site | `site-design-interview` → `theme` |
| Plan pages & IA | `site-structure` |
| New page | `new-page` |
| New reusable component | `new-widget` |
| Blog post | `write-post` |
| Turn on analytics / prep for ads | `analytics` |
| Publish changes to the live site | `publish` |

| Skill | What it does |
| --- | --- |
| `site-design-interview` | Runs the design interview → writes the design brief. |
| `site-structure` | Plans the site's pages, layouts, and component split → the structure brief. |
| `theme` | Turns a filled design brief into the `globals.css` token block + component styling. |
| `analytics` | Enables the first-party GA4 relay, custom events, and the server-side ad-conversion pattern. |
| `publish` | The full branch → PR → merge → cleanup ritual, written out end-to-end for non-developers, every time. |
| `new-page` | Scaffolds a new page that satisfies the SEO Contract Law (metadata + schema). |
| `new-widget` | Scaffolds a reusable, props-driven widget in `components/widgets/`. |
| `write-post` | Writes a blog post that satisfies the frontmatter contract + content laws. |

An autonomous coding agent reads these the same way — they're the shared operating procedures, so the standard travels
with the template.
