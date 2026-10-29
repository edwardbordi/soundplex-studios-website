import Image from "next/image";
import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";
import Reveal from "./Reveal";
import ForwardArrow from "./ForwardArrow";
import ConnectionWall from "./widgets/ConnectionWall";
import ChainRun from "./widgets/ChainRun";
import ChainPanels from "./widgets/ChainPanels";

/**
 * The chain section (Ideas → Opportunity), on every home version (Ed, 2026-10-29):
 *   "panels" — four photo cards, a comet running card to card, the eyebrow and button shine last
 *   "line"   — the original gold line with dots (ChainRun), kept to switch back to
 */
const CHAIN: "panels" | "line" = "panels";
import GoogleReviews from "./widgets/GoogleReviews";
import LatestPosts from "./widgets/LatestPosts";
import ShopSpots from "./ShopSpots";
import ScrollHero from "./ScrollHero";
// Version C uses the working copy (V3); the original fly-through is FlythroughV2, untouched.
import FlythroughV3 from "./widgets/FlythroughV3";
import { HeroLive, ThisWeek } from "./widgets/HomeNow";
import { getWall } from "../../lib/members/members";
import { getCalendarItems } from "../../lib/events/public";
import { getAllPosts } from "../../lib/blog/posts";
import JsonLd from "./JsonLd";
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  PHONE_TEL,
  ORGANIZATION_ID,
  SHOW_SAMPLE_EVENTS,
} from "../../lib/site-config";

/* The building itself is the page's subject, so it gets a Place node pointing back at the
 * one Organization in layout.tsx (never a second Organization — see the note there).
 * Address and hours are the values verified off the live site on 2026-09-02; if they
 * change, they change in site-config.ts first. */
const placeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Place",
  "@id": `${SITE_URL}/#place`,
  name: SITE_NAME,
  address: {
    "@type": "PostalAddress",
    streetAddress: "6713 Rudderow Ave",
    addressLocality: "Pennsauken",
    addressRegion: "NJ",
    postalCode: "08109",
    addressCountry: "US",
  },
  telephone: PHONE_TEL,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "22:00",
    },
  ],
  isAccessibleForFree: false,
  photo: `${SITE_URL}/flythrough/poster/13.jpg`,
  containedInPlace: { "@id": ORGANIZATION_ID },
};

/* George's three offers (COMPANY-FACTS §7) — the home page's "what is this place". */
const WAYS = [
  {
    eyebrow: "Rent a room",
    title: "Three rooms, one building.",
    body: "The WoodRoom stage, Studio A in the round, the SoundLounge speakeasy — for parties, workshops, podcasts and shoots.",
    image: "/flythrough/states/state-A.jpg",
    alt: "The WoodRoom at SoundPlex, empty and lit: the stage, the brick wall in magenta, lounge seating",
    href: "/rooms",
    cta: "See the rooms",
  },
  {
    eyebrow: "Come to a show",
    title: "Something on most nights.",
    body: "Live music four feet from the stage, comedy, talks, screenings and open mics. Come alone — everyone does.",
    image: "/rooms/wood-room-2.webp",
    alt: "A guitarist mid-song on the SoundPlex stage under red and green light",
    href: "/studio-productions",
    cta: "What’s on",
  },
  {
    eyebrow: "Join the Plex Collective",
    title: "A third place that works.",
    body: "Membership for creators and founders: the rooms, the people already here, and a path from idea to finished work.",
    image: "/flythrough/states/state-B-4.jpg",
    alt: "Three people deep in conversation on the WoodRoom floor",
    href: "/membership",
    cta: "How membership works",
  },
];

const EYEBROW = "font-[family-name:var(--font-poppins)] text-xs font-medium uppercase tracking-[0.22em] text-[#d4a030]";
const H2 = "font-[family-name:var(--font-poppins)] text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl";

