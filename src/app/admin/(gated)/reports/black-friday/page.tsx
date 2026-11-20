import Link from "next/link";
import {
  Card,
  LinkButton,
  PageHeader,
  StatusPill,
} from "@realiizlabs/admin/shell";
import { studio } from "@/lib/admin/studio";
import { SITE_TIMEZONE } from "@/lib/site-config";
import {
  blackFridayReport,
  OFFER_END,
  PLACES,
  type Journey,
  type PageStats,
  type Report,
  type Source,
} from "@/lib/black-friday/report";

/**
 * Studio → Reports → Black Friday: the campaign report, read from the HighLevel account at request
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

const when = (ms: number) =>
  new Date(ms).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: SITE_TIMEZONE,
  });
const STATUS: Record<string, string> = {
  confirmed: "Booked",
  new: "Booked",
  showed: "Held",
  noshow: "No-show",
  cancelled: "Cancelled",
  invalid: "Cancelled",
};

/** Studio's disclosure look: a small chevron that points right when closed and turns down when open. */
const SUMMARY =
  "flex cursor-pointer list-none items-center gap-2 select-none [&::-webkit-details-marker]:hidden";
const CHEVRON =
  "inline-block h-[.4rem] w-[.4rem] shrink-0 -rotate-45 border-r-[1.5px] border-b-[1.5px] border-current transition-transform";

const muted = { color: "var(--text-muted)" } as const;
const mono = { fontFamily: "var(--rz-font-mono)" } as const;

type Tab = "overview" | "page" | "visitors" | "money" | "notes";
const TABS: [Tab, string][] = [
  ["overview", "Overview"],
  ["page", "The page"],
  ["visitors", "Visitors"],
  ["money", "Messages and money"],
  ["notes", "Notes"],
];
const href = (tab: Tab, extra = "") =>
  `/admin/reports/black-friday?tab=${tab}${extra}`;

const EMAIL_COLOR = "var(--signal)";
const TEXT_COLOR = "var(--series-blue)";
const box = { background: "var(--surface-2)" } as const;
const strong = { color: "var(--text-primary)" } as const;

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
      <p className="mt-2 text-3xl font-semibold tabular-nums" style={strong}>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[var(--rz-radius,10px)] px-3 py-2.5 text-center"
      style={box}
    >
      <p className="text-xl font-semibold tabular-nums" style={strong}>
        {value}
      </p>
      <p className="mt-0.5 text-xs" style={muted}>
        {label}
      </p>
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

/** One bar row. `parts` stacks several colours in the one bar (emails + texts); `detail` is the quiet text after the number. */
function Bar({
  label,
  value,
  max,
  detail,
  parts,
}: {
  label: string;
  value: number;
  max: number;
  detail?: string;
  parts?: { value: number; color: string }[];
}) {
  const segments = (parts ?? [{ value, color: EMAIL_COLOR }]).filter(
    (part) => part.value > 0,
  );
  const width = (v: number) => (max > 0 ? Math.max((v / max) * 100, 1.5) : 0);
  return (
    <div className="grid grid-cols-[12rem_1fr_11rem] items-center gap-3 py-1.5 text-sm max-sm:grid-cols-[8rem_1fr_auto]">
      <span className="whitespace-nowrap max-sm:whitespace-normal">
        {label}
      </span>
      <span className="flex h-2.5 overflow-hidden rounded-full" style={box}>
        {segments.map((part, i) => (
          <span
            key={i}
            className="block h-full"
            style={{ width: `${width(part.value)}%`, background: part.color }}
          />
        ))}
      </span>
      <span className="text-right whitespace-nowrap tabular-nums">
        {n(value)}
        {detail ? <span style={muted}> · {detail}</span> : null}
      </span>
    </div>
  );
}

