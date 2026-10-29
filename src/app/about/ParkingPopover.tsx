"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * "Where to park" — the live site's parking popup, as a small popover beside Get directions
 * (Ed, 2026-10-28: "add the parking notes as a popover"). Opens on click, closes on Esc, a click
 * outside, or the button again. Opens upward so it never runs off the bottom of the page.
 */
export default function ParkingPopover({ notes }: { notes: { title: string; body: string }[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={`card-cta inline-flex items-center gap-2 whitespace-nowrap ${open ? "text-[#e2b34e]" : ""}`}
      >
        Where to park
      </button>
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label="Where to park"
          className="vo-fade absolute bottom-full left-0 z-30 mb-3 w-[min(22rem,calc(100vw-3rem))] rounded-[8px] border border-white/10 bg-[#0f0f0f] p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]"
        >
          <p className="font-[family-name:var(--font-lora)] text-[16px] italic text-white/80">Parking, close by, day or night.</p>
          <ul className="mt-4 grid gap-4">
            {notes.map((n) => (
              <li key={n.title} className="border-l-2 border-[#d4a030]/60 pl-3">
                <p className="font-[family-name:var(--font-poppins)] text-[14px] font-medium text-white">{n.title}</p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-white/60">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
