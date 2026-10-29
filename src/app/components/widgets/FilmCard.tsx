"use client";

/**
 * SoundPlex's branded film player (Ed, 2026-10-28), ported from Realiiz's own FilmCard pattern:
 * a 16:9 facade (no video loads until someone presses play) that plays IN PLACE with our own
 * controls (gold, no browser chrome), then pops out into a small window when you scroll past it.
 * The window can be dragged anywhere, resized, minimized, and tucked into the side of the screen
 * (a tab stays on the edge to bring it back); the close button stops it and puts it home.
 *
 * The one rule: the player renders exactly ONCE and docking only changes its CSS — never move it
 * to another parent or portal it, or the video restarts from zero.
 * Frame: the dark mount ("ink"), since SoundPlex is a dark site. Used on /about (George's reel).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const FRAME_STYLE: "mount" | "overlay" | "ink" = "ink";

export default function FilmCard({
  poster,
  alt,
  label,
  caption,
  src,
  cta = "Watch",
  duration,
  endAction,
}: {
  
  poster: string;
  alt: string;
  
  label: string;
  
  caption: string;
  
  src?: string;
  
  cta?: string;
  
  duration?: string;
  
  endAction?: {
    href: string;
    label: string;
    
    note?: string;
  };
}) {
  const [playing, setPlaying] = useState(false);
  
  const [ended, setEnded] = useState(false);
  
  // A film that can't be fetched would set this; no onError handler is wired yet.
  const [missing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(0);

  
  const [docked, setDocked] = useState(false);
  
  const [forced, setForced] = useState(false);
  
  const [dismissed, setDismissed] = useState(false);
  
  const [anchorH, setAnchorH] = useState(0);

  
  
  const [side, setSide] = useState<"l" | "r">("r");
  const [pos, setPos] = useState<{ top: number } | null>(null);
  
  const [tucked, setTucked] = useState(false);
  const tabDrag = useRef<{
    startY: number;
    startTop: number;
    moved: boolean;
  } | null>(null);
  
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  
  const [custom, setCustom] = useState<{
    dx: number;
    dy: number;
    w: number;
  } | null>(null);
  const arrangeRef = useRef<{
    x: number;
    y: number;
    dx: number;
    dy: number;
    w: number;
    mode: "move" | "size";
  } | null>(null);
  
  const [canArrange, setCanArrange] = useState(false);
  
  const [barHover, setBarHover] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const sync = () => setCanArrange(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  
  const [sliding, setSliding] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  
  const videoDrag = useRef<{ x: number; y: number; moved: boolean } | null>(
    null,
  );

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  
  const film = missing ? undefined : src;
  const isEmbed = !!film && /youtube\.com|youtu\.be|vimeo\.com/.test(film);
  const mini = playing && (docked || forced) && !dismissed;

  
  useEffect(() => {
    if (!playing) return;
    const el = anchorRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const out = entry.intersectionRatio < 0.3;
        if (out) setAnchorH((h) => h || entry.boundingClientRect.height);
        setDocked(out);
        if (!out) {
          setDismissed(false);
          setTucked(false);
        }
      },
      { threshold: [0, 0.3, 1] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [playing]);

  
  useEffect(() => {
    if (!pos) return;
    const onResize = () => {
      const el = frameRef.current;
      if (!el) return;
      setPos((p) => (p ? { top: clampTop(p.top, el.offsetHeight) } : p));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  
  
  const slideTuck = useCallback((next: boolean) => {
    setSliding(true);
    setTucked(next);
    window.setTimeout(() => setSliding(false), 300);
  }, []);

  const finishDrag = useCallback(() => {
    dragStart.current = null;
    const r = frameRef.current?.getBoundingClientRect();
    if (r) {
      
      setPos({ top: clampTop(r.top, r.height) });

      
      if (r.right > window.innerWidth + 40) {
        setSide("r");
        slideTuck(true);
      } else if (r.left < -40) {
        setSide("l");
        slideTuck(true);
      } else {
        
        setSide(r.left + r.width / 2 < window.innerWidth / 2 ? "l" : "r");
      }
    }
    setDrag(null);
  }, []);

  
  useEffect(() => {
    if (!drag) return;
    const end = () => finishDrag();
    window.addEventListener("pointerup", end, true);
    window.addEventListener("pointercancel", end, true);
    return () => {
      window.removeEventListener("pointerup", end, true);
      window.removeEventListener("pointercancel", end, true);
    };
  }, [drag, finishDrag]);

  
  const startArrange = (e: React.PointerEvent, mode: "move" | "size") => {
    if (!canArrange || mini) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const w = custom?.w ?? frameRef.current?.offsetWidth ?? 368;
    arrangeRef.current = {
      x: e.clientX,
      y: e.clientY,
      dx: custom?.dx ?? 0,
      dy: custom?.dy ?? 0,
      w,
      mode,
    };
    setCustom({ dx: custom?.dx ?? 0, dy: custom?.dy ?? 0, w });
  };
  const moveArrange = (e: React.PointerEvent) => {
    const a = arrangeRef.current;
    if (!a) return;
    if (a.mode === "move") {
      setCustom({
        dx: a.dx + (e.clientX - a.x),
        dy: a.dy + (e.clientY - a.y),
        w: a.w,
      });
    } else {
      
      const grown = a.w + (a.x - e.clientX);
      const w = Math.min(
        Math.max(grown, 280),
        Math.min(window.innerWidth - 80, 900),
      );
      setCustom({ dx: a.dx - (w - a.w), dy: a.dy, w });
    }
  };
  const endArrange = () => {
    arrangeRef.current = null;
  };

  const onBarDown = (e: React.PointerEvent) => {
    if (!mini) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDrag({ dx: 0, dy: 0 });
  };
  const onBarMove = (e: React.PointerEvent) => {
    const s = dragStart.current;
    if (!s) return;
    setDrag({ dx: e.clientX - s.x, dy: e.clientY - s.y });
  };

  
  const closeFilm = () => {
    videoRef.current?.pause();
    setPlaying(false);
    setForced(false);
    setTucked(false);
    setDismissed(false);
    setCustom(null);
    setPos(null);
  };
  const minimizeFilm = () => {
    if (mini) {
      setForced(false);
      setDismissed(false);
      setTucked(false);
      anchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!playing) return;
    const el = anchorRef.current;
    if (el) setAnchorH((h) => h || el.offsetHeight);
    setSide("r");
    setPos(null);
    setDismissed(false);
    setForced(true);
  };
  const zoomFilm = () => {
    if (mini) {
      const el = stageRef.current;
      if (!el) return;
      if (document.fullscreenElement) void document.exitFullscreen();
      else void el.requestFullscreen?.();
      return;
    }
    if (custom) {
      setCustom(null);
      return;
    }
    const base = frameRef.current?.offsetWidth ?? 368;
    const w = Math.min(
      Math.max(Math.round(base * 1.6), 280),
      Math.min(window.innerWidth - 80, 900),
    );
    setCustom({ dx: -(w - base), dy: 0, w });
  };

  
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  const seekTo = (clientX: number, el: HTMLElement) => {
    const v = videoRef.current;
    if (!v || !total) return;
    const r = el.getBoundingClientRect();
    v.currentTime =
      Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * total;
  };

  
  const sideClass = side === "r" ? "right-4 sm:right-5" : "left-4 sm:left-5";
  const miniClass = mini
    ? 
      `isolate fixed z-[90] w-[min(22rem,78vw)] ${sideClass} ${
        // Above the site's "Live at SoundPlex" pill, which owns the bottom-right corner.
        pos === null ? "bottom-20" : ""
      }`
    : 
      "relative isolate";

  const pct = total ? (time / total) * 100 : 0;
  
  const overlaid = FRAME_STYLE === "overlay" && !mini;
  
  const dark = FRAME_STYLE === "ink";

  return (
    <figure className="w-full">
      <div
        ref={anchorRef}
        style={mini ? { height: anchorH || undefined } : undefined}
        className={mini ? "relative" : undefined}
      >
        {mini && (
          <div className="absolute inset-0 grid place-items-center rounded-[10px] border border-dashed border-white/15 bg-white/[0.02]">
            <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 px-4 text-center">
              <span className="font-[family-name:var(--font-lora)] text-[15px] italic text-white/60">
                Still playing, in the corner.
              </span>
              <button
                type="button"
                onClick={minimizeFilm}
                className="rounded-[4px] bg-[#d4a030] px-3.5 py-2 font-[family-name:var(--font-poppins)] text-[12.5px] font-semibold text-black transition-colors hover:bg-[#e2b34e]"
              >
                Bring it back
              </button>
            </span>
          </div>
        )}
        <div
          ref={frameRef}
          
          
          
          
          className={`${miniClass} ${
            
            !mini && custom ? "z-20" : ""
          }`}
          style={
            mini
              ? {
                  top: pos?.top,
                  
                  transform: drag
                    ? `translate(${drag.dx}px, ${drag.dy}px)`
                    : tucked
                      ? 
                        `translateX(calc(${side === "r" ? "100% + 1.5rem" : "-100% - 1.5rem"}))`
                      : undefined,
                  
                  transition: sliding ? "transform .28s ease" : undefined,
                  pointerEvents: tucked ? "none" : undefined,
                }
              : !mini && custom
                ? {
                    
                    transform: `translate(${custom.dx}px, ${custom.dy}px)`,
                    width: custom.w,
                    maxWidth: "none",
                  }
                : undefined
          }
        >
          <div
            
            // SoundPlex card: rounded, hairline border, the board's dark, a deep shadow when floating.
            // Square bottom-left corner: that's the resize grip's corner, so it reads as the
            // handle (Ed). Every other corner stays round.
            className={`group/card relative rounded-[10px] rounded-bl-none border ${
              dark ? "border-white/10 bg-[#0f0f0f]" : "border-white/10 bg-paper"
            } ${
              mini
                ? "shadow-[0_28px_70px_-20px_rgba(0,0,0,0.95),0_0_0_1px_rgba(212,160,48,0.18)]"
                : "shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)]"
            } ${overlaid ? "p-0" : ""}`}
          >

            {canArrange && !mini && (
              <span
                aria-hidden="true"
                
                
                
                className={`pointer-events-none absolute -top-6 right-5 z-30 flex items-center gap-1.5 transition-opacity duration-300 ${
                  barHover ? "opacity-100 delay-200" : "opacity-0 delay-0"
                }`}
              >
                <span className="font-[family-name:var(--font-lora)] whitespace-nowrap text-[14px] italic leading-none text-[#d4a030]">
                  drag to move
                </span>
                <svg
                  viewBox="0 0 22 16"
                  
                  className="h-4 w-[22px] shrink-0 stroke-[#d4a030]"
                  fill="none"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 7.6C8.5 6.6 15.2 7.8 19.4 13.4" />
                  <path d="M19.4 13.4 14.4 12.5M19.4 13.4 18.5 8.4" />
                </svg>
              </span>
            )}
            {!overlaid && (
              <div
                
                onPointerDown={(e) =>
                  mini ? onBarDown(e) : startArrange(e, "move")
                }
                onPointerMove={(e) => (mini ? onBarMove(e) : moveArrange(e))}
                onPointerUp={mini ? finishDrag : endArrange}
                onPointerCancel={mini ? finishDrag : endArrange}
                
                onPointerEnter={() => setBarHover(true)}
                onPointerLeave={() => setBarHover(false)}
                className={`flex h-10 select-none items-center gap-3 px-3.5 ${
                  
                  mini || canArrange
                    ? "cursor-grab touch-none active:cursor-grabbing"
                    : ""
                }`}
              >
                <span
                  onPointerDown={(e) => e.stopPropagation()}
                  
                  className="group/dots flex shrink-0 items-center gap-[7px]"
                >
                  {/* Three round lights, quiet until you reach for them: then close goes red and
                      the other two gold, with their marks showing. */}
                  <button
                    type="button"
                    aria-label="Close the film and put it back"
                    onClick={closeFilm}
                    className="grid h-3 w-3 place-items-center rounded-full bg-white/20 transition-colors group-hover/dots:bg-[#e5484d]"
                  >
                    <svg
                      viewBox="0 0 8 8"
                      aria-hidden="true"
                      fill="none"
                      stroke="rgba(250,244,230,0.9)"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      className="h-[6px] w-[6px] opacity-0 transition-opacity group-hover/dots:opacity-100"
                    >
                      <path d="m2 2 4 4M6 2 2 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label={
                      mini
                        ? "Bring the film back"
                        : "Send the film to the corner"
                    }
                    onClick={minimizeFilm}
                    className="grid h-3 w-3 place-items-center rounded-full bg-white/20 transition-colors group-hover/dots:bg-[#d4a030]"
                  >
                    <svg
                      viewBox="0 0 8 8"
                      aria-hidden="true"
                      fill="none"
                      stroke="rgba(26,20,16,0.7)"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      className="h-[6px] w-[6px] opacity-0 transition-opacity group-hover/dots:opacity-100"
                    >
                      <path d="M1.5 4h5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label={
                      mini
                        ? "Full screen"
                        : custom
                          ? "Back to its usual size"
                          : "Make the film bigger"
                    }
                    onClick={zoomFilm}
                    className="grid h-3 w-3 place-items-center rounded-full bg-white/20 transition-colors group-hover/dots:bg-[#d4a030]"
                  >
                    <svg
                      viewBox="0 0 8 8"
                      aria-hidden="true"
                      fill="rgba(250,244,230,0.9)"
                      className="h-[6px] w-[6px] opacity-0 transition-opacity group-hover/dots:opacity-100"
                    >
                      <path d="M6.9 1.1v3.6L3.3 1.1z" />
                      <path d="M1.1 6.9V3.3l3.6 3.6z" />
                    </svg>
                  </button>
                </span>
                <span className="mt-px min-w-0 flex-1 truncate font-[family-name:var(--font-poppins)] text-[11px] font-medium uppercase leading-none tracking-[0.16em] text-white/70">
                  {label}
                </span>
                {(mini || canArrange) && (
                  <span
                    aria-hidden="true"
                    
                    
                    className="ml-auto mr-px grid shrink-0 grid-cols-3 gap-[3px] opacity-30 transition-opacity group-hover/card:opacity-60"
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-[2.5px] w-[2.5px] rounded-full ${
                          dark ? "bg-[#e2b34e]" : "bg-[#d4a030]"
                        }`}
                      />
                    ))}
                  </span>
                )}
              </div>
            )}

            <div>
              <div
                ref={stageRef}
                
                
                className={`group relative aspect-video w-full overflow-hidden bg-black ${overlaid ? "rounded-[10px] rounded-bl-none" : "rounded-br-[10px]"}`}
              >
                {playing && film ? (
                  isEmbed ? (
                    <iframe
                      src={toEmbed(film)}
                      title={label}
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                      
                      className={`absolute inset-0 h-full w-full ${
                        drag ? "pointer-events-none" : ""
                      }`}
                    />
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        tabIndex={0}
                        
                        onKeyDown={(e) => {
                          const k = e.key.toLowerCase();
                          if (e.key === " " || k === "k") {
                            e.preventDefault();
                            togglePlay();
                          }
                          if (k === "m") {
                            const v = videoRef.current;
                            if (!v) return;
                            v.muted = !v.muted;
                            setMuted(v.muted);
                          }
                        }}
                        src={src}
                        poster={poster}
                        autoPlay
                        playsInline
                        
                        onClick={() => {
                          const moved = videoDrag.current?.moved;
                          videoDrag.current = null;
                          if (!moved) togglePlay();
                        }}
                        onPointerDown={(e) => {
                          if (!mini) return;
                          e.currentTarget.setPointerCapture(e.pointerId);
                          videoDrag.current = {
                            x: e.clientX,
                            y: e.clientY,
                            moved: false,
                          };
                        }}
                        onPointerMove={(e) => {
                          const v = videoDrag.current;
                          if (!mini || !v || e.buttons === 0) return;
                          const dx = e.clientX - v.x;
                          const dy = e.clientY - v.y;
                          if (!v.moved && Math.hypot(dx, dy) < 8) return;
                          v.moved = true;
                          setDrag({ dx, dy });
                        }}
                        onPointerUp={() => {
                          if (mini && videoDrag.current?.moved) finishDrag();
                        }}
                        onPlay={() => {
                          setPaused(false);
                          setEnded(false);
                        }}
                        onPause={() => setPaused(true)}
                        onEnded={() => setEnded(true)}
                        
                        onSeeked={(e) => {
                          const v = e.currentTarget;
                          if (v.duration && v.currentTime < v.duration - 0.5)
                            setEnded(false);
                        }}
                        onLoadedMetadata={(e) =>
                          setTotal(e.currentTarget.duration || 0)
                        }
                        onTimeUpdate={(e) =>
                          setTime(e.currentTarget.currentTime)
                        }
                        className={`absolute inset-0 h-full w-full cursor-pointer ${
                          mini ? "touch-none" : ""
                        }`}
                      />

                      {ended && endAction ? (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-start bg-gradient-to-b from-black/70 via-black/25 via-45% to-transparent to-60% pt-[5%]">
                          <Link
                            href={endAction.href}
                            className="group/end inline-flex items-center gap-2 rounded-[4px] bg-[#d4a030] px-5 py-3 font-[family-name:var(--font-poppins)] text-[14px] font-semibold text-black shadow-[0_10px_26px_-8px_rgba(0,0,0,0.7)] transition-colors duration-200 hover:bg-[#e2b34e]"
                          >
                            {endAction.label}
                            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform motion-safe:group-hover/end:translate-x-1">
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
                          </Link>
                          {endAction.note && (
                            <span className="mt-2 font-[family-name:var(--font-lora)] text-[14px] italic text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
                              {endAction.note}
                            </span>
                          )}
                        </div>
                      ) : paused && (
                        <button
                          type="button"
                          aria-label="Resume the film"
                          onClick={togglePlay}
                          className="group/resume absolute inset-0 z-10 grid place-items-center bg-black/25"
                        >
                          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#d4a030] text-black shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7)] transition-transform group-hover/resume:scale-105">
                            <PlayMark className="h-7 w-7 fill-current stroke-current" />
                          </span>
                        </button>
                      )}

                      <div
                        
                        className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent pb-2 pl-8 pr-3 pt-7 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 sm:pr-4"
                        style={paused ? { opacity: 1 } : undefined}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            aria-label={paused ? "Play" : "Pause"}
                            onClick={togglePlay}
                            className="shrink-0 text-white/90 transition-colors hover:text-[#e2b34e]"
                          >
                            {paused ? (
                              <PlayMark className="h-4 w-4 fill-current stroke-current" />
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                fill="currentColor"
                                className="h-4 w-4"
                              >
                                <path d="M7.5 5h3.5v14H7.5zM13 5h3.5v14H13z" />
                              </svg>
                            )}
                          </button>

                          <div
                            role="slider"
                            aria-label="Seek"
                            aria-valuemin={0}
                            aria-valuemax={Math.round(total)}
                            aria-valuenow={Math.round(time)}
                            tabIndex={0}
                            onPointerDown={(e) => {
                              e.currentTarget.setPointerCapture(e.pointerId);
                              seekTo(e.clientX, e.currentTarget);
                            }}
                            onPointerMove={(e) => {
                              if (e.buttons > 0)
                                seekTo(e.clientX, e.currentTarget);
                            }}
                            onKeyDown={(e) => {
                              const v = videoRef.current;
                              if (!v) return;
                              if (e.key === "ArrowRight") v.currentTime += 5;
                              if (e.key === "ArrowLeft") v.currentTime -= 5;
                            }}
                            className="relative h-4 flex-1 cursor-pointer touch-none"
                          >
                            <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/20">
                              <div
                                className="absolute inset-y-0 left-0 rounded-full bg-[#d4a030]"
                                style={{ width: `${pct}%` }}
                              />
                              <div
                                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4a030] shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
                                style={{ left: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {!mini && (
                            <span className="font-[family-name:var(--font-poppins)] tabular shrink-0 text-[12px] text-white/80">
                              {fmt(time)} /{" "}
                              {total ? fmt(total) : (duration ?? "")}
                            </span>
                          )}

                          <button
                            type="button"
                            aria-label={muted ? "Unmute" : "Mute"}
                            onClick={() => {
                              const v = videoRef.current;
                              if (!v) return;
                              v.muted = !v.muted;
                              setMuted(v.muted);
                            }}
                            className="shrink-0 text-white/75 transition-colors hover:text-[#e2b34e]"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M11 5 6 9H2v6h4l5 4V5z" />
                              {muted ? (
                                <path d="M22 9l-6 6M16 9l6 6" />
                              ) : (
                                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.4 5.6a9 9 0 0 1 0 12.8" />
                              )}
                            </svg>
                          </button>

                          <button
                            type="button"
                            aria-label="Full screen"
                            onClick={() => {
                              
                              const el = stageRef.current;
                              if (!el) return;
                              if (document.fullscreenElement)
                                void document.exitFullscreen();
                              else void el.requestFullscreen?.();
                            }}
                            className="shrink-0 text-white/75 transition-colors hover:text-[#e2b34e]"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  )
                ) : (
                  <>
                    {overlaid && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start gap-3 bg-gradient-to-b from-black/75 to-transparent px-3 pb-7 pt-2.5"
                      >
                        <span className="text-[10px] font-bold uppercase leading-[1.35] tracking-[0.2em] text-[#e2b34e]">
                          {label}
                        </span>
                        {duration && (
                          <span className="tabular ml-auto shrink-0 text-[12px] text-white/80">
                            {duration}
                          </span>
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPlaying(true)}
                      aria-label={film ? label : `${label} — not yet filmed`}
                      className="group absolute inset-0 block w-full"
                    >
                      <Image
                        src={poster}
                        alt={alt}
                        fill
                        sizes="(min-width: 1024px) 26rem, 100vw"
                        className="object-cover opacity-85 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
                      />
                      {/* A gold play button, and the word under it. */}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <span className="relative grid h-16 w-16 place-items-center">
                          {/* A slow gold ring breathing out from the button (Ed): an invitation,
                              not an alarm. Off for reduced motion. */}
                          <span aria-hidden className="absolute inset-0 rounded-full bg-[#d4a030]/60 motion-safe:animate-[sp-pulse_2.2s_ease-out_infinite]" />
                          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-[#d4a030] text-black shadow-[0_12px_34px_-8px_rgba(0,0,0,0.75)] transition-transform duration-300 group-hover:scale-110">
                            <PlayMark className="h-8 w-8 fill-current stroke-current" />
                          </span>
                        </span>
                        <span className="flex items-center gap-2 rounded-[3px] bg-black/55 px-3 py-1 font-[family-name:var(--font-poppins)] text-[12px] font-semibold text-white backdrop-blur">
                          {film ? cta : "Film coming"}
                          {film && duration && <span className="tabular font-normal text-white/70">· {duration}</span>}
                        </span>
                      </span>
                    </button>
                  </>
                )}
              </div>
              {canArrange && !mini && (
                <>
                  <span
                    role="separator"
                    aria-label="Resize the film"
                    onPointerDown={(e) => startArrange(e, "size")}
                    onPointerMove={moveArrange}
                    onPointerUp={endArrange}
                    onPointerCancel={endArrange}
                    // z-20: with the card's old padding gone, this corner now sits ON the video,
                    // under its controls bar (z-10), which was swallowing the grab (Ed).
                    className="group/grip absolute bottom-0 left-0 z-20 grid h-7 w-7 cursor-nesw-resize touch-none place-items-end justify-items-start p-[3px]"
                  >
                    <svg
                      viewBox="0 0 10 10"
                      aria-hidden="true"
                      className="h-[9px] w-[9px] stroke-[#d4a030] opacity-60 transition-opacity duration-300 group-hover/card:opacity-80 group-hover/grip:opacity-100"
                      fill="none"
                      strokeWidth="1"
                      strokeLinecap="round"
                    >
                      <path d="M0.5 2.5 7.5 9.5" />
                      <path d="M0.5 5.5 4.5 9.5" />
                      <path d="M0.5 8.5 1.5 9.5" />
                    </svg>
                  </span>
                  <span
                    aria-hidden="true"
                    
                    
                    className="pointer-events-none absolute -bottom-7 left-3 flex items-center gap-1.5 opacity-0 transition-opacity delay-0 duration-300 group-hover/card:opacity-100 group-hover/card:delay-200"
                  >
                    <svg
                      viewBox="0 0 22 16"
                      className="h-4 w-[22px] shrink-0 stroke-[#d4a030]"
                      fill="none"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 8.4C13.5 9.4 6.8 8.2 2.6 2.6" />
                      <path d="M2.6 2.6 7.6 3.5M2.6 2.6 3.5 7.6" />
                    </svg>
                    <span className="font-[family-name:var(--font-lora)] whitespace-nowrap text-[14px] italic leading-none text-[#d4a030]">
                      grab to resize
                    </span>
                    <svg
                      viewBox="0 0 10 10"
                      aria-hidden="true"
                      
                      className="-mt-[2px] h-[11px] w-[11px] shrink-0 stroke-[#d4a030]"
                      fill="none"
                      strokeWidth="1"
                      strokeLinecap="round"
                    >
                      <path d="M0.5 2.5 7.5 9.5" />
                      <path d="M0.5 5.5 4.5 9.5" />
                      <path d="M0.5 8.5 1.5 9.5" />
                    </svg>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {mini && tucked && (
        <button
          type="button"
          aria-label="Bring the film back (drag to move it)"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const rect = e.currentTarget.getBoundingClientRect();
            tabDrag.current = {
              startY: e.clientY,
              startTop: pos?.top ?? rect.top - 8,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            const t = tabDrag.current;
            if (!t || e.buttons === 0) return;
            const dy = e.clientY - t.startY;
            if (Math.abs(dy) > 4) t.moved = true;
            const h = frameRef.current?.offsetHeight ?? 220;
            const top = Math.min(
              Math.max(t.startTop + dy, 8),
              window.innerHeight - h - 8,
            );
            
            setPos({ top });
          }}
          onClick={() => {
            
            const moved = tabDrag.current?.moved;
            tabDrag.current = null;
            if (!moved) slideTuck(false);
          }}
          style={pos === null ? undefined : { top: pos.top }}
          className={`group/tab fixed z-[91] flex touch-none select-none flex-col items-center gap-2 border border-white/15 bg-[#0f0f0f] px-2 py-3.5 shadow-[0_14px_36px_-12px_rgba(0,0,0,0.85)] transition-colors hover:border-[#d4a030]/60 ${
            pos === null ? "bottom-24" : ""
          } ${side === "r" ? "right-0 rounded-l-[8px] border-r-0" : "left-0 rounded-r-[8px] border-l-0"}`}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            
            className={`h-3.5 w-3.5 text-[#d4a030] transition-transform duration-200 ease-out ${
              side === "r"
                ? "rotate-180 motion-safe:group-hover/tab:-translate-x-1"
                : "motion-safe:group-hover/tab:translate-x-1"
            }`}
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
          <span
            className="font-[family-name:var(--font-poppins)] text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/75"
            style={{ writingMode: "vertical-rl" }}
          >
            Reel
          </span>
        </button>
      )}

      <figcaption className="sr-only">
        {film ? caption : `${caption} — being filmed now.`}
      </figcaption>
    </figure>
  );
}

function clampTop(top: number, height: number): number {
  const MARGIN = 20;
  const SNAP = 56;
  const lo = MARGIN;
  const hi = Math.max(MARGIN, window.innerHeight - height - MARGIN);
  if (top < lo + SNAP) return lo;
  if (top > hi - SNAP) return hi;
  return Math.min(Math.max(top, lo), hi);
}

function PlayMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      strokeWidth="2.2"
      strokeLinejoin="round"
      className={className}
    >
      {/* Optically centered: the box sits a hair right of center so the triangle's mass
          (not its box) lands in the middle of a round button. */}
      <path d="M7.5 4.5v15l12.5-7.5z" />
    </svg>
  );
}

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function toEmbed(url: string): string {
  const yt =
    /youtu\.be\/([\w-]{6,})/.exec(url) ??
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/.exec(url);
  if (yt) {
    return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1`;
  }
  return url;
}
