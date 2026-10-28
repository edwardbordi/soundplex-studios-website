import Link from "next/link";
import Image from "next/image";
import Reveal from "../Reveal";
import ForwardArrow from "../ForwardArrow";
import type { RoomEntry } from "../../../lib/rooms/rooms";

/** "$150" — the lowest hourly rate in the room file; the same "From" the room page shows. */
function lowestRate(rates: string[]): string | null {
  const n = rates.map((x) => Number(x.match(/\$(\d[\d,]*)/)?.[1]?.replace(/,/g, ""))).filter((v) => v > 0).sort((a, b) => a - b)[0];
  return n ? `$${n}` : null;
}

/** The three rooms as cards — photo, name, one line, the facts strip, two links. */
export default function RoomCards({ rooms }: { rooms: RoomEntry[] }) {
  return (
    <div className="rm__grid">
      {rooms.map(({ frontmatter: r }, i) => (
        <Reveal key={r.slug} delay={i * 60}>
          <article className="rm__card">
            <Link href={`/rooms/${r.slug}`} className="rm__photo" aria-label={r.name}>
              <Image src={r.heroImage} alt={r.heroImageAlt} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
            </Link>
            <div className="rm__card-body">
              <p className="rm__label">{[r.capacity && `${r.capacity}${/\d$/.test(r.capacity) ? " people" : ""}`, r.size].filter(Boolean).join(" · ")}</p>
              <h3 className="rm__name"><Link href={`/rooms/${r.slug}`}>{r.name}</Link></h3>
              <p className="rm__tag">{r.tagline}</p>
              {lowestRate(r.rates) && <p className="rm__rate">From {lowestRate(r.rates)}/hr</p>}
              <div className="rm__links">
                <Link href={`/rooms/${r.slug}`} className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">See the room<ForwardArrow /></Link>
                <Link href={`/start?path=room&room=${r.slug}`} className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">Book it<ForwardArrow /></Link>
              </div>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
