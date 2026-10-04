import type { Metadata } from "next";
import { SITE_URL, SITE_NAME, OG_IMAGE_PATH } from "./site-config";

/**
 * The per-page SEO contract (the "standard" — a contract, not a template).
 *
 * Every non-blog page declares one PageSeo and passes it to buildPageMetadata(). The page's content
 * and layout stay 100% bespoke; only these SEO signals are standardized and consistent across the site.
 * This mirrors what the blog already gets from its frontmatter schema (see lib/blog/schema.ts).
 *
 * `focusKeyword` is editorial/SEO-QA only — the single primary intent a page targets. Like the blog's,
 * it must NEVER be rendered as a `<meta name="keywords">` tag (dead/ignored by search engines).
 */
export interface PageSeo {
  /** Page <title> + OG/Twitter title. Unique per page. */
  title: string;
  /** Meta description — unique, intent-matched (~155 chars). */
  description: string;
  /** Route path, e.g. "/about". Canonical = SITE_URL + path. */
  path: string;
  /** Single primary keyword/intent the page targets. QA-only, never emitted as a tag. */
  focusKeyword: string;
  /** Social image override (root-relative or absolute). Defaults to the site OG image. */
  ogImage?: string;
  /** OG type. Defaults to "website". */
  ogType?: "website" | "article" | "profile";
  /** Keep the page out of the index when true. */
  noindex?: boolean;
}

/** Site default social image (1200×630) — pages without their own OG image inherit this. */
export const DEFAULT_OG_IMAGE = OG_IMAGE_PATH;

/**
 * Turn a PageSeo into Next Metadata: title, description, canonical, and full OpenGraph + Twitter.
 * Always sets an OG image (default when the page doesn't override) so a per-page `openGraph` never
 * silently drops the inherited social image — the known Next Metadata gotcha.
 */
export function buildPageMetadata(seo: PageSeo): Metadata {
  const image = seo.ogImage ?? DEFAULT_OG_IMAGE;
  const meta: Metadata = {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.path },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${SITE_URL}${seo.path}`,
      type: seo.ogType ?? "website",
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [image],
    },
  };
  if (seo.noindex) meta.robots = { index: false, follow: false };
  return meta;
}

// ---------------------------------------------------------------------------
// JSON-LD builders (per page kind). Feed the returned object into <JsonLd data={…} />.
// Additive — pages opt in; nothing renders until a page uses one.
// ---------------------------------------------------------------------------

export function serviceJsonLd(input: { name: string; description: string; path: string; areaServed?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: `${SITE_URL}${input.path}`,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(input.areaServed ? { areaServed: input.areaServed } : {}),
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function faqJsonLd(qas: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: { "@type": "Answer", text: qa.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
