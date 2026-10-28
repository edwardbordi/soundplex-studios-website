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
import { PODCAST, useById, type RoomUse } from "../../../lib/rooms/uses";
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
  const uses = r.uses.map(useById).filter((u): u is RoomUse => !!u);

  // The four numbers in the hero, from the room file as printed (strings on purpose).
  const lowest = r.rates.map((x) => Number(x.match(/\$(\d[\d,]*)/)?.[1]?.replace(/,/g, ""))).filter((n) => n > 0).sort((a, b) => a - b)[0];
  const num = (s?: string) => s?.match(/^[\d,]+/)?.[0];
  const facts: { k: string; v: string; unit?: string }[] = [
    ...(r.capacity ? [{ k: "Holds", v: num(r.capacity) ?? r.capacity, ...(num(r.capacity) ? { unit: "people" } : {}) }] : []),
    ...(r.size ? [{ k: "Size", v: num(r.size) ?? r.size, ...(num(r.size) ? { unit: "sq ft" } : {}) }] : []),
    ...(r.ceilings ? [{ k: "Ceilings", v: num(r.ceilings) ?? r.ceilings.split(",")[0], ...(num(r.ceilings) ? { unit: "ft" } : {}) }] : []),
    ...(lowest ? [{ k: "From", v: `$${lowest}`, unit: "/hr" }] : []),
  ];

  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <article>
          {/* The hero: the room, full-bleed, with everything you'd ask first laid over it —
              name, one line, the four numbers, and the two things you can do. */}
          <header className="rmh">
            <Image src={r.heroImage} alt={r.heroImageAlt} fill priority sizes="100vw" className="rmh__img object-cover" />
            <div className="rmh__scrim" aria-hidden />
            <div className="rmh__inner mx-auto max-w-6xl px-6">
              <Reveal eager><Link href="/rooms" className="evp__back rmh__back group"><BackArrow />All rooms</Link></Reveal>
              <div className="rmh__copy">
                <Reveal eager><p className="page-head__eyebrow">The rooms · SoundPlex, Pennsauken</p></Reveal>
                <Reveal eager delay={80}><h1 className="rmh__title">{r.name}<em>{r.tagline}</em></h1></Reveal>
                {facts.length > 0 && (
                  <Reveal eager delay={160}>
                    <dl className="rmh__facts">
                      {facts.map((f) => (
                        <div key={f.k} className="rmh__fact"><dt>{f.k}</dt><dd>{f.v}{f.unit && <span>{f.unit}</span>}</dd></div>
                      ))}
                    </dl>
                  </Reveal>
                )}
                <Reveal eager delay={220}>
                  <div className="rmh__ctas">
                    <Link href={`/start?path=room&room=${r.slug}`} className="evp__btn group">Book this room<ForwardArrow /></Link>
                    {r.gallery.length > 0 && <a href="#photos" className="rmh__more">See the photos</a>}
                  </div>
                </Reveal>
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-6">
            <section className="rmp__head" aria-label={`About the ${r.name}`}>
              <div>
                <Reveal><div className="rmp__story blog-prose"><MDXRemote source={room.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} /></div></Reveal>
              </div>
              <Reveal delay={80}>
                <aside className="rmp__book">
                  <p className="rm__label">Rates</p>
                  <ul className="rmp__rates">{r.rates.map((x) => <li key={x}>{x}</li>)}</ul>
                  <Link href={`/start?path=room&room=${r.slug}`} className="evp__btn group rmp__btn">Book this room<ForwardArrow /></Link>
                  <p className="rmp__fine">Tell us the date and what it’s for; we check the calendar and come back within a business day. Members get member rates.</p>
                </aside>
              </Reveal>
            </section>

            {/* What you can do here: every use is a tap into the survey with room + use set. */}
            {uses.length > 0 && (
              <Reveal>
                <section className="rmp__uses" aria-labelledby="uses-h">
                  <p id="uses-h" className="rm__label">Book it for</p>
                  <ul className="rmp__chips">
                    {uses.map((u) => (
                      <li key={u.id}>
                        <Link href={`/start?path=room&room=${r.slug}&use=${u.id}`} className="rmp__chip">{u.plural}</Link>
                      </li>
                    ))}
                  </ul>
                  {uses.some((u) => u.id === "podcast") && <p className="rmp__fine">Podcasts: we bring the cameras, mics and an operator to the room — {PODCAST.rate.replace(" ·", ",")}.</p>}
                </section>
              </Reveal>
            )}

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

            {r.gallery.length > 0 && (
              <section id="photos" className="rmp__gallery scroll-mt-24" aria-label={`Photos of the ${r.name}`}>
                <ul>
                  {r.gallery.map((src, i) => (
                    <Reveal key={src} as="li" delay={i * 40}>
                      <Image src={src} alt={`${r.name} at SoundPlex, photo ${i + 1}`} width={1600} height={1067} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="rmp__gallery-img" />
                    </Reveal>
                  ))}
                </ul>
              </section>
            )}

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
