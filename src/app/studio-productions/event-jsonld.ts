import { eventWhen } from "@realiizlabs/admin/events";
import { ORGANIZATION_ID, SITE_NAME, SITE_TIMEZONE, SITE_URL } from "../../lib/site-config";
import type { EventItem } from "../../lib/events/schema";
import { ROOM_NAMES } from "../../lib/events/public";

/** schema.org Event with the full venue address and an Offer when there's a price/ticket URL. */
export function eventJsonLd(fm: EventItem): Record<string, unknown> {
  const when = eventWhen(fm, { defaultZone: SITE_TIMEZONE });
  const priceNum = fm.price ? Number((fm.price.match(/\d+(\.\d+)?/) ?? [])[0]) : NaN;
  const free = /free/i.test(fm.price ?? "");
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: fm.title,
    description: fm.summary,
    startDate: when.allDay ? fm.date : when.start.toISOString(),
    ...(when.end ? { endDate: when.end.toISOString() } : {}),
    eventStatus: fm.cancelled ? "https://schema.org/EventCancelled" : fm.rescheduledTo ? "https://schema.org/EventRescheduled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: `${ROOM_NAMES[fm.venue ?? "wood-room"] ?? "SoundPlex"}, ${SITE_NAME}`,
      address: { "@type": "PostalAddress", streetAddress: "6713 Rudderow Ave", addressLocality: "Pennsauken", addressRegion: "NJ", postalCode: "08109", addressCountry: "US" },
    },
    organizer: fm.producer && fm.producer !== "SoundPlex" ? { "@type": "Organization", name: fm.producer } : { "@id": ORGANIZATION_ID },
    ...(fm.heroImage ? { image: `${SITE_URL}${fm.heroImage}` } : {}),
    url: `${SITE_URL}/studio-productions/${fm.slug}`,
    ...(fm.url || fm.price
      ? {
          offers: {
            "@type": "Offer",
            ...(fm.url ? { url: fm.url } : {}),
            ...(free ? { price: 0, priceCurrency: "USD" } : Number.isFinite(priceNum) ? { price: priceNum, priceCurrency: "USD" } : {}),
            availability: fm.closed ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          },
        }
      : {}),
  };
}
