import Link from "next/link";
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

// The footer nav = the main nav (one list, lib/site-config.ts) + legal pages.
const FOOTER_LINKS = [
  ...NAV_LINKS,
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <div className="font-display text-lg font-semibold text-ink">{SITE_NAME}</div>
            {LOCATION && <div className="mt-2 text-sm text-slate">{LOCATION}</div>}
            <div className="mt-2 flex flex-col gap-1 text-sm text-slate">
              {CONTACT_EMAIL && (
                <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-ink">
                  {CONTACT_EMAIL}
                </a>
              )}
              {PHONE_DISPLAY && (
                <a href={`tel:${PHONE_TEL}`} className="transition-colors hover:text-ink">
                  {PHONE_DISPLAY}
                </a>
              )}
            </div>
          </div>
          <nav className="flex flex-col gap-2 font-mono-label text-sm text-slate">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-ink">
                {l.label}
              </Link>
            ))}
            {SOCIAL_LINKS.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink">
                {s.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-10 border-t border-line pt-6 text-xs text-slate">
          © {new Date().getFullYear()} {SITE_NAME} — a {LEGAL_ENTITY} brand. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
