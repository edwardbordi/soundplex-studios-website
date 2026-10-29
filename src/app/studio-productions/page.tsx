import Image from "next/image";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import JsonLd from "../components/JsonLd";
import WhatsOn from "../components/widgets/WhatsOn";
import { buildPageMetadata, breadcrumbJsonLd } from "../../lib/seo";
import { SHOW_SAMPLE_EVENTS, SITE_NAME } from "../../lib/site-config";
import { getCalendarItems, getPublicEvents, getUpcomingAndPast } from "../../lib/events/public";
import { getAllRooms } from "../../lib/rooms/rooms";
import { eventJsonLd } from "./event-jsonld";

/**
 * /studio-productions — Studio Productions (SITE-STRUCTURE-BRIEF §11). The page is the Realiiz
 * showroom's "What's On" demo, ported (Ed 2026-10-28: the demo's design exactly; SoundPlex's
 * colors, fonts and data). Top to bottom, as in the demo: no hero — it opens on what's happening
 * right now (the board), then the calendar (List / Calendar / Rooms), members: who's here, the
 * rooms. Then — SoundPlex's own — past productions, each with its page.
 *
 * WhatsOn works from the visitor's clock (client); this server page hands it George's real
 * calendar (getCalendarItems — private bookings stripped to "Private event") and whether the
 * sample week is on (site-config SHOW_SAMPLE_EVENTS). Search engines get the h1, the copy, the
 * past-production links and Event JSON-LD for every real upcoming public production.
 */
export const metadata = buildPageMetadata({
  title: `Studio Productions — what’s on: live music, comedy, talks & screenings — ${SITE_NAME}`,
  description: "What’s on at SoundPlex in Pennsauken, NJ, tonight and every night: live music four feet from the stage, comedy, talks, screenings, open mics and workshops — and which rooms are free.",
  path: "/studio-productions",
  focusKeyword: "live music comedy shows Pennsauken NJ",
});

const GOLD = "#d4a030";
const DISPLAY = "font-[family-name:var(--font-poppins)]";

export default function StudioProductionsPage() {
  const now = new Date();
  const items = getCalendarItems(now);
  const { upcoming, past } = getUpcomingAndPast(now);
  const upcomingFm = getPublicEvents().filter((e) => upcoming.some((u) => u.slug === e.slug));
  const rooms = getAllRooms().map(({ frontmatter: r }) => r);

  return (
    <>
      <Nav />
      <main id="main" className="flex-1 bg-[#050505]">
        {/* No hero: the page opens straight on what's happening right now (as in the demo). */}
        <h1 className="sr-only">Studio Productions at SoundPlex Studios: what’s on tonight, the calendar and who’s here</h1>
        <section id="calendar" className="relative scroll-mt-28 overflow-hidden px-6 pb-20 pt-14 sm:pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full opacity-[0.12] blur-3xl"
            style={{ background: `radial-gradient(circle, ${GOLD}, transparent 65%)` }}
          />
          <div className="relative mx-auto max-w-6xl">
            <WhatsOn items={items} showSamples={SHOW_SAMPLE_EVENTS} />
            {SHOW_SAMPLE_EVENTS && (
              <p
                className="mt-10 text-[12.5px] leading-relaxed text-white/40"
                data-needs="Your real calendar"
                data-needs-detail="Upcoming events: name, date, time, room, price or free, public or members only, and the ticket link. Also the member ticket discount (we've shown 20%)."
              >
                Sample calendar: these nights are examples of a SoundPlex week, shown until the real calendar goes in. The member login is a
                preview, check-ins are simulated, and nothing is booked, sold, sent or stored.
              </p>
            )}
          </div>
        </section>

        <section id="rooms" className="scroll-mt-24 border-t border-white/[0.08] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <p className={`${DISPLAY} text-xs font-medium uppercase tracking-[0.22em]`} style={{ color: GOLD }}>
                The rooms
              </p>
              <h2 className={`${DISPLAY} mt-4 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-5xl`}>
                Every room has its own calendar.
              </h2>
            </Reveal>
            <ul className="mt-12 grid gap-px overflow-hidden rounded-[8px] border border-white/10 bg-white/10 sm:grid-cols-3">
              {rooms.map((r, i) => (
                <Reveal key={r.slug} as="li" delay={i * 60} className="bg-[#050505]">
                  <Link href={`/rooms/${r.slug}`} className="group block">
                    <span className="relative block aspect-[16/10] overflow-hidden">
                      <Image
                        src={r.heroImage}
                        alt={r.heroImageAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover opacity-85 transition-[transform,opacity] duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" aria-hidden />
                    </span>
                    <div className="p-6 pt-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className={`${DISPLAY} text-xl font-semibold text-white transition-colors group-hover:text-[#d4a030]`}>{r.name}</h3>
                        {r.capacity && <span className="shrink-0 text-[12px] text-white/45">holds {r.capacity}</span>}
                      </div>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/60">{r.description}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* SoundPlex's own: the real history, each with its page — proof the place is alive. */}
        {past.length > 0 && (
          <section id="past" className="scroll-mt-24 border-t border-white/[0.08] px-6 py-20">
            <div className="mx-auto max-w-6xl">
              <p className={`${DISPLAY} text-xs font-medium uppercase tracking-[0.22em]`} style={{ color: GOLD }}>
                Past productions
              </p>
              <ul className="mt-6 divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {past.slice(0, 16).map((e) => (
                  <li key={e.slug}>
                    <Link href={`/studio-productions/${e.slug}`} className="group grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-baseline gap-4 py-3.5">
                      <span className="text-[13px] tabular-nums text-white/45">{e.month} {e.day}</span>
                      <span className="truncate text-[15px] text-white/80 group-hover:text-white">{e.title}</span>
                      <span className="text-[12px] uppercase tracking-[0.12em] text-white/40">{e.kindLabel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <Footer />
      {upcomingFm.map((fm) => <JsonLd key={fm.slug} data={eventJsonLd(fm)} />)}
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Studio Productions", path: "/studio-productions" }])} />
    </>
  );
}
