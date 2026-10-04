import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";
import ForwardArrow from "./components/ForwardArrow";
import FlythroughV2 from "./components/widgets/FlythroughV2";
import ConnectionWall from "./components/widgets/ConnectionWall";
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
    body: "The Wood Room is a real stage with a real audience four feet away. Shows, sessions and screenings run through the week.",
    cta: { label: "Book a night", href: "/book" },
  },
  {
    title: "Join the Plex Collective",
    body: "Memberships for people who show up: the room, the gear, and the other creators who are already here.",
    cta: { label: "Schedule a tour", href: "/book" },
  },
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
          <ConnectionWall />
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
