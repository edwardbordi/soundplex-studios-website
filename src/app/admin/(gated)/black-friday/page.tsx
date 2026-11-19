import { Card, LinkButton, PageHeader } from "@realiizlabs/admin/shell";
import { studio } from "@/lib/admin/studio";
import { SITE_TIMEZONE } from "@/lib/site-config";
import {
  blackFridayReport,
  OFFER_END,
  PLACES,
  type Report,
  type Source,
} from "@/lib/black-friday/report";

/**
 * Studio → Black Friday: the campaign report, read from the HighLevel account at request
 * time (src/lib/black-friday/report.ts). Read-only. Temporary: remove with the campaign.
 */

const n = (v: number) => v.toLocaleString("en-US");
const money = (v: number) =>
  v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
const pct = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : "";
const dayLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
const clock = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: SITE_TIMEZONE,
  });

const muted = { color: "var(--text-muted)" } as const;
const mono = { fontFamily: "var(--rz-font-mono)" } as const;

function Tile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div
      className="rounded-[var(--rz-radius,10px)] border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <p
        className="text-xs tracking-wide uppercase"
        style={{ ...muted, ...mono }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-3xl font-semibold tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      {note ? (
        <p className="mt-1 text-sm" style={muted}>
          {note}
        </p>
      ) : null}
    </div>
  );
}

function Problem({ what, error }: { what: string; error: string }) {
  return (
    <p className="text-sm" style={muted}>
      Couldn’t read {what}. {error}
    </p>
  );
}

