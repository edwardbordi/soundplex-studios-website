import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import Reveal from "../../components/Reveal";
import BackArrow from "../../components/BackArrow";
import ForwardArrow from "../../components/ForwardArrow";
import JsonLd from "../../components/JsonLd";
import mdxComponents from "../../blog/mdx-components";
import UpcomingEvents from "../../components/widgets/UpcomingEvents";
import { buildPageMetadata, breadcrumbJsonLd } from "../../../lib/seo";
import { SITE_NAME, SITE_URL, ORGANIZATION_ID } from "../../../lib/site-config";
import { getAllRooms, getRoomBySlug } from "../../../lib/rooms/rooms";
import { getUpcomingAndPast } from "../../../lib/events/public";

/** /rooms/[slug] — one room: photo, story, facts, what's included, book it, what's on in it. */
export function generateStaticParams() {
  return getAllRooms().map((r) => ({ slug: r.frontmatter.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomBySlug(slug);
  if (!room) return {};
  const r = room.frontmatter;
  return buildPageMetadata({
    title: `${r.name} — ${r.tagline} — ${SITE_NAME}`,
    description: r.description,
    path: `/rooms/${r.slug}`,
    focusKeyword: r.focusKeyword,
    ogImage: r.heroImage,
  });
}

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = getRoomBySlug(slug);
  if (!room) notFound();
  const r = room.frontmatter;
  const inRoom = getUpcomingAndPast().upcoming.filter((e) => e.room === r.slug).slice(0, 3);
  const others = getAllRooms().filter((x) => x.frontmatter.slug !== r.slug);

  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <article>
          <div className="rmp__hero">
            <Image src={r.heroImage} alt={r.heroImageAlt} fill priority sizes="100vw" className="object-cover" />
            <div className="evp__hero-scrim" aria-hidden />
          </div>
          <div className="mx-auto max-w-6xl px-6">
            <Reveal eager><Link href="/rooms" className="evp__back group"><BackArrow />All rooms</Link></Reveal>
            <header className="rmp__head">
              <div>
                <Reveal eager><p className="page-head__eyebrow">{[r.capacity && `${r.capacity}${/\d$/.test(r.capacity) ? " people" : ""}`, r.size, r.ceilings].filter(Boolean).join(" · ")}</p></Reveal>
                <Reveal eager delay={80}><h1 className="page-head__title">{r.name} <em>{r.tagline}</em></h1></Reveal>
                <Reveal eager delay={160}><div className="rmp__story blog-prose"><MDXRemote source={room.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} /></div></Reveal>
              </div>
              <Reveal eager delay={200}>
                <aside className="rmp__book">
                  <p className="rm__label">Rates</p>
                  <ul className="rmp__rates">{r.rates.map((x) => <li key={x}>{x}</li>)}</ul>
                  <Link href={`/start?path=room&room=${r.slug}`} className="evp__btn group rmp__btn">Book this room<ForwardArrow /></Link>
                  <p className="rmp__fine">Tell us the date and the occasion; we check the calendar and come back within a business day. Members get member rates.</p>
                </aside>
              </Reveal>
            </header>

            <div className="rmp__cols">
              <Reveal>
                <section>
                  <p className="rm__label">What’s included</p>
                  <ul className="rmp__list">{r.included.map((x) => <li key={x}>{x}</li>)}</ul>
                </section>
              </Reveal>
              <Reveal delay={80}>
                <section>
                  <p className="rm__label">Best for</p>
                  <ul className="rmp__list">{r.bestFor.map((x) => <li key={x}>{x}</li>)}</ul>
                </section>
              </Reveal>
            </div>

            {inRoom.length > 0 && (
              <section className="rmp__events">
                <UpcomingEvents events={inRoom} heading={`Coming up in the ${r.name}`} />
              </section>
            )}

            <nav className="rmp__others" aria-label="Other rooms">
              <p className="rm__label">The other rooms</p>
              <ul>
                {others.map(({ frontmatter: o }) => (
                  <li key={o.slug}><Link href={`/rooms/${o.slug}`} className="group inline-flex items-center gap-2">{o.name}<span className="text-slate"> — {o.tagline}</span><ForwardArrow /></Link></li>
                ))}
              </ul>
            </nav>
          </div>
        </article>
      </main>
      <Footer />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "EventVenue",
        name: `${r.name}, ${SITE_NAME}`,
        description: r.description,
        url: `${SITE_URL}/rooms/${r.slug}`,
        image: `${SITE_URL}${r.heroImage}`,
        ...(r.capacity && /^\d+$/.test(r.capacity) ? { maximumAttendeeCapacity: Number(r.capacity) } : {}),
        address: { "@type": "PostalAddress", streetAddress: "6713 Rudderow Ave", addressLocality: "Pennsauken", addressRegion: "NJ", postalCode: "08109", addressCountry: "US" },
        containedInPlace: { "@id": `${SITE_URL}/#place` },
        isAccessibleForFree: false,
        provider: { "@id": ORGANIZATION_ID },
      }} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Rooms", path: "/rooms" }, { name: r.name, path: `/rooms/${r.slug}` }])} />
    </>
  );
}
