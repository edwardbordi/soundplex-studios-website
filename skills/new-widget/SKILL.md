---
name: new-widget
description: Scaffold a reusable, props-driven widget in components/widgets/ for this site-starter. Use when a content block will be reused across pages (hero, CTA, feature grid, testimonial/review, FAQ, etc.).
---

# new-widget

Create a reusable block in `src/app/components/widgets/` — built once, dropped into any page.

## Steps

1. **Name it + define its props.** A widget takes ALL its content via props — never hard-code page copy
   inside a widget. e.g. `Testimonials({ heading, items })`, `CTA({ title, ctaLabel, ctaHref })`.
2. **Create `src/app/components/widgets/<Name>.tsx`:**
   ```tsx
   import Reveal from "../Reveal";
   export interface <Name>Props { /* … */ }
   export default function <Name>(props: <Name>Props) {
     return <section className="mx-auto max-w-5xl px-6 py-20">{/* uses token classes */}</section>;
   }
   ```
3. **Use the theme token classes** (`text-ink`, `text-slate`, `border-line`, `bg-ink`, `font-display`,
   `rounded-2xl`, …) so it inherits the site's design and restyles automatically with the theme.
4. **Accessibility + Image Law:** semantic markup; `next/image` + real `alt` for any images.
5. **Drop it into pages** by importing and passing data.

## When NOT to make a widget

If it appears on every page (header/footer), it's **global** (`components/global/`), not a widget. If
it's a one-off on a single page, inline it.

Verify: `npm run lint && npx tsc --noEmit && npm run build`. Open a PR.
