import Link from "next/link";
import Image from "next/image";
import ForwardArrow from "./ForwardArrow";
import OutboundArrow from "./OutboundArrow";
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

const MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(`${SITE_NAME} ${LOCATION}`)}`;

export default function Footer() {
  return (
    <footer className="foot">
      <div className="mx-auto max-w-6xl px-6">
        {/* The closing line + the door. */}
        <div className="foot__hero">
          <p className="foot__eyebrow">Pennsauken, NJ</p>
          <p className="foot__line">
            You have a home. You have work. <em>This is your third place.</em>
          </p>
          <Link href="/book" className="foot__cta group inline-flex items-center whitespace-nowrap">
            Schedule a tour
            <ForwardArrow />
          </Link>
        </div>

        <div className="foot__grid">
          <div className="foot__col">
            <p className="foot__label">Visit</p>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="foot__link foot__link--out group inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="foot__link--multi">
                {LOCATION.split(", ").map((part, i) => (
                  <span key={i}>{part}</span>
                ))}
              </span>
              <OutboundArrow />
            </a>
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
            {NAV_LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="foot__link">
                {l.label}
              </Link>
            ))}
          </nav>
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
    </footer>
  );
}
