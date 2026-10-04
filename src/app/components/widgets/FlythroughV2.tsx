"use client";

import { useEffect, useRef } from "react";
import { NIGHTS, OTHER_NIGHT, nightById } from "./flythrough-route-v2";
import { mountScrollWorld } from "./vendor/scrub-engine";

/**
 * Hero v2 — "The room fills." Same engine, same mount pattern as Flythrough.tsx (read the
 * notes there), different route: two video legs, then four stills of one frame that
 * cross-dissolve as the room fills. See design-process/flythrough/HERO-V2.md.
 *
 * `night` picks which route mounts (see NIGHTS in flythrough-route-v2.ts). The chooser —
 * one chip per ready night — is written into the first frame's eyebrow after mount, as
 * plain links: the engine registers window listeners with no teardown, so switching
 * nights is a fresh page (`/?night=music`), never a remount.
 *
 * This is the homepage hero (since 2026-09-22). The original room-tour film (Flythrough.tsx)
 * lives on /rooms, untouched.
 */
export default function FlythroughV2({ night: nightId, basePath = "/" }: { night?: string; basePath?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const night = nightById(nightId);
  const ready = NIGHTS.filter((n) => n.ready);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.mounted) return;
    el.dataset.mounted = "1";

    mountScrollWorld(el, {
      nav: false,
      atmosphere: false,
      hint: "scroll to step inside",
      // Seam width for the two VIDEO legs only — the stills carry their own `dissolve`.
      crossfade: 0.08,
      // How fast a state dissolve catches up with the scroll position (per frame). Lower
      // is slower and more filmic on a flick; 0.1 is the engine default.
      dissolveEase: 0.07,
      sections: night.route,
      connectors: [],
    });

    // The chooser: replace the first eyebrow's text with one chip per ready night. Only
    // when there's a choice to make — one night means no chips, just the eyebrow.
    // Ed (2026-09-22): the chooser shows EVERY night by default — the unbuilt ones as
    // plain, un-linked chips — so the range of the place is visible even before each
    // route is built. `?preview=ready` shows only the built ones (what a public ship
    // would want; flip the default when the nights are in).
    const previewAll = new URLSearchParams(window.location.search).get("preview") !== "ready";
    const shown = previewAll ? NIGHTS : ready;
    if (shown.length > 1) {
      const eyebrow = el.querySelector<HTMLElement>(".sw-copy .sw-copy__eyebrow");
      if (eyebrow) {
        eyebrow.classList.add("sw-v2-nights");
        const chips = shown
          .map((n) => {
            const active = n.id === night.id;
            if (!n.ready) return `<span class="sw-v2-night is-soon">${n.label}</span>`;
            return (
              `<a class="sw-v2-night${active ? " is-active" : ""}" href="${basePath}?night=${n.id}` +
              `${previewAll ? "&preview=nights" : ""}"${active ? ' aria-current="true"' : ""}>${n.label}</a>`
            );
          })
          .join("");
        // One row that scrolls sideways (the fade at the right edge says "more"), with
        // OTHER always last and always live — the night nobody listed.
        eyebrow.innerHTML =
          `<span class="sw-v2-nights__label">Tonight</span>` +
          `<span class="sw-v2-nights__track">${chips}` +
          `<a class="sw-v2-night is-other group" href="${OTHER_NIGHT.href}">${OTHER_NIGHT.label}` +
          `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sw-v2-night__arrow"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a></span>`;
        // The copy layer is pointer-events:none by design; the chips need to be tappable.
        const copy = eyebrow.closest<HTMLElement>(".sw-copy");
        if (copy) copy.style.pointerEvents = "auto";
        // Desktop affordances for a sideways row: the wheel scrolls it, and it drags like
        // a phone. (A visible slider bar under it is CSS — .sw-v2-nights__track.)
        const track = eyebrow.querySelector<HTMLElement>(".sw-v2-nights__track");
        if (track) {
          track.addEventListener(
            "wheel",
            (e) => {
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                track.scrollLeft += e.deltaY;
                e.preventDefault();
              }
            },
            { passive: false },
          );
          let dragX = 0, dragLeft = 0, dragging = false, moved = false;
          track.addEventListener("pointerdown", (e) => {
            if (e.pointerType !== "mouse") return;
            dragging = true; moved = false; dragX = e.clientX; dragLeft = track.scrollLeft;
            track.setPointerCapture(e.pointerId);
          });
          track.addEventListener("pointermove", (e) => {
            if (!dragging) return;
            const dx = e.clientX - dragX;
            if (Math.abs(dx) > 3) moved = true;
            track.scrollLeft = dragLeft - dx;
          });
          const end = () => { dragging = false; };
          track.addEventListener("pointerup", end);
          track.addEventListener("pointercancel", end);
          // A drag shouldn't also fire the chip you started on.
          track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
        }
      }
    }

    // Secondary CTAs carry the site's arrow (the engine renders plain text buttons). On
    // phones CSS turns them into a text link — the two stacked buttons crowded the hint.
    const ARROW =
      '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sw-btn__arrow"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
    el.querySelectorAll<HTMLAnchorElement>(".sw-btn--ghost").forEach((b) => {
      b.classList.add("group");
      b.insertAdjacentHTML("beforeend", ARROW);
    });

    const veil = veilRef.current;
    const onScroll = () => {
      // Guard: before the engine has built its track the mount is 0px tall, and the
      // "past the film" test would come out true — hiding the scrim on load.
      const h = el.offsetHeight;
      const past = h > 0 && window.scrollY > el.offsetTop + h - window.innerHeight;
      el.classList.toggle("sw-past", past);
      // The opening veil fades out over the first leg (1.2vh): by the time the doors
      // open it's gone, and the states are graded only by the permanent top scrim.
      const t = Math.min(1, Math.max(0, window.scrollY / (1.2 * window.innerHeight)));
      if (veil) veil.style.opacity = String(1 - t * t);
      // Fixed siblings of the mount don't inherit the engine's `.sw-past` hide — do it
      // by hand once the page content covers the film.
      if (scrimRef.current) scrimRef.current.style.opacity = past ? "0" : "1";
      if (veil) veil.style.visibility = past ? "hidden" : "visible";
    };
    onScroll();
    requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // No scroll-snap and no "settle" glide: both were tried (2026-09-22) and felt clunky
    // against the scrub. The reader scrolls; the film is wherever they stop.

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // The route is fixed for the life of the page (see the note above), so mount once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Grading layers FIRST, mount LAST: globals.css pulls the page up with
          `.sw-mount + .sw-after`, so the mount has to stay the section's direct
          previous sibling. All of these are position:fixed, so DOM order is free. */}
      {/* Permanent top scrim: the nav has to read over whatever frame is under it. */}
      <div aria-hidden ref={scrimRef} className="sw-v2-scrim" />
      {/* Opening veil: warms and darkens the foyer's top-right. Fades with scroll. */}
      <div aria-hidden ref={veilRef} className="sw-v2-veil" />
      {/* The engine owns everything INSIDE this div — never render children into it. */}
      <div ref={ref} className="sw-mount sw-v2" />
    </>
  );
}
