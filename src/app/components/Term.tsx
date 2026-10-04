"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/**
 * Inline jargon term with a plain-English definition shown in a tooltip.
 *
 * Interaction model (works on every input type — this is the whole point):
 *  - Desktop mouse: definition appears on hover (mouseenter/leave).
 *  - Touch: a tap toggles the definition; tapping elsewhere or the term again
 *    dismisses it.
 *  - Keyboard: the term is a real <button>; focusing it (focus-visible) shows
 *    the definition, blurring or Escape hides it.
 *  - Screen readers: a visually-hidden copy of the definition is always in the
 *    DOM and linked via aria-describedby, so it's announced when the term is
 *    focused — independent of the visual bubble.
 *
 * Why it's not just "hover + click toggle": a touch tap makes the browser fire
 * *compatibility* mouse events (mouseenter) AND a click. Naively, mouseenter
 * would open and the click would immediately toggle it back closed — so taps
 * would never stick on a phone. We guard against that: a touchstart sets a
 * short-lived flag that suppresses the synthetic hover, click only toggles when
 * that flag is set (i.e. a real tap), and focus only opens for keyboard
 * (:focus-visible) so it doesn't fight the tap either.
 *
 * Why a portal: the bubble used to render inside the term's card, so any
 * ancestor with overflow:hidden / clip / a stacking context (e.g. the rounded
 * Four Corners grid) sliced it off at the card edge. It now renders into
 * document.body via a portal — escaping every ancestor clip — and is positioned
 * against the term with getBoundingClientRect (position: fixed). It tracks the
 * term on scroll/resize while open and flips above the term when there isn't
 * room below, so it can never be clipped by a container.
 *
 * The affordance is a subtle dotted underline in a muted tone that shifts to the
 * signal blue on hover/focus.
 */

const WIDTH = 272; // px — fixed bubble width for predictable positioning
const GAP = 8; // px — space between the term and the bubble
const MARGIN = 8; // px — keep the bubble this far from the viewport edges

type Pos = {
  top: number;
  left: number;
  width: number;
  caretLeft: number;
  placement: "above" | "below";
};

