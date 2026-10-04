import LegalPage, { type LegalBlock } from "../components/LegalPage";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";

export const metadata = buildPageMetadata({
  title: `Privacy Policy — ${SITE_NAME}`,
  description: `The privacy policy for ${SITE_NAME}.`,
  path: "/privacy",
  focusKeyword: "privacy policy",
  noindex: true,
});

// Placeholder — replace with your own privacy policy before launch.
const BLOCKS: LegalBlock[] = [
  {
    type: "p",
    text: "This is a placeholder privacy policy. Replace it with your own before you launch. Describe what information you collect, how you use it, and the choices visitors have.",
  },
];

export default function PrivacyPage() {
  return <LegalPage eyebrow="Legal" title="Privacy Policy" lastUpdated="" blocks={BLOCKS} />;
}
