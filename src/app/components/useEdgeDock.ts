"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Shared behaviour for the review widgets (VariantToggle, SpeedBadge): a
 * panel pinned to one screen edge that can be dragged anywhere — open, or
 * closed by its edge tab — and snaps to the nearest side at the height it
 * was dropped, the same feel as the intro video's mini-player. Side + height
 * are remembered per browser.
 *
 * `grip` goes on the open panel's handle, `tabGrip` on the edge tab. A press
 * that moves < 8px is a tap (the caller's onClick still fires — check
 * `wasDrag()` there to skip it after a real drag); more is a drag.
 */
export function useEdgeDock(key: string, defaults: { side: "l" | "r"; topVh?: number; topPx?: number; bottomPx?: number }) {
  const [side, setSide] = useState<"l" | "r">(defaults.side);
  const [top, setTop] = useState<number | null>(null); // px from viewport top; null = default
  const [drag, setDrag] = useState<{ dx: number; dy: number; what: "panel" | "tab" } | null>(null);
  const start = useRef<{ x: number; y: number; what: "panel" | "tab"; el: HTMLElement } | null>(null);
  const moved = useRef(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(`${key}-pos`) ?? "null");
        if (saved && (saved.side === "l" || saved.side === "r")) {
          setSide(saved.side);
          if (typeof saved.top === "number") setTop(saved.top);
        }
      } catch {}
    });
    return () => cancelAnimationFrame(raf);
  }, [key]);

  const finish = () => {
    const s = start.current;
    start.current = null;
    const r = s?.el.getBoundingClientRect();
    if (r) {
      const y = Math.min(Math.max(r.top, 8), window.innerHeight - r.height - 8);
      const nextSide: "l" | "r" = r.left + r.width / 2 < window.innerWidth / 2 ? "l" : "r";
      setTop(y);
      setSide(nextSide);
      try {
        localStorage.setItem(`${key}-pos`, JSON.stringify({ side: nextSide, top: y }));
      } catch {}
    }
    setDrag(null);
  };

  // One set of handlers for both grips; the element says which it is via
  // data-dock="panel" | "tab" (keeps ref access inside event handlers only).
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    const what = (e.currentTarget.dataset.dock === "tab" ? "tab" : "panel") as "panel" | "tab";
    start.current = { x: e.clientX, y: e.clientY, what, el: e.currentTarget };
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const s = start.current;
    if (!s || e.buttons === 0) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!moved.current && Math.hypot(dx, dy) < 8) return;
    moved.current = true;
    setDrag({ dx, dy, what: s.what });
  };
  const onPointerUp = () => {
    if (start.current && moved.current) finish();
    else start.current = null;
  };
  const gripHandlers = { onPointerDown, onPointerMove, onPointerUp };

  const wasDrag = () => moved.current;

  // The tab sits at `top`; the open panel is usually taller than the tab, so
  // near the bottom of the screen it's pulled up to stay fully on screen
  // (it's still tucked/untucked at the same edge, just opens upward).
  const [panelTop, setPanelTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const fit = () => {
      const h = el.offsetHeight;
      const base = top === null ? (defaults.topPx ?? (window.innerHeight * (defaults.topVh ?? 50)) / 100) : top;
      setPanelTop(Math.max(8, Math.min(base, window.innerHeight - h - 8)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [top, side, defaults.topVh, defaults.topPx]);

  // Until it's been dragged, a bottomPx default anchors to the bottom edge instead.
  const topStyle: CSSProperties =
    top !== null
      ? { top }
      : defaults.bottomPx !== undefined
        ? { bottom: defaults.bottomPx }
        : defaults.topPx !== undefined
          ? { top: defaults.topPx }
          : { top: `${defaults.topVh ?? 50}vh` };
  const panelTopStyle: CSSProperties = panelTop === null ? topStyle : { top: panelTop };
  const move = (what: "panel" | "tab"): CSSProperties =>
    drag && drag.what === what ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : {};

  return {
    side,
    drag,
    frameRef,
    grip: { ...gripHandlers, "data-dock": "panel" as const },
    tabGrip: { ...gripHandlers, "data-dock": "tab" as const },
    wasDrag,
    panelStyle: { ...panelTopStyle, ...move("panel") },
    tabStyle: { ...topStyle, ...move("tab") },
  };
}
