import Link from "next/link";
import { SITE_NAME, NAV_LINKS } from "../../lib/site-config";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";

/**
 * The site header. Links come from NAV_LINKS in lib/site-config.ts — ONE list
 * that the desktop nav and the mobile menu both read, so they can never drift.
 * Below `sm:` the inline links give way to the hamburger (MobileMenu), which
 * carries the same list plus the legal links.
 */
export default function Nav() {
  return (
    <header className="border-b border-line">
      <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
          {SITE_NAME}
        </Link>
        <div className="hidden items-center gap-6 font-mono-label text-sm text-slate sm:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
          {/* Dark-mode toggle (opt-in kit) — delete this line for a
              light-only site; the CSS and bootstrap cost nothing unused. */}
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
