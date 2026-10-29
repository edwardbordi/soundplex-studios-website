"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ROOMS } from "../../../lib/venue/data";
import Check from "./Check";

/**
 * The calendar's room filter: a branded dropdown (not the browser's own), square like the
 * header's Log in button. Each room shows its photo and what it holds. The menu is fixed to the
 * screen, so the sideways-scrolling filter row on phones can't clip it.
 */
export default function RoomPicker({
  value,
  onChange,
  full,
  field,
  allLabel = "All rooms",
  allSub,
  allValue = "all",
}: {
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
  /** Form-field look (inside the booking popup): full width, input height, no "Room" prefix. */
  field?: boolean;
  allLabel?: string;
  allSub?: string;
  allValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{
    top: number;
    right: number;
    width?: number;
  } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const current = ROOMS.find((r) => r.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      if (e.type === "scroll" || e.type === "resize") return setOpen(false);
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !btn.current?.contains(t))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    menu.current
      ?.querySelector<HTMLButtonElement>('[aria-selected="true"]')
      ?.focus();
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    const r = btn.current?.getBoundingClientRect();
    if (r)
      setAt({
        top: r.bottom + 6,
        right: Math.max(12, window.innerWidth - r.right),
        width: field ? r.width : undefined,
      });
    setOpen((o) => !o);
  };
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    btn.current?.focus();
  };
  const options = [
    { id: allValue, name: allLabel, photo: "", capacity: 0 },
    ...ROOMS,
  ];

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Room: ${current?.name ?? allLabel}`}
        onClick={toggle}
        className={
          field
            ? `mt-1.5 flex h-[46px] w-full items-center gap-2 rounded-[4px] border bg-white/[0.04] px-3 text-left text-[14.5px] font-normal text-white transition-colors ${open ? "border-[#d4a030]" : "border-white/15 hover:border-white/35"}`
            : `flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[4px] border px-3 ${full ? "w-full" : ""} font-[family-name:var(--font-poppins)] text-[13px] font-medium transition-colors ${
                value !== allValue
                  ? "border-[#d4a030]/70 text-[#d4a030]"
                  : "border-white/20 text-white hover:border-white/50"
              }`
        }
      >
        {!field && <span className="text-white/45">Room</span>}
        <span className={full || field ? "flex-1 truncate text-left" : ""}>
          {current
            ? field
              ? `${current.name} (holds ${current.capacity})`
              : current.name
            : allLabel}
        </span>
        <svg
          viewBox="0 0 12 8"
          aria-hidden="true"
          className={`h-2 w-3 text-white/55 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M1 1l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </button>

      {open &&
        at &&
        // Rendered at page level, so a popup's scrolling or animation can't clip it.
        createPortal(
          <div
            ref={menu}
            role="listbox"
            aria-label="Room"
            className="vo-pop fixed z-[95] w-64 overflow-hidden rounded-[8px] border border-white/12 bg-[#141414] py-1.5 text-white shadow-2xl"
            style={{ top: at.top, right: at.right, width: at.width }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
              e.preventDefault();
              const items = [
                ...(menu.current?.querySelectorAll<HTMLButtonElement>(
                  '[role="option"]',
                ) ?? []),
              ];
              const i = items.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              items[
                (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
                  items.length
              ]?.focus();
            }}
          >
            {options.map((o) => {
              const sel = o.id === value;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={sel}
                  onClick={() => pick(o.id)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left outline-none transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.08]"
                >
                  {o.photo ? (
                    <Image
                      src={o.photo}
                      alt=""
                      width={64}
                      height={64}
                      className="h-8 w-8 shrink-0 rounded-[4px] object-cover"
                    />
                  ) : (
                    <span className="grid h-8 w-8 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-[4px]">
                      {ROOMS.map((r) => (
                        <Image
                          key={r.id}
                          src={r.photo}
                          alt=""
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ))}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[14px] ${sel ? "font-semibold text-[#d4a030]" : "text-white/90"}`}
                    >
                      {o.name}
                    </span>
                    <span className="block text-[11.5px] text-white/40">
                      {o.capacity
                        ? `Holds ${o.capacity}`
                        : (allSub ?? `${ROOMS.length} rooms`)}
                    </span>
                  </span>
                  {sel && <Check className="h-4 w-4 text-[#d4a030]" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
