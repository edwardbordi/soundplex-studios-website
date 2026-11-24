import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ForwardArrow from "../components/ForwardArrow";
import OutboundArrow from "../components/OutboundArrow";
import SectionRail from "../components/SectionRail";
import JsonLd from "../components/JsonLd";
import BuildCards from "./BuildCards";
import WebsitesCalendar from "./WebsitesCalendar";
import { buildPageMetadata, breadcrumbJsonLd, serviceJsonLd } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";

/**
 * /websites — "Websites by SoundPlex". Built by Realiiz, a Plex Collective member and SoundPlex's
 * web partner (private/Realiiz-SoundPlex-Partner-Agreement). Prices are the normal ones, Schedule A.
 * Presented as SoundPlex's own offer (Ed, 2026-11-24): Realiiz is introduced, never featured, and
 * nothing is badged "From SoundPlex", because all of it is.
 *
 * Layout (Ed, 2026-11-24): the realiiz.com Black Friday funnel (/black-friday/soundplex), section
 * for section, without the deal: no countdown, no package price or "only 20 sites", normal
 * prices. SoundPlex's own header and footer. Builds show the same three member sites as the
 * funnel (approved quotes), and "a first look" is this site itself. Details get finalized at launch: the parts still
 * to confirm carry data-needs, so they show in the review kit's "What we still need".
 */
export const metadata = buildPageMetadata({
  title: `Websites — we build it first, you pay when you love it — ${SITE_NAME}`,
  description:
    "A website that feels like you do in person, for South Jersey businesses. Designed for you, the words written for you, and you see a working preview before you pay anything. From $6,000.",
  path: "/websites",
  focusKeyword: "website design South Jersey",
});

const GOLD = "#d4a030";
const POP = "font-[family-name:var(--font-poppins)]";
const eyebrow = `${POP} text-[11.5px] font-medium uppercase tracking-[0.22em] text-[#d4a030]`;
const h2 = `${POP} mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl`;
/** The thin gold rule between sections, as on the funnel. */
const band = "scroll-mt-24 border-b border-transparent [border-image:linear-gradient(to_right,transparent,rgba(212,160,48,0.38),transparent)_1]";

/** George's calendar for website calls. Set NEXT_PUBLIC_WEBSITES_CALENDAR_ID to change it. */
const CALENDAR_ID = process.env.NEXT_PUBLIC_WEBSITES_CALENDAR_ID || "xyPCrxOdKKkz5oTz6Waq";

/** Why it works: small cards in a band under the hero, two lines each at any width. */
const REASONS: { t: string; d: [string, string] }[] = [
  { t: "No risk", d: ["See your site before", "you pay a dollar."] },
  { t: "Payment plans", d: ["Spread it out", "if that suits you better."] },
  { t: "Words included", d: ["We write the copy", "from one conversation."] },
  { t: "You own it", d: ["Site, hosting and domain,", "all in your name."] },
  { t: "Found everywhere", d: ["Built for Google", "and for AI search."] },
  { t: "Yours to run", d: ["Post, update and publish", "from your own dashboard."] },
];

/** What a site costs: the normal prices (partner agreement, Schedule A). */
const PRICES: { item: string; note: string; value: string }[] = [
  { item: "A custom website, up to 10 pages", note: "Designed for your business, with the words written for you", value: "$6,000" },
  { item: "More pages", note: "Past the first ten", value: "$400 each" },
  { item: "Fly-through animation", note: "On your home page, like this site’s", value: "$2,000" },
  { item: "Your past blog posts moved over", note: "Kept, with their search standing", value: "$50 a post" },
  { item: "A 3-step funnel with follow-up", note: "A page that turns visitors into booked calls", value: "from $2,000" },
  { item: "A CRM other than GoHighLevel", note: "Forms connect to GoHighLevel at no extra cost", value: "$500" },
  { item: "Custom tools and member areas", note: "Scoped with you before anything starts", value: "Quoted" },
  { item: "A produced podcast episode", note: "Recorded here and shared with the SoundPlex network", value: "$250" },
  { item: "The Plex Collective", note: "Our membership: a room full of local owners and creators", value: "$75 a month" },
];

const ALSO_INCLUDED = ["Your own publishing dashboard", "A blog", "An events calendar you update yourself", "Forms wired into your CRM", "Google reviews on the site", "Search setup"];

/**
 * Ways to pay on a $6,000 site (Ed, 2026-11-24): paying in full costs least; spreading it costs a
 * little more (+5% over three payments, +10% over six), so paying in full is the better deal.
 * To confirm with George before launch (data-needs below).
 */
