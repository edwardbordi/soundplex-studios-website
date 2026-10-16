import Link from "next/link";
import Image from "next/image";
import Reveal from "../Reveal";
import ForwardArrow from "../ForwardArrow";
import type { RoomEntry } from "../../../lib/rooms/rooms";

/** The four rooms as cards — photo, name, one line, the facts strip, two links. */
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
              {r.rates[0] && <p className="rm__rate">From {r.rates[0].replace(/\s*·.*$/, "")}</p>}
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
