import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import Eyebrow from "../components/Eyebrow";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";

export const metadata = buildPageMetadata({
  title: `About — ${SITE_NAME}`,
  description: `Learn about ${SITE_NAME}.`,
  path: "/about",
  focusKeyword: "about",
  ogType: "profile",
});

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <article className="mx-auto max-w-(--w-prose) px-6 pb-24 pt-16">
          <Reveal>
            <Eyebrow tone="signal">About</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              About {SITE_NAME}
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 text-lg leading-relaxed text-slate">
              Replace this with your story — who you are, what you do, and why it matters to the people you
              serve. Keep it specific and human; unique, first-hand content is what wins in both Google and
              AI search.
            </p>
          </Reveal>
        </article>
      </main>
      <Footer />
    </>
  );
}
