import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";
import Hero from "./components/widgets/Hero";
import { buildPageMetadata } from "../lib/seo";
import { SITE_NAME, SITE_DESCRIPTION } from "../lib/site-config";

// SEO Contract Law applies to the homepage too — it used to declare only a
// canonical and shipped with no title/description/focusKeyword, in the one
// file every new site starts from. Replace these placeholder values when you
// brand the site.
export const metadata = buildPageMetadata({
  title: `${SITE_NAME} — ${SITE_DESCRIPTION}`,
  description: SITE_DESCRIPTION,
  path: "/",
  focusKeyword: "REPLACE — the one phrase this site should rank for",
});

// Placeholder content — replace all of it. Pages are composed from reusable widgets (see
// components/README.md); this home uses the Hero widget + an inline feature grid.
const FEATURES = [
  { title: "Fast by default", body: "Static-rendered, owned, deployable anywhere — no bloat, no lock-in." },
  { title: "AI-search ready", body: "Clean metadata + structured data on every page, so Google and AI engines can read you." },
  { title: "Yours to own", body: "Everything lives in this repo. No external CMS, no subscriptions, no dependency." },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <Hero
          eyebrow="Starter"
          title="A website you own — built to be found."
          subtitle={SITE_DESCRIPTION}
          ctaLabel="Get in touch"
          ctaHref="/book"
        />

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <Reveal key={f.title}>
                <div className="h-full rounded-2xl border border-line p-6">
                  <h2 className="font-display text-lg font-semibold text-ink">{f.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
