import type { Metadata } from "next";
import { Lora, Roboto, Roboto_Slab, Poppins } from "next/font/google";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  LEGAL_ENTITY,
  OG_IMAGE_PATH,
  CONTACT_EMAIL,
  PHONE_TEL,
  SOCIAL_LINKS,
  ORGANIZATION_ID,
} from "../lib/site-config";
import JsonLd from "./components/JsonLd";
import AnalyticsBeacon from "./components/AnalyticsBeacon";
import { StudioBar } from "@realiizlabs/admin/bar";
import PreviewChrome from "./components/PreviewChrome";
import { STUDIO_ROUTES } from "../lib/admin/content-types";
import "./globals.css";

/* ─── Type ───────────────────────────────────────────────────────────────────
 * The three faces soundplexstudios.com actually uses, self-hosted by next/font
 * so the site matches the live brand exactly (extracted from the live site's
 * computed styles + Elementor globals, 2026-09-02):
 *   Lora italic 400  → headlines / the payload line
 *   Roboto           → body
 *   Roboto Slab      → card titles
 *   Poppins 500      → labels, buttons, nav (uppercase, letterspaced)
 * Exposed as CSS variables so globals.css and the fly-through engine both read
 * one source of truth. */
const lora = Lora({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", variable: "--font-lora" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--font-roboto" });
const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--font-roboto-slab" });
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"], display: "swap", variable: "--font-poppins" });

const fontVars = `${lora.variable} ${roboto.variable} ${robotoSlab.variable} ${poppins.variable}`;

// Default social-share image (1200×630) — used for any page that doesn't set its own.
const OG_IMAGE = `${SITE_URL}${OG_IMAGE_PATH}`;

/* Sitewide Organization structured data, rendered once on every page.
 *
 * ⚠️ THIS IS THE ONLY ORGANIZATION BLOCK ON THE SITE. Do not add a second one
 * on an individual page — a crawler finding two Organization entities at one
 * URL, with different fields, has to pick one and may pick the thinner one.
 * The `@id` (lib/site-config.ts) is a stable name for the organization, so
 * anything that needs to REFER to it points at the id instead of restating
 * the fields and drifting.
 *
 * Edit for your business type — e.g. LocalBusiness for a physical location,
 * with address/geo/openingHours.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  legalName: LEGAL_ENTITY,
  url: SITE_URL,
  image: OG_IMAGE,
  description: SITE_DESCRIPTION,
  ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {}),
  ...(PHONE_TEL ? { telephone: PHONE_TEL } : {}),
  ...(SOCIAL_LINKS.length ? { sameAs: SOCIAL_LINKS.map((s) => s.url) } : {}),
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — ${SITE_DESCRIPTION}`,
  description: SITE_DESCRIPTION,
  icons: {
    // The real SoundPlex monogram, extracted from the client's lockup.
    icon: [{ url: "/logos/favicon.png", type: "image/png" }],
    apple: [{ url: "/logos/app-icon.png" }],
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full antialiased ${fontVars}`}>
      {/* Dark only (DESIGN-BRIEF.md): the template's light/dark toggle kit is not used, so
          there is no theme-scope id or pre-paint bootstrap here. */}
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationJsonLd} />
        {/* First-party analytics beacon — no-ops entirely until
            GA4_MEASUREMENT_ID + GA4_API_SECRET are set (see .env.example
            and api/t/route.ts). Zero third-party JS either way. */}
        <AnalyticsBeacon />
        {/* Skip link — without it a keyboard user tabs through the whole
            header on every page before reaching anything. Each page's <main>
            carries id="main". Visually hidden until focused; see .skip-link
            in globals.css. */}
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        {/* Studio pill: shows only in a browser that has signed in to /admin (marker cookie); anonymous visitors see nothing. */}
        <StudioBar routes={STUDIO_ROUTES} />
        {/* TEMPORARY: the client-review kit. Renders nothing at all unless
            PREVIEW_CHROME is on in site-config, and each widget's code is only
            fetched once a reviewer switches that widget on. Delete at launch. */}
        <PreviewChrome />
      </body>
    </html>
  );
}