const PLANS: { name: string; total: string; pay: string; how: string }[] = [
  { name: "Pay in full", total: "$6,000", pay: "Half now, half at launch", how: "Half when you approve your preview, half when the site goes live." },
  { name: "In three", total: "$6,300", pay: "3 payments of $2,100", how: "One when you approve your preview, then one a month for two months." },
  { name: "Monthly", total: "$6,600", pay: "6 payments of $1,100", how: "One when you approve your preview, then one a month for five months." },
];

const STEPS = [
  { t: "Book a call", d: "Pick a time for a short Zoom call with George below. It costs nothing." },
  { t: "We learn your business", d: "One conversation about what you do, who you serve and what you want the site to do." },
  { t: "You see your site", d: "We build a working preview and walk you through it on a live screen share. Not a sketch, the real thing." },
  { t: "Then you decide", d: "If you love it, you make your first payment and we finish and launch it. If you don’t, you owe nothing." },
];

const BENEFITS: { t: string; d: string }[] = [
  { t: "Beautiful", d: "Designed for your business. Not a template with your logo on it." },
  { t: "Loads almost instantly", d: "Fast on Google’s speed test. Speed wins rankings and customers." },
  { t: "Built to convert", d: "Built by a marketer, not just a designer. The goal is customers, not compliments." },
  { t: "Copy included", d: "The words are written for you, to sell what you do." },
  { t: "Flawless on mobile", d: "Most of your visitors are on a phone. It’s built for them." },
  { t: "Built for AI search", d: "Structured so ChatGPT, Claude, Perplexity and Gemini can find you and cite you, not just Google." },
  { t: "Your SEO survives the move", d: "Redirects, structure and rankings are handled when you switch, so you keep your Google standing." },
  { t: "It doesn’t break", d: "No plugins to update and no patches to chase." },
  { t: "You own everything", d: "Site, hosting and domain, in your name once it’s paid for. Leave any time and take it with you." },
  { t: "No monthly template fees", d: "You buy it once. No $97 a month for a template you never own." },
];

const RAIL = [
  { id: "top", label: "Websites" },
  { id: "why", label: "Why it works" },
  { id: "prices", label: "What it costs" },
  { id: "pay", label: "Ways to pay" },
  { id: "how", label: "How it works" },
  { id: "reasons", label: "Ten reasons" },
  { id: "builds", label: "Member builds" },
  { id: "preview", label: "This site" },
  { id: "book", label: "Book a call" },
];

