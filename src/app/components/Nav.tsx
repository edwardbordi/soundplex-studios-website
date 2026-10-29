import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, NAV_LINKS, NAV_CTA, SHOW_SAMPLE_EVENTS, PHONE_DISPLAY } from "../../lib/site-config";
import { getCalendarItems } from "../../lib/events/public";
import AccountMenu from "./widgets/AccountMenu";
import MobileMenu from "./MobileMenu";
import NavScroll from "./NavScroll";
import BookMenu from "./BookMenu";
import { MembershipMega, ProductionsMega, RoomsMega } from "./NavMega";

/**
 * The site header. Links come from NAV_LINKS in lib/site-config.ts — ONE list
 * that the desktop nav and the mobile menu both read, so they can never drift.
 * Below `sm:` the inline links give way to the hamburger (MobileMenu), which
 * carries the same list plus the legal links.
 *
 * `overlay` floats the header over a full-bleed hero (the home photo) instead of
 * sitting in the document flow: fixed, no bottom rule, a scrim so the links stay
 * legible. Every other page: sticky. On both, scrolling past the top condenses it —
 * tighter padding, a smaller logo, a solid dark bar with a soft blur (Ed, 2026-10-28).
 */
export default function Nav({ overlay = false }: { overlay?: boolean }) {
  // The mega menus' live bits (what's in each room, the next show): the same calendar the
  // site's live widget reads. Public + members titles only; private bookings arrive stripped.
  const items = getCalendarItems();
  return (
    <>
    {/* The header FLOATS (fixed) on every page, and on inner pages a spacer holds its full
        height in the flow. It used to be sticky, in the flow: when it condensed on scroll it got
        ~55px shorter, the page jumped up under it, the scroll position crossed back over the
        threshold and it re-expanded, over and over (Ed: "flickering uncontrollably"). Fixed +
        spacer means condensing never moves the page. NavScroll keeps --hdr-h = its full height. */}
    {!overlay && <div aria-hidden className="h-[var(--hdr-h,73px)] md:h-[var(--hdr-h,110px)]" />}
    <header
      data-site-header
      className={`site-header ${
        overlay
          ? "site-header--overlay fixed inset-x-0 top-0 z-[60] bg-gradient-to-b from-black/85 via-black/45 to-transparent"
          : "fixed inset-x-0 top-0 z-[60] border-b border-line bg-[#050505]"
      }`}
    >
      {/* Sticky on every page; once you scroll, it condenses (NavScroll sets data-scrolled). */}
      <NavScroll />
      {/* No top bar (Ed, 2026-10-29): it was mainly there for the phone, which now sits in this
          row. Hours live in the Rooms menu, on About and in the footer; the address on About
          and in the footer; socials in the footer. */}
      {/* Three zones so nothing collides: the logo, the links (centered in what's left), and a
          right-hand group (call + account). Inline links from lg (1024px) up; below that, the
          hamburger — the links never get squeezed into the logo (Ed, 2026-10-28). */}
      <nav aria-label="Primary" className="site-nav mx-auto flex max-w-7xl items-center gap-6 px-6">
        {/* The real brand lockup (client asset, transparent, reads on dark). Nudged up 2px (Ed,
            2026-10-29): the mark's tall bars sit above the wordmark, so centering the image box
            left "SOUNDPLEX" a touch below the menu text.
            SITE_NAME stays as the accessible name. Source: 490×69. */}
        <Link href="/" className="flex shrink-0 items-center" aria-label={SITE_NAME}>
          <Image
            src="/logos/soundplex-lockup.png"
            alt={SITE_NAME}
            width={196}
            height={28}
            priority
            className="site-logo h-6 w-auto -translate-y-[2px] xl:h-7"
          />
        </Link>
        <div className="nav-links hidden min-w-0 flex-1 items-center justify-center lg:flex">
          {/* Rooms and Studio Productions open mega menus (NavMega); the rest are plain links. */}
          {NAV_LINKS.map((l) =>
            l.href === "/rooms" ? (
              <RoomsMega key={l.label} items={items} showSamples={SHOW_SAMPLE_EVENTS} />
            ) : l.href === "/studio-productions" ? (
              <ProductionsMega key={l.label} items={items} showSamples={SHOW_SAMPLE_EVENTS} />
            ) : l.href === "/membership" ? (
              <MembershipMega key={l.label} />
            ) : (
              <Link key={l.label} href={l.href} className="nav-link">
                {l.label}
              </Link>
            ),
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {/* The phone, quiet, just left of the door (Ed, 2026-10-29). Stays when the header condenses. */}
          {/* Style E in D's frame (Ed): a small gold "CALL" label, then the number, in a thin
              square-cornered border like Get in touch. */}
          <a href={NAV_CTA.href} className="group flex items-center gap-2 whitespace-nowrap rounded-[3px] border border-white/25 px-3.5 py-[0.55rem] transition-colors hover:border-[#d4a030]/70" aria-label={`Call SoundPlex at ${PHONE_DISPLAY}`}>
            <span className="font-[family-name:var(--font-poppins)] text-[10.5px] font-medium uppercase leading-none tracking-[0.2em] text-[#d4a030]">Call</span>
            <span className="text-[13.5px] leading-none tracking-[0.02em] text-white/85 transition-colors group-hover:text-[#e2b34e]">{PHONE_DISPLAY}</span>
          </a>
          {/* The one front door (Ed, 2026-10-28): every question, call request, booking or tour
              starts at /start, which asks what brings you and routes it. No separate contact form. */}
          {/* "Book" (Ed, 2026-10-29), replacing "Get in touch": a menu of the real reasons —
              rent a room, a tour, tickets, a production — each into the right path of /start. */}
          <BookMenu />
          {/* Members: Log in, or the avatar menu once in (ported from the What's On demo). */}
          <AccountMenu />
        </div>
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          {/* One tap calls George (Ed, 2026-10-29). */}
          <a href={NAV_CTA.href} aria-label={`Call SoundPlex at ${PHONE_DISPLAY}`} className="flex h-9 items-center rounded-[3px] border border-white/25 px-2.5 font-[family-name:var(--font-poppins)] text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4a030]/70 hover:text-[#e2b34e]">
            Call
          </a>
          <AccountMenu />
          <MobileMenu items={items} showSamples={SHOW_SAMPLE_EVENTS} />
        </div>
      </nav>
    </header>
    </>
  );
}