/** A bar row with its numbers in fixed columns (visits, share of all visits, time), so they line up down the card. */
function Reach({
  label,
  value,
  max,
  time = "",
}: {
  label: string;
  value: number;
  max: number;
  time?: string;
}) {
  const width = max > 0 && value > 0 ? Math.max((value / max) * 100, 1.5) : 0;
  return (
    <div className="grid grid-cols-[12rem_1fr_3rem_3.5rem_4rem] items-center gap-3 py-1.5 text-sm max-sm:grid-cols-[7rem_1fr_2.5rem_3rem]">
      <span className="whitespace-nowrap max-sm:whitespace-normal">
        {label}
      </span>
      <span className="h-2.5 overflow-hidden rounded-full" style={box}>
        <span
          className="block h-full rounded-full"
          style={{ width: `${width}%`, background: EMAIL_COLOR }}
        />
      </span>
      <span className="text-right tabular-nums">{n(value)}</span>
      <span className="text-right tabular-nums" style={muted}>
        {pct(value, max) || "0%"}
      </span>
      <span className="text-right tabular-nums max-sm:hidden" style={muted}>
        {time}
      </span>
    </div>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

const value = <T,>(s: Source<T>): T | null => (s.ok ? s.data : null);

/** The offer page's sections, top to bottom, in plain words. */
const SECTIONS: [string, string][] = [
  ["deal", "The offer (top of page)"],
  ["why-now", "Why now"],
  ["package", "The package"],
  ["pay", "Ways to pay"],
  ["how", "How it works"],
  ["reasons", "What you get"],
  ["builds", "Member sites"],
  ["preview", "The preview"],
  ["book", "The calendar"],
];
const sectionLabel = (id: string) =>
  SECTIONS.find(([key]) => key === id)?.[1] ?? id;
const duration = (seconds: number) =>
  seconds >= 60
    ? `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
    : `${Math.round(seconds)}s`;

const OUTCOMES = [
  "booked",
  "started",
  "clicked",
  "read",
  "skimmed",
  "left",
] as const;
const OUTCOME: Record<
  string,
  { label: string; tone: "up" | "info" | "neutral" | "warn" }
> = {
  booked: { label: "Booked a call", tone: "up" },
  started: { label: "Started booking", tone: "info" },
  clicked: { label: "Clicked to book", tone: "info" },
  read: { label: "Read the page", tone: "neutral" },
  skimmed: { label: "Skimmed", tone: "neutral" },
  left: { label: "Left at the top", tone: "warn" },
};
const DEVICE: Record<string, string> = {
  mobile: "Phone",
  tablet: "Tablet",
  desktop: "Computer",
};

/* ───────────── Overview ───────────── */

function Overview({ report }: { report: Report }) {
  const emails = value(report.emails);
  const texts = value(report.texts);
  const calls = value(report.calls);
  const pipeline = value(report.pipeline);
  const audience = value(report.audience);
  const page = report.page?.ok ? report.page.data : null;
  const sold = pipeline?.won ?? 0;
  const sent = (emails?.delivered ?? 0) + (texts?.delivered ?? 0);
  const queued = audience?.tagged ?? null;
  const scale = Math.max(queued ?? 0, sent);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Messages sent"
          value={emails ? n(sent) : "–"}
          note={
            emails
              ? `${n(emails.delivered)} emails · ${n(texts?.delivered ?? 0)} texts`
              : "Couldn’t read emails"
          }
        />
        {page ? (
          <Tile
            label="Visits to the offer page"
            value={n(page.visits)}
            note={`${n(page.visitors)} ${page.visitors === 1 ? "person" : "people"} · ${n(page.bookClicks)} clicked to book`}
          />
        ) : (
          <Tile
            label="Replies to texts"
            value={texts ? n(texts.replies) : "–"}
            note={texts ? `${n(texts.sent)} texts sent` : "Couldn’t read texts"}
          />
        )}
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
              ? `${n(Math.max(PLACES - sold, 0))} places left`
              : "Couldn’t read the pipeline"
          }
        />
      </div>

      <Card title="From message to sale" className="mt-6">
        {emails ? (
          <>
            {queued != null ? (
              <Bar label="Queued by the campaign" value={queued} max={scale} />
            ) : null}
            <Bar
              label="Messages sent"
              value={sent}
              max={scale}
              parts={[
                { value: emails.delivered, color: EMAIL_COLOR },
                { value: texts?.delivered ?? 0, color: TEXT_COLOR },
              ]}
            />
            {page ? (
              <Bar label="Visited the page" value={page.visits} max={scale} />
            ) : null}
            {page ? (
              <Bar
                label="Clicked to book"
                value={page.bookClicks}
                max={scale}
                detail={
                  pct(page.bookClicks, page.visits)
                    ? `${pct(page.bookClicks, page.visits)} of visits`
                    : undefined
                }
              />
            ) : null}
            {page ? (
              <Bar
                label="Started booking"
                value={page.calendarStarted}
                max={scale}
              />
            ) : null}
            {calls ? (
              <Bar label="Calls booked" value={calls.booked} max={scale} />
            ) : null}
            {calls ? (
              <Bar label="Calls held" value={calls.held} max={scale} />
            ) : null}
            {pipeline ? (
              <Bar label="Sites sold" value={pipeline.won} max={scale} />
            ) : null}
            <p
              className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm"
              style={muted}
            >
              <Key
                color={EMAIL_COLOR}
                label={`Emails · ${n(emails.delivered)}`}
              />
              <Key
                color={TEXT_COLOR}
                label={
                  texts
                    ? `Texts · ${n(texts.delivered)}`
                    : "Texts · couldn’t read"
                }
              />
            </p>
          </>
        ) : (
          <Problem
            what="emails"
            error={report.emails.ok ? "" : report.emails.error}
          />
        )}
      </Card>

      <Card title="Day by day" className="mt-6">
        <div className="rz-table-wrap">
          <table className="rz-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Emails</th>
                <th>Texts</th>
                {page ? <th>Visits</th> : null}
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
                  <td>{texts ? n(d.texts) : "–"}</td>
                  {page ? <td>{n(d.visits)}</td> : null}
                  <td>{calls ? n(d.booked) : "–"}</td>
                  <td>{calls ? n(d.held) : "–"}</td>
                  <td>{pipeline ? n(d.sold) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/* ───────────── The page ───────────── */

function NoPage({ report }: { report: Report }) {
  return (
    <Card title="Nothing from the offer page yet">
      {report.page && !report.page.ok ? (
        <Problem what="visits to the offer page" error={report.page.error} />
      ) : (
        <p className="text-sm">
          Visits show up here once the page statistics are connected and someone
          has opened the page.
        </p>
      )}
    </Card>
  );
}

/** The statistics label each click with what it was; these are the words shown for each kind. */
const CLICK_KINDS: [string, string][] = [
  ["Button: ", "Book button"],
  ["Opened: ", "Opened a member’s website"],
  ["Link: ", "Menu or link on the page"],
];

function ThePage({ report }: { report: Report }) {
  const page: PageStats | null = report.page?.ok ? report.page.data : null;
  const b = page?.behavior;
  if (!page || !b || page.visits === 0) return <NoPage report={report} />;
  const share = (v: number) => pct(v, page.visits) || "0%";
  const quarter = b.scroll.find((x) => x.percent === 25)?.visits ?? 0;
  const bottom = b.scroll.find((x) => x.percent >= 90)?.visits ?? 0;
  const sections = SECTIONS.flatMap(([id, label]) => {
    const found = b.sections.find((x) => x.id === id);
    return found ? [{ label, ...found }] : [];
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Visits"
          value={n(page.visits)}
          note={`${n(page.visitors)} ${page.visitors === 1 ? "person" : "people"} · ${share(b.phones)} on a phone`}
        />
        <Tile
          label="Typical time on page"
          value={b.medianSeconds ? duration(b.medianSeconds) : "–"}
          note={`${share(b.leftFast)} left within 10 seconds`}
        />
        <Tile
          label="Got past the first screen"
          value={share(quarter)}
          note={`${share(bottom)} reached the bottom`}
        />
        <Tile
          label="Clicked to book"
          value={n(page.bookClicks)}
          note={`${n(page.calendarStarted)} started booking · ${n(page.bookings)} booked`}
        />
      </div>

      <Card title="Where people stop" className="mt-6">
        <p className="mb-4 text-sm" style={muted}>
          Each bar is the share of visitors who saw that part of the page, top
          to bottom, with the typical time they spent there.
        </p>
        <div
          className="mb-1 grid grid-cols-[12rem_1fr_3rem_3.5rem_4rem] gap-3 text-[0.68rem] font-semibold tracking-[0.05em] uppercase max-sm:hidden"
          style={muted}
        >
          <span>Part of the page</span>
          <span />
          <span className="text-right">Visits</span>
          <span className="text-right">Share</span>
          <span className="text-right">Time</span>
        </div>
        <Reach
          label="Landed on the page"
          value={page.visits}
          max={page.visits}
        />
        {sections.map((x) => (
          <Reach
            key={x.id}
            label={x.label}
            value={x.seen}
            max={page.visits}
            time={x.medianSeconds ? duration(x.medianSeconds) : ""}
          />
        ))}
        <div
          className="mt-5 mb-2 border-t pt-5 text-sm font-semibold"
          style={{ ...strong, borderColor: "var(--separator)" }}
        >
          Then, at the calendar
        </div>
        <Reach
          label="Clicked to book"
          value={page.bookClicks}
          max={page.visits}
        />
        <Reach
          label="Started booking"
          value={page.calendarStarted}
          max={page.visits}
        />
        <Reach label="Booked" value={page.bookings} max={page.visits} />
      </Card>

      <Card title="What they clicked" className="mt-6">
        {b.clicks.length ? (
          <>
            <p className="mb-3 text-sm" style={muted}>
              Every button and link on the page that someone used, most used
              first. Each visit counts once per item.
            </p>
            <div className="rz-table-wrap">
              <table className="rz-table">
                <thead>
                  <tr>
                    <th>What they clicked</th>
                    <th>What it is</th>
                    <th>Visits</th>
                    <th>Of all visits</th>
                  </tr>
                </thead>
                <tbody>
                  {b.clicks.map((c) => {
                    const [prefix, kind] = CLICK_KINDS.find(([start]) =>
                      c.label.startsWith(start),
                    ) ?? ["", "Link"];
                    return (
                      <tr key={c.label}>
                        <td>{c.label.slice(prefix.length)}</td>
                        <td className="rz-fit" style={muted}>
                          {kind}
                        </td>
                        <td>{n(c.visits)}</td>
                        <td>{share(c.visits)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm" style={muted}>
            Nobody has clicked anything yet.
          </p>
        )}
      </Card>
    </>
  );
}

/* ───────────── Visitors ───────────── */

// Section colours for "Where their time went", cycled in the order they reached them.
const SEG = [
  "var(--series-blue)",
  "var(--signal)",
  "var(--signal-warn)",
  "var(--status-up)",
  "color-mix(in srgb, var(--series-blue) 55%, var(--signal))",
  "color-mix(in srgb, var(--signal-warn) 55%, var(--series-blue))",
];
// Moments that matter get a coloured dot; routine ones (sections) a small grey one.
const DOT: Record<string, string> = {
  arrive: "var(--series-blue)",
  tap: "var(--signal-warn)",
  calendar: "var(--signal)",
  booking: "var(--signal)",
  booked: "var(--status-up)",
  leave: "var(--status-down)",
};
const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** One visit, told in order: a one-line verdict, where their time went, then the moments on a timeline. */
function Story({ journey: j }: { journey: Journey }) {
  const timed = j.sections.filter((x) => x.seconds > 0);
  const total = timed.reduce((sum, x) => sum + x.seconds, 0);
  const last = j.sections[j.sections.length - 1];
  const device =
    j.device === "mobile"
      ? "a phone"
      : j.device === "tablet"
        ? "a tablet"
        : j.device === "desktop"
          ? "a computer"
          : "an unknown device";
  const verdict = `${(OUTCOME[j.outcome] ?? OUTCOME.skimmed).label}: ${j.seconds ? duration(j.seconds) : "under a second"} on ${device}, scrolled ${Math.min(j.scroll, 100)}%${last ? `, last saw ${sectionLabel(last.id)}` : ", never got past the top"}.`;
  return (
    <div
      className="mt-2 ml-4 rounded-[var(--rz-radius,10px)] px-4 py-3.5"
      style={box}
    >
      <p className="text-sm" style={strong}>
        {verdict}
      </p>

      {total > 0 ? (
        <div className="mt-4">
          <p
            className="mb-1.5 text-[0.62rem] font-semibold tracking-[0.08em] uppercase"
            style={muted}
          >
            Where their time went
          </p>
          <div
            aria-hidden
            className="flex h-1.5 gap-0.5 overflow-hidden rounded-full"
            style={{ background: "var(--surface-3)" }}
          >
            {timed.map((x, i) => (
              <span
                key={x.id}
                style={{
                  width: `${(x.seconds / total) * 100}%`,
                  background: SEG[i % SEG.length],
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {timed.map((x, i) => (
              <span
                key={x.id}
                className="inline-flex items-center gap-1.5 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  aria-hidden
                  className="h-[7px] w-[7px] rounded-[2px]"
                  style={{ background: SEG[i % SEG.length] }}
                />
                {sectionLabel(x.id)}{" "}
                <span className="tabular-nums" style={muted}>
                  {duration(x.seconds)}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {j.steps.length > 1 ? (
        <ol className="relative mt-4">
          {/* The thread joining the dots. */}
          <span
            aria-hidden
            className="absolute top-2.5 bottom-2.5 w-px"
            style={{
              left: "calc(2.6rem + 0.4rem + 0.45rem - 0.5px)",
              background:
                "color-mix(in srgb, var(--text-muted) 45%, transparent)",
            }}
          />
          {j.steps.map((x, i) => {
            const color = DOT[x.kind];
            const big = Boolean(color);
            const where =
              x.kind === "tap" && x.section && x.section !== "none"
                ? sectionLabel(x.section)
                : "";
            return (
              <li
                key={i}
                className="relative grid items-center gap-[0.4rem] py-[0.2rem]"
                style={{
                  gridTemplateColumns: "2.6rem 0.9rem minmax(0, 1fr)",
                  fontSize: big ? "0.8rem" : "0.74rem",
                }}
              >
                <span className="text-[0.7rem] tabular-nums" style={muted}>
                  {mmss(x.at)}
                </span>
                <span aria-hidden className="flex justify-center">
                  <span
                    className="rounded-full"
                    style={{
                      width: big ? 8 : 5,
                      height: big ? 8 : 5,
                      background: color ?? "var(--text-muted)",
                      boxShadow: "0 0 0 3px var(--surface-2)",
                    }}
                  />
                </span>
                <span
                  className="min-w-0"
                  style={{
                    color:
                      x.kind === "leave"
                        ? "var(--status-down)"
                        : big
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                  }}
                >
                  {x.kind === "section" ? sectionLabel(x.section) : x.text}
                  {where ? <span style={muted}> · in {where}</span> : null}
                  {x.kind === "leave" && j.seconds ? (
                    <span style={muted}> · after {duration(j.seconds)}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

const FIRST = 10;

type SortKey = "when" | "outcome" | "device" | "time" | "scroll";
/** How far a visit got, for sorting "What they did": booked first when descending. */
const RANK: Record<string, number> = {
  left: 0,
  skimmed: 1,
  read: 2,
  clicked: 3,
  started: 4,
  booked: 5,
};
const SORTS: Record<
  SortKey,
  {
    label: string;
    first: "asc" | "desc";
    by: (x: Journey, y: Journey) => number;
  }
> = {
  when: { label: "When", first: "desc", by: (x, y) => x.at - y.at },
  outcome: {
    label: "What they did",
    first: "desc",
    by: (x, y) =>
      (RANK[x.outcome] ?? 0) - (RANK[y.outcome] ?? 0) || x.at - y.at,
  },
  device: {
    label: "Device",
    first: "asc",
    by: (x, y) =>
      (DEVICE[x.device] ?? "~").localeCompare(DEVICE[y.device] ?? "~") ||
      y.at - x.at,
  },
  time: {
    label: "Time on page",
    first: "desc",
    by: (x, y) => x.seconds - y.seconds,
  },
  scroll: {
    label: "Scrolled",
    first: "desc",
    by: (x, y) => x.scroll - y.scroll || x.seconds - y.seconds,
  },
};

function Visitors({
  report,
  show,
  all,
  sort,
  dir,
}: {
  report: Report;
  show: string;
  all: boolean;
  sort: SortKey;
  dir: "asc" | "desc";
}) {
  const page: PageStats | null = report.page?.ok ? report.page.data : null;
  if (!page || !page.journeys.length) return <NoPage report={report} />;
  // Counted over every visit when the source says so; the list itself is only the latest ones.
  const tally = (kind: string) =>
    page.outcomes
      ? (page.outcomes[kind] ?? 0)
      : page.journeys.filter((j) => j.outcome === kind).length;
  const everyone = page.outcomes ? page.visits : page.journeys.length;
  const picked = show
    ? page.journeys.filter((j) => j.outcome === show)
    : page.journeys;
  const listed = [...picked].sort(
    (x, y) => (dir === "asc" ? 1 : -1) * SORTS[sort].by(x, y),
  );
  // Everything a link on this tab must carry so that sorting, filtering and "show all" keep each other.
  const state = (over: {
    show?: string;
    all?: boolean;
    sort?: SortKey;
    dir?: "asc" | "desc";
  }) => {
    const next = { show, all, sort, dir, ...over };
    return `${next.show ? `&show=${next.show}` : ""}${next.sort !== "when" || next.dir !== "desc" ? `&sort=${next.sort}&dir=${next.dir}` : ""}${next.all ? "&all=1" : ""}`;
  };
  const column = (key: SortKey, className: string) => {
    const active = sort === key;
    // A first click sorts the natural way for that column; clicking the active one flips it.
    const next = active ? (dir === "asc" ? "desc" : "asc") : SORTS[key].first;
    return (
      <a
        href={href("visitors", state({ sort: key, dir: next }))}
        className={`inline-flex items-center gap-1 whitespace-nowrap no-underline ${className}`}
        style={active ? strong : { color: "inherit" }}
        aria-label={`Sort by ${SORTS[key].label.toLowerCase()}`}
      >
        {SORTS[key].label}
        <span
          aria-hidden
          className={`inline-block h-[.35rem] w-[.35rem] border-r-[1.5px] border-b-[1.5px] border-current ${active ? (dir === "asc" ? "translate-y-[2px] rotate-[225deg]" : "-translate-y-[1px] rotate-45") : "rotate-45 opacity-0"}`}
        />
      </a>
    );
  };
  const shown = all ? listed : listed.slice(0, FIRST);
  // The same square label Studio uses for statuses (rz-pill), a touch roomier because these are links.
  const chip = (key: string, label: string, count: number) => (
    <a
      key={key}
      href={href("visitors", state({ show: key, all: false }))}
      aria-current={show === key ? "true" : undefined}
      className={`rz-pill no-underline ${show === key ? "rz-pill--up" : ""}`}
      style={{
        padding: "0.45rem 0.65rem",
        fontSize: "0.66rem",
        ...(show === key
          ? { fontWeight: 600, borderColor: "var(--signal)" }
          : {}),
      }}
    >
      {label} <span style={{ opacity: 0.7 }}>{n(count)}</span>
    </a>
  );
  const calendar = tally("booked") + tally("started") + tally("clicked");

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Visits"
          value={n(page.visits)}
          note={`${n(page.visitors)} ${page.visitors === 1 ? "person" : "people"}`}
        />
        <Tile
          label="Went for the calendar"
          value={n(calendar)}
          note={`${n(tally("booked"))} booked · ${n(tally("started"))} started · ${n(tally("clicked"))} clicked`}
        />
        <Tile
          label="Read the page"
          value={n(tally("read"))}
          note={`${pct(tally("read"), everyone) || "0%"} of visits · ${n(tally("skimmed"))} skimmed`}
        />
        <Tile
          label="Left at the top"
          value={n(tally("left"))}
          note={`${pct(tally("left"), everyone) || "0%"} of visits`}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {chip("", page.outcomes ? "All" : "Latest", everyone)}
        {OUTCOMES.filter((kind) => tally(kind) > 0).map((kind) =>
          chip(kind, OUTCOME[kind].label, tally(kind)),
        )}
      </div>

      <Card>
        <div
          className="flex items-center gap-2 pb-2.5 text-[0.68rem] font-semibold tracking-[0.05em] uppercase"
          style={muted}
        >
          <span className="w-[.4rem] shrink-0" />
          {column("when", "w-40 shrink-0")}
          {column("outcome", "w-36 shrink-0")}
          {column("device", "w-24 shrink-0 max-sm:hidden")}
          {column("time", "w-28 shrink-0 justify-end max-sm:hidden")}
          {column("scroll", "ml-auto justify-end max-sm:hidden")}
        </div>
        {shown.map((j, i) => {
          const outcome = OUTCOME[j.outcome] ?? OUTCOME.skimmed;
          return (
            <details
              key={i}
              className="group/visit border-t py-2.5 last:pb-0"
              style={{ borderColor: "var(--separator)" }}
            >
              <summary className={`${SUMMARY} text-sm`}>
                <span
                  className={`${CHEVRON} group-open/visit:rotate-45`}
                  style={muted}
                />
                <span className="w-40 shrink-0 tabular-nums">{when(j.at)}</span>
                <span className="w-36 shrink-0">
                  <StatusPill tone={outcome.tone}>{outcome.label}</StatusPill>
                </span>
                <span className="w-24 shrink-0 max-sm:hidden" style={muted}>
                  {DEVICE[j.device] ?? "Unknown"}
                </span>
                <span className="w-28 shrink-0 text-right tabular-nums max-sm:hidden">
                  {j.seconds ? duration(j.seconds) : "under 1s"}
                </span>
                <span
                  className="ml-auto flex items-center gap-2 max-sm:hidden"
                  style={muted}
                >
                  <span
                    className="block h-1.5 w-24 overflow-hidden rounded-full"
                    style={box}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.min(j.scroll, 100)}%`,
                        background: EMAIL_COLOR,
                      }}
                    />
                  </span>
                  <span className="w-10 text-right tabular-nums">
                    {Math.min(j.scroll, 100)}%
                  </span>
                </span>
              </summary>
              <Story journey={j} />
            </details>
          );
        })}
        {!shown.length ? (
          <p className="text-sm" style={muted}>
            No visits like that yet.
          </p>
        ) : null}
      </Card>

      {listed.length > FIRST ? (
        <p className="mt-3 text-sm">
          <a
            href={href("visitors", state({ all: !all }))}
            style={{ color: "var(--text-secondary)" }}
          >
            {all
              ? `Show the latest ${FIRST}`
              : `Show the latest ${n(listed.length)}`}
          </a>
        </p>
      ) : null}
    </>
  );
}

