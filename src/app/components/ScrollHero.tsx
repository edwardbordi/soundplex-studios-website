"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ForwardArrow from "./ForwardArrow";
import ShopSpots from "./ShopSpots";

/**
 * Home hero, version B (Ed, 2026-10-29): the same two WoodRoom frames as version A, but the room
 * fills AS YOU SCROLL, tied to the scrollbar, instead of on its own.
 *   Top:    the empty, lit room + its own line ("The lights are on.") + the empty room's
 *           shoppable art (every piece visible in that frame).
 *   Scroll: the crowd dissolves in, the line hands over to George's ("Find your people…").
 *   End:    the full room + the CTAs + what's on now + only the art the crowd doesn't hide.
 * The section is ~2.6 screens tall with a sticky frame inside; scroll progress p (0→1) drives CSS
 * variables directly (no React re-render per frame). React only re-renders when the phase
 * changes (empty / between / full), which swaps the hotspots.
 */
const EMPTY = "/flythrough/states/state-A.jpg";
const FULL = "/flythrough/states/state-C-2.jpg";
const EYEBROW = "font-[family-name:var(--font-poppins)] text-xs font-medium uppercase tracking-[0.22em] text-[#d4a030]";
const H1 = "mt-5 max-w-3xl font-[family-name:var(--font-poppins)] text-[clamp(2.6rem,7vw,5.2rem)] font-semibold leading-[0.98] tracking-tight text-white";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Phase = "empty" | "between" | "full";

export default function ScrollHero({ live }: { live: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("empty");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last: Phase = "empty";
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      const p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 1;
      el.style.setProperty("--p", p.toFixed(4));
      el.style.setProperty("--fill", smooth(0.15, 0.7, p).toFixed(4));
      el.style.setProperty("--copy-a", (1 - smooth(0.04, 0.28, p)).toFixed(4));
      el.style.setProperty("--copy-b", smooth(0.6, 0.85, p).toFixed(4));
      const next: Phase = p < 0.12 ? "empty" : p > 0.86 ? "full" : "between";
      if (next !== last) {
        last = next;
        setPhase(next);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative h-[260svh]"
      style={{ ["--p" as string]: 0, ["--fill" as string]: 0, ["--copy-a" as string]: 1, ["--copy-b" as string]: 0 }}
    >
      <div className="sticky top-0 flex h-[100svh] items-end overflow-hidden">
        {/* The two frames, one camera: the full room underneath, the empty room fading off it. */}
        <div className="absolute inset-0 origin-[50%_60%]" style={{ transform: "scale(calc(1.02 + var(--p) * 0.06))" }}>
          <Image src={FULL} alt="The WoodRoom at SoundPlex full of people talking in groups under the stage lights" fill priority sizes="100vw" className="object-cover" />
          <Image src={EMPTY} alt="" aria-hidden fill priority sizes="100vw" className="object-cover" style={{ opacity: "calc(1 - var(--fill))" }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/35 to-black/55" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" aria-hidden />

        {/* Shoppable art: every piece in the empty room at the top; at the end, only the pieces
            the crowd doesn't hide (hotspots.ts per photo). None mid-dissolve. */}
        {phase === "empty" && <ShopSpots key="empty" src={EMPTY} />}
        {phase === "full" && <ShopSpots key="full" src={FULL} />}

        {/* The scroll cue: a thin gold line drawing downward, bottom center, no words (Ed). */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2" style={{ opacity: "var(--copy-a)" }} aria-hidden>
          <span className="scroll-line" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-14 pt-40 sm:pb-20">
          {/* The empty room's line. */}
          <div
            className="absolute inset-x-6 bottom-14 sm:bottom-20"
            style={{ opacity: "var(--copy-a)", transform: "translateY(calc((1 - var(--copy-a)) * -18px))", pointerEvents: phase === "empty" ? "auto" : "none" }}
            aria-hidden={phase !== "empty"}
          >
            <p className={EYEBROW}>SoundPlex Studios · Pennsauken, NJ</p>
            {/* A touch smaller than George's line (Ed): three lines, not four. */}
            <p className="mt-5 max-w-4xl font-[family-name:var(--font-poppins)] text-[clamp(2.3rem,5.4vw,4.3rem)] font-semibold leading-[1] tracking-tight text-white">
              Creators, founders and music lovers{" "}
              <em className="font-[family-name:var(--font-lora)] font-normal italic text-[#d4a030]">already call this place home.</em>
            </p>
            {/* One useful line instead of "scroll to…" (Ed: more premium); the gold line below invites the scroll. */}
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/75">Live music, podcasts, workshops and a community of makers in Pennsauken, NJ.</p>
          </div>

          {/* The full room's line: George's, the CTAs, and what's on now. */}
          <div
            style={{ opacity: "var(--copy-b)", transform: "translateY(calc((1 - var(--copy-b)) * 22px))", pointerEvents: phase === "full" ? "auto" : "none" }}
          >
            <p className={EYEBROW}>SoundPlex Studios · Pennsauken, NJ</p>
            <h1 className={H1}>
              Find your people.{" "}
              <em className="font-[family-name:var(--font-lora)] font-normal italic text-[#d4a030]">Create your next chapter.</em>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/75">
              Three rooms, a stage and a calendar that’s always on — a third place for creators, founders and everyone who comes to see them.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/start?path=collective&from=hero-b" className="evp__btn group" tabIndex={phase === "full" ? 0 : -1}>
                Book a tour
                <ForwardArrow />
              </Link>
              <Link href="/studio-productions" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap" tabIndex={phase === "full" ? 0 : -1}>
                What’s on tonight
                <ForwardArrow />
              </Link>
            </div>
            <div className="mt-10 sm:absolute sm:bottom-20 sm:right-6 sm:mt-0">{live}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
