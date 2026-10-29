import Link from "next/link";
import Image from "next/image";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import ForwardArrow from "../components/ForwardArrow";
import JsonLd from "../components/JsonLd";
import Gallery from "./Gallery";
import { ART } from "../../lib/gallery/art";
import { buildPageMetadata, breadcrumbJsonLd } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";

/**
 * /gallery — the art on SoundPlex's walls, for sale (Ed, 2026-10-28). Linked from the footer, not
 * the header. The catalog is lib/gallery/art.ts — PLACEHOLDER pieces for now (see the note there);
 * the page says so in a small line until the real collection is in. Remove that line, and the
 * `noindex`, when it is.
 */
export const metadata = buildPageMetadata({
  title: `The Gallery — art from our walls, for sale — ${SITE_NAME}`,
  description: "Paintings, drawings and sculpture from the walls of SoundPlex Studios in Pennsauken, NJ. Every piece is one of a kind, and every piece is for sale.",
  path: "/gallery",
  focusKeyword: "art for sale Pennsauken",
  // Sample catalog: keep it out of search until the real pieces are in.
  noindex: true,
});

export default function GalleryPage() {
  const samples = ART.some((a) => a.sample);
  return (
    <>
      <Nav />
      {/* overflow-x-clip: the filter bar's full-width backing is 100vw, which counts the scrollbar;
          clip (not hidden) trims that sliver without breaking the bar's sticky. */}
      <main id="main" className="flex-1 overflow-x-clip">
        {/* The hero is compact, with the featured piece on its right (Ed: the grid should show
            without scrolling). Gallery draws both, since the featured piece opens the same panel. */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:pt-14">
          <Gallery
            pieces={ART}
            intro={
              <>
                <Reveal eager><p className="page-head__eyebrow">The SoundPlex Gallery</p></Reveal>
                <Reveal eager delay={80}>
                  <h1 className="page-head__title">
                    Art from our walls. <em>Every piece is for sale.</em>
                  </h1>
                </Reveal>
                <Reveal eager delay={160}>
                  <p className="page-head__lede">Paintings, drawings and sculpture by the artists in our community, hung in the WoodRoom, Studio A and the SoundLounge. One of a kind, every one. Buy it here, or see it on the wall first.</p>
                </Reveal>
                {samples && (
                  <Reveal eager delay={220}>
                    <p className="mt-4 text-[12.5px] text-white/40">Preview: the pieces, artists and prices are samples while the real collection is photographed.</p>
                  </Reveal>
                )}
              </>
            }
          />
        </section>

        {/* For artists */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          {/* For artists: the poster wall on the left, the invitation on the right (Ed: give it life). */}
          <Reveal>
            <div className="grid overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#0a0a0a] md:grid-cols-[1fr_1.1fr]">
              <div className="relative min-h-[220px]">
                <Image src="/about/poster-wall-2.webp" alt="Framed vintage music posters on a dark wall at SoundPlex" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_55%,#0a0a0a_100%)] max-md:bg-[linear-gradient(to_top,#0a0a0a_0%,transparent_50%)]" />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-10">
                <p className="page-head__eyebrow">For artists</p>
                <h2 className="mt-3 font-[family-name:var(--font-poppins)] text-[clamp(1.5rem,2.6vw,2rem)] font-medium leading-tight text-white">
                  Hang your work <em className="font-[family-name:var(--font-lora)] font-normal italic text-[#d4a030]">at SoundPlex.</em>
                </h2>
                <p className="mt-3 max-w-[30rem] text-[15px] leading-relaxed text-white/60">Your pieces on our walls, seen by everyone who comes through for a show, a session or a tour, and sold right here.</p>
                <div className="mt-6">
                  <Link href="/start?path=talk&from=gallery-artist" className="evp__btn group">
                    Talk to George
                    <ForwardArrow />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gallery", path: "/gallery" }])} />
    </>
  );
}
