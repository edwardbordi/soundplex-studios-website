import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import ForwardArrow from "../components/ForwardArrow";
import Flythrough from "../components/widgets/Flythrough";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME, LOCATION } from "../../lib/site-config";

/**
 * ROOMS — the original homepage fly-through, moved here (2026-09-22) because that film
 * IS a tour of every room in the building. It stands in for a real rooms page until one
 * exists (specs, rates, booking per room). The homepage is now the "room fills" hero.
 *
 * No Place JSON-LD here — the homepage carries the one Place node; this page must not
 * emit a second one.
 */
export const metadata = buildPageMetadata({
  title: `The Rooms — ${SITE_NAME}, Pennsauken, NJ`,
  description:
    "Walk through every room at SoundPlex: the Wood Room stage, Studio A, the podcast studio and the Sound Lounge — bookable by the hour, with an engineer if you want one.",
  path: "/rooms",
  focusKeyword: "recording studio rooms Pennsauken NJ",
});

const ROOMS = [
  {
    title: "Book a room by the hour",
    body: "Recording, podcast and photo/video sessions in the same rooms you just walked through — with an engineer if you want one.",
    cta: { label: "Check availability", href: "/book" },
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

export default function Rooms() {
  return (
    <>
      <Nav overlay />
      <main id="main" className="flex-1">
        {/* One h1 per page (SEO contract); the film is the visible headline. */}
        <h1 className="sr-only">The rooms at SoundPlex Studios: the WoodRoom, Studio A, the Podcasting Studios and the SoundLounge.</h1>
        <Flythrough />

        {/* Everything below the flight. It scrolls up over the last frame once the
            camera has come to rest in the Sound Lounge. */}
        <section className="sw-after relative z-30 bg-bone">
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
