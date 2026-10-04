import type { ReactNode } from "react";

/**
 * Widens a post visual beyond the 680px reading column without causing
 * horizontal scroll. Centers on the same axis as the (mx-auto) article column
 * and grows to ~920px, capped at the viewport minus a small gutter.
 *
 * Drop a visual inside <Breakout> when it benefits from more room than the
 * prose measure (charts, wide tables). On narrow screens it resolves to roughly
 * full width — a modest, intentional breakout. Shared by all post visuals.
 */
export default function Breakout({ children }: { children: ReactNode }) {
  return (
    <div className="visual-reset relative left-1/2 w-[min(var(--w-visual),calc(100vw-2rem))] -translate-x-1/2">
      {children}
    </div>
  );
}
