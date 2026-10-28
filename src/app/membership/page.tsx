import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import ForwardArrow from "../components/ForwardArrow";
import JsonLd from "../components/JsonLd";
import CollectiveSteps from "../components/widgets/CollectiveSteps";
import ChainRun from "../components/widgets/ChainRun";
import ConnectionWall from "../components/widgets/ConnectionWall";
import UpcomingEvents from "../components/widgets/UpcomingEvents";
import { buildPageMetadata, breadcrumbJsonLd, serviceJsonLd } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";
import { getWall } from "../../lib/members/members";
import { getUpcomingAndPast } from "../../lib/events/public";

/**
 * /membership — The Plex Collective. The three-step model only (Ed, 2026-10-04); the old
 * Audience/Backstage/Center Stage tiers are gone and their funnel URLs redirect here.
 * Framing is George's own copy from the live page, kept.
 */
export const metadata = buildPageMetadata({
  title: `The Plex Collective — membership at ${SITE_NAME}`,
  description: "A true third place for founders and creators in South Jersey. Membership from $75 a month: the rooms, the people, the events, and a path from idea to finished work. Start with a complimentary tour.",
  path: "/membership",
  focusKeyword: "creative membership South Jersey",
});

export default function MembershipPage() {
  const wall = getWall();
  const upcoming = getUpcomingAndPast().upcoming.slice(0, 3);
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="page-head">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal eager><p className="page-head__eyebrow">The Plex Collective · Membership</p></Reveal>
            <Reveal eager delay={80}><h1 className="page-head__title">You have a home. You have work. <em>This is your third place.</em></h1></Reveal>
            <Reveal eager delay={160}>
              <p className="page-head__lede">Most people have a home and a workplace, but few have a true third place. The Plex Collective is one: not just a venue, a networking group or a production studio, but a guided ecosystem where connection and creativity turn into momentum.</p>
            </Reveal>
            <Reveal eager delay={240}>
              <div className="mb__ctas">
                <Link href="/start?path=collective" className="evp__btn group">Book your complimentary tour<ForwardArrow /></Link>
                <p className="mb__fine">Membership starts with a visit. The tour is on us.</p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-8">
          <Reveal><p className="page-head__eyebrow">How the Plex Collective works</p></Reveal>
          <div className="mt-6"><CollectiveSteps /></div>
        </section>

        {/* The statement: centered, roomy, the chain running, George's motto under it (ChainRun). */}
        <section className="ch-stage mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="page-head__eyebrow">Not rocket science. Human science.</p>
          </Reveal>
          <ChainRun />
        </section>

        <ConnectionWall members={wall.members} connections={wall.connections} />

        <section className="mx-auto max-w-6xl px-6 py-20">
          <UpcomingEvents events={upcoming} heading="Where members meet this month" />
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <Reveal>
            <div className="rm__cta">
              <p>Come see the place first. Then decide.</p>
              <Link href="/start?path=collective" className="evp__btn group">Book a tour<ForwardArrow /></Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
      <JsonLd data={serviceJsonLd({ name: "The Plex Collective membership", description: "Membership at SoundPlex Studios: access to the rooms, the community, events and networking, discovery sessions, and a guided path from idea to finished work.", path: "/membership" })} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Membership", path: "/membership" }])} />
    </>
  );
}
