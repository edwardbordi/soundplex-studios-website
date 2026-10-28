import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import ForwardArrow from "../components/ForwardArrow";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata, breadcrumbJsonLd, serviceJsonLd } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";

/**
 * /websites — "Websites by SoundPlex". George resells Realiiz websites under Realiiz's program
 * (private/Realiiz-SoundPlex-Partner-Agreement-v1.docx). Copy is the talk's argument,
 * distilled; prices are Schedule A. CTA → /start?path=website.
 */
export const metadata = buildPageMetadata({
  title: `Websites — we build it first, you pay when you love it — ${SITE_NAME}`,
  description: "A website that feels like you do in person. Built on a fast, modern platform with your own publishing dashboard, for South Jersey businesses. We build the preview first; you pay when you love it. From $6,000.",
  path: "/websites",
  focusKeyword: "website design South Jersey",
});

const INCLUDED = [
  "Up to ten pages, designed and built — not a template filled in",
  "Your own publishing dashboard: posts, events, pages, pictures, no developer",
  "A blog and an events calendar that are actually easy to keep up",
  "Contact and newsletter forms wired straight into your CRM, with follow-up",
  "Search-engine setup done properly: metadata, structured data, sitemap, speed",
  "Google reviews on the page",
  "Copy written from a real conversation about your business",
  "Hosting, domain and accounts in your name — you own all of it",
];

const EXTRAS = [
  ["Extra pages", "$400 each"],
  ["Fly-through animated homepage", "$2,000"],
  ["3-step funnel with follow-up", "from $2,000"],
  ["CRM integration beyond GoHighLevel", "$500"],
  ["Content migration", "$50 per post"],
  ["Custom tools, member areas", "quoted"],
];

export default function WebsitesPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="page-head">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal eager><p className="page-head__eyebrow">Websites by SoundPlex</p></Reveal>
            <Reveal eager delay={80}><h1 className="page-head__title">You’re better in person than you are online. <em>Let’s close the gap.</em></h1></Reveal>
            <Reveal eager delay={160}>
              <p className="page-head__lede">People feel your business the second they walk in. Online they get a few seconds, on a phone, in a parking lot. A website’s job is to give them that feeling before they’ve set foot in the place — and most don’t come close.</p>
            </Reveal>
            <Reveal eager delay={240}>
              <div className="mb__ctas">
                <Link href="/start?path=website" className="evp__btn group">Start with a conversation<ForwardArrow /></Link>
                <p className="mb__fine">We build it first. You pay when you love it.</p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="ws__how">
            {[
              ["01", "A conversation", "Thirty minutes about your business, your customers, and what the site has to do. That’s the whole brief."],
              ["02", "We build the preview", "A working site — your words, your rooms, your people — shown to you live on a call. Not a sketch. The real thing."],
              ["03", "You pay when you love it", "If it’s right, you pay the deposit and we finish it together. If it isn’t, you owe nothing and you walk away."],
            ].map(([n, t, b], i) => (
              <Reveal key={n} delay={i * 80}>
                <article className="cs__step"><p className="cs__n">Step {n}</p><h2 className="cs__name">{t}</h2><p className="cs__line">{b}</p></article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="ab__band">
          <div className="mx-auto max-w-6xl px-6 ws__price">
            <Reveal>
              <p className="page-head__eyebrow">A complete site</p>
              <h2 className="ws__amount">$6,000</h2>
              <p className="ws__note">Up to ten pages. Four to six weeks from the day we have your content. Two rounds of changes. Thirty days of fixes after launch. 2027 pricing goes up; this is the 2026 rate.</p>
            </Reveal>
            <Reveal delay={80}>
              <ul className="rmp__list ws__list">{INCLUDED.map((x) => <li key={x}>{x}</li>)}</ul>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal><p className="page-head__eyebrow">When you need more</p></Reveal>
          <Reveal delay={80}>
            <dl className="ws__extras">{EXTRAS.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <Reveal>
            <div className="rm__cta">
              <p>This site is one. Scroll back up and walk through the door.</p>
              <Link href="/start?path=website" className="evp__btn group">Start with a conversation<ForwardArrow /></Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
      <JsonLd data={serviceJsonLd({ name: "Website design and build", description: "Websites for South Jersey businesses, built preview-first on a modern platform with a client publishing dashboard.", path: "/websites", areaServed: "South Jersey" })} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Websites", path: "/websites" }])} />
    </>
  );
}
