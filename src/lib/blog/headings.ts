import GithubSlugger from "github-slugger";
import type { RailSection } from "../../app/components/SectionRail";

/**
 * Curated short rail labels, keyed by the FULL heading text (exact match,
 * including straight quotes/apostrophes and em-dashes). Unmapped headings fall
 * back to their full text so nothing silently drops from the rail.
 */
const RAIL_LABELS: Record<string, string> = {
  "The expensive mistake almost everyone is making": "The mistake",
  "Why this keeps happening (and why it's not your fault)": "Why it happens",
  "The thing to do instead: diagnose before you prescribe": "What to do instead",
  "What you might actually do — after you've looked": "What you'd do",
  'What "doing it right" actually looks like': "Doing it right",
  "The one thing to remember": "The one thing",
  "One more thing — for later, not today": "For later",
  "Where the numbers come from": "The sources",
};

/**
 * Build the section-navigation list from a post's MDX body.
 *
 * Extracts every top-level `## ` heading in order and computes each `id` with
 * github-slugger — the SAME library rehype-slug runs on the rendered headings —
 * so the ids match the in-page anchor ids exactly. A single slugger instance is
 * used across the headings in order, mirroring rehype-slug's per-document
 * dedup behaviour. The `id` is always the slug of the FULL heading text, never
 * the curated label.
 *
 * Inline emphasis markers (`*`/`_`/`` ` ``) are stripped before lookup so the
 * label-map key matches the rendered text; github-slugger strips them from the
 * slug regardless, so the id is unaffected either way.
 *
 * Pure server util — no DOM access, no client code.
 */
export function getH2Sections(content: string): RailSection[] {
  const slugger = new GithubSlugger();
  const sections: RailSection[] = [];

  for (const line of content.split("\n")) {
    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const heading = match[1].replace(/[*_`]/g, "");
    const id = slugger.slug(heading);
    const label = RAIL_LABELS[heading] ?? heading;
    sections.push({ id, label });
  }

  return sections;
}