/**
 * The home page body, shared by three versions (Ed, 2026-10-29), picked with the Preview switch:
 *   /        hero "flythrough", version C: in through the front doors (THE DEFAULT)
 *   /home-a  hero "fill",       version A: the room fills on its own
 *   /home-b  hero "scroll",     version B: the room fills as you scroll
 * Delete the losers' routes once George picks.
 *
 * HOME (Ed, 2026-10-28): clean, not overdone. One photo hero with a slow push-in and a live
 * "what's on" card, then: three ways in · this week · the Connection Wall · the chain ·
 * reviews + the Spotlight. Motion in three places only: the push-in, the live dot, the chain.
 *
 * THE FLY-THROUGH is version C (/, Ed 2026-10-29): FlythroughV3 (working copy of V2) + its route +
 * vendor/scrub-engine. It needs the next section to carry `sw-after relative z-30` (the engine
 * pulls it up over the last frame), which the "Three ways in" section gets when hero is C.
 */
export default function HomeView({ hero = "fill", night }: { hero?: "fill" | "scroll" | "flythrough"; night?: string }) {
  const wall = getWall();
  const items = getCalendarItems();
  const posts = getAllPosts()
    .slice()
    .sort((a, b) => b.frontmatter.publishedAt.getTime() - a.frontmatter.publishedAt.getTime())
    .slice(0, 6)
    .map(({ frontmatter: f }) => ({ slug: f.slug, title: f.title, excerpt: f.excerpt, heroImage: f.heroImage, heroImageAlt: f.heroImageAlt ?? f.title, publishedAt: f.publishedAt.toISOString().slice(0, 10) }));

  return (
    <>
      <JsonLd data={placeJsonLd} />
      <Nav overlay />
      <main id="main" className="flex-1 bg-[#050505]">
        {/* ── Hero C (the home page, /): the fly-through: in through the front doors, down the
              hall, to the WoodRoom (FlythroughV3 + the scrub engine). ── */}
        {hero === "flythrough" ? (
          <FlythroughV3 night={night} basePath="/" />
        ) : /* ── Hero B (preview, /home-b): the room fills as you scroll (ScrollHero). ── */
        hero === "scroll" ? (
          <ScrollHero live={<HeroLive items={items} showSamples={SHOW_SAMPLE_EVENTS} />} />
        ) : (
        /* ── Hero A (preview, /home-a): one photo, a slow push-in, George's line, and what's on right now. ── */
        <section className="relative flex min-h-[min(94svh,900px)] items-end overflow-hidden">
          {/* The room fills — once, on its own, not tied to scrolling (Ed, 2026-10-28): the same
              WoodRoom shot, empty and lit, dissolves into the room full of people and stays.
              Two frames from one camera angle; CSS only (globals.css .home-loop). */}
          <div className="home-loop absolute inset-0">
            <Image src="/flythrough/states/state-C-2.jpg" alt="The WoodRoom at SoundPlex full of people talking in groups under the stage lights" fill priority sizes="100vw" className="home-hero__img object-cover" />
            <Image src="/flythrough/states/state-A.jpg" alt="" aria-hidden fill priority sizes="100vw" className="home-hero__img home-loop__empty object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/35 to-black/55" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" aria-hidden />
          {/* Shoppable art on the wall, but only once the room has filled (the empty frame fades
              out 1.2s→3.4s; globals.css home-fill), and only the pieces the crowd doesn't hide. */}
          <ShopSpots src="/flythrough/states/state-C-2.jpg" delayMs={3500} />
          <div className="relative mx-auto w-full max-w-6xl px-6 pb-14 pt-40 sm:pb-20">
            <Reveal eager><p className={EYEBROW}>SoundPlex Studios · Pennsauken, NJ</p></Reveal>
            <Reveal eager delay={80}>
              <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-poppins)] text-[clamp(2.6rem,7vw,5.2rem)] font-semibold leading-[0.98] tracking-tight text-white">
                Find your people.{" "}
                <em className="font-[family-name:var(--font-lora)] font-normal italic text-[#d4a030]">Create your next chapter.</em>
              </h1>
            </Reveal>
            <Reveal eager delay={160}>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/75">
                Three rooms, a stage and a calendar that’s always on — a third place for creators, founders and everyone who comes to see them.
              </p>
            </Reveal>
            <Reveal eager delay={220}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link href="/start?path=collective&from=hero" className="evp__btn group">Book a tour<ForwardArrow /></Link>
                <Link href="/studio-productions" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">What’s on tonight<ForwardArrow /></Link>
              </div>
            </Reveal>
            <div className="mt-10 sm:absolute sm:bottom-20 sm:right-6 sm:mt-0">
              <HeroLive items={items} showSamples={SHOW_SAMPLE_EVENTS} />
            </div>
          </div>
        </section>
        )}

        {/* ── Three ways in ── (after the fly-through, `sw-after` pulls it up over the last frame) */}
        <section className={`px-6 py-24 ${hero === "flythrough" ? "sw-after relative z-30 bg-[#050505]" : ""}`}>
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <p className={EYEBROW}>What brings you in</p>
              <h2 className={`${H2} mt-4 max-w-2xl`}>Three ways to be part of it.</h2>
            </Reveal>
            <ul className="mt-12 grid gap-4 md:grid-cols-3">
              {WAYS.map((w, i) => (
                <Reveal key={w.href} as="li" delay={i * 80}>
                  <Link href={w.href} className="group flex h-full flex-col overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#0f0f0f] transition-colors hover:border-[#d4a030]/60">
                    <span className="relative block aspect-[4/3] overflow-hidden">
                      <Image src={w.image} alt={w.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                      <span className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" aria-hidden />
                    </span>
                    <div className="flex flex-1 flex-col p-6 pt-3">
                      <p className={`${EYEBROW} text-[11px]`}>{w.eyebrow}</p>
                      <h3 className="mt-2 font-[family-name:var(--font-poppins)] text-2xl font-semibold tracking-tight text-white">{w.title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/60">{w.body}</p>
                      <span className="card-cta mt-auto inline-flex items-center gap-2 self-start whitespace-nowrap pt-6">{w.cta}<ForwardArrow /></span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ── This week ── */}
        <section className="border-t border-white/[0.08] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Reveal>
                <p className={EYEBROW}>Studio Productions</p>
                <h2 className={`${H2} mt-4`}>This week at SoundPlex.</h2>
              </Reveal>
              <Link href="/studio-productions" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">See everything<ForwardArrow /></Link>
            </div>
            <div className="mt-10"><ThisWeek items={items} showSamples={SHOW_SAMPLE_EVENTS} /></div>
          </div>
        </section>

        {/* ── Who you'd meet ── */}
        <ConnectionWall members={wall.members} connections={wall.connections} />

        {/* ── The chain: Ideas → Opportunity, then the way in ── */}
        <section className="ch-stage mx-auto max-w-6xl px-6">
          {CHAIN === "panels" ? (
            // The photo panels with the comet; the eyebrow animates last (inside ChainPanels).
            <ChainPanels eyebrow="Not rocket science. Human science." />
          ) : (
            <>
              <Reveal><p className="page-head__eyebrow">Not rocket science. Human science.</p></Reveal>
              <ChainRun />
            </>
          )}
          <Reveal>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 max-[719px]:justify-start">
              {/* With the panels, a gold shine sweeps across this button once the sequence ends (cp-shine). */}
              <Link href="/start?path=collective&from=home-chain" className={`evp__btn group ${CHAIN === "panels" ? "cp-shine" : ""}`}>Join the Collective<ForwardArrow /></Link>
              <Link href="/membership" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">How membership works<ForwardArrow /></Link>
            </div>
          </Reveal>
        </section>

        {/* ── What people say (renders once the Places key is in) + the Spotlight ── */}
        <div className="border-t border-white/[0.08]">
          <GoogleReviews />
          <LatestPosts posts={posts} />
        </div>
      </main>
      <Footer />
    </>
  );
}