/* ───────────── Messages and money ───────────── */

function Money({ report }: { report: Report }) {
  const emails = value(report.emails);
  const texts = value(report.texts);
  const calls = value(report.calls);
  const pipeline = value(report.pipeline);

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Emails sent"
          value={emails ? n(emails.delivered) : "–"}
          note={
            emails
              ? `${n(emails.messages.length)} ${emails.messages.length === 1 ? "email" : "emails"} so far`
              : "Couldn’t read emails"
          }
        />
        <Tile
          label="Texts sent"
          value={texts ? n(texts.sent) : "–"}
          note={
            texts
              ? `${n(texts.replies)} ${texts.replies === 1 ? "reply" : "replies"} · ${n(texts.optOuts)} opted out`
              : "Couldn’t read texts"
          }
        />
        <Tile
          label="Sold so far"
          value={pipeline ? money(pipeline.wonValue) : "–"}
          note={
            pipeline
              ? `${n(pipeline.won)} of ${PLACES} sites`
              : "Couldn’t read the pipeline"
          }
        />
        <Tile
          label="Your share"
          value={pipeline ? money(pipeline.share) : "–"}
          note="20% plus $150 a site"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card title="Calls">
          {calls ? (
            <>
              <div className="grid grid-cols-5 gap-2">
                <Stat label="Booked" value={n(calls.booked)} />
                <Stat label="Coming up" value={n(calls.upcoming)} />
                <Stat label="Held" value={n(calls.held)} />
                <Stat label="No-show" value={n(calls.noShow)} />
                <Stat label="Cancelled" value={n(calls.cancelled)} />
              </div>
              {calls.list.length ? (
                <div className="rz-table-wrap mt-4">
                  <table className="rz-table">
                    <thead>
                      <tr>
                        <th>Who</th>
                        <th>When</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls.list.map((c, i) => (
                        <tr key={i}>
                          <td>{c.name}</td>
                          <td className="rz-fit">{when(c.startAt)}</td>
                          <td>{STATUS[c.status] ?? c.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-sm" style={muted}>
                  No calls booked yet.
                </p>
              )}
            </>
          ) : (
            <Problem
              what="the calendar"
              error={report.calls.ok ? "" : report.calls.error}
            />
          )}
        </Card>

        <Card
          title={pipeline ? `Pipeline: ${pipeline.name}` : "Pipeline and money"}
        >
          {pipeline ? (
            <>
              <div className="rz-table-wrap">
                <table className="rz-table">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>People</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeline.stages.map((s) => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td>{n(s.open)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <strong>Sold</strong>
                      </td>
                      <td>
                        <strong>{n(pipeline.won)}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Not moving forward</td>
                      <td>{n(pipeline.lost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <Problem
              what="the pipeline"
              error={report.pipeline.ok ? "" : report.pipeline.error}
            />
          )}
        </Card>
      </div>

      <Card title="Each message" className="mt-6">
        {emails ? (
          emails.messages.length ? (
            <div className="rz-table-wrap">
              <table className="rz-table">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Type</th>
                    <th>First sent</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.messages.map((m) => (
                    <tr key={m.subject}>
                      <td>{m.subject}</td>
                      <td className="rz-fit">
                        {m.kind === "email" ? "Email" : "Text"}
                      </td>
                      <td className="rz-fit">
                        {m.first ? dayLabel(m.first) : "–"}
                      </td>
                      <td>{n(m.sent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm" style={muted}>
              No campaign messages have gone out yet.
            </p>
          )
        ) : (
          <Problem
            what="emails"
            error={report.emails.ok ? "" : report.emails.error}
          />
        )}
      </Card>

      <Card title="Texts" className="mt-6">
        {texts ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Sent" value={n(texts.sent)} />
            <Stat label="Replies" value={n(texts.replies)} />
            <Stat label="Opted out (STOP)" value={n(texts.optOuts)} />
            <Stat
              label="Opt-out rate"
              value={
                texts.sent > 0
                  ? `${((texts.optOuts / texts.sent) * 100).toFixed(1)}%`
                  : "–"
              }
            />
          </div>
        ) : (
          <Problem
            what="texts"
            error={report.texts.ok ? "" : report.texts.error}
          />
        )}
      </Card>
    </>
  );
}

/* ───────────── Notes ───────────── */

function Notes({ report }: { report: Report }) {
  const calls = value(report.calls);
  const emails = value(report.emails);
  const notes: [string, string][] = [
    [
      "How fresh are these numbers?",
      `Read at ${clock(report.generatedAt)}. They are kept for up to 15 minutes; Refresh reads them again. Nothing on this page changes anything in HighLevel.`,
    ],
    [
      "Where do the sent numbers come from?",
      "From HighLevel’s message history: emails and texts that have actually left, the same number as Sent under Email Analytics in HighLevel. It can be far below what the workflow shows, because the workflow counts a message as soon as it is queued and HighLevel then sends a big batch gradually over several hours. “Queued by the campaign” is everyone the workflow has processed so far.",
    ],
    [
      "Where are delivered, opened and clicked?",
      "HighLevel shows those on each email step of the workflow and under Email Analytics, but doesn’t hand them to this report.",
    ],
    [
      "How are text replies and opt-outs counted?",
      "Only answers from people a campaign text went to. An answer of STOP (or a similar word) counts as an opt-out, not a reply; HighLevel stops texting that person automatically. An opt-out rate above about 1% is worth a look before the next text goes out.",
    ],
    [
      "How are page visits counted?",
      "A visit is one sitting on the offer page; “People” is how many different visitors that was. Visitors are anonymous: nothing here says who they are. “Typical” times are the middle value, so one tab left open for an hour doesn’t skew them. A section counts as seen once a good part of it has been on screen. “Started booking” is someone clicking into the calendar.",
    ],
    [
      "Which calls are counted?",
      `A call counts when it is on the offer calendar and the booking workflow tagged the contact “bf26-booked”. Booked is the day someone picked a time; Held is the day of the call, once the appointment is marked “Showed”.${calls?.skipped ? ` Right now ${n(calls.skipped)} other ${calls.skipped === 1 ? "appointment on this calendar isn’t" : "appointments on this calendar aren’t"} counted because the contact doesn’t have that tag.` : ""}`,
    ],
    [
      "When does a sale count?",
      "Once its opportunity is marked Won, with the value set to the amount sold. Only opportunities whose source is “Black Friday 2026” are counted.",
    ],
    [
      "How is my share worked out?",
      "20% of each payment plus $150 a site, shown here as if every sale is paid in full.",
    ],
    ...(emails?.truncated
      ? ([
          [
            "Why might the email counts be low?",
            "There were more emails than one load can read, so the counts are a little low.",
          ],
        ] as [string, string][])
      : []),
  ];
  return (
    <Card title="How these numbers are counted">
      {notes.map(([question, answer]) => (
        <details
          key={question}
          className="group/q border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
          style={{ borderColor: "var(--separator)" }}
        >
          <summary
            className={`${SUMMARY} text-sm font-medium`}
            style={{ color: "var(--text-secondary)" }}
          >
            <span className={`${CHEVRON} group-open/q:rotate-45`} />
            {question}
          </summary>
          <p className="mt-2 max-w-3xl pl-4 text-sm" style={muted}>
            {answer}
          </p>
        </details>
      ))}
    </Card>
  );
}

export default async function BlackFridayPage({
  searchParams,
}: {
  searchParams: Promise<{
    fresh?: string;
    debug?: string;
    tab?: string;
    show?: string;
    all?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  await studio.requireAdmin();
  const { fresh, debug, tab: asked, show, all, sort, dir } = await searchParams;
  const report = await blackFridayReport(Boolean(fresh));
  const tab: Tab = TABS.some(([key]) => key === asked)
    ? (asked as Tab)
    : "overview";
  const ends = new Date(OFFER_END - 1).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: SITE_TIMEZONE,
  });

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/admin/reports"
            className="no-underline"
            style={{ color: "inherit" }}
          >
            Reports
          </Link>
        }
        title="Black Friday"
        subtitle={`The website offer, from the first email to the sale. Ends ${ends}.`}
        actions={
          report ? (
            <LinkButton
              href={href(tab, `&fresh=${report.generatedAt}`)}
              variant="secondary"
              size="sm"
            >
              Refresh
            </LinkButton>
          ) : null
        }
      />
      {report ? (
        <>
          <nav className="rz-tabs" role="tablist" aria-label="Report sections">
            {TABS.map(([key, label]) => (
              <a
                key={key}
                href={href(key)}
                role="tab"
                aria-selected={tab === key}
                className="rz-tabs__tab no-underline"
              >
                {label}
              </a>
            ))}
          </nav>
          {tab === "overview" ? <Overview report={report} /> : null}
          {tab === "page" ? <ThePage report={report} /> : null}
          {tab === "visitors" ? (
            <Visitors
              report={report}
              show={
                OUTCOMES.some((kind) => kind === show) ? (show as string) : ""
              }
              all={Boolean(all)}
              sort={sort && sort in SORTS ? (sort as SortKey) : "when"}
              dir={
                dir === "asc" || dir === "desc"
                  ? dir
                  : sort && sort in SORTS
                    ? SORTS[sort as SortKey].first
                    : "desc"
              }
            />
          ) : null}
          {tab === "money" ? <Money report={report} /> : null}
          {tab === "notes" ? <Notes report={report} /> : null}
          {debug ? (
            <Card title="Field names (for your web team)" className="mt-6">
              <pre
                className="text-xs break-words whitespace-pre-wrap"
                style={mono}
              >
                {Object.entries(report.shapes)
                  .map(([k, v]) => `${k}: ${v.join(", ")}`)
                  .join("\n\n") || "No records came back."}
              </pre>
            </Card>
          ) : null}
        </>
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