function Bar({
  label,
  value,
  max,
  note,
}: {
  label: string;
  value: number;
  max: number;
  note?: string;
}) {
  const width =
    max > 0 ? Math.max((value / max) * 100, value > 0 ? 1.5 : 0) : 0;
  return (
    <div className="grid grid-cols-[9rem_1fr_auto] items-center gap-3 py-1.5 text-sm">
      <span>{label}</span>
      <span
        className="h-2.5 overflow-hidden rounded-full"
        style={{ background: "var(--surface-2)" }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${width}%`, background: "var(--signal)" }}
        />
      </span>
      <span className="min-w-28 text-right tabular-nums">
        {n(value)}
        {note ? <span style={muted}> · {note}</span> : null}
      </span>
    </div>
  );
}

const value = <T,>(s: Source<T>): T | null => (s.ok ? s.data : null);

function Body({ report, debug }: { report: Report; debug: boolean }) {
  const emails = value(report.emails);
  const texts = value(report.texts);
  const calls = value(report.calls);
  const pipeline = value(report.pipeline);
  const audience = value(report.audience);
  const sold = pipeline?.won ?? 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Emails delivered"
          value={emails ? n(emails.delivered) : "–"}
          note={
            emails
              ? emails.hasEngagement
                ? `${n(emails.opened)} opened · ${n(emails.clicked)} clicked`
                : `${n(emails.sent)} sent`
              : "Couldn’t read emails"
          }
        />
        <Tile
          label="Texts sent"
          value={texts ? n(texts.sent) : "–"}
          note={
            texts
              ? `${n(texts.replies)} ${texts.replies === 1 ? "reply" : "replies"}`
              : "Couldn’t read texts"
          }
        />
        <Tile
          label="Calls booked"
          value={calls ? n(calls.booked) : "–"}
          note={
            calls
              ? `${n(calls.held)} held · ${n(calls.upcoming)} coming up`
              : "Couldn’t read the calendar"
          }
        />
        <Tile
          label="Sites sold"
          value={pipeline ? `${n(sold)} of ${PLACES}` : "–"}
          note={
            pipeline
              ? `${n(Math.max(PLACES - sold, 0))} places left through your page`
              : "Couldn’t read the pipeline"
          }
        />
      </div>

      <Card title="From email to sale" className="mt-6">
        {emails ? (
          <>
            {audience?.tagged != null ? (
              <Bar
                label="On the list"
                value={audience.tagged}
                max={Math.max(audience.tagged, emails.sent)}
              />
            ) : null}
            <Bar
              label="Emails delivered"
              value={emails.delivered}
              max={Math.max(audience?.tagged ?? 0, emails.delivered)}
            />
            {emails.hasEngagement ? (
              <>
                <Bar
                  label="Opened"
                  value={emails.opened}
                  max={emails.delivered}
                  note={pct(emails.opened, emails.delivered)}
                />
                <Bar
                  label="Clicked"
                  value={emails.clicked}
                  max={emails.delivered}
                  note={pct(emails.clicked, emails.delivered)}
                />
              </>
            ) : null}
            {calls ? (
              <Bar
                label="Calls booked"
                value={calls.booked}
                max={emails.delivered}
              />
            ) : null}
            {calls ? (
              <Bar
                label="Calls held"
                value={calls.held}
                max={emails.delivered}
              />
            ) : null}
            {pipeline ? (
              <Bar
                label="Sites sold"
                value={pipeline.won}
                max={emails.delivered}
              />
            ) : null}
            <p className="mt-3 text-sm" style={muted}>
              Emails are counted once per message, so someone who gets three
              emails counts three times. Bars from “Calls booked” down are small
              on purpose: they share the scale of the emails above them.
              {emails.hasEngagement
                ? ""
                : " Opens and clicks aren’t shown because HighLevel didn’t report any for these emails."}
            </p>
          </>
        ) : (
          <Problem
            what="emails"
            error={report.emails.ok ? "" : report.emails.error}
          />
        )}
      </Card>

      <Card title="Day by day" meta="Newest first" className="mt-6">
        <div className="rz-table-wrap">
          <table className="rz-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Emails</th>
                <th>Opened</th>
                <th>Clicked</th>
                <th>Texts</th>
                <th>Booked</th>
                <th>Held</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {report.days.map((d) => (
                <tr key={d.day}>
                  <td className="rz-fit">{dayLabel(d.day)}</td>
                  <td>{emails ? n(d.sent) : "–"}</td>
                  <td>{emails?.hasEngagement ? n(d.opened) : "–"}</td>
                  <td>{emails?.hasEngagement ? n(d.clicked) : "–"}</td>
                  <td>{texts ? n(d.texts) : "–"}</td>
                  <td>{calls ? n(d.booked) : "–"}</td>
                  <td>{calls ? n(d.held) : "–"}</td>
                  <td>{pipeline ? n(d.sold) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm" style={muted}>
          Opened and Clicked sit on the day the email was sent. Booked is the
          day someone picked a time; Held is the day of the call. Texts are
          every text sent from the account that day.
        </p>
      </Card>

      <Card title="Each email" className="mt-6">
        {emails ? (
          emails.messages.length ? (
            <div className="rz-table-wrap">
              <table className="rz-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>First sent</th>
                    <th>Sent</th>
                    <th>Delivered</th>
                    <th>Opened</th>
                    <th>Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.messages.map((m) => (
                    <tr key={m.subject}>
                      <td>{m.subject}</td>
                      <td className="rz-fit">{dayLabel(m.first)}</td>
                      <td>{n(m.sent)}</td>
                      <td>{n(m.delivered)}</td>
                      <td>
                        {emails.hasEngagement
                          ? `${n(m.opened)} · ${pct(m.opened, m.delivered)}`
                          : "–"}
                      </td>
                      <td>
                        {emails.hasEngagement
                          ? `${n(m.clicked)} · ${pct(m.clicked, m.delivered)}`
                          : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm" style={muted}>
              No campaign emails have gone out yet.
            </p>
          )
        ) : (
          <Problem
            what="emails"
            error={report.emails.ok ? "" : report.emails.error}
          />
        )}
        {emails?.truncated ? (
          <p className="mt-3 text-sm" style={muted}>
            There were more emails than one load can read, so these counts are a
            little low.
          </p>
        ) : null}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Calls">
          {calls ? (
            <div className="rz-table-wrap">
              <table className="rz-table">
                <tbody>
                  <tr>
                    <td>Booked</td>
                    <td>{n(calls.booked)}</td>
                  </tr>
                  <tr>
                    <td>Coming up</td>
                    <td>{n(calls.upcoming)}</td>
                  </tr>
                  <tr>
                    <td>Held</td>
                    <td>{n(calls.held)}</td>
                  </tr>
                  <tr>
                    <td>No-show</td>
                    <td>{n(calls.noShow)}</td>
                  </tr>
                  <tr>
                    <td>Cancelled</td>
                    <td>{n(calls.cancelled)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <Problem
              what="the calendar"
              error={report.calls.ok ? "" : report.calls.error}
            />
          )}
          <p className="mt-3 text-sm" style={muted}>
            A call counts as held once its appointment is marked “Showed” in
            HighLevel.
          </p>
        </Card>

        <Card title="Pipeline and money" meta={pipeline?.name}>
          {pipeline ? (
            <>
              <div className="rz-table-wrap">
                <table className="rz-table">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Open</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeline.stages.map((s) => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td>{n(s.open)}</td>
                        <td>{s.value ? money(s.value) : "–"}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>Won</td>
                      <td>{n(pipeline.won)}</td>
                      <td>{money(pipeline.wonValue)}</td>
                    </tr>
                    <tr>
                      <td>Lost</td>
                      <td>{n(pipeline.lost)}</td>
                      <td>–</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm">
                Sold so far: <strong>{money(pipeline.wonValue)}</strong>. Your
                share: <strong>{money(pipeline.share)}</strong>.
              </p>
              <p className="mt-1 text-sm" style={muted}>
                Your share is 20% of each payment plus $150 a site, shown here
                as if every sale is paid in full. A sale counts once its
                opportunity is marked Won, with the value set to the amount
                sold.
              </p>
            </>
          ) : (
            <Problem
              what="the pipeline"
              error={report.pipeline.ok ? "" : report.pipeline.error}
            />
          )}
        </Card>
      </div>

      {texts === null && !report.texts.ok ? (
        <div className="mt-6">
          <Problem what="texts" error={report.texts.error} />
        </div>
      ) : null}

      <p className="mt-6 text-sm" style={muted}>
        Read from your HighLevel account at {clock(report.generatedAt)}. Numbers
        are kept for up to 15 minutes; Refresh reads them again. Nothing on this
        page changes anything in HighLevel.
      </p>

      {debug ? (
        <Card title="Field names (for your web team)" className="mt-6">
          <pre className="overflow-x-auto text-xs" style={mono}>
            {Object.entries(report.shapes)
              .map(([k, v]) => `${k}: ${v.join(", ")}`)
              .join("\n\n") || "No records came back."}
          </pre>
        </Card>
      ) : null}
    </>
  );
}

export default async function BlackFridayPage({
  searchParams,
}: {
  searchParams: Promise<{ fresh?: string; debug?: string }>;
}) {
  await studio.requireAdmin();
  const { fresh, debug } = await searchParams;
  const report = await blackFridayReport(Boolean(fresh));
  const ends = new Date(OFFER_END - 1).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: SITE_TIMEZONE,
  });

  return (
    <>
      <PageHeader
        eyebrow="Campaign"
        title="Black Friday"
        subtitle={`The website offer, from the first email to the sale. Ends ${ends}.`}
        actions={
          report ? (
            <LinkButton
              href={`/admin/black-friday?fresh=${report.generatedAt}`}
              variant="secondary"
              size="sm"
            >
              Refresh
            </LinkButton>
          ) : null
        }
      />
      {report ? (
        <Body report={report} debug={Boolean(debug)} />
      ) : (
        <Card title="The report isn’t connected yet">
          <p>
            Add these to the site’s environment variables (in Vercel: Settings,
            then Environment Variables), then redeploy:
          </p>
          <ul className="mt-2 list-disc pl-6 font-mono text-sm">
            <li>HIGHLEVEL_TOKEN</li>
            <li>HIGHLEVEL_LOCATION_ID</li>
          </ul>
        </Card>
      )}
    </>
  );
}
