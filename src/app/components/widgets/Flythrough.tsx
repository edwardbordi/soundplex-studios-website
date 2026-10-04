"use client";

import { useEffect, useRef } from "react";
import { ROUTE } from "./flythrough-route";
import { mountScrollWorld } from "./vendor/scrub-engine";

/**
 * The homepage hero: a scroll-scrubbed camera flight through the real building.
 *
 * The engine (components/widgets/vendor/scrub-engine.js — the scroll-world skill's, kept
 * verbatim) is vanilla JS that builds its own DOM and injects its own CSS into the
 * container it's handed, so React's only jobs here are to give it a container, mount it
 * once on the client, and get out of the way. Never render children into that container —
 * the engine owns everything inside it.
 *
 * ARCHITECTURE A: the thirteen legs ARE the journey, so there are no connectors. Passing
 * an empty array makes the engine crossfade leg to leg, which is what we want: the legs
 * are already frame-locked to each other, so the dissolve only has to hide Seedance's
 * sub-pixel drift at the seam, not a content jump. 0.08 is the skill's arch-A width —
 * wider starts to read as a dissolve rather than a continuous take.
 *
 * The engine's own topbar is off (no brand/nav/cta): the page already renders the real
 * site <Nav overlay />, and two headers over one film is one too many. The finale leg
 * carries the CTA buttons instead.
 */
export default function Flythrough() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.mounted) return;
    el.dataset.mounted = "1";

    mountScrollWorld(el, {
      nav: false,
      // No drifting particles / gradient wash: this is photographed reality, and the
      // atmosphere layer is built for illustrated diorama worlds. It would read as dirt
      // on the lens here.
      atmosphere: false,
      hint: "scroll to walk in",
      crossfade: 0.08,
      sections: ROUTE,
      connectors: [],
    });

    // The engine's chrome is position:fixed and stays pinned for the life of the page,
    // which is right while the film is on screen and wrong the moment you scroll past it
    // onto the rest of the homepage. Nothing in the engine knows about "after the track",
    // so the wrapper tells it: once the flight is behind us, the chrome goes away.
    // (Toggling a class beats clipping the container — a transformed/contained ancestor
    // would re-root the engine's fixed positioning and break the whole stage.)
    // One viewport-height, not half: the page content is pulled up by exactly 1vh (see
    // `.sw-mount + .sw-after` in globals.css), so this is the moment it finishes covering
    // the film. Hiding the chrome any later leaves the route rail floating over the copy
    // below; any earlier and it vanishes while the film is still on screen.
    const onScroll = () => {
      const past = window.scrollY > el.offsetTop + el.offsetHeight - window.innerHeight;
      el.classList.toggle("sw-past", past);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div ref={ref} className="sw-mount" />;
}
