"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { NAV_LINKS, NAV_CTA } from "../../lib/site-config";
import { ROOMS, roomOf } from "../../lib/venue/data";
import type { CalItem } from "../../lib/events/constants";
import { nextShow, roomStatus, showLabel, useVenueNow } from "./NavMega";

/**
 * The phone navigation — a disclosure widget, not a div that toggles a class.
 *
 * The accessibility parts are the point (this pattern was hard-won on a
 * previous site build):
 *
 *   • a real <button> with aria-expanded and aria-controls, so a screen reader
 *     announces it as collapsed/expanded rather than as unlabelled clutter
 *   • Escape closes it, because that is what Escape does
 *   • focus moves into the panel on open and back to the button on close —
 *     without this a keyboard user opens the menu and their focus is still
 *     behind it, in a panel they can't see
 *   • Tab is trapped inside the panel while it's open — otherwise Tab walks
 *     out into the scroll-locked, invisible page behind the scrim
 *   • the page behind is inert to scroll while it's open
 *   • it closes on navigation, or the next page renders underneath an open menu
 *
 * Closing on navigation is handled by an onClick on every link in the panel,
 * NOT by an effect watching usePathname() — the handler already knows, and the
 * scrim covers every other route out.
 */
function Section({
  label,
  href,
  expanded,
  onToggle,
  onGo,
  children,
}: {
  label: string;
  href: string;
  expanded: boolean;
  onToggle: () => void;
  onGo: () => void;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-center">
        <Link href={href} onClick={onGo} className="font-display flex-1 rounded-lg px-3 py-2.5 text-lg font-semibold text-ink transition-colors hover:bg-bone-2">
          {label}
        </Link>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          aria-label={`${expanded ? "Hide" : "Show"} ${label}`}
          onClick={onToggle}
          className="grid h-10 w-10 place-items-center rounded-lg text-ink/60 hover:bg-bone-2"
        >
          <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div id={id} className="mb-2 ml-3 flex flex-col gap-1 border-l border-line pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

function SubLink({ href, onGo, img, name, sub }: { href: string; onGo: () => void; img: string; name: string; sub: string }) {
  return (
    <Link href={href} onClick={onGo} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-bone-2">
      <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-[4px]">
        <Image src={img} alt="" fill sizes="56px" className="object-cover" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium text-ink">{name}</span>
        <span className="block truncate text-[12.5px] text-slate">{sub}</span>
      </span>
    </Link>
  );
}

export default function MobileMenu({ items, showSamples }: { items: CalItem[]; showSamples: boolean }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const { now, events } = useVenueNow(items, showSamples);
  const show = nextShow(events, now);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Escape closes. Listener on the document so it works wherever focus is.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // Freeze the page behind. Restore the previous value rather than
    // hard-setting "" — another component may legitimately own it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Land the keyboard user INSIDE the thing they just opened.
    panelRef.current?.querySelector("a")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Two bars that become an X. aria-hidden because the button's own
            aria-label already says what this is. */}
        <span className="relative block h-3.5 w-5" aria-hidden="true">
          <span
            className={`absolute left-0 top-0 h-0.5 w-full bg-current transition-transform ${
              open ? "top-1/2 -translate-y-1/2 rotate-45" : ""
            }`}
          />
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-full bg-current transition-transform ${
              open ? "bottom-1/2 translate-y-1/2 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {/* Rendered only when open. A permanently-mounted panel hidden with CSS
          keeps its links in the tab order and the accessibility tree, so a
          screen-reader user tabs through a menu that isn't on screen. */}
      {open && (
        <>
          {/* Catches the tap outside. A real button rather than a bare div so
              it's reachable and announced rather than an invisible trap. */}
          <button
            type="button"
            className="fixed inset-0 z-40 bg-ink/30"
            aria-label="Close menu (tap outside)"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed inset-x-4 top-4 z-50 rounded-2xl border border-line bg-paper p-6 shadow-xl"
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            {/* An explicit close in the panel's own corner. The hamburger does turn into
                an X, but it sits in the header behind the panel — people look for the
                close where the menu is. Focus returns to the hamburger, as Escape does. */}
            <button
              type="button"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-bone-2"
              aria-label="Close menu"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <nav aria-label="Main" className="flex max-h-[calc(100svh-9rem)] flex-col gap-1 overflow-y-auto pr-10">
              {NAV_LINKS.map((l) =>
                l.href === "/membership" ? (
                  <Section key={l.label} label={l.label} href={l.href} expanded={section === l.href} onToggle={() => setSection(section === l.href ? null : l.href)} onGo={() => setOpen(false)}>
                    {[
                      ["How it works", "/membership"],
                      ["Meet the members", "/membership#wall"],
                      ["Who’s here now", "/studio-productions#members"],
                    ].map(([name, href]) => (
                      <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-[15px] text-ink/80 transition-colors hover:bg-bone-2">
                        {name}
                      </Link>
                    ))}
                    <Link href="/start?path=collective&from=menu" onClick={() => setOpen(false)} className="mt-1 self-start rounded-[4px] bg-[#d4a030] px-3.5 py-2 text-[13px] font-semibold text-black">
                      Book your free tour →
                    </Link>
                  </Section>
                ) : l.href === "/rooms" || l.href === "/studio-productions" ? (
                  // The desktop mega menus, as accordions (Ed, 2026-10-28).
                  <Section key={l.label} label={l.label} href={l.href} expanded={section === l.href} onToggle={() => setSection(section === l.href ? null : l.href)} onGo={() => setOpen(false)}>
                    {l.href === "/rooms" ? (
                      <>
                        {ROOMS.map((r) => {
                          const st = roomStatus(r.id, events, now);
                          return (
                            <SubLink key={r.id} href={`/rooms/${r.id}`} onGo={() => setOpen(false)} img={r.photo} name={r.name} sub={`Holds ${r.capacity}${st.text ? ` · ${st.text}` : ""}`} />
                          );
                        })}
                        <SubLink href="/rooms#podcast" onGo={() => setOpen(false)} img="/rooms/podcast-temp.webp" name="Podcast" sub="Any free room · $250/hr" />
                        <Link href="/start?path=room" onClick={() => setOpen(false)} className="mt-1 self-start rounded-[4px] bg-[#d4a030] px-3.5 py-2 text-[13px] font-semibold text-black">
                          Book a room →
                        </Link>
                      </>
                    ) : (
                      <>
                        {show && now && (
                          <SubLink
                            href={show.slug ? `/studio-productions/${show.slug}` : "/studio-productions#tonight"}
                            onGo={() => setOpen(false)}
                            img={roomOf(show.room).photo}
                            name={show.title}
                            sub={`${showLabel(show, now)} · ${show.start.toLocaleTimeString("en-US", { hour: "numeric", minute: show.start.getMinutes() ? "2-digit" : undefined })}`}
                          />
                        )}
                        {[
                          ["Tonight", "#tonight"],
                          ["Calendar", "#calendar"],
                          ["Past productions", "#past"],
                        ].map(([name, hash]) => (
                          <Link
                            key={hash}
                            href={`/studio-productions${hash}`}
                            onClick={() => {
                              setOpen(false);
                              if (window.location.pathname === "/studio-productions") window.dispatchEvent(new CustomEvent("sp:view", { detail: hash }));
                            }}
                            className="rounded-lg px-3 py-2 text-[15px] text-ink/80 transition-colors hover:bg-bone-2">
                            {name}
                          </Link>
                        ))}
                        <Link href="/start?path=room&from=productions" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-[15px] text-ink/80 transition-colors hover:bg-bone-2">
                          Produce your own
                        </Link>
                      </>
                    )}
                  </Section>
                ) : (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-display rounded-lg px-3 py-2.5 text-lg font-semibold text-ink transition-colors hover:bg-bone-2"
                  >
                    {l.label}
                  </Link>
                ),
              )}
              {/* The phone, as the same hollow gold button the desktop header shows. */}
              {/* The one front door (/start), then the phone. */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link href="/start?from=menu" onClick={() => setOpen(false)} className="nav-cta nav-cta--solid">
                  Get in touch
                </Link>
                <a href={NAV_CTA.href} onClick={() => setOpen(false)} className="nav-cta">
                  {NAV_CTA.label}
                </a>
              </div>
            </nav>
            <div className="mt-4 flex gap-4 border-t border-line pt-4 font-mono-label text-xs text-slate">
              <Link href="/privacy" onClick={() => setOpen(false)}>
                Privacy
              </Link>
              <Link href="/terms" onClick={() => setOpen(false)}>
                Terms
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
