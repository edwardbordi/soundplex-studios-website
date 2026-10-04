import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { eventWhen, formatWhen, kindOf } from "@realiizlabs/admin/events";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import Reveal from "../../components/Reveal";
import Eyebrow from "../../components/Eyebrow";
import BackArrow from "../../components/BackArrow";
import JsonLd from "../../components/JsonLd";
import mdxComponents from "../../blog/mdx-components";
import { buildPageMetadata, breadcrumbJsonLd } from "../../../lib/seo";
import { SITE_NAME, SITE_TIMEZONE } from "../../../lib/site-config";
import { getAllEvents, getEventBySlug } from "../../../lib/events/events";
import { EventLinks, eventJsonLd } from "../EventRow";

/** /events/[slug] — one event: the when/where, the link, and the long description (MDX body). */

export function generateStaticParams() {
  return getAllEvents().map((e) => ({ slug: e.frontmatter.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getEventBySlug(slug);
  if (!item) return {};
  const fm = item.frontmatter;
  return buildPageMetadata({
    title: `${fm.title} — ${SITE_NAME}`,
    description: fm.summary,
    path: `/events/${fm.slug}`,
    focusKeyword: fm.title,
    ogImage: fm.ogImage ?? fm.heroImage ?? undefined,
  });
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getEventBySlug(slug);
  if (!item) notFound();
  const fm = item.frontmatter;
  const when = eventWhen(fm, { defaultZone: SITE_TIMEZONE });
  const kind = kindOf(fm);

  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <article className="mx-auto max-w-3xl px-6 pb-24 pt-20 sm:pt-28 lg:pt-32">
          <Reveal>
            <Link href="/events" className="group font-mono-label inline-flex items-center gap-2 text-sm text-slate transition-colors hover:text-ink">
              <BackArrow />
              All events
            </Link>
          </Reveal>

          <header className="mt-8 border-b border-line pb-10">
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <Eyebrow tone="signal">{kind ?? "Event"}</Eyebrow>
                {fm.cancelled && <span className="font-mono-label rounded-full border border-amber/60 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-amber">Canceled</span>}
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h1 className={`font-display mt-6 text-pretty text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl ${fm.cancelled ? "line-through decoration-slate/60" : ""}`}>
                {fm.title}
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <dl className="mt-8 grid items-baseline gap-x-10 gap-y-4 text-slate sm:grid-cols-[auto_1fr]">
                <dt className="font-mono-label text-xs uppercase tracking-[0.14em]">When</dt>
                <dd><time dateTime={when.start.toISOString()}>{formatWhen(when)}</time></dd>
                {fm.location && (<><dt className="font-mono-label text-xs uppercase tracking-[0.14em]">Where</dt><dd>{fm.location}</dd></>)}
              </dl>
              {fm.cancelled && fm.cancelledNote && <p className="mt-4 text-sm text-amber">{fm.cancelledNote}</p>}
              <div className="mt-6"><EventLinks fm={fm} /></div>
            </Reveal>
          </header>

          {item.content && (
            <div className="blog-prose mt-12">
              <MDXRemote source={item.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
            </div>
          )}
        </article>
      </main>
      <Footer />
      <JsonLd data={eventJsonLd(fm, SITE_TIMEZONE)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Events", path: "/events" }, { name: fm.title, path: `/events/${fm.slug}` }])} />
    </>
  );
}
