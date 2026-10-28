import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";
import ForwardArrow from "./components/ForwardArrow";
import FlythroughV2 from "./components/widgets/FlythroughV2";
import ConnectionWall from "./components/widgets/ConnectionWall";
import { getWall } from "../lib/members/members";
import RoomTransform, { type Look } from "./components/widgets/RoomTransform";
import UpcomingEvents from "./components/widgets/UpcomingEvents";
import CollectiveSteps from "./components/widgets/CollectiveSteps";
import LatestPosts from "./components/widgets/LatestPosts";
import { getUpcomingAndPast } from "../lib/events/public";
import { getAllPosts } from "../lib/blog/posts";
import JsonLd from "./components/JsonLd";
import { buildPageMetadata } from "../lib/seo";
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  LOCATION,
  PHONE_TEL,
  ORGANIZATION_ID,
} from "../lib/site-config";

export const metadata = buildPageMetadata({
  title: `${SITE_NAME} — Recording, Podcast & Live Event Studios in Pennsauken, NJ`,
  description: SITE_DESCRIPTION,
  path: "/",
  focusKeyword: "recording studio Pennsauken NJ",
});

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

/* What the film can't say. Kept to three, kept concrete — AUDIENCE.md is explicit that
 * hype without a room, date or price attached is the wrong voice for this brand. */
const ROOMS = [
  {
    title: "Book a room by the hour",
    body: "Recording, podcast and photo/video sessions in the same rooms you just walked through — with an engineer if you want one.",
    cta: { label: "See the rooms", href: "/rooms" },
  },
  {
    title: "Play the room",
    body: "The WoodRoom is a real stage with a real audience four feet away. Shows, sessions and screenings run through the week.",
    cta: { label: "What’s on", href: "/studio-productions" },
  },
  {
    title: "Join the Plex Collective",
    body: "Memberships for people who show up: the room, the gear, and the other creators who are already here.",
    cta: { label: "Book a tour", href: "/start?path=collective" },
  },
];

/* The WoodRoom, one angle, dressed for different nights. The first looks are the hero's
 * own states; the others are generated from the same frame as they're made (HERO-V2.md). */
const LOOKS: Look[] = [
  { id: "workshop", label: "A workshop", image: "/flythrough/states/state-C-2.jpg", alt: "The WoodRoom full for a business workshop, people talking in groups under the stage lights", line: "Fifty founders, a mic, and the conversations that happen after.", href: "/start?path=room&room=wood-room&use=workshop" },
  { id: "talk", label: "A talk", image: "/flythrough/states/state-B-4.jpg", alt: "Three people in conversation on the WoodRoom floor before a talk", line: "A speaker, a room that leans in, and nobody checking the time.", href: "/start?path=room&room=wood-room&use=workshop" },
  { id: "empty", label: "Yours", image: "/flythrough/states/state-A.jpg", alt: "The WoodRoom empty and lit, stage set, waiting", line: "Eighty seats, a stage, a piano, and whatever you’re planning.", href: "/start?path=room&room=wood-room" },
  { id: "after", label: "The after-party", image: "/flythrough/states/state-D-2.jpg", alt: "Three people lingering in the WoodRoom as the night ends", line: "The part of the night people actually remember.", href: "/start?path=room&room=wood-room&use=party" },
];

/**
 * HOME — hero v2, "the room fills" (2026-09-22; the original room-tour film now lives on
 * /rooms). `?night=` picks the route; see NIGHTS in flythrough-route-v2.ts.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ night?: string }>;
}) {
  const { night } = await searchParams;
  const wall = getWall();
  const upcoming = getUpcomingAndPast().upcoming.slice(0, 3);
  const posts = getAllPosts()
    .slice()
    .sort((a, b) => b.frontmatter.publishedAt.getTime() - a.frontmatter.publishedAt.getTime())
    .slice(0, 3)
    .map(({ frontmatter: f }) => ({ slug: f.slug, title: f.title, excerpt: f.excerpt, heroImage: f.heroImage, heroImageAlt: f.heroImageAlt ?? f.title, publishedAt: f.publishedAt.toISOString().slice(0, 10) }));
  return (
    <>
      <JsonLd data={placeJsonLd} />
      {/* The header floats over the film rather than sitting above it — the fly-through
          is full-bleed and starts at the very top of the viewport. */}
      <Nav overlay />
      <main id="main" className="flex-1">
        {/* The page's one h1 (SEO contract + the smoke test). The film IS the visible
            headline — the engine renders every scene title as an h2 — so this carries the
            hero's own line for crawlers and screen readers, unseen. Tailwind's sr-only keeps
            a 1px box, so it still counts as rendered. */}
        <h1 className="sr-only">You have a home. You have work. This is your third place. SoundPlex Studios, Pennsauken, NJ.</h1>
        <FlythroughV2 night={night} basePath="/" />

        {/* George's Connection Wall — the first thing after the film. It has to be the
            mount's direct next sibling (`.sw-mount + .sw-after` pulls it up over the last
            frame). Placeholder cast until real members opt in. */}
        <div className="sw-after relative z-30">
          <ConnectionWall members={wall.members} connections={wall.connections} />
        </div>

        <div className="relative z-30 bg-bone">
          <RoomTransform
            looks={LOOKS}
            heading="Same room. Different night."
            lede="The WoodRoom from the one spot everyone stands when they walk in. Tap a night and watch it change."
          />
          <section className="mx-auto max-w-6xl px-6 py-20">
            <UpcomingEvents events={upcoming} heading="What’s on" />
          </section>
          <section className="hc">
            <div className="mx-auto max-w-6xl px-6">
              <Reveal><p className="page-head__eyebrow">The Plex Collective</p></Reveal>
              <Reveal delay={80}><h2 className="page-head__title" style={{ fontSize: "clamp(1.7rem,3.6vw,2.8rem)" }}>Membership is three steps. <em>The first one is a tour.</em></h2></Reveal>
              <div className="mt-10"><CollectiveSteps compact /></div>
            </div>
          </section>
          <LatestPosts posts={posts} />
        </div>

        <section className="relative z-30 bg-bone">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <Reveal>
              <h2 className="font-display text-3xl text-ink sm:text-4xl">
                Create, perform, or just come for the show — you belong here.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate">
                {LOCATION} — minutes from Cherry Hill and Merchantville, with parking on site.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {ROOMS.map((r) => (
                <Reveal key={r.title}>
                  <div className="flex h-full flex-col rounded-sm border border-line p-6">
                    <h3 className="font-slab text-lg font-bold text-ink">{r.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate">{r.body}</p>
                    <Link href={r.cta.href} className="card-cta group mt-auto inline-flex items-center gap-2 self-start whitespace-nowrap pt-6">
                      {r.cta.label}
                      <ForwardArrow />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <div className="relative z-30 bg-bone">
        <Footer />
      </div>
    </>
  );
}
