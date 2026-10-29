import { eventWhen } from "@realiizlabs/admin/events";
import { getAllEvents, getEventBySlug } from "../../../../lib/events/events";
import { SITE_NAME, SITE_TIMEZONE, SITE_URL } from "../../../../lib/site-config";

/** /studio-productions/<slug>/invite.ics — "Add to calendar". Public events only. */
export function generateStaticParams() {
  return getAllEvents().filter((e) => e.frontmatter.visibility === "public").map((e) => ({ slug: e.frontmatter.slug }));
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getEventBySlug(slug);
  if (!item || item.frontmatter.visibility !== "public") return new Response("Not found", { status: 404 });
  const fm = item.frontmatter;
  const when = eventWhen(fm, { defaultZone: SITE_TIMEZONE });
  const end = when.end ?? new Date(when.start.getTime() + 2 * 3600 * 1000);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${SITE_NAME}//EN`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${fm.slug}@soundplexstudios.com`,
    `DTSTAMP:${stamp(new Date())}`,
    when.allDay ? `DTSTART;VALUE=DATE:${fm.date.replace(/-/g, "")}` : `DTSTART:${stamp(when.start)}`,
    when.allDay ? "" : `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(fm.title)}`,
    `DESCRIPTION:${esc(`${fm.summary}\n${SITE_URL}/studio-productions/${fm.slug}`)}`,
    `LOCATION:${esc(`${SITE_NAME}, 6713 Rudderow Ave, Pennsauken, NJ 08109`)}`,
    `URL:${SITE_URL}/studio-productions/${fm.slug}`,
    fm.cancelled ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean);
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${fm.slug}.ics"` },
  });
}
