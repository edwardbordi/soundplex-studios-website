"use client";

import Image from "next/image";
import ForwardArrow from "../ForwardArrow";
import BackArrow from "../BackArrow";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MEMBERS, CONNECTIONS, type Member, type Connection } from "../../../../content/wall/members";

/**
 * The Connection Wall — George's idea: a wall of member portraits; pick one and you get
 * their story, what they offer, what they're looking for, and (with permission) the
 * collaborations that started here.
 *
 * The interaction is a camera move, not a panel: tap a face and the whole wall glides in
 * until that portrait is large in front of you, the rest still there round the edges,
 * dimmed; the story fades in beside it. Tap one of their connections and the camera pans
 * along the thread to the other person, with the three steps of the story. "Back to the
 * wall" pulls out. It's the same language as the hero — you move through the place.
 *
 * Data lives in content/wall/members.ts. Adding a member is one portrait and one entry.
 */

const ZOOM_MS = 950;

type View = { x: number; y: number; s: number };
const HOME: View = { x: 0, y: 0, s: 1 };

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

export default function ConnectionWall() {
  const stageRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [active, setActive] = useState<Member | null>(null);
  const [story, setStory] = useState<Connection | null>(null);
  const [view, setView] = useState<View>(HOME);
  const [threads, setThreads] = useState<
    { a: string; b: string; x1: number; y1: number; x2: number; y2: number; d: string }[]
  >([]);
  const [hover, setHover] = useState<string | null>(null);
  const autoTimer = useRef<number | null>(null);

  const byId = useMemo(() => Object.fromEntries(MEMBERS.map((m) => [m.id, m])), []);
  const connectionsOf = useCallback(
    (id: string) => CONNECTIONS.filter((c) => c.permission && c.between.includes(id)),
    [],
  );

  // Thread geometry, in the plane's own (untransformed) coordinates, so the SVG scales
  // with the wall. A thread runs frame-edge to frame-edge — never across a face — and the
  // dots sit ON the frame border, so two neighbours still show a line between them.
  // Recomputed on resize.
  const measure = useCallback(() => {
    const plane = planeRef.current;
    if (!plane) return;
    const GAP = 0.5; // the gold ring is a 1px box-shadow outside the frame's box: its centre
    // Exact (fractional) rects, not offsetLeft/offsetWidth — those round to whole pixels
    // and the dots drift by up to half a pixel. Everything is divided by the plane's
    // current scale so a re-measure while zoomed still lands in plane coordinates.
    const pr = plane.getBoundingClientRect();
    const scale = plane.offsetWidth ? pr.width / plane.offsetWidth : 1;
    const frameRect = (id: string) => {
      const f = tileRefs.current[id]?.querySelector<HTMLElement>(".wall__frame");
      if (!f) return null;
      const r = f.getBoundingClientRect();
      const w = r.width / scale;
      const h = r.height / scale;
      return {
        cx: (r.left - pr.left) / scale + w / 2,
        cy: (r.top - pr.top) / scale + h / 2,
        hw: w / 2 + GAP,
        hh: h / 2 + GAP,
      };
    };
    // Where the line from this frame's centre toward `to` leaves the frame, and the
    // outward normal of the side it leaves through — the curve departs square-on.
    const edge = (r: NonNullable<ReturnType<typeof frameRect>>, to: { cx: number; cy: number }) => {
      const dx = to.cx - r.cx;
      const dy = to.cy - r.cy;
      const tx = dx !== 0 ? r.hw / Math.abs(dx) : Infinity;
      const ty = dy !== 0 ? r.hh / Math.abs(dy) : Infinity;
      const t = Math.min(tx, ty);
      const side = tx < ty ? "x" : "y";
      return {
        x: r.cx + dx * t,
        y: r.cy + dy * t,
        nx: side === "x" ? Math.sign(dx) : 0,
        ny: side === "y" ? Math.sign(dy) : 0,
      };
    };
    setThreads(
      CONNECTIONS.filter((c) => c.permission)
        .map((c) => {
          const ra = frameRect(c.between[0]);
          const rb = frameRect(c.between[1]);
          if (!ra || !rb) return null;
          const p = edge(ra, rb);
          const q = edge(rb, ra);
          // A cubic whose handles push out along each frame's normal: neighbours read as
          // an almost-straight wire, far pairs on other rows as a smooth S.
          const dist = Math.hypot(q.x - p.x, q.y - p.y);
          const k = Math.max(28, dist * 0.42);
          const d =
            `M ${p.x} ${p.y} C ${p.x + p.nx * k} ${p.y + p.ny * k}, ` +
            `${q.x + q.nx * k} ${q.y + q.ny * k}, ${q.x} ${q.y}`;
          return { a: c.between[0], b: c.between[1], x1: p.x, y1: p.y, x2: q.x, y2: q.y, d };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    );
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // The camera: scale the plane so the chosen tile is large, and translate so it lands
  // left-of-centre on desktop (story on the right) or top-centre on a phone (story below).
  const flyTo = useCallback((id: string) => {
    const stage = stageRef.current;
    const tile = tileRefs.current[id];
    if (!stage || !tile) return;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const phone = W < 861;
    const cx = tile.offsetLeft + tile.offsetWidth / 2;
    const cy = tile.offsetTop + tile.offsetHeight / 2;
    // Phone: the portrait takes ~44% of the width and sits in the top fifth, leaving the
    // lower ~58% of the stage for the card (which is capped at that and scrolls).
    const s = phone ? (W * 0.44) / tile.offsetWidth : (H * 0.66) / tile.offsetHeight;
    const tx = phone ? W * 0.5 : W * 0.3;
    const ty = phone ? H * 0.2 : H * 0.5;
    setView({ x: tx - s * cx, y: ty - s * cy, s });
  }, []);

  const open = useCallback(
    (m: Member) => {
      setStory(null);
      setActive(m);
      flyTo(m.id);
    },
    [flyTo],
  );

  const follow = useCallback(
    (c: Connection) => {
      if (!active) return;
      const otherId = c.between[0] === active.id ? c.between[1] : c.between[0];
      setStory(c);
      setActive(byId[otherId]);
      flyTo(otherId);
    },
    [active, byId, flyTo],
  );

  const close = useCallback(() => {
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    setActive(null);
    setStory(null);
    setView(HOME);
  }, []);

  // "Show me one": a random thread, played as the camera would — to the first person,
  // a beat, then along the thread to the second with the story.
  const showOne = useCallback(() => {
    const pool = CONNECTIONS.filter((c) => c.permission);
    const c = pool[Math.floor(Math.random() * pool.length)];
    const a = byId[c.between[0]];
    setStory(null);
    setActive(a);
    flyTo(a.id);
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    autoTimer.current = window.setTimeout(() => {
      setStory(c);
      setActive(byId[c.between[1]]);
      flyTo(c.between[1]);
    }, ZOOM_MS + 1400);
  }, [byId, flyTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const zoomed = active !== null;
  const activeThreads = active ? connectionsOf(active.id) : [];
  const storyFrom = story ? byId[story.between[0]] : null;
  const storyTo = story ? byId[story.between[1]] : null;

  return (
    <section className="wall" aria-labelledby="wall-title">
      <div className="mx-auto max-w-6xl px-6">
        <p className="wall__eyebrow">The Plex Collective</p>
        <h2 id="wall-title" className="wall__title">
          Everyone on this wall <em>met here.</em>
        </h2>
        <div className="wall__lede">
          <p>Tap a face. Follow a thread.</p>
          <button type="button" className="wall__show" onClick={showOne}>
            Show me one
          </button>
        </div>
      </div>

      <div ref={stageRef} className={`wall__stage${zoomed ? " is-zoomed" : ""}${story ? " has-story" : ""}`}>
        {/* The wall — a plane the camera moves over. Tiles keep their layout positions;
            only the plane's transform changes, so the move reads as one camera glide. */}
        <div
          ref={planeRef}
          className="wall__plane"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}
        >
          {/* Two thread layers: the LINES run behind the tiles, the DOTS sit in front on
              the frame borders. Same geometry, same visibility classes. */}
          {(["lines", "dots"] as const).map((layer) => (
            <svg key={layer} className={`wall__threads wall__threads--${layer}`} aria-hidden>
              {threads.map((t) => {
                const lit = active && (t.a === active.id || t.b === active.id);
                const hov = !active && hover && (t.a === hover || t.b === hover);
                const isStory = story && story.between.includes(t.a) && story.between.includes(t.b);
                const cls = `${lit ? " is-lit" : ""}${hov ? " is-hover" : ""}${isStory ? " is-story" : ""}`;
                return (
                  <g key={`${t.a}-${t.b}`} className={`wall__thread${cls}`}>
                    {layer === "lines" ? (
                      <path d={t.d} className="wall__thread-line" />
                    ) : (
                      <>
                        {/* Only the dot on the OTHER person's frame breathes — the one on
                            the card you're reading stays still. */}
                        <circle cx={t.x1} cy={t.y1} r={2.75} className={`wall__thread-dot${active && t.a !== active.id ? " is-far" : ""}`} />
                        <circle cx={t.x2} cy={t.y2} r={2.75} className={`wall__thread-dot${active && t.b !== active.id ? " is-far" : ""}`} />
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          ))}

          {MEMBERS.map((m) => {
            const isActive = active?.id === m.id;
            const linked = active ? connectionsOf(active.id).some((c) => c.between.includes(m.id)) : false;
            return (
              <button
                key={m.id}
                type="button"
                ref={(el) => {
                  tileRefs.current[m.id] = el;
                }}
                className={`wall__tile${isActive ? " is-active" : ""}${linked ? " is-linked" : ""}`}
                onClick={() => (isActive ? close() : open(m))}
                onMouseEnter={() => setHover(m.id)}
                onMouseLeave={() => setHover(null)}
                aria-pressed={isActive}
                aria-label={`${m.name}, ${m.role}`}
              >
                <span className="wall__frame">
                  {m.portrait ? (
                    <Image src={m.portrait} alt={`${m.name}, ${m.role}`} fill sizes="(max-width: 860px) 33vw, 16vw" className="wall__photo" />
                  ) : (
                    <span className="wall__initials" aria-hidden>
                      {initials(m.name)}
                    </span>
                  )}
                </span>
                <span className="wall__name">{m.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* The story — not part of the plane, so it doesn't scale. Fades in once the
            camera has arrived. */}
        {active && (
          <aside className={`wall__card${story ? " has-story" : ""}`} aria-live="polite">
            {story && storyFrom && storyTo ? (
              <>
                <p className="wall__card-eyebrow wall__card-eyebrow--pair">
                  <span>{storyFrom.name.split(" ")[0]}</span>
                  <ForwardArrow />
                  <span>{storyTo.name.split(" ")[0]}</span>
                </p>
                <ol className="wall__steps">
                  {story.steps.map((s, i) => (
                    <li key={i}>
                      <span className="wall__step-n">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <p className="wall__card-eyebrow" style={{ marginTop: 22 }}>
                  {active.name}
                </p>
                <p className="wall__role">{active.role}</p>
              </>
            ) : (
              <>
                <p className="wall__card-eyebrow">{active.role}</p>
                <h3 className="wall__card-title">{active.name}</h3>
                <p className="wall__story">{active.story}</p>
                <dl className="wall__facts">
                  <dt>I offer</dt>
                  <dd>{active.offer}</dd>
                  <dt>I&rsquo;m looking for</dt>
                  <dd>{active.looking}</dd>
                </dl>
              </>
            )}

            {activeThreads.length > 0 && (
              <div className="wall__links">
                <p className="wall__card-eyebrow">Connected here</p>
                {activeThreads.map((c) => {
                  const otherId = c.between[0] === active.id ? c.between[1] : c.between[0];
                  const other = byId[otherId];
                  return (
                    <button key={otherId} type="button" className="wall__link group" onClick={() => follow(c)}>
                      <span className="wall__link-name">{other.name}</span>
                      <span className="wall__link-role">{other.role}</span>
                      <span className="wall__link-arrow">
                        <ForwardArrow />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <button type="button" className="wall__back group" onClick={close}>
              <BackArrow />
              Back to the wall
            </button>
          </aside>
        )}
      </div>
    </section>
  );
}
