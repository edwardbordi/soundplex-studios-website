/**
 * Types for the vendored scroll-world engine (scrub-engine.js).
 *
 * Hand-written because the engine ships as plain JS with no types. Only the surface this
 * site actually uses is declared — if you start passing a config key that isn't here
 * (mobile variants, connectors with real clips), add it here too or `tsc` will reject it.
 */

export interface ScrollWorldSection {
  id: string;
  label: string;
  still: string;
  stillMobile?: string;
  /** Optional: a section with no clip keeps its still on screen (engine-native). */
  clip?: string;
  clipMobile?: string;
  accent?: string;
  scroll?: number;
  linger?: number;
  /* SoundPlex additions for still-only "state" sections (hero v2) — see scrub-engine.js */
  /** 0–1: fraction of this section's band spent cross-dissolving in from the previous segment. */
  dissolve?: number;
  /** Scale delta of the still's slow push over the band (e.g. 0.03). Omit for stock poster drift. */
  drift?: number;
  /** 0–1 horizontal focal point → object-position, so phone crops land on the people. */
  focal?: number;
  eyebrow?: string;
  title?: string;
  body?: string;
  tags?: string[];
  cta?: {
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
}

export interface ScrollWorldConfig {
  brand?: { name: string; href?: string };
  cta?: { label: string; href: string };
  nav?: boolean;
  atmosphere?: boolean;
  hint?: string;
  diveScroll?: number;
  connScroll?: number;
  crossfade?: number;
  /** SoundPlex: per-frame catch-up rate for eased state dissolves (default 0.1). */
  dissolveEase?: number;
  sections: ScrollWorldSection[];
  /** Architecture A has none — an empty array makes the engine crossfade leg to leg. */
  connectors?: (string | null)[];
  connectorsMobile?: (string | null)[];
}

export function mountScrollWorld(container: HTMLElement, config: ScrollWorldConfig): void;
