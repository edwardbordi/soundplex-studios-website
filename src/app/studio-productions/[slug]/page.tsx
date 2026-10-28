import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { eventWhen, formatWhen } from "@realiizlabs/admin/events";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import Reveal from "../../components/Reveal";
import BackArrow from "../../components/BackArrow";
import ForwardArrow from "../../components/ForwardArrow";
import OutboundArrow from "../../components/OutboundArrow";
import JsonLd from "../../components/JsonLd";
import mdxComponents from "../../blog/mdx-components";
import { buildPageMetadata, breadcrumbJsonLd } from "../../../lib/seo";
import { SITE_NAME, SITE_TIMEZONE, SITE_URL } from "../../../lib/site-config";
import { getAllEvents, getEventBySlug } from "../../../lib/events/events";
import { kindLabel } from "../../../lib/events/schema";
import { ROOM_NAMES } from "../../../lib/events/public";
import { eventJsonLd } from "../event-jsonld";

/** /studio-productions/[slug] — one production. Public events only. */

/** Six hours after it started, the tickets button and "add to calendar" come off. */
function isOver(start: Date): boolean {
  return start.getTime() < Date.now() - 6 * 3600 * 1000;
}

export function generateStaticParams() {
  return getAllEvents().filter((e) => e.frontmatter.visibility !== "private").map((e) => ({ slug: e.frontmatter.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getEventBySlug(slug);
  if (!item || item.frontmatter.visibility === "private") return {};
  const fm = item.frontmatter;
  return buildPageMetadata({
    title: `${fm.title} — ${SITE_NAME}`,
    description: fm.summary,
    path: `/studio-productions/${fm.slug}`,
    focusKeyword: fm.title,
    ogImage: fm.ogImage ?? fm.heroImage ?? undefined,
  });
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getEventBySlug(slug);
  if (!item || item.frontmatter.visibility === "private") notFound();
  const fm = item.frontmatter;
  const when = eventWhen(fm, { defaultZone: SITE_TIMEZONE });
  const past = isOver(when.start);
  const room = fm.venue ?? "wood-room";
  const roomName = ROOM_NAMES[room] ?? room;
  const gcal = new URL("https://calendar.google.com/calendar/render");
  gcal.searchParams.set("action", "TEMPLATE");
  gcal.searchParams.set("text", fm.title);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  gcal.searchParams.set("dates", `${fmt(when.start)}/${fmt(when.end ?? new Date(when.start.getTime() + 7200000))}`);
  gcal.searchParams.set("details", `${fm.summary}\n${SITE_URL}/studio-productions/${fm.slug}`);
  gcal.searchParams.set("location", `${SITE_NAME}, 6713 Rudderow Ave, Pennsauken, NJ 08109`);

  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <article className="evp">
          {fm.heroImage && (
            <div className="evp__hero">
              <Image src={fm.heroImage} alt={fm.heroImageAlt ?? fm.title} fill priority sizes="100vw" className="object-cover" />
              <div className="evp__hero-scrim" aria-hidden />
            </div>
          )}
          <div className="mx-auto max-w-3xl px-6">
            <Reveal eager>
              <Link href="/studio-productions" className="evp__back group"><BackArrow />All productions</Link>
            </Reveal>
            <header className="evp__head">
              <Reveal eager>
                <p className="evp__eyebrow">
                  {kindLabel(fm)} · {roomName}
                  {fm.cancelled && <span className="evp__warn"> · Canceled</span>}
                  {!fm.cancelled && fm.closed && <span className="evp__warn"> · Sold out</span>}
                  {!fm.cancelled && fm.rescheduledTo && <span className="evp__warn"> · Rescheduled</span>}
                </p>
              </Reveal>
              <Reveal eager delay={80}>
                <h1 className={`evp__title${fm.cancelled ? " is-cancelled" : ""}`}>{fm.title}</h1>
              </Reveal>
              <Reveal eager delay={160}>
                <dl className="evp__facts">
                  <dt>When</dt><dd><time dateTime={when.start.toISOString()}>{formatWhen(when)}</time></dd>
                  <dt>Where</dt><dd><Link href={`/rooms/${room}`} className="evp__roomlink">{roomName}</Link>, SoundPlex · 6713 Rudderow Ave, Pennsauken</dd>
                  {fm.producer && <><dt>Presented by</dt><dd>{fm.producer}</dd></>}
                  {fm.price && <><dt>Price</dt><dd>{fm.price}</dd></>}
                  {fm.host && <><dt>Host</dt><dd>{fm.host}</dd></>}
                </dl>
                {fm.cancelled && fm.cancelledNote && <p className="evp__note">{fm.cancelledNote}</p>}
                {!fm.cancelled && fm.rescheduledTo && (
                  <p className="evp__note">Moved — see <Link href={`/studio-productions/${fm.rescheduledTo}`}>the new date</Link>.</p>
                )}
                <div className="evp__actions">
                  {fm.url && !fm.cancelled && !fm.closed && !past && (
                    <a href={fm.url} target="_blank" rel="noopener noreferrer" className="evp__btn group">
                      {fm.ticketLabel ?? "Get tickets"}<OutboundArrow />
                    </a>
                  )}
                  {!past && !fm.cancelled && (
                    <span className="evp__cal">
                      <span className="evp__cal-label">Add to calendar</span>
                      <a href={`/studio-productions/${fm.slug}/invite.ics`} className="evp__cal-link">Apple / Outlook</a>
                      <a href={gcal.toString()} target="_blank" rel="noopener noreferrer" className="evp__cal-link">Google</a>
                    </span>
                  )}
                </div>
                {fm.hostNote && (
                  <p className="evp__alone"><span>Coming alone?</span> {fm.hostNote}</p>
                )}
              </Reveal>
            </header>

            {item.content && (
              <div className="blog-prose evp__body">
                <MDXRemote source={item.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
              </div>
            )}

            <footer className="evp__foot">
              <Link href="/studio-productions" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">Everything that’s on<ForwardArrow /></Link>
              <Link href="/start?path=produce" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">Put on your own<ForwardArrow /></Link>
            </footer>
          </div>
        </article>
      </main>
      <Footer />
      <JsonLd data={eventJsonLd(fm)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Studio Productions", path: "/studio-productions" }, { name: fm.title, path: `/studio-productions/${fm.slug}` }])} />
    </>
  );
}
