"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import ForwardArrow from "../ForwardArrow";
import type { PostCard } from "./LatestPosts";

/**
 * The home page's Spotlight row (Ed, 2026-10-28 — "horizontally scroll like the realiiz home
 * page showroom section"). Ported from that slider, SoundPlex colors and post cards.
 *
 * Desktop (mouse/trackpad, md+, motion allowed): the section PINS. Scrolling down holds the
 * page while the same scroll slides the posts sideways, then the page carries on. The row runs
 * off both screen edges, the first card lined up with the heading, and ends on an "All posts"
 * card. A thin gold line shows how far along you are.
 * Phones / reduced motion: a swipeable, snapping row with the same progress line.
 */
const PIN_QUERY = "(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)";

function subscribePin(cb: () => void) {
  const m = window.matchMedia(PIN_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const getPin = () => window.matchMedia(PIN_QUERY).matches;

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const CARD_W = "w-[84%] sm:w-[48%] md:w-[38%] lg:w-[30%]";

export default function PostsRail({ posts, head }: { posts: PostCard[]; head: ReactNode }) {
  const pinned = useSyncExternalStore(subscribePin, getPin, () => false);
  const frame = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const stick = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [gut, setGut] = useState<{ l: number; r: number } | null>(null);
  const [bar, setBar] = useState({ w: 0.3, x: 0 });
  const [dist, setDist] = useState(0);
  const [viewW, setViewW] = useState(1);
  const [stickH, setStickH] = useState(0);
  const [stickTop, setStickTop] = useState(96);
  const [prog, setProg] = useState(0);

  // Space from the content column to each screen edge, so the row can run full bleed.
  const measure = useCallback(() => {
    const f = frame.current;
    if (!f) return;
    const box = f.getBoundingClientRect();
    setGut({ l: Math.round(box.left), r: Math.round(document.documentElement.clientWidth - box.right) });
  }, []);

  const update = useCallback(() => {
    const r = rail.current;
    if (!r) return;
    const w = Math.min(1, r.clientWidth / r.scrollWidth);
    const max = r.scrollWidth - r.clientWidth;
    setBar({ w, x: max > 0 ? (r.scrollLeft / max) * (1 - w) : 0 });
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      measure();
      update();
    });
    ro.observe(document.documentElement);
    if (frame.current) ro.observe(frame.current);
    if (rail.current) ro.observe(rail.current);
    return () => ro.disconnect();
  }, [measure, update, pinned]);

  useEffect(() => {
    const r = rail.current;
    if (!r) return;
    r.addEventListener("scroll", update, { passive: true });
    return () => r.removeEventListener("scroll", update);
  }, [update, pinned]);

  // Pinned: measure the travel, then map the page's scroll through the section to it.
  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const size = () => {
      const t = track.current;
      const st = stick.current;
      if (!t) return;
      if (st) {
        const h = st.offsetHeight;
        setStickH(h);
        setStickTop(Math.max(88, Math.round((window.innerHeight - h) / 2 + 32)));
      }
      setDist(Math.max(0, t.scrollWidth - document.documentElement.clientWidth));
      setViewW(Math.min(1, document.documentElement.clientWidth / t.scrollWidth));
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const p = pin.current;
        const t = track.current;
        const st = stick.current;
        if (!p || !t) return;
        const travel = Math.max(1, t.scrollWidth - document.documentElement.clientWidth);
        const top = st ? parseFloat(getComputedStyle(st).top) || 0 : 0;
        setProg(Math.min(1, Math.max(0, (top - p.getBoundingClientRect().top) / travel)));
      });
    };
    const ro = new ResizeObserver(() => {
      size();
      onScroll();
    });
    if (track.current) ro.observe(track.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pinned, gut]);

  const cards = posts.map((p) => <Card key={p.slug} p={p} />);

  if (pinned) {
    return (
      <div>
        <div ref={frame} />
        <div
          ref={pin}
          className="relative"
          style={{ height: stickH ? stickH + dist : undefined, marginLeft: gut ? -gut.l : undefined, marginRight: gut ? -gut.r : undefined }}
        >
          <div ref={stick} className="sticky overflow-hidden" style={{ top: stickTop }}>
            <div style={gut ? { paddingLeft: gut.l, paddingRight: gut.r } : undefined}>{head}</div>
            <div
              ref={track}
              role="list"
              aria-label="Latest posts"
              className="mt-8 flex gap-4 will-change-transform"
              style={{ paddingLeft: gut?.l, transform: `translate3d(${-prog * dist}px, 0, 0)` }}
            >
              {cards}
              <AllCard image={posts[posts.length - 1]?.heroImage} />
              {/* End spacer: an overflowing flex row ignores its right padding. */}
              <span aria-hidden className="shrink-0" style={{ width: Math.max(0, (gut?.r ?? 0) - 16) }} />
            </div>
            <div style={gut ? { paddingLeft: gut.l, paddingRight: gut.r } : undefined}>
              <div aria-hidden className="relative mt-6 h-[2px] overflow-hidden rounded-full bg-white/[0.08]">
                <div className="absolute inset-y-0 rounded-full bg-[#d4a030]" style={{ width: `${viewW * 100}%`, left: `${prog * (1 - viewW) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {head}
      <div ref={frame} className="relative mt-8">
        <div
          ref={rail}
          role="list"
          aria-label="Latest posts"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={gut ? { marginLeft: -gut.l, marginRight: -gut.r, paddingLeft: gut.l, paddingRight: gut.r, scrollPaddingLeft: gut.l } : undefined}
        >
          {cards}
          <AllCard image={posts[posts.length - 1]?.heroImage} />
        </div>
      </div>
      <div aria-hidden className="relative mt-5 h-[2px] overflow-hidden rounded-full bg-white/[0.08]">
        <div className="absolute inset-y-0 rounded-full bg-[#d4a030] transition-[left] duration-150 ease-out" style={{ width: `${bar.w * 100}%`, left: `${bar.x * 100}%` }} />
      </div>
    </div>
  );
}

function Card({ p }: { p: PostCard }) {
  return (
    <div role="listitem" className={`${CARD_W} shrink-0 snap-start`}>
      <article className="lp__card">
        <Link href={`/blog/${p.slug}`} className="lp__photo group" aria-label={p.title}>
          <Image src={p.heroImage} alt={p.heroImageAlt} fill sizes="(min-width: 1024px) 30vw, (min-width: 768px) 38vw, (min-width: 640px) 48vw, 84vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        </Link>
        <p className="lp__date">{fmtDate(p.publishedAt)}</p>
        <h3 className="lp__title">
          <Link href={`/blog/${p.slug}`}>{p.title}</Link>
        </h3>
        <p className="lp__ex">{p.excerpt}</p>
      </article>
    </div>
  );
}

/** The row's last card: on to the whole Spotlight. */
function AllCard({ image }: { image?: string }) {
  return (
    <div role="listitem" className={`${CARD_W} shrink-0 snap-start`}>
      <Link href="/blog" className="group relative block aspect-[16/10] overflow-hidden rounded-[3px] border border-white/[0.08] bg-[#0b0b0b]">
        {image && <Image src={image} alt="" fill sizes="30vw" className="object-cover opacity-30 transition-transform duration-500 group-hover:scale-[1.04]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="font-[family-name:var(--font-poppins)] text-[0.62rem] uppercase tracking-[0.18em] text-white/60">The Spotlight</p>
          <p className="mt-1.5 flex items-center gap-2 font-[family-name:var(--font-poppins)] text-xl font-medium text-white transition-colors group-hover:text-[#e2b34e]">
            All posts <ForwardArrow />
          </p>
        </div>
      </Link>
    </div>
  );
}
