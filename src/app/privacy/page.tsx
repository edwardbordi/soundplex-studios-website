import LegalPage, { type LegalBlock } from "../components/LegalPage";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";

export const metadata = buildPageMetadata({
  title: `Privacy Policy — ${SITE_NAME}`,
  description: `How ${SITE_NAME} collects, uses and shares personal information when you visit soundplexstudios.com.`,
  path: "/privacy",
  focusKeyword: "privacy policy",
  noindex: true,
});

/*
 * Ported verbatim from the live site (soundplexstudios.com/privacy-policy, last updated March 3,
 * 2025 — COMPANY-FACTS: "port live Terms + Privacy verbatim"). Only the formatting changed:
 * sentence-case headings, the address written out, US spelling ("Behavioral").
 * REVIEW BEFORE LAUNCH (George / counsel): the live text mentions Shopify and shipping, which the
 * new site doesn't use, and doesn't yet mention GoHighLevel (forms), the members' login or the
 * site's own analytics. It's George's legal text — not ours to rewrite.
 */
const BLOCKS: LegalBlock[] = [
  {
    type: "p",
    text: "SOUNDPLEX STUDIOS operates soundplexstudios.com (the “Site”). Throughout the site, the terms “we”, “us” and “our” refer to SOUNDPLEX STUDIOS. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from Site.",
  },
  { type: "h2", text: "Personal information we collect" },
  {
    type: "p",
    text: "When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the Site, we collect information about the individual web pages or products that you view, what websites or search terms referred you to the Site, and information about how you interact with the Site. We refer to this automatically-collected information as “Device Information.”",
  },
  { type: "p", text: "We collect Device Information using the following technologies:" },
  {
    type: "ul",
    items: [
      "“Cookies” are data files that are placed on your device or computer and often include an anonymous unique identifier. For more information about cookies, and how to disable cookies, visit http://www.allaboutcookies.org.",
      "“Log files” track actions occurring on the Site, and collect data including your IP address, browser type, Internet service provider, referring/exit pages, and date/time stamps.",
      "“Web beacons,” “tags,” and “pixels” are electronic files used to record information about how you browse the Site.",
    ],
  },
  {
    type: "p",
    text: "Additionally when you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment information, email address, and phone number. We refer to this information as “Order Information.”",
  },
  {
    type: "p",
    text: "When we talk about “Personal Information” in this Privacy Policy, we are talking both about Device Information and Order Information.",
  },
  { type: "h2", text: "How do we use your personal information?" },
  {
    type: "p",
    text: "We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to: communicate with you; screen our orders for potential risk or fraud; and when in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.",
  },
  {
    type: "p",
    text: "We use the Device Information that we collect to help us screen for potential risk and fraud (in particular, your IP address), and more generally to improve and optimize our Site (for example, by generating analytics about how our customers browse and interact with the Site, and to assess the success of our marketing and advertising campaigns).",
  },
  { type: "h2", text: "Sharing your personal information" },
  {
    type: "p",
    text: "We share your Personal Information with third parties to help us use your Personal Information, as described above. For example, we use Shopify to power our online stores—you can read more about how Shopify uses your Personal Information here: https://www.shopify.com/legal/privacy. We use Facebook and Google Analytics to help us understand how our customers use the Site—you can read more about how Google uses your Personal Information here: https://www.google.com/intl/en/policies/privacy/. You can also opt-out of Google Analytics here: https://tools.google.com/dlpage/gaoptout. You can read more about how Facebook uses your Personal Information and how you can opt-out here: https://www.facebook.com/policy.php",
  },
  {
    type: "p",
    text: "Finally, we may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.",
  },
  { type: "h2", text: "Behavioral advertising" },
  {
    type: "p",
    text: "As described above, we use your Personal Information to provide you with targeted advertisements or marketing communications we believe may be of interest to you. For more information about how targeted advertising works, you can visit the Network Advertising Initiative’s (“NAI”) educational page at http://www.networkadvertising.org/understanding-online-advertising/how-does-it-work.",
  },
  { type: "p", text: "You can opt out of targeted advertising by:" },
  {
    type: "ul",
    items: [
      "**Facebook** — https://www.facebook.com/settings/?tab=ads",
      "**Google** — https://www.google.com/settings/ads/anonymous",
      "**Bing** — https://advertise.bingads.microsoft.com/en-us/resources/policies/personalized-ads",
    ],
  },
  {
    type: "p",
    text: "Additionally, you can opt out of some of these services by visiting the Digital Advertising Alliance’s opt-out portal at: http://optout.aboutads.info/.",
  },
  { type: "h2", text: "Do not track" },
  {
    type: "p",
    text: "Please note that we do not alter our Site’s data collection and use practices when we see a Do Not Track signal from your browser.",
  },
  { type: "h2", text: "Your rights" },
  {
    type: "p",
    text: "If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us through the contact information below.",
  },
  {
    type: "p",
    text: "Additionally, if you are a European resident we note that we are processing your information in order to fulfill contracts we might have with you (for example if you make an order through the Site), or otherwise to pursue our legitimate business interests listed above. Additionally, please note that your information will be transferred outside of Europe, including to Canada and the United States.",
  },
  { type: "h2", text: "Data retention" },
  {
    type: "p",
    text: "When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.",
  },
  { type: "h2", text: "Changes" },
  {
    type: "p",
    text: "We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.",
  },
  { type: "h2", text: "Contact us" },
  {
    type: "p",
    text: "For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by mail using the details provided below:",
  },
  { type: "contact", name: "SoundPlex Studios", lines: ["6713 Rudderow Ave", "Pennsauken, NJ 08109"] },
];

export default function PrivacyPage() {
  return <LegalPage eyebrow="Legal" title="Privacy Policy" lastUpdated="March 3, 2025" blocks={BLOCKS} />;
}
