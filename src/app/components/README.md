# Components — the real tree

**This folder is flat, plus one `widgets/` subfolder.** (An earlier version of this README described
a `global/` / `ui/` / `widgets/` split that never existed — agents copy what they see, not what they
read, so this file now describes what's here. Same section in AGENTS.md.)

- **Site chrome** (flat): `Nav.tsx`, `MobileMenu.tsx`, `Footer.tsx` — on every page, defined once.
  Their links come from `NAV_LINKS` in `lib/site-config.ts` — one list, never duplicated.
- **Content helpers** (flat): `JsonLd.tsx`, `LegalPage.tsx`.
- **Primitives** (flat): `Eyebrow.tsx`, `Reveal.tsx`, `SectionRail.tsx`, the arrow icons.
- **`widgets/`** — reusable content blocks dropped into many pages, parameterized by props: **Hero,
  Testimonials**, and whatever you extract next (CTA, FeatureGrid, FAQ, …).

**The rule:** copy-pasting markup between pages → make it a **widget**. A new one-off helper lands
flat, like its neighbours.

Widgets take data via props (never hard-code page content in a widget). Example:

```tsx
import Hero from "./components/widgets/Hero";
import Testimonials from "./components/widgets/Testimonials";

<Hero eyebrow="…" title="…" subtitle="…" ctaLabel="…" ctaHref="/contact" />
<Testimonials items={[{ quote: "…", name: "…", role: "…" }]} />
```

Use the `new-widget` skill to scaffold a new reusable block that follows this convention.
