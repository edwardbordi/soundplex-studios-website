"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import ForwardArrow from "./ForwardArrow";

/**
 * The header's main button (Ed, 2026-10-29: "Get in touch" undersold it — this button starts
 * renting a room, a tour, tickets, a production). "Book" opens a small menu of the real reasons
 * people come, each straight into the right path of the /start survey (or the calendar, for
 * tickets). Opens on hover (desktop) and on click/tap; Escape or a click outside closes it.
 */
// Small photo thumbs, not icons (Ed): each choice shows the real thing.
const CHOICES = [
  { href: "/start?path=room&from=nav-book", title: "Rent a room", sub: "Parties, workshops, shoots and sessions", img: "/rooms/wood-room-3.webp" },
  { href: "/start?path=collective&from=nav-book", title: "Book a tour", sub: "See the building and hear about membership", img: "/rooms/sound-lounge-1.webp" },
  { href: "/studio-productions", title: "Get tickets", sub: "Shows, comedy, talks and screenings", img: "/rooms/wood-room-2.webp" },
  { href: "/start?path=produce&from=nav-book", title: "Record or produce", sub: "Podcasts, videos and live sessions, with our team", img: "/rooms/podcast-temp.webp" },
] as const;

export default function BookMenu() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();

  const later = (v: boolean, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(v), ms);
  };
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      clearTimeout(timer.current);
      return;
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div ref={wrap} className="relative" onMouseEnter={() => later(true, 90)} onMouseLeave={() => later(false, 220)}>
      {/* Split button (Ed): "Book" goes to /start (it asks what brings you); the arrow opens the menu. */}
      <div className="nav-cta nav-cta--solid nav-split">
        <Link href="/start?from=nav-book" onClick={close}>
          Book
        </Link>
        <span className="nav-split__rule" aria-hidden="true" />
        <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={id} aria-label="Booking options" onClick={() => setOpen((o) => !o)}>
          <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div id={id} role="menu" className="vo-pop absolute right-0 top-full z-[70] mt-3 w-[22rem] overflow-hidden rounded-[8px] border border-white/12 bg-[#101010] text-white shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
          <ul className="p-2">
            {CHOICES.map((c) => (
              <li key={c.title}>
                <Link href={c.href} role="menuitem" onClick={close} className="group flex items-center gap-3.5 rounded-[6px] px-3 py-3 transition-colors hover:bg-white/[0.06]">
                  <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[5px] rounded-bl-none ring-1 ring-white/10 transition-shadow group-hover:ring-[#d4a030]/60">
                    <Image src={c.img} alt="" fill sizes="64px" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-[family-name:var(--font-poppins)] text-[14.5px] font-medium transition-colors group-hover:text-[#e2b34e]">{c.title}</span>
                    <span className="mt-0.5 block text-[12.5px] text-white/50">{c.sub}</span>
                  </span>
                  <span className="text-white/30 transition-colors group-hover:text-[#e2b34e]">
                    <ForwardArrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/start?path=talk&from=nav-book" role="menuitem" onClick={close} className="flex items-center justify-between border-t border-white/[0.08] px-5 py-3 text-[13px] text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white">
            Something else? Talk to us
            <ForwardArrow />
          </Link>
        </div>
      )}
    </div>
  );
}
