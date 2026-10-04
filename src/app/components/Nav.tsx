import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, NAV_LINKS, NAV_CTA } from "../../lib/site-config";
import MobileMenu from "./MobileMenu";

/**
 * The site header. Links come from NAV_LINKS in lib/site-config.ts — ONE list
 * that the desktop nav and the mobile menu both read, so they can never drift.
 * Below `sm:` the inline links give way to the hamburger (MobileMenu), which
 * carries the same list plus the legal links.
 *
 * `overlay` floats the header over a full-bleed hero (the homepage fly-through)
 * instead of sitting in the document flow: fixed, no bottom rule, and a scrim so
 * the links stay legible over whatever frame of the film is behind them.
 */
export default function Nav({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={
        overlay
          ? "fixed inset-x-0 top-0 z-[60] bg-gradient-to-b from-black/85 via-black/45 to-transparent"
          : "border-b border-line"
      }
    >
      <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* The real brand lockup (client asset, transparent, reads on dark).
            SITE_NAME stays as the accessible name. Source: 490×69. */}
        <Link href="/" className="flex items-center" aria-label={SITE_NAME}>
          <Image
            src="/logos/soundplex-lockup.png"
            alt={SITE_NAME}
            width={196}
            height={28}
            priority
            className="h-6 w-auto sm:h-7"
          />
        </Link>
        {/* Uppercase, letterspaced, Poppins 500 — the site's small-caps voice — with one
            outlined gold button at the end. Links stay ink on dark; the button is the
            only colour in the header. */}
        <div className="nav-links hidden items-center gap-7 sm:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
          <Link href={NAV_CTA.href} className="nav-cta">
            {NAV_CTA.label}
          </Link>
        </div>
        <MobileMenu />
      </nav>
    </header>
  );
}
