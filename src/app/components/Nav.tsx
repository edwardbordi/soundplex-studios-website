import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, NAV_LINKS, NAV_CTA, SHOW_SAMPLE_EVENTS, LOCATION, PHONE_DISPLAY, SOCIAL_LINKS } from "../../lib/site-config";
import OpenNow from "./OpenNow";


function SocialIcon({ name }: { name: string }) {
  const p = { viewBox: "0 0 24 24", className: "h-3 w-3", "aria-hidden": true } as const;
  if (/insta/i.test(name))
    return (
      <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  if (/face/i.test(name))
    return (
      <svg {...p} fill="currentColor">
        <path d="M14 8.5V7c0-.8.5-1 1-1h2V3h-2.8C11.5 3 11 5 11 6.6v1.9H9V11.5h2V21h3v-9.5h2.4l.4-3H14z" />
      </svg>
    );
  return <span className="text-[11px]">{name}</span>;
}
import { getCalendarItems } from "../../lib/events/public";
import AccountMenu from "./widgets/AccountMenu";
import MobileMenu from "./MobileMenu";
import NavScroll from "./NavScroll";
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
      {/* The top bar (Ed, 2026-10-28): where, whether we're open right now, the phone and the
          socials, so the main row can stay tight. Folds away once you scroll (CSS:
          .site-topbar). md and up; phones get the same things in the menu. */}
      <div className="site-topbar hidden md:block">
        {/* Quiet on purpose (Ed: "a little too loud"): smaller, dimmer type, fainter dividers. */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 text-[11.5px] tracking-[0.01em] text-white/40">
          <div className="flex min-w-0 items-center gap-5">
            {/* To About → Getting here (the map, hours, parking), not straight to Google (Ed). */}
            <Link href="/about#getting-here" className="truncate transition-colors hover:text-[#e2b34e]">
              {LOCATION}
            </Link>
            <span aria-hidden className="h-2.5 w-px bg-white/10" />
            <OpenNow variant="inline" />
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <a href={NAV_CTA.href} className="transition-colors hover:text-[#e2b34e]">
              Call {PHONE_DISPLAY}
            </a>
            <span aria-hidden className="h-2.5 w-px bg-white/10" />
            {SOCIAL_LINKS.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`SoundPlex on ${s.label}`} className="transition-colors hover:text-[#e2b34e]">
                <SocialIcon name={s.label} />
              </a>
            ))}
          </div>
        </div>
      </div>
      {/* Three zones so nothing collides: the logo, the links (centered in what's left), and a
          right-hand group (call + account). Inline links from lg (1024px) up; below that, the
          hamburger — the links never get squeezed into the logo (Ed, 2026-10-28). */}
      <nav aria-label="Primary" className="site-nav mx-auto flex max-w-7xl items-center gap-6 px-6">
        {/* The real brand lockup (client asset, transparent, reads on dark).
            SITE_NAME stays as the accessible name. Source: 490×69. */}
        <Link href="/" className="flex shrink-0 items-center" aria-label={SITE_NAME}>
          <Image
            src="/logos/soundplex-lockup.png"
            alt={SITE_NAME}
            width={196}
            height={28}
            priority
            className="site-logo h-6 w-auto xl:h-7"
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
          {/* The phone lives in the top bar now (Ed), so this row is just the door and the account.
              The one front door (Ed, 2026-10-28): every question, call request, booking or tour
              starts at /start, which asks what brings you and routes it. No separate contact form. */}
          <Link href="/start?from=nav" className="nav-cta nav-cta--solid">
            Get in touch
          </Link>
          {/* Members: Log in, or the avatar menu once in (ported from the What's On demo). */}
          <AccountMenu />
        </div>
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <AccountMenu />
          <MobileMenu items={items} showSamples={SHOW_SAMPLE_EVENTS} />
        </div>
      </nav>
    </header>
    </>
  );
}