export default function Term({
  children,
  definition,
}: {
  children: ReactNode;
  definition: string;
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false); // positioned + faded in
  const [mounted, setMounted] = useState(false); // portal target available (client)
  const [pos, setPos] = useState<Pos>({
    top: 0,
    left: 0,
    width: WIDTH,
    caretLeft: WIDTH / 2,
    placement: "below",
  });

  // A <span>, not a <button>: buttons are atomic inline boxes that can
  // never break across lines, so a multi-word term dragged the whole
  // phrase onto a new line mid-sentence. A span wraps like normal text;
  // role/tabIndex/keydown below preserve the button semantics.
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tooltipId = useId();

  // Portal target (document.body) only exists after client mount; one-shot flag, no cascade.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Position the bubble against the term in viewport (fixed) coordinates.
  //
  // Tunables (declared above): WIDTH is the bubble's preferred width, clamped
  // down to whatever the viewport can fit minus MARGIN on each side. GAP is the
  // vertical breathing room between the term and the bubble. MARGIN is the
  // minimum distance the bubble is allowed to sit from any viewport edge.
  //
  // Vertical edge-flip: we measure free space below (vh - r.bottom) and above
  // (r.top) the term. We open *below* when the bubble fully fits there
  // (spaceBelow >= tipH + GAP), or — if it fits neither side — on whichever side
  // simply has more room (spaceBelow >= spaceAbove). Otherwise we flip *above*.
  // The chosen `top` is then floored at MARGIN so an above-placement can't run
  // off the top of the screen.
  //
  // Horizontal clamp: the bubble is centered on the term, then `left` is clamped
  // into [MARGIN, vw - width - MARGIN] so it never crosses a side edge. Because
  // that clamp can push the body away from the term's center, the caret is
  // positioned independently (caretLeft) and held 14px in from either end so it
  // still points at the term without poking past the rounded corners.
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    // A wrapped term (the whole reason the trigger is a <span>) has a
    // bounding rect spanning the full paragraph width — centering on that
    // parks the bubble nowhere near the word. Anchor on the widest line
    // fragment instead.
    const rects = Array.from(trigger.getClientRects());
    const r =
      rects.length > 1
        ? rects.reduce((a, b) => (b.width > a.width ? b : a))
        : trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(WIDTH, vw - 2 * MARGIN);
    const tipH = tipRef.current?.offsetHeight ?? 0;

    const spaceBelow = vh - r.bottom;
    const spaceAbove = r.top;
    const placement: "above" | "below" =
      spaceBelow >= tipH + GAP || spaceBelow >= spaceAbove ? "below" : "above";

    const top =
      placement === "below" ? r.bottom + GAP : Math.max(MARGIN, r.top - GAP - tipH);

    const centerX = r.left + r.width / 2;
    const left = Math.max(MARGIN, Math.min(centerX - width / 2, vw - width - MARGIN));
    const caretLeft = Math.max(14, Math.min(centerX - left, width - 14));

    setPos({ top, left, width, caretLeft, placement });
  }, []);

  // While open: position now, re-measure next frame (height known), and keep it
  // glued to the term on scroll/resize. Capture-phase scroll catches scrolling
  // inside any ancestor, not just the window.
  useLayoutEffect(() => {
    if (!open) {
      // Closing: reset the fade so the next open re-measures (edge-flip) before showing.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(false);
      return;
    }
    updatePosition();
    const raf = requestAnimationFrame(() => {
      updatePosition();
      setReady(true);
    });
    const onMove = () => updatePosition();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, updatePosition]);

  // Dismiss on outside pointerdown / Escape while open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || tipRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(touchTimer.current), []);

  // Mark "a touch just happened" so the synthetic mouse events it triggers are
  // ignored by the hover handlers for a short window.
  const markTouched = () => {
    touchedRef.current = true;
    clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => {
      touchedRef.current = false;
    }, 600);
  };

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-describedby={tooltipId}
        aria-expanded={open}
        onTouchStart={markTouched}
        onClick={() => {
          // Only a genuine tap toggles; mouse/keyboard are handled by hover/focus.
          if (touchedRef.current) setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          // Button parity for keyboard users (span doesn't get this free).
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        onMouseEnter={() => {
          if (!touchedRef.current) setOpen(true);
        }}
        onMouseLeave={() => {
          if (!touchedRef.current) setOpen(false);
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        className="cursor-help text-inherit underline decoration-dotted decoration-current/50 underline-offset-4 transition-colors hover:decoration-signal focus-visible:rounded-xs focus-visible:decoration-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        {children}
      </span>

      {/* Always-present description for assistive tech, independent of the visual
          bubble's mount state. */}
      <span id={tooltipId} className="sr-only">
        {definition}
      </span>

      {/* Visual bubble — portaled to <body> so no ancestor can clip it. */}
      {mounted &&
        open &&
        // border-white/15 keeps a visible edge on dark navy sections (where the
        // dark bubble would otherwise blend in); shadow-lg lifts it off light
        // bone sections. Together the boundary always reads.
        createPortal(
          <div
            ref={tipRef}
            aria-hidden="true"
            className={`pointer-events-none fixed z-1000 rounded-lg border border-white/15 bg-ink px-5 py-4 text-left text-sm font-normal leading-snug text-bone shadow-lg transition-opacity duration-150 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <span
              aria-hidden="true"
              className="absolute h-2 w-2 rotate-45 rounded-xs bg-ink"
              style={{
                left: pos.caretLeft,
                marginLeft: -4,
                ...(pos.placement === "below" ? { top: -4 } : { bottom: -4 }),
              }}
            />
            {definition}
          </div>,
          // Portal into a themed scope element when one exists
          // (a .theme-dark class there flips the ink/bone vars, so the bubble
          // follows any light/dark toggle). Everywhere else the
          // scope is absent and this is document.body, unchanged.
          document.getElementById("theme-scope") ?? document.body,
        )}
    </>
  );
}
