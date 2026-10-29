"use client";

import { useEffect, useRef, useState } from "react";
import { nightById } from "./flythrough-route-v3";
import ShopSpots from "../ShopSpots";

/** The Ideas scene's still: the empty WoodRoom, whose art has hotspots (lib/gallery/hotspots.ts). */
const IDEAS_STILL = "/flythrough/states/state-A.jpg";

/** "I'm here to…" (Ed, 2026-10-29): the reasons people come, each into the right /start path. */
const INTENTS = [
  { label: "Rent a room", href: "/start?path=room&from=home-chips" },
  { label: "Record a podcast", href: "/start?path=produce&from=home-chips" },
  { label: "See a show", href: "/studio-productions" },
  { label: "Join the Collective", href: "/start?path=collective&from=home-chips" },
  { label: "Take a tour", href: "/start?path=collective&from=home-chips-tour" },
];
const SOMETHING_ELSE = { label: "Something else", href: "/start?path=talk&from=home-chips" };
import { mountScrollWorld } from "./vendor/scrub-engine";

/**
 * V3 = THE WORKING COPY of FlythroughV2 for home version C (the home page, /), made 2026-10-29 so Ed can
 * change it freely. FlythroughV2.tsx + flythrough-route-v2.ts are the ORIGINAL, kept untouched
 * to go back to: swap FlythroughV3 → FlythroughV2 in HomeView.tsx.
 *
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
export default function FlythroughV3({ night: nightId, basePath = "/" }: { night?: string; basePath?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const night = nightById(nightId);
  void basePath; // night links used it; the "I'm here to" chips go to /start instead
  const [spots, setSpots] = useState<{ posY: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // BUILD the film once (the engine can't be torn down), but ALWAYS (re)attach the page's
    // listeners below. Ed, 2026-10-29: in development React mounts effects twice (Strict
    // Mode); the old "return if already mounted" skipped the listeners on the second run, so
    // nothing tracked the scroll — the film's copy and dots never hid, the hotspots never came.
    const firstBuild = !el.dataset.mounted;
    el.dataset.mounted = "1";

    if (firstBuild) {
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

    // The chip rail on the first frame (Ed, 2026-10-29): "I'm here to…", one chip per reason
    // people come, each straight into the right path of /start (like the header's Book menu).
    // Replaces the "Tonight" night chooser; the nights machinery stays (night= still works).
    {
      const eyebrow = el.querySelector<HTMLElement>(".sw-copy .sw-copy__eyebrow");
      if (eyebrow) {
        eyebrow.classList.add("sw-v2-nights");
        const chips = INTENTS.map((i) => `<a class="sw-v2-night" href="${i.href}">${i.label}</a>`).join("");
        // One row that scrolls sideways (the fade at the right edge says "more"), with
        // "Something else" always last.
        eyebrow.innerHTML =
          `<span class="sw-v2-nights__label">I’m here to</span>` +
          `<span class="sw-v2-nights__track">${chips}` +
          `<a class="sw-v2-night is-other group" href="${SOMETHING_ELSE.href}">${SOMETHING_ELSE.label}` +
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

    // The page's main heading (Ed, 2026-10-29: the smoke test caught a home page with no <h1>):
    // the engine renders every frame's title as an <h2>, so promote the FIRST frame's title —
    // "You have a home. You have work. This is your third place." — to the one <h1>. Same class,
    // same look; the engine keeps no reference to the title element, so swapping it is safe.
    const firstTitle = el.querySelector<HTMLElement>(".sw-copy .sw-copy__title");
    if (firstTitle && firstTitle.tagName === "H2") {
      const h1 = document.createElement("h1");
      h1.className = firstTitle.className;
      h1.innerHTML = firstTitle.innerHTML;
      firstTitle.replaceWith(h1);
    }

    // Secondary CTAs carry the site's arrow (the engine renders plain text buttons). On
    // phones CSS turns them into a text link — the two stacked buttons crowded the hint.
    const ARROW =
      '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sw-btn__arrow"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
    el.querySelectorAll<HTMLAnchorElement>(".sw-btn--ghost").forEach((b) => {
      b.classList.add("group");
      b.insertAdjacentHTML("beforeend", ARROW);
    });
    } // end of the one-time build

    const veil = veilRef.current;
    // The art hotspots on the last scene, Ideas (Ed, 2026-10-29). It's state-A.jpg held still
    // (drift 0 in the v3 route), so the hotspots line up with the paintings. On only while
    // Ideas is the active stop AND before the page below starts rising over the film.
    let spotsOn: boolean | null = null;
    const checkSpots = (force = false) => {
      const dots = document.querySelectorAll(".sw-route__dot");
      const lastActive = dots.length > 0 && dots[dots.length - 1].classList.contains("is-active");
      // "Rising" = the page below (the `.sw-after` section right after the mount) has
      // actually come into view, measured, not estimated.
      const next = el.nextElementSibling as HTMLElement | null;
      const rising = !!next && next.getBoundingClientRect().top < window.innerHeight - 1;
      const on = lastActive && !rising;
      if (on === spotsOn && !force) return;
      spotsOn = on;
      if (!on) return setSpots(null);
      // Match the engine's own framing: the still's vertical object-position (42–46%).
      const still = Array.from(el.querySelectorAll<HTMLImageElement>(".sw-scene__still")).find((i) => i.src.includes(IDEAS_STILL));
      const y = still ? parseFloat(getComputedStyle(still).objectPosition.split(" ")[1] ?? "50") : 42;
      setSpots({ posY: (Number.isFinite(y) ? y : 42) / 100 });
    };
    const onScroll = () => {
      requestAnimationFrame(() => checkSpots());
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
    // The engine moves the active dot on its own (smoothed) timing, sometimes after the last
    // scroll event — so also re-check whenever a dot's class changes.
    const dotWatch = new MutationObserver(() => checkSpots());
    const routeEl = document.querySelector(".sw-route");
    if (routeEl) dotWatch.observe(routeEl, { subtree: true, attributes: true, attributeFilter: ["class"] });
    const onResize = () => {
      onScroll();
      requestAnimationFrame(() => checkSpots(true)); // a breakpoint can change the framing
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // No scroll-snap and no "settle" glide: both were tried (2026-09-22) and felt clunky
    // against the scrub. The reader scrolls; the film is wherever they stop.

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      dotWatch.disconnect();
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
      {/* The art for sale on the Ideas scene's walls (fixed over the film, under the nav). */}
      {spots && (
        <div className="fixed inset-0 z-[35]">
          <ShopSpots key={spots.posY} src={IDEAS_STILL} posY={spots.posY} />
        </div>
      )}
      {/* The engine owns everything INSIDE this div — never render children into it. */}
      <div ref={ref} className="sw-mount sw-v2" />
    </>
  );
}