export default function WebsitesPage() {
  return (
    <>
      <Nav />
      <SectionRail sections={RAIL} />
      <main id="main" className="flex-1 bg-[#050505] text-white">
        {/* Hero (no countdown, no deal) */}
        <section id="top" className={`relative overflow-hidden ${band}`}>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(60% 55% at 50% 38%, rgba(212,160,48,0.10), rgba(212,160,48,0.03) 45%, transparent 75%)" }}
          />
          <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-14 text-center sm:pt-20">
            <p className={eyebrow}>Websites by SoundPlex</p>
            <h1 className={`${POP} mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl`}>
              You’re better in person than you are online.
            </h1>
            <p className={`${POP} mx-auto mt-6 max-w-3xl text-balance text-2xl font-semibold leading-snug tracking-tight sm:text-[2rem]`}>
              Let’s close the gap. <span style={{ color: GOLD }}>From $6,000.</span>
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-[17.5px] leading-relaxed text-white/75">
              A custom website designed for your business, with the words written for you. We build it first and show it to you live. You
              only pay when you love it.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-white/55">
              Built with Realiiz, a Plex Collective member and our web partner, the team behind this site.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
              <Link href="#book" className="evp__btn group">
                Book a call with George
                <ForwardArrow />
              </Link>
              <Link href="#prices" className="group inline-flex items-center gap-1.5 text-[15.5px] font-semibold text-white transition-colors hover:text-[#e2b34e]">
                See what it costs
                <ForwardArrow />
              </Link>
            </div>
            <figure className="mx-auto mt-12 max-w-xl">
              <span aria-hidden="true" className="mx-auto block h-px w-12 bg-[#d4a030]/60" />
              <blockquote className={`${POP} mt-6 text-balance text-[19px] font-medium leading-snug text-white/90 sm:text-[21px]`}>
                &ldquo;We&apos;re taking our creativity to another level, and bringing our community with us.&rdquo;
              </blockquote>
              <figcaption className={`${POP} mt-3 text-[10.5px] uppercase tracking-[0.18em] text-[#d4a030]`}>George · SoundPlex Studios</figcaption>
            </figure>
          </div>
        </section>

        {/* Why it works: six cards in their own band */}
        <section id="why" className={`${band} bg-[#0b0b0b]`}>
          <ul className="mx-auto grid max-w-5xl gap-3 px-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((r) => (
              <li key={r.t} className="rounded-[10px] border border-white/12 bg-black px-5 py-4 text-center">
                <span className={`${POP} text-[11.5px] uppercase tracking-[0.18em] text-[#d4a030]`}>{r.t}</span>
                <span className="mt-1.5 block text-[15.5px] leading-snug text-white">
                  <span className="block">{r.d[0]}</span>
                  <span className="block">{r.d[1]}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* What it costs (normal prices) */}
        <section id="prices" className={band}>
          <div className="mx-auto max-w-3xl px-6 py-16">
            <div className="text-center">
              <p className={eyebrow}>What it costs</p>
              <h2 className={h2}>One price for the site. Add only what you need.</h2>
            </div>
            <div className="mt-9 overflow-hidden rounded-[12px] border border-[#d4a030]/45 bg-[#0b0b0b]">
              <ul className="divide-y divide-white/10 px-6 sm:px-8">
                {PRICES.map((row) => (
                  <li key={row.item} className="flex items-baseline justify-between gap-6 py-4">
                    <span>
                      <span className={`${POP} block text-[17.5px] font-semibold`}>{row.item}</span>
                      <span className="mt-0.5 block text-[14.5px] text-white/60">{row.note}</span>
                    </span>
                    <span className="shrink-0 text-right text-[15.5px] tabular-nums text-white/75">{row.value}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#d4a030]/45 bg-[#d4a030]/[0.08] px-6 py-6 sm:px-8">
                <div className="flex items-baseline justify-between gap-6">
                  <span className={`${POP} text-xl font-semibold`}>A complete site</span>
                  <span className={`${POP} text-4xl font-semibold tabular-nums`} style={{ color: GOLD }}>
                    from $6,000
                  </span>
                </div>
                <p className="mt-2 text-right text-[14px] text-white/60">Most small-business sites land right there. Bigger builds are scoped with you up front.</p>
              </div>
            </div>
            <p className="mx-auto mt-7 max-w-2xl text-center text-[15px] leading-relaxed text-white/65">Also part of every site: {ALSO_INCLUDED.join(" · ")}.</p>
          </div>
        </section>

        {/* Ways to pay */}
        <section id="pay" className={`${band} bg-[#0b0b0b]`}>
          <div
            className="mx-auto max-w-5xl px-6 py-16"
            data-needs="Payment plans"
            data-needs-detail="Confirm the payment options for a normal (not Black Friday) site: how many payments, and when each is due."
          >
            <div className="text-center">
              <p className={eyebrow}>Ways to pay</p>
              <h2 className={h2}>Pay it the way that suits you.</h2>
            </div>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {PLANS.map((p, i) => (
                <li key={p.name} className={`rounded-[10px] border px-6 py-6 ${i === 0 ? "border-[#d4a030]/70 bg-[#d4a030]/[0.07]" : "border-white/12 bg-black"}`}>
                  <span className="flex items-center justify-between gap-3">
                    <span className={`${POP} text-[12px] uppercase tracking-[0.18em] text-[#d4a030]`}>{p.name}</span>
                    {i === 0 && (
                      <span className={`${POP} whitespace-nowrap rounded-[3px] bg-[#d4a030] px-2 py-1 text-[9.5px] font-semibold uppercase leading-none tracking-[0.16em] text-black`}>Best value</span>
                    )}
                  </span>
                  <span className={`${POP} mt-2 block text-4xl font-semibold tabular-nums`}>{p.total}</span>
                  <span className="mt-3 block text-[16.5px] font-semibold">{p.pay}</span>
                  <span className="mt-1.5 block text-[14.5px] leading-relaxed text-white/65">{p.how}</span>
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-7 max-w-3xl text-center text-[15px] leading-relaxed text-white/65">
              Paying in full costs least; spreading it out adds a little. Whichever you pick, nothing is due until you&apos;ve seen your site and love it. The site goes live as soon as it&apos;s finished,
              and once it&apos;s paid for, everything moves into your own accounts. It&apos;s yours.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className={band}>
          <div className="mx-auto max-w-4xl px-6 py-16">
            <div className="text-center">
              <p className={eyebrow}>How it works</p>
              <h2 className={h2}>You see it before you pay.</h2>
            </div>
            <ol className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className={`${POP} flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d4a030]/60 text-[15px] font-semibold text-[#d4a030]`}>{i + 1}</span>
                  <span>
                    <span className={`${POP} block text-[18px] font-semibold`}>{s.t}</span>
                    <span className="mt-1 block text-[15.5px] leading-relaxed text-white/70">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ten reasons, and the SoundPlex add-on */}
        <section id="reasons" className={`${band} bg-[#0b0b0b]`}>
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="text-center">
              <p className={eyebrow}>What you get</p>
              <h2 className={h2}>Ten reasons this isn&apos;t just another website.</h2>
            </div>
            <ol className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {BENEFITS.map((b, i) => (
                <li key={b.t} className="flex gap-4">
                  <span className={`${POP} w-7 shrink-0 text-right text-[19px] font-semibold tabular-nums text-[#d4a030]`}>{i + 1}</span>
                  <span>
                    <span className={`${POP} block text-[18px] font-semibold`}>{b.t}</span>
                    <span className="mt-1 block text-[15.5px] leading-relaxed text-white/70">{b.d}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-12 rounded-[10px] border border-[#d4a030]/45 bg-black p-7 sm:p-9">
              <p className={eyebrow}>Launch it here</p>
              <h3 className={`${POP} mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl`}>It&apos;s not just a website. It can come with a way to get it seen.</h3>
              <p className="mt-4 max-w-3xl text-pretty text-[16.5px] leading-relaxed text-white/75">A new site needs people looking at it. We can launch it with you, right here at SoundPlex.</p>
              <ul className="mt-6 grid gap-6 md:grid-cols-3">
                {[
                  { t: "Your podcast episode", d: "Recorded and professionally produced at SoundPlex Studios, about you and your business." },
                  { t: "The SoundPlex network", d: "SoundPlex shares your episode with its own audience, and hands you the content to use everywhere." },
                  { t: "The Plex Collective", d: "Membership: a room full of local business owners and creators to meet while your new site is fresh." },
                ].map((x) => (
                  <li key={x.t}>
                    <span className={`${POP} block text-[17.5px] font-semibold text-[#d4a030]`}>{x.t}</span>
                    <span className="mt-1 block text-[15.5px] leading-relaxed text-white/70">{x.d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Recent builds for SoundPlex members */}
        <section id="builds" className={band}>
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <p className={eyebrow}>From other SoundPlex members</p>
              <h2 className={h2}>Recent builds for people you may know.</h2>
            </div>
            <BuildCards />
          </div>
        </section>

        {/* This site is one of them */}
        <section id="preview" className={`${band} bg-[#0b0b0b]`}>
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <p className={eyebrow}>You&apos;re looking at one</p>
            <h2 className={h2}>This site is one of ours.</h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-[16.5px] leading-relaxed text-white/70">
              Scroll the home page and you&apos;ll walk through the front door. That&apos;s the fly-through, and you can have something like it on your home page too.
            </p>
            <Link
              href="/"
              aria-label="Walk through the SoundPlex home page"
              className="group mt-9 block overflow-hidden rounded-[10px] border border-[#d4a030]/45 bg-black text-left transition-colors hover:border-[#d4a030]"
            >
              <span className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                <span aria-hidden="true" className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                </span>
                <span className={`${POP} ml-2 truncate text-[10.5px] uppercase tracking-[0.16em] text-white/55`}>soundplexstudios.com</span>
              </span>
              <video
                src="/websites/soundplex-preview.mp4"
                poster="/websites/soundplex-preview.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="block aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- the still for reduced motion */}
              <img
                src="/websites/soundplex-preview.jpg"
                alt="The walk up to the SoundPlex Studios front door, from the fly-through on the home page"
                className="hidden aspect-video w-full object-cover motion-reduce:block"
              />
            </Link>
            <Link
              href="/"
              className="group mt-7 inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-[#d4a030]/60 px-6 py-3.5 text-[16px] font-semibold text-[#d4a030] transition-colors hover:bg-[#d4a030] hover:text-black"
            >
              Walk through the front door
              <ForwardArrow />
            </Link>
          </div>
        </section>

        {/* Book */}
        <section id="book" className="scroll-mt-24">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <div className="text-center">
              <p className={eyebrow}>Book a call</p>
              <h2 className={h2}>Pick a time with George.</h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-[16.5px] leading-relaxed text-white/70">
                The call costs nothing. Tell George about your business and what you want your site to do.
              </p>
            </div>
            <div className="mt-8" data-needs="Website call calendar" data-needs-detail="Which calendar website calls should book on (it uses George's Black Friday calendar for now).">
              <WebsitesCalendar calendarId={CALENDAR_ID} tone="dark" title="Book a call with George" />
            </div>
            <p className="mt-6 text-center text-[14.5px] text-white/55">
              Rather tell us in writing?{" "}
              <Link href="/start?path=website" className="text-[#d4a030] underline-offset-4 hover:underline">
                Start with a few questions
              </Link>
              {" · "}
              <a href="https://realiiz.com/websites" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-white/70 hover:text-white">
                About Realiiz, our web partner
                <OutboundArrow />
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <JsonLd data={serviceJsonLd({ name: "Website design and build", description: "Websites for South Jersey businesses, built preview-first: designed for you, the words written for you, and you pay when you love it.", path: "/websites", areaServed: "South Jersey" })} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Websites", path: "/websites" }])} />
    </>
  );
}
