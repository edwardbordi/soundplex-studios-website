"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { NAV_LINKS } from "../../lib/site-config";

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
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
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
    <div className="sm:hidden">
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
            <nav aria-label="Main" className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display rounded-lg px-3 py-2.5 text-lg font-semibold text-ink transition-colors hover:bg-bone-2"
                >
                  {l.label}
                </Link>
              ))}
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
