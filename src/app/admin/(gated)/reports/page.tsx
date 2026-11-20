import Link from "next/link";
import { ForwardArrow, PageHeader, StatusPill } from "@realiizlabs/admin/shell";
import { studio } from "@/lib/admin/studio";
import { SITE_TIMEZONE } from "@/lib/site-config";
import { OFFER_END } from "@/lib/black-friday/report";

/**
 * Studio → Reports: one card per custom report. Adding a report = a folder beside this file
 * and an entry in REPORTS. Kept light on purpose: no report's data is loaded here.
 */
const REPORTS = [
  {
    href: "/admin/reports/black-friday",
    title: "Black Friday",
    description:
      "The website offer, from the first email to the sale: messages sent, what visitors do on the offer page, calls booked, sites sold and your share.",
    ends: OFFER_END,
  },
];

export default async function ReportsPage() {
  await studio.requireAdmin();
  return (
    <>
      <PageHeader title="Reports" subtitle="Live numbers for your campaigns." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => {
          const until = new Date(r.ends - 1).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            timeZone: SITE_TIMEZONE,
          });
          const running = new Date().getTime() < r.ends;
          return (
            <Link
              key={r.href}
              href={r.href}
              className="group flex flex-col rounded-[var(--rz-radius,12px)] border p-5 no-underline transition-colors hover:border-[var(--signal)]"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-1)",
                color: "inherit",
              }}
            >
              <span className="flex items-center justify-between gap-3">
                <span
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {r.title}
                </span>
                <StatusPill tone={running ? "up" : "neutral"}>
                  {running ? `Running until ${until}` : `Ended ${until}`}
                </StatusPill>
              </span>
              <span
                className="mt-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {r.description}
              </span>
              <span
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Open report <ForwardArrow />
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
