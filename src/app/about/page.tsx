import Link from "next/link";
import Image from "next/image";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import CountUp from "../components/CountUp";
import ForwardArrow from "../components/ForwardArrow";
import OutboundArrow from "../components/OutboundArrow";
import JsonLd from "../components/JsonLd";
import FilmCard from "../components/widgets/FilmCard";
import OpenNow from "../components/OpenNow";
import ParkingPopover from "./ParkingPopover";

/** George's reel, in his GHL media library. */
const REEL_SRC = "https://assets.cdn.filesafe.space/dPsv4bKyPW2sZ8hNlNFN/media/6ae26a1136aa4a07e8376736.mp4";
import { buildPageMetadata, breadcrumbJsonLd } from "../../lib/seo";
import { SITE_NAME, PHONE_DISPLAY, PHONE_TEL, LOCATION } from "../../lib/site-config";

/**
 * /about — upgraded 2026-10-28 (Ed: "I like the about on his existing site, let's use most of
 * that"). The words are the live page's (soundplexstudios.com/about), lightly tidied; the photos
 * are George's own from that page (public/about/); the reel is George's, from his GHL media
 * library. Order follows the live page: welcome → reel → history + numbers → mission → the art
 * → George → the SoundLounge + a client's words → member perks → getting here (the live site's
 * parking popup, as a section).
 * Numbers + rating: the live site's, confirmed by Ed 2026-10-28.
 */
export const metadata = buildPageMetadata({
  title: `About — the building, the art, and George — ${SITE_NAME}`,
  description: "SoundPlex Studios in Pennsauken, NJ: a building with a musical heritage — Victor Talking Machine, RCA, Dick Clark — now a creative studio, venue and community run by George Koch.",
  path: "/about",
  focusKeyword: "SoundPlex Studios Pennsauken history",
  ogType: "profile",
});

const MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(`${SITE_NAME} ${LOCATION}`)}`;

const STATS = [
  { to: 1929, suffix: "", label: "RCA Victor moves in", plain: true },
  { to: 213, suffix: "+", label: "Artists and creators" },
  { to: 10, suffix: "k+", label: "Creative hours logged" },
  { to: 2, suffix: "", label: "Years and counting" },
];

const PERKS = [
  { title: "Pro-grade production", body: "Access top-tier engineers, videographers and studio resources to elevate your content." },
  { title: "Marketing and growth tools", body: "Lean on expert branding, social media and promotional support to expand your reach." },
];

/** 6713 Rudderow Ave, Pennsauken (US Census geocoder, 2026-10-28). Centers the map. */
const MAP_AT = { lat: 39.952732, lng: -75.039891 };

const PARKING = [
  { title: "On site", body: "Behind and alongside the building." },
  { title: "On the street", body: "Easy to find in the surrounding blocks." },
  { title: "Nearby lots", body: "Pinsetter Bar & Bowl, a two-minute walk east, and the Merchantville Walkway lot, a well-lit five-minute walk that leads straight to our back entrance." },
];

const EYEBROW = "page-head__eyebrow";

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        {/* ── Welcome ── */}
        {/* Copy left, George's reel top right (Ed, 2026-10-28) in the branded player: plays in
            place, then pops out into a window you can drag, resize, minimize and tuck into the side. */}
        <section className="page-head">
          <div className="mx-auto grid max-w-6xl items-start gap-x-[clamp(32px,5vw,72px)] gap-y-10 px-6 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <Reveal eager><p className={EYEBROW}>About SoundPlex Studios</p></Reveal>
              <Reveal eager delay={80}><h1 className="page-head__title">Welcome to your <em>creative playground.</em></h1></Reveal>
              <Reveal eager delay={160}>
                <p className="page-head__lede">SoundPlex Studios is more than a space. It’s a community where artists, musicians and creators thrive. From recording and live performances to networking and collaboration, we provide the tools, spaces and support to bring your vision to life.</p>
              </Reveal>
              <Reveal eager delay={220}>
                <p className="mt-5 flex items-center gap-2.5 text-[14px] text-white/70">
                  <span className="tracking-[0.12em] text-[#d4a030]" aria-hidden>★★★★★</span>
                  Rated 4.9 out of 5
                </p>
              </Reveal>
            </div>
            {/* NOT inside <Reveal>: its transform would become the containing block for the
                docked (position: fixed) window and trap it inside this column. */}
            <div className="w-full lg:-mt-2 lg:w-[26rem] xl:w-[30rem]">
              <div>
                <FilmCard
                  poster="/about/on-stage.webp"
                  alt="A guitarist laughing mid-song on the SoundPlex stage under red light"
                  label="The SoundPlex reel"
                  caption="The rooms, the shows and the people of SoundPlex Studios"
                  src={REEL_SRC}
                  cta="Watch the reel"
                  endAction={{ href: "/start?path=collective&from=about-reel", label: "Book a tour", note: "Come see it for yourself." }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── History + the numbers ── */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="ab__grid">
            <Reveal>
              <div className="grid grid-cols-[1.4fr_1fr] gap-3">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] border border-white/10">
                  <Image src="/about/woodroom-color.webp" alt="The WoodRoom at SoundPlex in colored light: paintings on the old brick wall, booths and small tables on the wide-plank floor" fill sizes="(max-width: 860px) 60vw, 30vw" className="object-cover" />
                </div>
                <div className="grid gap-3">
                  <div className="relative overflow-hidden rounded-[3px] border border-white/10">
                    <Image src="/about/studio-a.webp" alt="Studio A at SoundPlex: drums, a grand piano and an organ under chandeliers" fill sizes="(max-width: 860px) 40vw, 20vw" className="object-cover" />
                  </div>
                  <div className="relative overflow-hidden rounded-[3px] border border-white/10">
                    <Image src="/about/poster-wall.webp" alt="A wall of vintage concert posters at SoundPlex" fill sizes="(max-width: 860px) 40vw, 20vw" className="object-cover" />
                  </div>
                </div>
              </div>
            </Reveal>
            <div>
              <Reveal><p className={EYEBROW}>SoundPlex history</p></Reveal>
              <Reveal delay={60}><h2 className="up__h mt-2">A building with a <em className="font-[family-name:var(--font-lora)] font-normal italic text-[#d4a030]">record.</em></h2></Reveal>
              <Reveal delay={120}>
                <div className="ab__prose">
                  <p>SoundPlex Studios is inspired by a building rich with musical heritage. Originally a bottlecap factory, it became a hub for the Victor Talking Machine Company in the early 20th century, evolving into RCA Victor in 1929. That landmark witnessed legendary recordings by artists such as Enrico Caruso, Arturo Toscanini and Sergei Rachmaninoff, and even hosted broadcasting icon Dick Clark in the 1950s.</p>
                  <p>Today, SoundPlex Studios honors and extends this vibrant legacy, creating a welcoming space for music, art and meaningful human connection.</p>
                </div>
              </Reveal>
            </div>
          </div>

          <Reveal delay={80}>
            {/* Centered figures; between them, a faint divider half the row's height (Ed). Two per
                row on a phone (a divider between each pair), four in a row from md. */}
            <dl className="mt-14 grid grid-cols-2 gap-y-2 rounded-[6px] border border-white/10 bg-[#070707] md:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="relative px-5 py-7 text-center before:absolute before:left-0 before:top-1/4 before:hidden before:h-1/2 before:w-px before:bg-white/10 max-md:[&:nth-child(even)]:before:block md:[&:not(:first-child)]:before:block"
                >
                  <dt className="text-[12.5px] text-white/55">{s.label}</dt>
                  <dd className="mt-1 font-[family-name:var(--font-poppins)] text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tabular-nums leading-none text-white">
                    {s.plain ? s.to : <CountUp to={s.to} />}
                    <span className="text-[#d4a030]">{s.suffix}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* ── Mission ── */}
        <section className="ab__band">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal><p className={EYEBROW}>Mission and vision</p></Reveal>
            <Reveal delay={80}>
              <p className="ab__big">SoundPlex Studios exists to empower artists, musicians and creators with world-class spaces, cutting-edge resources and a vibrant community. <em>Our vision: the creative hub where talent flourishes, ideas come to life and connections spark new opportunities.</em></p>
            </Reveal>
          </div>
        </section>

        {/* ── The art ── */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="ab__grid">
            <div>
              <Reveal><p className={EYEBROW}>The art</p></Reveal>
              <Reveal delay={80}>
                <h2 className="up__h mt-2">Every wall tells a story. <em className="font-[family-name:var(--font-lora)] font-normal italic text-[#d4a030]">Every piece is for sale.</em></h2>
                <p className="ab__prose">Locally inspired, endlessly creative, and always inspiring. From bold visuals to hidden gems, there’s something to discover at every turn. Love what you see? Take it home. Ask George, or ask whoever’s at the bar.</p>
              </Reveal>
            </div>
            <Reveal delay={120}>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-[3px] border border-white/10">
                  <Image src="/about/poster-wall-2.webp" alt="Framed vintage music posters on a dark wall at SoundPlex: the Rolling Stones, the Supremes, Elvis, the Beatles, Springsteen" fill sizes="(max-width: 860px) 100vw, 50vw" className="object-cover" />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] border border-white/10">
                  <Image src="/about/woodroom-color.webp" alt="" fill sizes="25vw" className="object-cover object-left" />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] border border-white/10">
                  <Image src="/about/sound-lounge.webp" alt="" fill sizes="25vw" className="object-cover object-right" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── George ── */}
        <section className="border-y border-white/[0.08] bg-[#080808] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="ab__grid">
              <Reveal>
                <div className="relative aspect-[3/2] overflow-hidden rounded-[3px] border border-white/10">
                  <Image src="/about/george-koch.webp" alt="George Koch, owner of SoundPlex Studios, leaning on the grand piano in Studio A" fill sizes="(max-width: 860px) 100vw, 50vw" className="object-cover" />
                </div>
              </Reveal>
              <div>
                <Reveal><p className={EYEBROW}>George Koch · Owner</p></Reveal>
                <Reveal delay={60}><h2 className="up__h mt-2">The man who <em className="font-[family-name:var(--font-lora)] font-normal italic text-[#d4a030]">brings people together.</em></h2></Reveal>
                <Reveal delay={120}>
                  <div className="ab__prose">
                    <p>George Koch is a visionary business leader with a remarkable ability to turn ambitious ideas into reality. His true talent lies in bringing people and vision together, creating spaces where creativity thrives.</p>
                    <p>At SoundPlex Studios, that vision comes to life: a hub where innovation, collaboration and artistic energy flourish. Step inside and you’ll feel it, a creative community you won’t be able to resist coming back to, and bringing your friends.</p>
                  </div>
                </Reveal>
                <Reveal delay={180}>
                  <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
                    <Link href="/start?path=collective&from=about" className="evp__btn group">Book a tour with George<ForwardArrow /></Link>
                    <Link href="/contact-us" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">Talk to us<ForwardArrow /></Link>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── The SoundLounge + a client's words ── */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="ab__grid ab__grid--flip">
            <div>
              <Reveal>
                <blockquote>
                  <p className="font-[family-name:var(--font-lora)] text-[clamp(1.5rem,3.2vw,2.3rem)] italic leading-snug text-white">
                    <span className="text-[#d4a030]">“</span>I’ve never felt more relaxed going into a studio production than I have on all of our projects together.<span className="text-[#d4a030]">”</span>
                  </p>
                  <footer className="mt-4 text-[13px] uppercase tracking-[0.16em] text-white/50">A SoundPlex client</footer>
                </blockquote>
              </Reveal>
              <Reveal delay={100}>
                <p className="mt-10 text-[15px] leading-relaxed text-white/65">
                  <span className="text-white">The SoundLounge.</span> A stylish, intimate space made for connection, creativity and unforgettable gatherings, comfortably hosting up to 50 guests.
                </p>
                <Link href="/rooms/sound-lounge" className="card-cta group mt-4 inline-flex items-center gap-2 whitespace-nowrap">See the SoundLounge<ForwardArrow /></Link>
              </Reveal>
            </div>
            <Reveal>
              <div className="relative aspect-[3/2] overflow-hidden rounded-[3px] border border-white/10">
                <Image src="/about/sound-lounge.webp" alt="The SoundLounge at SoundPlex: mustard-yellow armchairs, grey sofas and red velvet curtains" fill sizes="(max-width: 860px) 100vw, 50vw" className="object-cover" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Member perks, over a night on stage ── */}
        <section className="relative overflow-hidden border-y border-white/[0.08] bg-[#050505]">
          {/* The photo owns the LEFT 60%, framed on the guitarist's face, at full strength, and
              melts into black where the copy starts (Ed: it was cropped to a mic stand and dimmed
              to mud under one gradient). On a phone it sits behind the copy, dimmed so the words read. */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[62%]">
            <Image src="/about/on-stage.webp" alt="" fill sizes="(min-width: 768px) 62vw, 100vw" className="object-cover object-[55%_22%] max-md:opacity-35" />
            <div className="absolute inset-0 md:bg-[linear-gradient(to_right,transparent_45%,rgba(5,5,5,0.7)_75%,#050505_100%)]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <div className="ml-auto max-w-xl">
              <Reveal><p className={EYEBROW}>Membership perks</p></Reveal>
              <Reveal delay={60}><h2 className="up__h mt-2">Your space to create, collaborate <em className="font-[family-name:var(--font-lora)] font-normal italic text-[#d4a030]">and shine.</em></h2></Reveal>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {PERKS.map((p, i) => (
                  <Reveal key={p.title} delay={120 + i * 60}>
                    <div className="border-t border-[#d4a030]/50 pt-4">
                      <h3 className="font-[family-name:var(--font-poppins)] text-[16px] font-medium text-white">{p.title}</h3>
                      <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/65">{p.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={240}>
                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <Link href="/start?path=collective&from=about-perks" className="evp__btn group">Book your free tour<ForwardArrow /></Link>
                  <Link href="/membership" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">How membership works<ForwardArrow /></Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Getting here (the live site's parking popup, as a section) ── */}
        <section id="getting-here" className="mx-auto max-w-6xl scroll-mt-32 px-6 py-20">
          <Reveal><p className={EYEBROW}>Getting here</p></Reveal>
          <Reveal delay={60}><h2 className="up__h mt-2">Easy to find. <em className="font-[family-name:var(--font-lora)] font-normal italic text-[#d4a030]">Easy to park.</em></h2></Reveal>
          {/* Simplified (Ed: "too busy — keep the premium"): the map, and beside it three plain
              lines on hairlines, the live open/closed pill, two actions. No boxes, no icons. */}
          <div className="mt-10 grid items-stretch gap-x-12 gap-y-8 md:grid-cols-[1.3fr_1fr]">
            <Reveal delay={100}>
              <div className="relative h-full min-h-[300px] overflow-hidden rounded-[8px] border border-white/10 bg-[#0b0b0b]">
                {/* Google's no-key embed, recolored to the night palette with a CSS filter. Centered
                    on the building's COORDINATES rather than searched by name: a search draws
                    Google's place card and pin (the "blue thing", Ed); coordinates draw the map
                    alone, and our own gold pin sits dead center over the building. */}
                <iframe
                  title={`Map: ${SITE_NAME}, ${LOCATION}`}
                  src={`https://maps.google.com/maps?ll=${MAP_AT.lat},${MAP_AT.lng}&z=16&t=m&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  // 64px taller and 64px up: the frame crops off Google's "Open in Maps" box in the
                  // top-left (Ed). The bottom, with Google's required attribution, stays in view.
                  className="absolute inset-x-0 -top-16 h-[calc(100%+4rem)] w-full border-0 [filter:invert(92%)_hue-rotate(180deg)_grayscale(40%)_contrast(0.9)]"
                />
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_70px_rgba(0,0,0,0.65)]" />
                {/* The pin (Ed picked option C): a gold dot ringed in black and gold, a halo
                    breathing out of it, and the name on a dark tag above, the way map apps label a
                    place. The DOT sits on the map's center, which is the building. */}
                {/* The map's center is now 32px above the frame's (the iframe sits 64px up), so the
                    pin follows it. */}
                <span aria-hidden className="pointer-events-none absolute left-1/2 top-[calc(50%-2rem)]">
                  {/* Wrapper centers; the inner halo animates (the pulse's own transform would
                      otherwise wipe out the centering translate). */}
                  <span className="absolute left-0 top-0 h-8 w-8 -translate-x-1/2 -translate-y-1/2">
                    <span className="block h-full w-full rounded-full bg-[#d4a030]/40 motion-safe:animate-[sp-pulse_2.2s_ease-out_infinite]" />
                  </span>
                  <span className="absolute left-0 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#0b0b0b] bg-[#d4a030] shadow-[0_0_0_1.5px_#d4a030,0_6px_16px_rgba(0,0,0,0.6)]" />
                  <span className="absolute left-0 top-[-52px] -translate-x-1/2 whitespace-nowrap rounded-[6px] border border-white/[0.12] bg-[#0b0b0b]/90 px-3 py-1.5 font-[family-name:var(--font-poppins)] text-[12.5px] font-medium text-white shadow-[0_8px_22px_rgba(0,0,0,0.55)] backdrop-blur">
                    SoundPlex Studios
                  </span>
                </span>
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="flex h-full flex-col">
                <dl className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                  <div className="py-5">
                    <dt className="text-[11.5px] uppercase tracking-[0.18em] text-white/45">Address</dt>
                    <dd className="mt-1.5 font-[family-name:var(--font-poppins)] text-[17px] text-white">{LOCATION}</dd>
                  </div>
                  <div className="py-5">
                    <dt className="text-[11.5px] uppercase tracking-[0.18em] text-white/45">Hours</dt>
                    <dd className="mt-1.5 font-[family-name:var(--font-poppins)] text-[17px] text-white">Monday to Saturday, 8 AM to 10 PM</dd>
                    <dd className="mt-2.5"><OpenNow /></dd>
                  </div>
                  {PHONE_DISPLAY && (
                    <div className="py-5">
                      <dt className="text-[11.5px] uppercase tracking-[0.18em] text-white/45">Phone</dt>
                      <dd className="mt-1.5 font-[family-name:var(--font-poppins)] text-[17px]">
                        <a href={`tel:${PHONE_TEL}`} className="text-white transition-colors hover:text-[#e2b34e]">{PHONE_DISPLAY}</a>
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-8">
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="evp__btn group">
                    Get directions
                    <OutboundArrow />
                  </a>
                  {/* The parking notes live in a popover here (Ed), not a section of their own.
                      The phone number above is already a tap-to-call link. */}
                  <ParkingPopover notes={PARKING} />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
    </>
  );
}
