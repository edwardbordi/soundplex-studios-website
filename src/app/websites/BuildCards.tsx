"use client";

import { useEffect, useRef } from "react";
import OutboundArrow from "../components/OutboundArrow";

/**
 * Recent builds for SoundPlex members, on /websites (Ed, 2026-11-24: the page follows the
 * realiiz.com Black Friday funnel's layout). Ported from realiiz-website's black-friday/MemberCards:
 * the clip plays, muted, while the card is on screen, and the picture zooms gently on hover.
 * The quotes are each client's approved words, word for word (realiiz-website
 * src/app/websites/caseStudyData.ts); if one changes there, change it here too.
 */

type Build = {
  id: string;
  name: string;
  kind: string;
  line: string;
  site: { href: string; label: string };
  media: { poster: string; video: string };
  quote: { text: string; name: string; title: string };
};

const BUILDS: Build[] = [
  {
    // Ed, 2026-11-24: show it here too, as on the realiiz.com funnel.
    id: "neoteric",
    name: "The Neoteric Academy of Art",
    kind: "Art academy",
    line: "Their story as a fly-through, a clear way in for every kind of student, and an application that sorts itself.",
    site: { href: "https://theneotericarts.com", label: "theneotericarts.com" },
    media: { poster: "/websites/cases/neoteric-hero.webp", video: "/websites/cases/neoteric-hero.mp4" },
    quote: {
      text: "We teach our students to slow down and really see, and for the first time our website feels like it was made the same way.",
      name: "Lisa Silas & Matthew Riggs",
      title: "Founders, The Neoteric Academy of Art",
    },
  },
  {
    id: "rootreach",
    name: "Root & Reach Creative",
    kind: "Content creator",
    line: "Her new website, with her 70s vibe all over it: words that explain themselves, reviews you can sort, and a dashboard she runs herself.",
    site: { href: "https://rootandreachcreative.com", label: "rootandreachcreative.com" },
    media: { poster: "/websites/cases/rootreach-hero.webp", video: "/websites/cases/rootreach-hero.mp4" },
    quote: {
      text: "He didn’t just create a website that looks great; he captured the heart of my brand and translated my vision into something that feels authentic to who I am and what I want my business to represent.",
      name: "Cristina Vann",
      title: "Founder, Root & Reach Creative",
    },
  },
  {
    id: "5degrees",
    name: "5 Degrees",
    kind: "Community movement",
    line: "A homepage that shows the mission as you scroll, with events and RSVPs wired into her CRM.",
    site: { href: "https://5degrees.org", label: "5degrees.org" },
    media: { poster: "/websites/cases/5degrees-hero.webp", video: "/websites/cases/5degrees-hero.mp4" },
    quote: {
      text: "I told Ed what the movement felt like, and he built a home that feels exactly like that. The events, the RSVPs, the guides — it all simply works.",
      name: "Anne Casey",
      title: "Founder, 5 Degrees",
    },
  },
];

function BuildCard({ b }: { b: Build }) {
  const video = useRef<HTMLVideoElement>(null);

  // The clip plays (muted) only while the card is on screen, and only after the page has loaded.
  useEffect(() => {
    const v = video.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          v.preload = "auto";
          v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: 0.4 },
    );
    const start = () => io.observe(v);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      io.disconnect();
    };
  }, []);

  return (
    <li className="group flex flex-col overflow-hidden rounded-[10px] border border-white/12 bg-[#0b0b0b] transition-[border-color,box-shadow] duration-300 hover:border-[#d4a030]/55 hover:shadow-[0_22px_44px_-26px_rgb(212_160_48/0.45)]">
      <span className="relative block aspect-[16/10] w-full overflow-hidden border-b border-white/12 bg-[#0b0b0b]">
        {/* eslint-disable-next-line @next/next/no-img-element -- a poster under a video, same size */}
        <img src={b.media.poster} alt={`The ${b.name} website`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
        <video
          ref={video}
          src={b.media.video}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[28%] [background:linear-gradient(to_bottom,rgb(5_6_8/0.92)_0%,rgb(5_6_8/0.7)_35%,rgb(5_6_8/0.3)_70%,rgb(5_6_8/0)_100%)]"
        />
        <span className="absolute left-3 top-3 rounded-[3px] bg-black/75 px-2.5 py-1 font-[family-name:var(--font-poppins)] text-[0.62rem] uppercase tracking-[0.18em] text-white backdrop-blur">
          Live client site
        </span>
      </span>
      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
        <span className="font-[family-name:var(--font-poppins)] text-[11px] uppercase tracking-[0.18em] text-[#d4a030]">{b.kind}</span>
        <span className="mt-1.5 block font-[family-name:var(--font-poppins)] text-xl font-semibold text-white">{b.name}</span>
        <span className="mt-2 block text-[14.5px] leading-relaxed text-white/65">{b.line}</span>
        <figure className="mt-5 border-l-2 border-[#d4a030]/60 pl-4">
          <blockquote className="text-[15px] leading-relaxed text-white/90">&ldquo;{b.quote.text}&rdquo;</blockquote>
          <figcaption className="mt-2 text-[13.5px] text-white/60">
            {b.quote.name}, {b.quote.title}
          </figcaption>
        </figure>
        <a
          href={b.site.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link mt-auto inline-flex items-center gap-1 pt-6 text-[15px] font-semibold text-[#d4a030] transition-colors hover:text-[#e2b34e]"
        >
          {b.site.label}
          <OutboundArrow />
        </a>
      </div>
    </li>
  );
}

export default function BuildCards() {
  return (
    <ul className="mt-8 grid gap-5 md:grid-cols-3">
      {BUILDS.map((b) => (
        <BuildCard key={b.id} b={b} />
      ))}
    </ul>
  );
}
