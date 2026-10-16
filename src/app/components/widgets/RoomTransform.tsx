"use client";

/**
 * "One Room. Endless Possibilities." (George's #3). One photograph of the WoodRoom from one
 * angle; tap a night and the room becomes it — the same frame, re-dressed. The looks are the
 * hero's states for now (workshop nights); the music / comedy / wedding / screening frames
 * come from the same Nano Banana pipeline (design-process/flythrough/HERO-V2.md). Each look
 * links to the survey with that occasion pre-selected.
 */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ForwardArrow from "../ForwardArrow";

export type Look = { id: string; label: string; image: string; alt: string; line: string; href: string };

export default function RoomTransform({ looks, heading, lede }: { looks: Look[]; heading: string; lede: string }) {
  const [active, setActive] = useState(0);
  const look = looks[active];
  return (
    <section className="rt" aria-labelledby="rt-h">
      <div className="mx-auto max-w-6xl px-6">
        <p className="page-head__eyebrow">One room. Endless possibilities.</p>
        <h2 id="rt-h" className="page-head__title" style={{ fontSize: "clamp(1.7rem,3.6vw,2.8rem)" }}>{heading}</h2>
        <p className="page-head__lede">{lede}</p>
        <div className="rt__stage">
          <div className="rt__frame">
            {looks.map((l, i) => (
              <Image key={l.id} src={l.image} alt={i === active ? l.alt : ""} fill sizes="(max-width: 1152px) 100vw, 1152px" className={`rt__img${i === active ? " is-active" : ""}`} priority={i === 0} />
            ))}
            <div className="rt__caption">
              <p className="rt__caption-line">{look.line}</p>
              <Link href={look.href} className="evp__btn group">Plan this night<ForwardArrow /></Link>
            </div>
          </div>
          <div className="rt__tabs" role="tablist" aria-label="What the room can be">
            {looks.map((l, i) => (
              <button key={l.id} role="tab" aria-selected={i === active} className={`rt__tab${i === active ? " is-active" : ""}`} onClick={() => setActive(i)} onMouseEnter={() => setActive(i)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
