---
name: new-page
description: Scaffold a new page in this site-starter that satisfies the SEO Contract Law. Use when adding any route/page (about, services, a landing page, etc.).
---

# new-page

Create a new page under `src/app/<route>/page.tsx` that obeys the framework laws.

## Steps

1. **Confirm the route + intent.** Ask for the path (e.g. `/services`) and the page's single focus
   keyword / intent if not given. Check the site-structure brief if one exists.
2. **Create `src/app/<route>/page.tsx`** with the SEO contract:
   ```tsx
   import Nav from "../components/Nav";
   import Footer from "../components/Footer";
   import { buildPageMetadata } from "../../lib/seo";

   export const metadata = buildPageMetadata({
     title: "<Page> — <SiteName>",
     description: "<unique, intent-matched, ~155 chars>",
     path: "/<route>",
     focusKeyword: "<one primary keyword>",
   });

   export default function Page() {
     return (
       <>
         <Nav />
         <main className="flex-1">{/* compose from widgets in components/widgets/ */}</main>
         <Footer />
       </>
     );
   }
   ```
3. **Add page JSON-LD** where it fits, using a builder from `src/lib/seo.ts`
   (`serviceJsonLd`, `faqJsonLd`, `breadcrumbJsonLd`, `webSiteJsonLd`) → `<JsonLd data={…} />`.
4. **Compose the body from widgets** (`components/widgets/`). Reuse; don't paste markup. Extract a new
   widget (see the `new-widget` skill) if you're repeating a block.
5. **Unique content only** (Uniqueness Law) — no templated/doorway pages.

## Laws to honor

- SEO Contract Law: `buildPageMetadata` is required; a missing field fails the build.
- Image Law: `next/image` + real `alt` for any content image.
- Schema Law: emit the right JSON-LD for the page kind.

## Verify

```
npm run lint && npx tsc --noEmit && npm run build
```
Open a PR (PR Law) — never commit to `main`.
