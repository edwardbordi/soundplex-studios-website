import LegalPage, { type LegalBlock } from "../components/LegalPage";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";

export const metadata = buildPageMetadata({
  title: `Terms of Service — ${SITE_NAME}`,
  description: `The terms of service for ${SITE_NAME}.`,
  path: "/terms",
  focusKeyword: "terms of service",
  noindex: true,
});

// Placeholder — replace with your own terms of service before launch.
const BLOCKS: LegalBlock[] = [
  {
    type: "p",
    text: "This is a placeholder terms of service. Replace it with your own before you launch. Describe the terms governing use of your site and services.",
  },
];

export default function TermsPage() {
  return <LegalPage eyebrow="Legal" title="Terms of Service" lastUpdated="" blocks={BLOCKS} />;
}
