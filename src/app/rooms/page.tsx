import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import ForwardArrow from "../components/ForwardArrow";
import JsonLd from "../components/JsonLd";
import Flythrough from "../components/widgets/Flythrough";
import RoomCards from "../components/widgets/RoomCards";
import { buildPageMetadata, breadcrumbJsonLd } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";
import { getAllRooms } from "../../lib/rooms/rooms";

/**
 * /rooms — the original fly-through (a tour of every room) with the four rooms as cards
 * beneath it. Rates shown as published (COMPANY-FACTS §4). The live site's URL, kept.
 */
export const metadata = buildPageMetadata({
  title: `The Rooms — rent a studio, stage or lounge in Pennsauken, NJ — ${SITE_NAME}`,
  description: "Four rooms under one roof in Pennsauken: the WoodRoom stage for 80, Studio A for recording and shows in the round, the Podcasting Studios, and the SoundLounge speakeasy. Rates from $125/hr.",
  path: "/rooms",
  focusKeyword: "event space rental South Jersey",
});

export default function Rooms() {
  const rooms = getAllRooms();
  return (
    <>
      <Nav overlay />
      <main id="main" className="flex-1">
        <h1 className="sr-only">The rooms at SoundPlex Studios: the WoodRoom, Studio A, the Podcasting Studios and the SoundLounge.</h1>
        <Flythrough />
        <section className="sw-after relative z-30 bg-bone">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <p className="page-head__eyebrow">Four rooms, one building</p>
              <h2 className="page-head__title">Rent the room. <em>Or the whole night.</em></h2>
              <p className="page-head__lede">Weddings, parties, workshops, shoots and sessions. Every room comes with the building — the art on the walls, the people in the hallway, parking out back. Tell us the occasion and we’ll check the calendar.</p>
            </Reveal>
            <div className="mt-12">
              <RoomCards rooms={rooms} />
            </div>
            <Reveal>
              <div className="rm__cta">
                <p>Not sure which room? Start with what you’re planning.</p>
                <Link href="/start?path=room" className="evp__btn group">Plan an event<ForwardArrow /></Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <div className="relative z-30 bg-bone">
        <Footer />
      </div>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Rooms", path: "/rooms" }])} />
    </>
  );
}
