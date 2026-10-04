import Link from "next/link";
import { eventWhen, formatWhen, kindOf } from "@realiizlabs/admin/events";
import ForwardArrow from "../components/ForwardArrow";
import OutboundArrow from "../components/OutboundArrow";
import { ORGANIZATION_ID, SITE_URL } from "../../lib/site-config";
import type { EventItem } from "../../lib/events/schema";

/**
 * One event in the list: a date block on the left, the details on the right;
 * one column under 640px. Canceled and rescheduled events keep their place and
 * say so. The row links inward to the event's own page; outbound links live there.
 *
 * A plain, honest default — restyle freely, the data shape is the contract.
 */
export function EventRow({ fm, zone, past = false }: { fm: EventItem; zone: string; past?: boolean }) {
  const when = eventWhen(fm, { defaultZone: zone });
  const day = new Intl.DateTimeFormat("en-US", { timeZone: when.zone, weekday: "short", day: "numeric", month: "short" }).formatToParts(when.start);
  const part = (t: string) => day.find((p) => p.type === t)?.value ?? "";
  const kind = kindOf(fm);
  const cancelled = fm.cancelled === true;

  return (
    <article id={fm.slug} className={`grid gap-4 py-8 sm:grid-cols-[5.5rem_1fr] sm:gap-8 ${past ? "opacity-80" : ""}`}>
      <div className="flex items-baseline gap-2 sm:block sm:text-center" aria-hidden="true">
        <div className="font-mono-label text-xs uppercase tracking-[0.14em] text-slate">{part("weekday")}</div>
        <div className="font-display text-3xl font-semibold leading-none text-ink sm:mt-1">{part("day")}</div>
        <div className="font-mono-label text-xs uppercase tracking-[0.14em] text-slate sm:mt-1">{part("month")}</div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {kind && <Chip>{kind}</Chip>}
          {cancelled && <Chip tone="warn">Canceled</Chip>}
          {!cancelled && fm.rescheduledTo && <Chip tone="warn">Rescheduled</Chip>}
        </div>
        <h3 className={`font-display mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl ${cancelled ? "line-through decoration-slate/60" : ""}`}>
          <Link href={`/events/${fm.slug}`} className="transition-colors hover:text-signal-strong">{fm.title}</Link>
        </h3>
        <p className="mt-1 text-sm text-slate">
          <time dateTime={when.start.toISOString()}>{formatWhen(when)}</time>
          {fm.location && <> · {fm.location}</>}
        </p>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate">{fm.summary}</p>
        {cancelled && fm.cancelledNote && <p className="mt-2 text-sm text-amber">{fm.cancelledNote}</p>}
        {!cancelled && fm.rescheduledTo && (
          <p className="mt-2 text-sm text-slate">
            Moved — see <a href={`#${fm.rescheduledTo}`} className="text-signal-strong transition-colors hover:text-ink">the new date</a>.
          </p>
        )}
        <div className="mt-4">
          <Link href={`/events/${fm.slug}`} className="group font-mono-label inline-flex items-center gap-2 text-sm font-medium text-signal-strong transition-colors hover:text-ink">
            Details
            <ForwardArrow />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** The outbound links for an event — detail page only; the list links inward. */
export function EventLinks({ fm }: { fm: EventItem }) {
  if (!fm.url) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
      <a href={fm.url} target="_blank" rel="noreferrer" className="group font-mono-label inline-flex items-center gap-1 text-sm text-signal-strong transition-colors hover:text-ink">
        Event website
        <OutboundArrow />
      </a>
    </div>
  );
}

function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "warn" }) {
  const cls = tone === "warn" ? "border-amber/60 text-amber" : "border-line text-slate";
  return <span className={`font-mono-label inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] ${cls}`}>{children}</span>;
}

/** schema.org Event. Dates carry the zone offset via toISOString on the resolved instant. */
export function eventJsonLd(fm: EventItem, zone: string): Record<string, unknown> {
  const when = eventWhen(fm, { defaultZone: zone });
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: fm.title,
    description: fm.summary,
    startDate: when.allDay ? fm.date : when.start.toISOString(),
    ...(when.end ? { endDate: when.end.toISOString() } : {}),
    eventStatus: fm.cancelled ? "https://schema.org/EventCancelled" : fm.rescheduledTo ? "https://schema.org/EventRescheduled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: /online/i.test(fm.location ?? "") ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    ...(fm.location ? { location: { "@type": "Place", name: fm.location } } : {}),
    organizer: { "@id": ORGANIZATION_ID },
    url: `${SITE_URL}/events/${fm.slug}`,
    ...(fm.url ? { sameAs: fm.url } : {}),
  };
}
