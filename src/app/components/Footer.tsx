import Link from "next/link";
import Image from "next/image";
import ForwardArrow from "./ForwardArrow";
import OutboundArrow from "./OutboundArrow";
import NewsletterForm from "./widgets/NewsletterForm";
import OpenNow from "./OpenNow";
import {
  SITE_NAME,
  LEGAL_ENTITY,
  CONTACT_EMAIL,
  PHONE_DISPLAY,
  PHONE_TEL,
  LOCATION,
  SOCIAL_LINKS,
  NAV_LINKS,
} from "../../lib/site-config";

/**
 * The footer is the last frame of the film: black, one hairline of gold, the site's
 * two voices (Poppins small caps for labels, Lora italic for the one line that matters)
 * and nothing decorative. It ends on the same invitation the hero makes — a tour — so
 * a visitor who scrolled the whole way has the door in front of them again.
 *
 * Nav = NAV_LINKS (one list, lib/site-config.ts); legal pages sit in the bottom bar.
 * Styles: .foot* in globals.css.
 */


/** `hero={false}` drops the closing line + Book a tour (the member pages already say it; Ed, 2026-10-28). */
export default function Footer({ hero = true }: { hero?: boolean }) {
  return (
    <footer className="foot">
      <div className="mx-auto max-w-6xl px-6">
        {/* The closing line + the door. */}
        {hero && (
        <div className="foot__hero">
          <p className="foot__eyebrow">Pennsauken, NJ</p>
          {/* One sentence per line, so it never breaks mid-thought ("…You / have work.", Ed). On a
              phone the first two share a line when they fit. */}
          <p className="foot__line">
            <span className="whitespace-nowrap sm:block">You have a home. </span>
            <span className="whitespace-nowrap sm:block">You have work.</span> <em className="block">This is your third place.</em>
          </p>
          <Link href="/start?path=collective&from=footer" className="foot__cta group inline-flex items-center whitespace-nowrap">
            Book a tour
            <ForwardArrow />
          </Link>
        </div>
        )}

        <div className="foot__grid">
          <div className="foot__col">
            <p className="foot__label">Visit</p>
            {/* To About → Getting here (map, hours, parking); directions open from there (Ed). */}
            <Link href="/about#getting-here" className="foot__link foot__link--out group inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="foot__link--multi">
                {LOCATION.split(", ").map((part, i) => (
                  <span key={i}>{part}</span>
                ))}
              </span>
              <ForwardArrow />
            </Link>
            {/* Open now / closed, live (moved from the old top bar, Ed 2026-10-29). */}
            <div className="mt-3 text-[14px] text-white/60">
              <OpenNow variant="inline" />
            </div>
          </div>
          <div className="foot__col">
            <p className="foot__label">Talk to us</p>
            {PHONE_DISPLAY && (
              <a href={`tel:${PHONE_TEL}`} className="foot__link">
                {PHONE_DISPLAY}
              </a>
            )}
            {CONTACT_EMAIL && (
              <a href={`mailto:${CONTACT_EMAIL}`} className="foot__link">
                {CONTACT_EMAIL}
              </a>
            )}
            {SOCIAL_LINKS.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="foot__link foot__link--out group inline-flex items-center gap-1.5 whitespace-nowrap">
                {s.label}
                <OutboundArrow />
              </a>
            ))}
          </div>
          <nav className="foot__col" aria-label="Footer">
            <p className="foot__label">Explore</p>
            {[...NAV_LINKS, { href: "/blog", label: "Spotlight" }, { href: "/gallery", label: "Gallery" },{ href: "/websites", label: "Websites" }, { href: "/contact-us", label: "Contact" }].map((l) => (
              <Link key={l.label} href={l.href} className="foot__link">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="foot__col foot__col--news">
            <p className="foot__label">Stay inspired</p>
            <p className="foot__news-lede">Once a month: what’s on, who’s new in the Collective, and what got made here.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="foot__bar">
          <Link href="/" aria-label={SITE_NAME} className="foot__brand">
            <Image src="/logos/soundplex-lockup.png" alt={SITE_NAME} width={140} height={20} className="h-4 w-auto" />
          </Link>
          <p className="foot__legal">
            © {new Date().getFullYear()} {LEGAL_ENTITY}
            <span className="foot__sep" aria-hidden>·</span>
            <Link href="/privacy">Privacy</Link>
            <span className="foot__sep" aria-hidden>·</span>
            <Link href="/terms">Terms</Link>
          </p>
        </div>
      </div>

      {/* The name as a watermark, edge to edge, sinking off the bottom (Ed, 2026-10-28 — like
          the live site). An SVG so the word always fits the width exactly. Decorative only. */}
      <div aria-hidden className="foot__mark">
        <svg viewBox="0 0 1000 190" preserveAspectRatio="xMidYMin meet">
          <defs>
            <linearGradient id="foot-mark-fade" x1="0" y1="0" x2="0" y2="1">
              {/* 0.16 too faint, 0.32 a touch loud, 0.22 too soft, 0.28 a little loud, 0.25 still a little (Ed): 0.21. */}
              {/* Black, not gold (Ed): the footer is pure black, so the letters are near-black, a
                  shade above it, sinking into it toward the bottom. Reads as black-on-black. */}
              {/* #161616 was too close to vanish (Ed: "just enough contrast to see it"); #222222
                  then read a little loud (Ed, 2026-10-31: "more muted"), #1b1b1b "a bit more", #181818 "more", #151515 "more", #121212 "more", #0f0f0f "more": #0c0c0c (bottom #050505, so it still fades into the #000 footer). */}
              <stop offset="0%" stopColor="#0c0c0c" stopOpacity="1" />
              <stop offset="100%" stopColor="#050505" stopOpacity="1" />
            </linearGradient>
          </defs>
          <text x="500" y="185" textAnchor="middle" textLength="990" lengthAdjust="spacingAndGlyphs" fill="url(#foot-mark-fade)">
            SoundPlex
          </text>
        </svg>
      </div>
    </footer>
  );
}
