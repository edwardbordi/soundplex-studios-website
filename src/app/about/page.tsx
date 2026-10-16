import Link from "next/link";
import Image from "next/image";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import ForwardArrow from "../components/ForwardArrow";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata, breadcrumbJsonLd } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";

/**
 * /about — George, the building, the art. The history paragraph is the live site's,
 * verbatim: George vetted it, the timeline is deliberately vague (COMPANY-FACTS §2), and
 * a proper timeline is a go-live polish item. The owner story is the live site's too.
 */
export const metadata = buildPageMetadata({
  title: `About — the building, the art, and George — ${SITE_NAME}`,
  description: "SoundPlex Studios in Pennsauken, NJ: a building with a musical heritage — Victor Talking Machine, RCA, Dick Clark — now a creative studio, venue and third place run by George Koch.",
  path: "/about",
  focusKeyword: "SoundPlex Studios Pennsauken history",
  ogType: "profile",
});

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="page-head">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal eager><p className="page-head__eyebrow">About SoundPlex</p></Reveal>
            <Reveal eager delay={80}><h1 className="page-head__title">Welcome to your <em>creative playground.</em></h1></Reveal>
            <Reveal eager delay={160}>
              <p className="page-head__lede">A production studio, a stage, a lounge and a hallway full of people who made something — in one old building in Pennsauken. Come for one thing. Stay two hours longer than you meant to.</p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="ab__grid">
            <Reveal>
              <div className="ab__photo" data-needs="A photo of George in the building" data-needs-detail="Portrait, in the WoodRoom or at the SoundLounge bar — landscape, 1600px+">
                <Image src="/flythrough/poster/03.jpg" alt="The WoodRoom at SoundPlex, lit for the evening" fill sizes="(max-width: 860px) 100vw, 50vw" className="object-cover" />
              </div>
            </Reveal>
            <div>
              <Reveal><p className="page-head__eyebrow">SoundPlex history</p></Reveal>
              <Reveal delay={80}>
                <div className="ab__prose">
                  <p>SoundPlex Studios is inspired by a building rich with musical heritage. Originally a bottlecap factory, it became a hub for the Victor Talking Machine Company in the early 20th century, evolving into RCA Victor in 1929. That landmark witnessed legendary recordings by artists such as Enrico Caruso, Arturo Toscanini, and Sergei Rachmaninoff, and even hosted broadcasting icon Dick Clark in the 1950s. Today, SoundPlex Studios honors and extends this vibrant legacy.</p>
                  <p>Studio A was Victor Records’ Studio B. The SoundLounge was once offices for Dick Clark and the Victor Talking Machine Co. The WoodRoom floor is 1890s wide-plank birch. The building has had a lot of tenants over the years, and most of them left something behind.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="ab__band">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal><p className="page-head__eyebrow">Mission</p></Reveal>
            <Reveal delay={80}>
              <p className="ab__big">SoundPlex Studios exists to empower artists, musicians, and creators by providing world-class spaces, cutting-edge resources, and a vibrant community. <em>Our vision is to be the ultimate creative hub where talent flourishes, ideas come to life, and connections spark new opportunities.</em></p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="ab__grid ab__grid--flip">
            <div>
              <Reveal><p className="page-head__eyebrow">George Koch · Owner</p></Reveal>
              <Reveal delay={80}>
                <div className="ab__prose">
                  <p>George Koch is a visionary business leader with a remarkable ability to turn ambitious ideas into reality. His true talent lies in seamlessly bringing people and vision together, creating spaces where creativity thrives. At SoundPlex Studios, his vision comes to life — an inspiring hub where innovation, collaboration, and artistic energy flourish.</p>
                  <p>Step inside, and you’ll experience the genius of his ideas transformed into a thriving creative community — one you won’t be able to resist returning to and sharing with friends.</p>
                  <p>George will tell you himself: some of the people in the pictures on these walls stood in this very room.</p>
                </div>
              </Reveal>
              <Reveal delay={160}>
                <Link href="/start?path=talk" className="card-cta group mt-6 inline-flex items-center gap-2 whitespace-nowrap">Talk to George<ForwardArrow /></Link>
              </Reveal>
            </div>
            <Reveal>
              <div className="ab__photo" data-needs="George's portrait" data-needs-detail="The live site's George-Koch-093 photo, or a new one; 3:2">
                <Image src="/flythrough/poster/11.jpg" alt="The SoundLounge bar at SoundPlex" fill sizes="(max-width: 860px) 100vw, 50vw" className="object-cover" />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <Reveal><p className="page-head__eyebrow">The art</p></Reveal>
          <Reveal delay={80}>
            <h2 className="page-head__title" style={{ fontSize: "clamp(1.6rem,3.4vw,2.6rem)" }}>Every wall tells a story. <em>Every piece is for sale.</em></h2>
            <p className="page-head__lede">Locally inspired, endlessly creative, always changing. Love what you see? Take it home — ask George, or tap a piece when you’re here.</p>
          </Reveal>
          <Reveal delay={160}>
            <div className="ab__art" data-needs="3–5 artworks with title, artist, size, price" data-needs-detail="For the tap-to-zoom gallery (SITE-STRUCTURE-BRIEF §8b). Straight-on photos, 4:5 or 3:2.">
              <p className="ab__art-note">Gallery coming once the first pieces are photographed.</p>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
    </>
  );
}
