import Link from "next/link";
import Image from "next/image";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import ForwardArrow from "../components/ForwardArrow";
import JsonLd from "../components/JsonLd";
import RoomCards from "../components/widgets/RoomCards";
import { buildPageMetadata, breadcrumbJsonLd } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";
import { getAllRooms } from "../../lib/rooms/rooms";
import { PODCAST } from "../../lib/rooms/uses";

/**
 * /rooms — a plain page head, the three rooms as cards, then the podcast section. The old
 * room-tour fly-through is off this page (Ed, 2026-10-28: clunky; a simpler, nicer one comes
 * back somewhere later — the Flythrough widget and its route stay in the repo, unused).
 * Podcast is a USE, set up in whichever room is free (SITE-STRUCTURE-BRIEF §8e). Rates shown as published (COMPANY-FACTS §4). The live site's URL,
 * kept; the old podcast-room URLs 301 to #podcast.
 */
export const metadata = buildPageMetadata({
  title: `The Rooms — rent a studio, stage or lounge in Pennsauken, NJ — ${SITE_NAME}`,
  description: "Three rooms under one roof in Pennsauken: the WoodRoom stage for 80, Studio A for recording and shows in the round, and the SoundLounge speakeasy — and a podcast setup that goes in any of them. Rates from $125/hr.",
  path: "/rooms",
  focusKeyword: "event space rental South Jersey",
});

export default function Rooms() {
  const rooms = getAllRooms();
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="page-head">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal eager><p className="page-head__eyebrow">Three rooms, one building</p></Reveal>
            <Reveal eager delay={80}>
              <h1 className="page-head__title">Rent the room. <em>Or the whole night.</em></h1>
            </Reveal>
            <Reveal eager delay={160}>
              <p className="page-head__lede">Weddings, parties, workshops, podcasts, shoots and sessions. Every room comes with the building — the art on the walls, the people in the hallway, parking out back. Pick the room, tell us what it’s for, and we’ll check the calendar.</p>
            </Reveal>
          </div>
        </section>
        <section>
          <div className="mx-auto max-w-6xl px-6 pb-24">
            <div>
              <RoomCards rooms={rooms} />
            </div>

            {/* Podcast: a use, not a room. The rig travels. */}
            <Reveal>
              <section id="podcast" className="rm__pod scroll-mt-28" aria-labelledby="pod-h">
                <div className="rm__pod-photo">
                  {/* TEMPORARY (Ed, 2026-10-28): the showroom demo's podcast shot until George has a
                      real one of the SoundPlex setup. Swap the file, keep the name or update here. */}
                  <Image src="/rooms/podcast-temp.webp" alt="A podcast setup: four microphones on arms around a round wooden table, headphones at each seat, cameras on tripods and soft studio lights" fill sizes="(max-width: 860px) 100vw, 45vw" className="object-cover" />
                </div>
                <div className="rm__pod-body">
                  <p className="rm__label">Podcasts — in any room</p>
                  <h2 id="pod-h" className="rm__pod-title">Three cameras that know <em>who’s talking.</em></h2>
                  <p className="rm__pod-line">{PODCAST.line}</p>
                  <ul className="rmp__rates">
                    <li>{PODCAST.rate}</li>
                    <li>{PODCAST.guests}</li>
                    <li>Lighting, sound capture and up to six backdrops · we can host the conversation if you’d like</li>
                  </ul>
                  <Link href="/start?path=room&use=podcast" className="evp__btn group rmp__btn">Book a session<ForwardArrow /></Link>
                </div>
              </section>
            </Reveal>

            <Reveal>
              <div className="rm__cta">
                <p>Not sure which room? Start with what you’re planning.</p>
                <Link href="/start?path=room" className="evp__btn group">Plan an event<ForwardArrow /></Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Rooms", path: "/rooms" }])} />
    </>
  );
}
