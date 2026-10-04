"use client";

import { useEffect, useRef, useState } from "react";

/** Playback-speed presets — shown for YouTube/mp4 (which accept speed commands), not Loom. */
const SPEEDS = [1, 1.5, 2] as const;
import { PREVIEW_WALKTHROUGH_URL, PREVIEW_TEST_URL } from "../../lib/site-config";
import { useEdgeDock } from "./useEdgeDock";
import Image from "next/image";
import { PlayIcon } from "./ReviewIcons";

/**
 * TEMPORARY — client review only. The walkthrough: a short video of the
 * builder explaining what this preview is, how to use the review widgets and
 * what feedback is wanted. Opens by itself the first time a browser lands on
 * the preview, then lives as a play-icon tab on the edge (drag to move, tuck
 * with the chevron) and in the Review menu. Video URL: PREVIEW_WALKTHROUGH_URL.
 */
const KEY = "review-walkthrough";

export default function Walkthrough() {
  const [tucked, setTucked] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [qr, setQr] = useState<string>("");

  // QR for "open this on your phone" — generated in the browser (the library
  // is loaded only here, only in the review kit), then set as an SVG data URL.
  useEffect(() => {
    let cancelled = false;
    import("qrcode").then(async (QR) => {
      try {
        const svg = await QR.toString(PREVIEW_TEST_URL, { type: "svg", margin: 1, color: { dark: "#000000", light: "#ffffff" } });
        if (!cancelled) setQr(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
      } catch {}
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const { side, drag, frameRef, grip, tabGrip, wasDrag, panelStyle, tabStyle } = useEdgeDock(`${KEY}-v2`, { side: "l", topPx: 92 });

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        // First visit in this browser: open. After that, remember the last state.
        const seen = localStorage.getItem(`${KEY}-seen`) === "1";
        setTucked(seen ? localStorage.getItem(`${KEY}-tucked`) !== "0" : false);
        localStorage.setItem(`${KEY}-seen`, "1");
      } catch {}
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  const set = (v: boolean) => {
    setTucked(v);
    if (v) setPlaying(false);
    try {
      localStorage.setItem(`${KEY}-tucked`, v ? "1" : "0");
    } catch {}
  };

  const left = side === "l";
  const src = PREVIEW_WALKTHROUGH_URL;
  const isYouTube = /youtube\.com|youtu\.be/.test(src);
  const isFile = /\.(mp4|webm|mov)(\?|$)/i.test(src);
  const canSpeed = isYouTube || isFile;
  const embed = src ? `${src}${src.includes("?") ? "&" : "?"}autoplay=1${isYouTube ? "&enablejsapi=1&rel=0" : ""}` : "";
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rate, setRate] = useState<number>(1);
  const fullscreen = () => {
    if (!playing) setPlaying(true);
    const el = (videoRef.current ?? iframeRef.current) as (HTMLElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!el) return;
    if (el.requestFullscreen) void el.requestFullscreen();
    else el.webkitEnterFullscreen?.(); // iOS Safari <video>
  };
  // Re-apply the chosen speed whenever the <video> (re)mounts — a fresh
  // element always starts at 1×, which is how the chip and playback drifted.
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }, [playing, rate]);
  const applyRate = (r: number) => {
    setRate(r);
    if (videoRef.current) videoRef.current.playbackRate = r;
    const win = iframeRef.current?.contentWindow;
    if (isYouTube && win) {
      win.postMessage(JSON.stringify({ event: "listening" }), "*");
      win.postMessage(JSON.stringify({ event: "command", func: "setPlaybackRate", args: [r] }), "*");
    }
  };

  return (
    <>
      <div
        ref={frameRef}
        role="region"
        aria-label="Preview walkthrough"
        aria-hidden={tucked}
        inert={tucked}
        style={panelStyle}
        className={`fixed z-[55] w-[min(92vw,380px)] border-t-4 border-signal bg-ink p-4 text-paper shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${
          left ? "left-4" : "right-4"
        } ${drag?.what === "panel" ? "" : "transition-transform duration-300 ease-out motion-reduce:transition-none"} ${
          tucked ? `pointer-events-none ${left ? "-translate-x-[calc(100%+2rem)]" : "translate-x-[calc(100%+2rem)]"}` : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p
            {...grip}
            title="Drag to move"
            className={`font-display flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-paper/60 select-none touch-none ${
              drag?.what === "panel" ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3 fill-current opacity-70">
              <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
            </svg>
            Walkthrough
          </p>
          <button
            type="button"
            onClick={() => set(true)}
            aria-label="Tuck the walkthrough away"
            className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-sm text-paper hover:bg-signal"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2.5">
              {left ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
            </svg>
          </button>
        </div>

        <p className="font-display mt-3 text-xl font-bold uppercase leading-none">Start here.</p>
        <p className="mt-2 text-sm leading-snug text-paper/85">
          A seven-minute tour of this preview: what&apos;s built, how to flip between the home page versions, and the ways you can send feedback.
        </p>

        {/* The player: title bar + picture inside one muted frame. */}
        <div className="mt-3 overflow-hidden rounded-sm border border-paper/20">
        <div className="flex h-8 items-center justify-between border-b border-paper/15 bg-ink-2 px-2">
          <div className="flex items-center gap-1" role="group" aria-label="Playback speed">
            <span className="font-display mr-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-paper/50">Speed</span>
            {SPEEDS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => applyRate(r)}
                disabled={!canSpeed}
                aria-pressed={rate === r}
                className={`font-display rounded-sm px-2 py-0.5 text-xs font-semibold tabular-nums disabled:opacity-40 ${
                  rate === r ? "bg-signal text-paper" : "text-paper/85 hover:bg-signal hover:text-paper"
                }`}
              >
                {r}×
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={fullscreen}
            disabled={!src}
            aria-label="Full screen"
            title="Full screen"
            className="flex h-6 w-6 items-center justify-center rounded-sm text-paper/85 hover:bg-signal hover:text-paper disabled:opacity-40"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H3v5" /><path d="M16 3h5v5" /><path d="M8 21H3v-5" /><path d="M16 21h5v-5" />
            </svg>
          </button>
        </div>
        <div className="relative aspect-video w-full bg-ink-2">
          {!src ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-paper/25 text-center">
              <PlayIcon className="h-8 w-8 text-paper/50" />
              <p className="px-6 text-xs text-paper/60">Walkthrough video coming — check back after the next update.</p>
            </div>
          ) : !playing ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label="Play the walkthrough"
              className="group absolute inset-0 flex items-center justify-center"
            >
              <Image
                src="/preview/walkthrough-poster.webp"
                alt=""
                width={960}
                height={540}
                sizes="380px"
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100 motion-reduce:transition-none"
              />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-sm bg-signal text-paper transition-colors group-hover:bg-signal-strong motion-reduce:transition-none">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current">
                  <path d="M6 4l14 8-14 8z" />
                </svg>
              </span>
            </button>
          ) : isFile ? (
            <video
              ref={videoRef}
              src={src}
              controls
              autoPlay
              playsInline
              onPlay={(e) => {
                e.currentTarget.playbackRate = rate;
              }}
              className="absolute inset-0 h-full w-full bg-ink"
            />
          ) : (
            <iframe
              ref={iframeRef}
              src={embed}
              title="Preview walkthrough"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>
        </div>

        {/* On your phone + what's changed */}
        <div className="mt-4 flex items-start gap-3 border-t border-paper/10 pt-3">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL SVG generated in the browser; review kit only
            <img src={qr} alt="QR code for this preview" width={64} height={64} className="h-16 w-16 shrink-0 rounded-sm bg-white p-1" />
          ) : (
            <span className="h-16 w-16 shrink-0 rounded-sm bg-paper/10" aria-hidden="true" />
          )}
          <div className="min-w-0 text-sm leading-snug">
            <p className="font-semibold text-paper">Open this on your phone.</p>
            <p className="mt-0.5 text-xs text-paper/60">Point your camera at the code — most of Jason&apos;s customers will see the site on a phone, so that&apos;s the view that matters.</p>
          </div>
        </div>

        <p className="mt-3 border-t border-paper/10 pt-3 text-[0.7rem] leading-snug text-paper/45">
          Build-preview widget — it won&apos;t appear on the live site.
        </p>
      </div>

      {/* The tab. */}
      <button
        type="button"
        tabIndex={tucked ? 0 : -1}
        {...tabGrip}
        onClick={() => {
          if (!wasDrag()) set(false);
        }}
        aria-label="Show the walkthrough"
        aria-hidden={!tucked}
        inert={!tucked}
        style={tabStyle}
        className={`group font-display fixed z-50 flex h-7 items-center gap-1 bg-ink/85 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-paper/90 select-none touch-none hover:bg-ink hover:text-paper ${
          drag?.what === "tab" ? "cursor-grabbing" : "cursor-grab transition-transform duration-300 ease-out motion-reduce:transition-none"
        } ${left ? "left-0 rounded-r-sm px-1.5" : "right-0 rounded-l-sm px-1.5 flex-row-reverse"} ${
          tucked ? "" : `pointer-events-none ${left ? "-translate-x-full" : "translate-x-full"}`
        }`}
      >
        <PlayIcon />
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover:max-w-[8rem] group-hover:opacity-100 group-focus-visible:max-w-[8rem] group-focus-visible:opacity-100 motion-reduce:transition-none">
          Walkthrough
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-2.5 w-2.5 stroke-current opacity-60" fill="none" strokeWidth="3">
          {left ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
        </svg>
      </button>
    </>
  );
}
