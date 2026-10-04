---
name: theme
description: Turn a filled design brief into this site's theme — the globals.css token block and component styling. Use after the design interview, or to restyle a site.
---

# theme

Translate `design-process/DESIGN-BRIEF.md` into the actual look. The token NAMES stay (components
reference them); you change the VALUES + the styling. The framework never depends on any of this.

## Steps

1. **Read the design brief.** If it's not filled, run the `site-design-interview` skill first.
2. **Rewrite the `@theme` block in `src/app/globals.css`** — set every color token (ink, bone, paper,
   signal/accent, slate, line, amber), the font tokens (display/body/mono — add `next/font` in
   `layout.tsx` if using web fonts), radius, and content widths to match the brief. Remove the
   "disposable skeleton" banner once it's a real theme.
3. **Style the components** — global (Nav/Footer), widgets, and pages — to the brief's density,
   corners, and motion. Keep using the token classes so the system stays consistent.
4. **Check contrast** — hit WCAG AA (4.5:1 body, 3:1 large) on the palette.

## Rules

- Keep token names stable; change values. Don't rename tokens (breaks every component).
- One accent used consistently (buttons/links/highlights) unless the brief says otherwise.
- Verify: `npm run build` (Tailwind compiles the theme). Open a PR.
