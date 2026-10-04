"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * "Watch the clip" — a tiny inline link that opens a video lightbox.
 * Built for inline endorsement/demo clips: real
 * footage beats any text testimonial, and a popup keeps the page flow
 * intact for everyone who doesn't click.
 *
 * Accepts a hosted mp4 URL (renders <video controls autoplay>) or a
 * YouTube/Vimeo embed URL (renders an iframe). Portals into the websites
 * theme scope so it sits above every Reveal stacking context and follows
 * the site theme.
 */
export default function WatchClip({
  src,
  label = "Watch the clip",
}: {
  src: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // Freeze the page behind the lightbox.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const isEmbed = /youtube\.com|youtu\.be|vimeo\.com/.test(src);

  return (
    <>
      {/* Plain inline button (no flex) so it sits ON the text baseline and
          flows with the attribution line; the up-right arrow matches the
          site's outbound-link language and nudges on hover. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group/clip whitespace-nowrap align-baseline text-[12.5px] font-medium text-signal-strong"
      >
        <span className="group-hover/clip:underline">{label}</span>{" "}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="inline-block h-3 w-3 -translate-y-px transition-transform duration-150 group-hover/clip:translate-x-0.5 group-hover/clip:-translate-y-[3px]"
        >
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            {/* backdrop */}
            <button
              type="button"
              aria-label="Close video"
              onClick={close}
              className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-[720px]">
              <button
                type="button"
                aria-label="Close video"
                onClick={close}
                className="absolute -top-9 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="overflow-hidden rounded-xl bg-black shadow-2xl">
                {isEmbed ? (
                  <iframe
                    src={src}
                    title={label}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="aspect-video w-full"
                  />
                ) : (
                  <video
                    src={src}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[70vh] w-full"
                  />
                )}
              </div>
            </div>
          </div>,
          document.getElementById("theme-scope") ?? document.body,
        )}
    </>
  );
}
