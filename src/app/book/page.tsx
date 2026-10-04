import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import Eyebrow from "../components/Eyebrow";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME, CONTACT_EMAIL } from "../../lib/site-config";

export const metadata = buildPageMetadata({
  title: `Contact — ${SITE_NAME}`,
  description: `Get in touch with ${SITE_NAME}.`,
  path: "/book",
  focusKeyword: "contact",
});

export default function BookPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="mx-auto max-w-2xl px-6 pb-24 pt-24 text-center">
          <Reveal eager>
            <Eyebrow tone="signal" align="center">Contact</Eyebrow>
          </Reveal>
          <Reveal eager delay={80}>
            <h1 className="font-display mt-6 text-balance text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
              Let&apos;s talk.
            </h1>
          </Reveal>
          <Reveal eager delay={140}>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-slate">
              Drop a note and we&apos;ll get back to you. Swap this out for a real contact form or a booking
              embed when you set up the site.
            </p>
          </Reveal>
          {CONTACT_EMAIL && (
            <Reveal eager delay={200}>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-mono-label mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm text-bone-2 transition-opacity hover:opacity-90"
              >
                {CONTACT_EMAIL}
              </a>
            </Reveal>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
