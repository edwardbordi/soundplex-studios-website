import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import JsonLd from "../components/JsonLd";
import EventsCalendar from "../components/widgets/EventsCalendar";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME, SITE_TIMEZONE } from "../../lib/site-config";
import { getUpcomingAndPast, getPublicEvents } from "../../lib/events/public";
import { eventJsonLd } from "./event-jsonld";

/**
 * /studio-productions — every public, ticketed thing at SoundPlex, by George or a member.
 * The live site's URL, kept (ranking history). Content: content/events/*.mdx with
 * visibility: public. Private rentals never render here.
 */
export const metadata = buildPageMetadata({
  title: `Studio Productions — live music, comedy, talks & screenings — ${SITE_NAME}`,
  description: "What's on at SoundPlex in Pennsauken, NJ: live music four feet from the stage, comedy nights, talks, screenings, open mics and workshops. Find your kind of night.",
  path: "/studio-productions",
  focusKeyword: "live music comedy shows Pennsauken NJ",
});

export default function StudioProductionsPage() {
  const now = new Date();
  const { upcoming, past } = getUpcomingAndPast(now);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const upcomingFm = getPublicEvents().filter((e) => upcoming.some((u) => u.slug === e.slug));

  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="page-head">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal eager><p className="page-head__eyebrow">Studio Productions</p></Reveal>
            <Reveal eager delay={80}>
              <h1 className="page-head__title">Find your kind <em>of night.</em></h1>
            </Reveal>
            <Reveal eager delay={160}>
              <p className="page-head__lede">Live music four feet from the stage. Comedy, talks, screenings, open mics. Some of it George puts on, some of it the Collective does. All of it is open to you.</p>
            </Reveal>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <EventsCalendar upcoming={upcoming} past={past} today={today} />
        </div>
      </main>
      <Footer />
      {upcomingFm.map((fm) => <JsonLd key={fm.slug} data={eventJsonLd(fm)} />)}
    </>
  );
}
