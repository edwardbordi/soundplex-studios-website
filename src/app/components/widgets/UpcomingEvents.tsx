import Link from "next/link";
import Reveal from "../Reveal";
import ForwardArrow from "../ForwardArrow";
import type { EventCard } from "../../../lib/events/public";

/** The next few public productions, compact. Used on the home, room pages and membership. */
export default function UpcomingEvents({ events, heading = "What’s on", more = true }: { events: EventCard[]; heading?: string; more?: boolean }) {
  if (events.length === 0) return null;
  return (
    <section className="up" aria-labelledby="up-h">
      <Reveal>
        <div className="up__head">
          <h2 id="up-h" className="up__h">{heading}</h2>
          {more && <Link href="/studio-productions" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">Everything that’s on<ForwardArrow /></Link>}
        </div>
      </Reveal>
      <ol className="up__list">
        {events.map((e, i) => (
          <li key={e.slug}>
            <Reveal delay={i * 60}>
              <Link href={`/studio-productions/${e.slug}`} className="up__item">
                <span className="up__date"><span>{e.weekday}</span><strong>{e.day}</strong><span>{e.month}</span></span>
                <span className="up__text">
                  <span className="up__kind">{e.kindLabel} · {e.roomName}{e.price ? ` · ${e.price}` : ""}</span>
                  <span className="up__title">{e.title}</span>
                  <span className="up__when">{e.whenText}</span>
                </span>
                <ForwardArrow />
              </Link>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
