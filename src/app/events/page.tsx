import { splitEvents } from "@realiizlabs/admin/events";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import Eyebrow from "../components/Eyebrow";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME, SITE_TIMEZONE } from "../../lib/site-config";
import { getAllEvents } from "../../lib/events/events";
import { EventRow, eventJsonLd } from "./EventRow";

/**
 * /events — upcoming first, then past. Content is content/events/*.mdx,
 * published from Studio like a blog post; the model is the package's events
 * schema (src/lib/events/schema.ts). Restyle freely — the sections, the empty
 * state and the JSON-LD are the parts worth keeping.
 */
export const metadata = buildPageMetadata({
  title: `Events — ${SITE_NAME}`,
  description: `What's coming up at ${SITE_NAME}, and what's already happened.`,
  path: "/events",
  focusKeyword: "events",
});

export default function EventsPage() {
  const all = getAllEvents().map((e) => e.frontmatter);
  const { upcoming, past } = splitEvents(all, new Date(), { defaultZone: SITE_TIMEZONE });

  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28 lg:pt-32">
            <div className="max-w-3xl">
              <Reveal>
                <Eyebrow tone="signal">Calendar</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-display mt-6 text-pretty text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">Events</h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate">What&apos;s coming up, and what&apos;s already happened.</p>
              </Reveal>
            </div>

            <section aria-labelledby="upcoming" className="mt-16">
              <h2 id="upcoming" className="font-display text-2xl font-semibold tracking-tight text-ink">Upcoming</h2>
              {upcoming.length === 0 ? (
                <p className="mt-6 text-slate">Nothing scheduled right now.</p>
              ) : (
                <ol className="mt-8 divide-y divide-line">
                  {upcoming.map((fm) => (
                    <li key={fm.slug}>
                      <EventRow fm={fm} zone={SITE_TIMEZONE} />
                      <JsonLd data={eventJsonLd(fm, SITE_TIMEZONE)} />
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {past.length > 0 && (
              <section aria-labelledby="past" className="mt-20">
                <h2 id="past" className="font-display text-2xl font-semibold tracking-tight text-ink">Past</h2>
                <ol className="mt-8 divide-y divide-line">
                  {past.map((fm) => (
                    <li key={fm.slug}>
                      <EventRow fm={fm} zone={SITE_TIMEZONE} past />
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
