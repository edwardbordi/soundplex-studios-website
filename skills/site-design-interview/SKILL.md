---
name: site-design-interview
description: Run the design interview for a new site and produce the design brief. Use at the START of a new site, before writing theme or component code.
---

# site-design-interview

Interview the owner about how the site should look and feel, then write the design brief that the
theme + components are built from. The design is 100% theirs — your job is to capture it precisely.

## Steps

1. **Work through `design-process/DESIGN-INTERVIEW.md`** conversationally — brand/feeling, color, type,
   layout & density, voice, imagery, practical. Push for concrete answers ("sharp corners, one blue
   accent, lots of white space" — not "clean and modern").
2. **Reflect back** a short summary of the intended look and confirm before writing.
3. **Write `design-process/DESIGN-BRIEF.md`** from the answers — fill the color table (with hex + WCAG
   AA contrast in mind), type, density, corners/radius, motion, voice, imagery, and the required home
   sections.
4. **Hand off:** the filled brief feeds the `theme` skill (→ `globals.css` tokens) and the
   `site-structure` skill (→ pages + component plan).

## Principles

- Never impose the starter's default look — it's a disposable placeholder. Design fresh from their
  answers. No two sites should look alike.
- Keep it accessible: target WCAG AA contrast on the palette you capture.
- Capture the voice too — it drives the copy across pages and posts.
