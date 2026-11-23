import "server-only";
import { after } from "next/server";
import { blackFridayConfig } from "@/lib/admin/env";
import { SITE_TIMEZONE } from "@/lib/site-config";

/**
 * The Black Friday campaign report (Studio → Black Friday): read-only numbers from the
 * HighLevel account, gathered per request. Every source fails on its own: one refused
 * call shows as "couldn't read" on its card and the rest of the page still loads. The
 * token never leaves this file's requests; errors carry the HTTP status and nothing else.
 *
 * Temporary: remove with the campaign (this folder, the page, its nav entry, the env getter).
 */

const BASE = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";
const TIMEOUT_MS = 10_000;
/** The message export sends up to 1,000 messages a page and is often slow: it gets longer. */
const EXPORT_TIMEOUT_MS = 25_000;
/** A timed-out or overloaded call is tried this many more times, waiting a little longer each time. */
const RETRY_WAITS_MS = [1_500, 4_000];

/** Midnight Eastern on the day the first email went out, and when the offer closes. */
export const CAMPAIGN_START = Date.parse("2026-11-19T05:00:00Z");
export const OFFER_END = Date.parse("2026-12-01T05:00:00Z");
export const PLACES = 20;
/** The partner share: 20% of what is sold plus a flat amount for each site. */
const SHARE_RATE = 0.2;
const SHARE_PER_SITE = 150;
/** An email subject counts as a campaign message once it has gone to this many people. */
const BROADCAST_MIN = 25;
const MAX_MESSAGE_PAGES = 30;
const CACHE_MS = 15 * 60 * 1000;

type Config = NonNullable<ReturnType<typeof blackFridayConfig>>;
export type Source<T> = { ok: true; data: T } | { ok: false; error: string };

export type DayRow = {
  day: string;
  sent: number;
  opened: number;
  clicked: number;
  texts: number;
  visits: number;
  booked: number;
  held: number;
  sold: number;
};
export type MessageRow = {
  subject: string;
  first: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  kind: "email" | "text";
};
export type StageRow = { name: string; open: number; value: number };

export type PageBehavior = {
  phones: number;
  medianSeconds: number;
  leftFast: number;
  scroll: { percent: number; visits: number }[];
  sections: {
    id: string;
    seen: number;
    interacted: number;
    medianSeconds: number;
  }[];
  clicks: { label: string; visits: number }[];
};
export type JourneyStep = {
  at: number;
  kind: string;
  text: string;
  section: string;
};
export type Journey = {
  at: number;
  device: string;
  seconds: number;
  scroll: number;
  outcome: string;
  sections: { id: string; seconds: number }[];
  taps: string[];
  steps: JourneyStep[];
};
export type PageStats = {
  visits: number;
  visitors: number;
  bookClicks: number;
  calendarViews: number;
  calendarStarted: number;
  bookings: number;
  behavior: PageBehavior | null;
  journeys: Journey[];
  /** How every visit ended, counted over all visits; null from an older statistics source. */
  outcomes: Record<string, number> | null;
};

export type Report = {
  generatedAt: number;
  emails: Source<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    hasEngagement: boolean;
    truncated: boolean;
    messages: MessageRow[];
  }>;
  texts: Source<{
    sent: number;
    delivered: number;
    failed: number;
    replies: number;
    /** People who answered a campaign text with STOP. */
    optOuts: number;
    truncated: boolean;
  }>;
  calls: Source<{
    booked: number;
    upcoming: number;
    held: number;
    noShow: number;
    cancelled: number;
    skipped: number;
    list: { name: string; startAt: number; status: string }[];
  }>;
  pipeline: Source<{
    name: string;
    stages: StageRow[];
    open: number;
    won: number;
    lost: number;
    wonValue: number;
    share: number;
  }>;
  audience: Source<{ tagged: number | null; booked: number | null }>;
  /** Visits to the offer page; null when that source isn't set up. */
  page: Source<PageStats> | null;
  days: DayRow[];
  /** Field names only (never values) of one record per source, for ?debug=1. */
  shapes: Record<string, string[]>;
  /**
   * Sources that couldn't be read this time and show their last good numbers instead:
   * the name as it reads in a sentence ("emails"), and when those numbers were read.
   */
  stale: { what: string; at: number }[];
};

/* ───────────── plumbing ───────────── */

type Json = Record<string, unknown>;
const obj = (v: unknown): Json =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {};
const arr = (v: unknown): Json[] => (Array.isArray(v) ? v.map(obj) : []);
const str = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;
const time = (v: unknown): number =>
  typeof v === "number" ? v : typeof v === "string" ? Date.parse(v) || 0 : 0;

class HttpError extends Error {
  constructor(
    public status: number,
    detail: string,
  ) {
    super(`HighLevel answered ${status}${detail ? `: ${detail}` : ""}`);
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Worth another try: HighLevel was slow, busy (429) or had a moment (5xx). A refusal (4xx) is not. */
function retryable(err: unknown): boolean {
  if (err instanceof HttpError) return err.status === 429 || err.status >= 500;
  return (
    err instanceof Error &&
    (err.name === "TimeoutError" || err.name === "TypeError")
  );
}

async function hl(
  cfg: Config,
  path: string,
  init?: { method?: "POST"; body?: Json; timeoutMs?: number },
): Promise<Json> {
  const timeoutMs = init?.timeoutMs ?? TIMEOUT_MS;
  for (let attempt = 0; ; attempt++) {
    // Never run past the read's deadline: the page has to answer before the server gives up on it.
    const left = deadline - Date.now();
    try {
      return await hlOnce(cfg, path, {
        ...init,
        timeoutMs: Math.max(1_000, Math.min(timeoutMs, left)),
      });
    } catch (err) {
      const pause = RETRY_WAITS_MS[attempt];
      if (
        pause === undefined ||
        !retryable(err) ||
        Date.now() + pause + 3_000 > deadline
      )
        throw err;
      await wait(pause);
    }
  }
}

/** When the current read must be done by (set in build); leaves room under the page's maxDuration. */
let deadline = Number.POSITIVE_INFINITY;
const READ_BUDGET_MS = 50_000;

async function hlOnce(
  cfg: Config,
  path: string,
  init?: { method?: "POST"; body?: Json; timeoutMs?: number },
): Promise<Json> {
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Version: API_VERSION,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(init?.timeoutMs ?? TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = obj(await res.json().catch(() => null));
    const message = Array.isArray(body.message)
      ? body.message.map(str).join("; ")
      : str(body.message);
    throw new HttpError(res.status, message.slice(0, 160));
  }
  return obj(await res.json().catch(() => null));
}

function explain(err: unknown): string {
  if (err instanceof HttpError) {
    if (err.status === 401)
      return `${err.message}. The token was refused, or it does not have permission for this.`;

    return err.message;
  }
  if (err instanceof Error && err.name === "TimeoutError")
    return "HighLevel took too long to answer. Try Refresh.";
  return err instanceof Error
    ? err.message
    : "Something went wrong reading this.";
}

/**
 * The last numbers each source read successfully, kept on this server. A source that fails
 * shows these (with a note saying when they're from) rather than "couldn't read".
 */
const lastGood = new Map<string, { at: number; data: unknown }>();

async function source<T>(
  key: string,
  fn: () => Promise<T>,
  stale: Report["stale"],
): Promise<Source<T>> {
  try {
    const data = await fn();
    lastGood.set(key, { at: Date.now(), data });
    return { ok: true, data };
  } catch (err) {
    const kept = lastGood.get(key);
    if (kept) {
      stale.push({ what: key, at: kept.at });
      return { ok: true, data: kept.data as T };
    }
    return { ok: false, error: explain(err) };
  }
}

const qs = (params: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();

const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: SITE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
/** YYYY-MM-DD in the site's time zone. */
const dayOf = (ms: number) => dayFmt.format(new Date(ms));

/* ───────────── sources ───────────── */

/** "outbound delivered: 120" lines for ?debug=1: counts only. */
function tally(list: Message[]): string[] {
  const counts = new Map<string, number>();
  for (const m of list) {
    const key = `${m.inbound ? "inbound" : "outbound"} ${m.status || "(no status)"}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([k, v]) => `${k}: ${v}`);
}

type Message = {
  at: number;
  status: string;
  inbound: boolean;
  subject: string;
  contactId: string;
  ending: string;
  /** An opt-out word ("STOP") rather than a real reply. */
  stop: boolean;
};

async function exportMessages(
  cfg: Config,
  channel: "Email" | "SMS",
  shapes: Report["shapes"],
): Promise<{ list: Message[]; truncated: boolean }> {
  const list: Message[] = [];
  let cursor = "";
  for (let page = 0; page < MAX_MESSAGE_PAGES; page++) {
    const data = await hl(
      cfg,
      `/conversations/messages/export?${qs({
        locationId: cfg.locationId,
        channel,
        startDate: new Date(CAMPAIGN_START).toISOString(),
        endDate: new Date().toISOString(),
        sortBy: "createdAt",
        sortOrder: "asc",
        limit: 1000,
        ...(cursor ? { cursor } : {}),
      })}`,
      { timeoutMs: EXPORT_TIMEOUT_MS },
    );
    const messages = arr(data.messages);
    if (page === 0 && messages[0]) {
      const meta = obj(messages[0].meta);
      shapes[channel === "Email" ? "email" : "text"] = [
        ...Object.keys(messages[0]),
        ...Object.keys(meta).map((k) => `meta.${k}`),
        ...Object.keys(obj(meta.email)).map((k) => `meta.email.${k}`),
      ];
    }
    for (const m of messages) {
      const meta = obj(m.meta);
      list.push({
        at: time(m.dateAdded),
        status: str(m.status).toLowerCase(),
        inbound: str(m.direction).toLowerCase() === "inbound",
        subject:
          str(m.subject) || str(obj(meta.email).subject) || str(meta.subject),
        contactId: str(m.contactId),
        // The end of the body: the same for everyone a broadcast went to, whatever the greeting says.
        ending:
          channel === "SMS"
            ? str(m.body).replace(/\s+/g, " ").trim().slice(-60)
            : "",
        stop:
          channel === "SMS" &&
          /^(stop|stopall|stop all|unsubscribe|cancel|end|quit|remove|opt ?out)[.!\s]*$/i.test(
            str(m.body).trim(),
          ),
      });
    }
    if (page === 0)
      shapes[`${channel} total HighLevel reports`] = [
        str(data.total) || "not given",
      ];
    cursor = str(data.nextCursor);
    if (!cursor || messages.length === 0) {
      shapes[`${channel} read`] = [
        `${list.length} in ${page + 1} page(s)`,
        ...tally(list),
      ];
      return { list, truncated: false };
    }
  }
  return { list, truncated: true };
}

const FAILED = new Set(["failed", "undelivered", "bounced", "rejected"]);
const OPENED = new Set(["opened", "read", "clicked"]);
const notDelivered = (status: string) =>
  FAILED.has(status) || status === "pending" || status === "scheduled";

type Opportunity = {
  status: string;
  pipelineId: string;
  stageId: string;
  value: number;
  wonAt: number;
};

/** Campaign opportunities are the ones whose source says so ("Black Friday 2026"), in whatever pipeline they sit. */
const CAMPAIGN_SOURCE = /black\s*friday/i;

async function opportunities(
  cfg: Config,
  shapes: Report["shapes"],
): Promise<Opportunity[]> {
  const list: Opportunity[] = [];
  // The search has answered to both spellings over time; try the documented one, then the older.
  let snake = false;
  for (let page = 1; page <= 20; page++) {
    const filter: Record<string, string | number> = cfg.pipelineId
      ? snake
        ? { pipeline_id: cfg.pipelineId }
        : { pipelineId: cfg.pipelineId }
      : {};
    const params: Record<string, string | number> = {
      ...(snake
        ? { location_id: cfg.locationId }
        : { locationId: cfg.locationId }),
      ...filter,
      status: "all",
      order: "added_desc",
      limit: 100,
      page,
    };
    let data: Json;
    try {
      data = await hl(cfg, `/opportunities/search?${qs(params)}`);
    } catch (err) {
      if (
        !snake &&
        page === 1 &&
        err instanceof HttpError &&
        (err.status === 400 || err.status === 422)
      ) {
        snake = true;
        page = 0;
        continue;
      }
      throw err;
    }
    const rows = arr(data.opportunities);
    if (page === 1 && rows[0]) shapes.opportunity = Object.keys(rows[0]);
    for (const o of rows) {
      if (!CAMPAIGN_SOURCE.test(str(o.source))) continue;
      list.push({
        status: str(o.status).toLowerCase(),
        pipelineId: str(o.pipelineId),
        stageId: str(o.pipelineStageId),
        value: num(o.monetaryValue),
        wonAt:
          time(o.lastStatusChangeAt) || time(o.updatedAt) || time(o.createdAt),
      });
    }
    // Newest first: once a full page is older than the campaign there is nothing further back.
    const oldest = rows.length ? time(rows[rows.length - 1].createdAt) : 0;
    if (rows.length < 100 || (oldest && oldest < CAMPAIGN_START)) break;
  }
  return list;
}

async function readPipeline(cfg: Config, shapes: Report["shapes"]) {
  const [data, all] = await Promise.all([
    hl(cfg, `/opportunities/pipelines?${qs({ locationId: cfg.locationId })}`),
    opportunities(cfg, shapes),
  ]);
  const pipelines = arr(data.pipelines);
  // The pipeline the campaign's opportunities sit in: the one named in the settings, else the one holding most of them.
  const count = (id: string) => all.filter((o) => o.pipelineId === id).length;
  const found = cfg.pipelineId
    ? pipelines.find((p) => str(p.id) === cfg.pipelineId)
    : // With none yet, the leads pipeline is where they will land.
      ([...pipelines]
        .sort((x, y) => count(str(y.id)) - count(str(x.id)))
        .find((p) => count(str(p.id)) > 0) ??
      pipelines.find((p) => /lead/i.test(str(p.name))) ??
      pipelines[0]);
  if (!found)
    throw new Error(
      cfg.pipelineId
        ? "The pipeline named in BLACK_FRIDAY_PIPELINE_ID was not found in this account."
        : "No pipelines were found in this account.",
    );
  const id = str(found.id);
  const opps = all.filter((o) => o.pipelineId === id);
  const stages: StageRow[] = arr(found.stages).map((s) => {
    const inStage = opps.filter(
      (o) => o.stageId === str(s.id) && o.status === "open",
    );
    return {
      name: str(s.name),
      open: inStage.length,
      value: inStage.reduce((sum, o) => sum + o.value, 0),
    };
  });
  const won = opps.filter((o) => o.status === "won");
  const wonValue = won.reduce((sum, o) => sum + o.value, 0);
  return {
    summary: {
      name: str(found.name),
      stages,
      open: opps.filter((o) => o.status === "open").length,
      won: won.length,
      lost: opps.filter((o) => o.status === "lost" || o.status === "abandoned")
        .length,
      wonValue,
      share: wonValue * SHARE_RATE + won.length * SHARE_PER_SITE,
    },
    wonAt: won.map((o) => o.wonAt),
  };
}

type Appointment = {
  addedAt: number;
  startAt: number;
  status: string;
  name: string;
};

/** Everyone the campaign went to carries this tag. */
const CAMPAIGN_TAG = "bf26-soundplex";
/** The booking workflow adds this one. A call only counts when its contact has it: the report shows who the workflow handled. */
const BOOKED_TAG = "bf26-booked";

/** Whether the contact carries the campaign tag, and their name. A contact that can't be read is counted, so a real booking is never hidden. */
async function campaignContact(
  cfg: Config,
  contactId: string,
): Promise<{ tagged: boolean; name: string }> {
  if (!contactId) return { tagged: true, name: "" };
  try {
    const contact = obj(
      (await hl(cfg, `/contacts/${encodeURIComponent(contactId)}`)).contact,
    );
    const tags = contact.tags;
    const name =
      [str(contact.firstName), str(contact.lastName)]
        .filter(Boolean)
        .join(" ") ||
      str(contact.name) ||
      str(contact.email);
    return {
      tagged: Array.isArray(tags)
        ? tags.some((t) => str(t).toLowerCase() === BOOKED_TAG)
        : true,
      name,
    };
  } catch {
    return { tagged: true, name: "" };
  }
}

async function appointments(
  cfg: Config,
  shapes: Report["shapes"],
): Promise<{ list: Appointment[]; skipped: number }> {
  const data = await hl(
    cfg,
    `/calendars/events?${qs({ locationId: cfg.locationId, calendarId: cfg.calendarId, startTime: CAMPAIGN_START, endTime: OFFER_END + 60 * 24 * 60 * 60 * 1000 })}`,
  );
  const events = arr(data.events);
  if (events[0]) shapes.appointment = Object.keys(events[0]);
  // The calendar is meant for the offer page only, but people do get booked onto it by hand.
  // Only contacts the booking workflow tagged count; the rest are reported as a number, not hidden.
  const ids = [...new Set(events.map((e) => str(e.contactId)))];
  const contacts = new Map<string, { tagged: boolean; name: string }>();
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const answers = await Promise.all(
      batch.map((id) => campaignContact(cfg, id)),
    );
    batch.forEach((id, n) => contacts.set(id, answers[n]));
  }
  const counted = events.filter(
    (e) => contacts.get(str(e.contactId))?.tagged !== false,
  );
  return {
    list: counted
      .map((e) => ({
        addedAt: time(e.dateAdded) || time(e.startTime),
        startAt: time(e.startTime),
        status: str(e.appointmentStatus).toLowerCase(),
        name:
          contacts.get(str(e.contactId))?.name || str(e.title) || "(no name)",
      }))
      .sort((x, y) => x.startAt - y.startAt),
    skipped: events.length - counted.length,
  };
}

async function tagged(cfg: Config, tag: string): Promise<number | null> {
  try {
    const data = await hl(cfg, "/contacts/search", {
      method: "POST",
      body: {
        locationId: cfg.locationId,
        pageLimit: 1,
        filters: [{ field: "tags", operator: "contains", value: tag }],
      },
    });
    return typeof data.total === "number" ? data.total : null;
  } catch {
    return null;
  }
}

/** Visits to the offer page, from the site it lives on: counts only, per day. */
async function pageStats(cfg: Config) {
  if (!cfg.stats) return null;
  const res = await fetch(cfg.stats.url, {
    headers: { Authorization: `Bearer ${cfg.stats.key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`The page statistics answered ${res.status}.`);
  const data = obj(await res.json().catch(() => null));
  const totals = obj(data.totals);
  const raw = data.behavior ? obj(data.behavior) : null;
  const behavior: PageBehavior | null = raw
    ? {
        phones: num(obj(raw.devices).mobile),
        medianSeconds: num(raw.median_seconds),
        leftFast: num(raw.left_within_10s),
        scroll: arr(raw.scroll).map((x) => ({
          percent: num(x.percent),
          visits: num(x.visits),
        })),
        sections: arr(raw.sections).map((x) => ({
          id: str(x.id),
          seen: num(x.seen),
          interacted: num(x.interacted),
          medianSeconds: num(x.median_seconds),
        })),
        clicks: arr(raw.clicks).map((x) => ({
          label: str(x.label),
          visits: num(x.visits),
        })),
      }
    : null;
  return {
    summary: {
      visits: num(totals.visits),
      visitors: num(data.visitors),
      bookClicks: num(totals.book_clicks),
      calendarViews: num(totals.calendar_views),
      calendarStarted: num(totals.calendar_started),
      bookings: num(totals.bookings),
      behavior,
      outcomes: data.outcomes
        ? Object.fromEntries(
            Object.entries(obj(data.outcomes)).map(([k, v]) => [k, num(v)]),
          )
        : null,
      journeys: arr(data.journeys).map((j) => ({
        at: time(j.at),
        device: str(j.device),
        seconds: num(j.seconds),
        scroll: num(j.scroll),
        outcome: str(j.outcome),
        sections: arr(j.sections).map((x) => ({
          id: str(x.id),
          seconds: num(x.seconds),
        })),
        taps: Array.isArray(j.taps) ? j.taps.map(str).filter(Boolean) : [],
        steps: arr(j.steps).map((x) => ({
          at: num(x.at),
          kind: str(x.kind),
          text: str(x.text),
          section: str(x.section),
        })),
      })),
    },
    days: arr(data.days).map((d) => ({
      day: str(d.day),
      visits: num(d.visits),
    })),
  };
}

/* ───────────── the report ───────────── */

async function build(cfg: Config): Promise<Report> {
  const shapes: Report["shapes"] = {};
  const now = Date.now();
  const days = new Map<string, DayRow>();
  for (
    let t = CAMPAIGN_START + 12 * 60 * 60 * 1000;
    dayOf(t) <= dayOf(now);
    t += 24 * 60 * 60 * 1000
  ) {
    const day = dayOf(t);
    days.set(day, {
      day,
      sent: 0,
      opened: 0,
      clicked: 0,
      texts: 0,
      visits: 0,
      booked: 0,
      held: 0,
      sold: 0,
    });
  }
  const bump = (ms: number, key: Exclude<keyof DayRow, "day">) => {
    const row = days.get(dayOf(ms));
    if (row) row[key] += 1;
  };

  const stale: Report["stale"] = [];
  deadline = Date.now() + READ_BUDGET_MS;
  // The two big message exports run one after the other, so they don't compete with each other
  // for HighLevel's attention; the small sources run alongside them.
  // All at once: one after the other doubled the wait, and the retries now cover a slow answer.
  const [emailRaw, textRaw, callRaw, pipelineRaw, audience, pageRaw] =
    await Promise.all([
      source("emails", () => exportMessages(cfg, "Email", shapes), stale),
      source("texts", () => exportMessages(cfg, "SMS", shapes), stale),
      source("calls", () => appointments(cfg, shapes), stale),
      source("the pipeline", () => readPipeline(cfg, shapes), stale),
      source(
        "tags",
        async () => {
          const [all, booked] = await Promise.all([
            tagged(cfg, CAMPAIGN_TAG),
            tagged(cfg, BOOKED_TAG),
          ]);
          return { tagged: all, booked };
        },
        stale,
      ),
      source("page visits", () => pageStats(cfg), stale),
    ]);

  let emails: Report["emails"];
  if (emailRaw.ok) {
    // Only broadcasts: a subject that went to enough people. One-to-one replies stay out.
    const bySubject = new Map<string, Message[]>();
    for (const m of emailRaw.data.list) {
      if (m.inbound) continue;
      const key = m.subject.trim() || "(no subject)";
      bySubject.set(key, [...(bySubject.get(key) ?? []), m]);
    }
    const hasSubjects = [...bySubject.keys()].some((k) => k !== "(no subject)");
    const messages: MessageRow[] = [];
    const total = { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 };
    let hasEngagement = false;
    for (const [subject, list] of bySubject) {
      if (hasSubjects && list.length < BROADCAST_MIN) continue;
      const row: MessageRow = {
        kind: "email",
        subject,
        first: dayOf(Math.min(...list.map((m) => m.at))),
        sent: list.length,
        delivered: 0,
        opened: 0,
        clicked: 0,
      };
      for (const m of list) {
        bump(m.at, "sent");
        if (!notDelivered(m.status)) row.delivered += 1;
        if (FAILED.has(m.status)) total.failed += 1;
        if (OPENED.has(m.status)) {
          row.opened += 1;
          bump(m.at, "opened");
        }
        if (m.status === "clicked") {
          row.clicked += 1;
          bump(m.at, "clicked");
        }
      }
      if (row.opened > 0) hasEngagement = true;
      total.sent += row.sent;
      total.delivered += row.delivered;
      total.opened += row.opened;
      total.clicked += row.clicked;
      messages.push(row);
    }
    messages.sort((a, b) =>
      a.first < b.first ? -1 : a.first > b.first ? 1 : b.sent - a.sent,
    );
    emails = {
      ok: true,
      data: {
        ...total,
        hasEngagement,
        truncated: emailRaw.data.truncated,
        messages,
      },
    };
  } else emails = emailRaw;

  let texts: Report["texts"];
  if (textRaw.ok) {
    // Only campaign texts: the same wording to enough people. Everyday one-to-one texts stay out,
    // and a reply counts only when it comes from someone a campaign text went to.
    const byEnding = new Map<string, number>();
    for (const m of textRaw.data.list)
      if (!m.inbound) byEnding.set(m.ending, (byEnding.get(m.ending) ?? 0) + 1);
    const out = textRaw.data.list.filter(
      (m) => !m.inbound && (byEnding.get(m.ending) ?? 0) >= BROADCAST_MIN,
    );
    const reached = new Set(out.map((m) => m.contactId));
    for (const m of out) bump(m.at, "texts");
    texts = {
      ok: true,
      data: {
        sent: out.length,
        delivered: out.filter((m) => !notDelivered(m.status)).length,
        failed: out.filter((m) => FAILED.has(m.status)).length,
        replies: textRaw.data.list.filter(
          (m) => m.inbound && !m.stop && reached.has(m.contactId),
        ).length,
        optOuts: new Set(
          textRaw.data.list
            .filter((m) => m.inbound && m.stop && reached.has(m.contactId))
            .map((m) => m.contactId),
        ).size,
        truncated: textRaw.data.truncated,
      },
    };
  } else texts = textRaw;

  let calls: Report["calls"];
  if (callRaw.ok) {
    const { list, skipped } = callRaw.data;
    for (const a of list) {
      bump(a.addedAt, "booked");
      if (a.status === "showed") bump(a.startAt, "held");
    }
    const cancelled = list.filter(
      (a) => a.status === "cancelled" || a.status === "invalid",
    ).length;
    calls = {
      ok: true,
      data: {
        booked: list.length,
        upcoming: list.filter(
          (a) =>
            a.startAt > now && (a.status === "confirmed" || a.status === "new"),
        ).length,
        held: list.filter((a) => a.status === "showed").length,
        noShow: list.filter((a) => a.status === "noshow").length,
        cancelled,
        skipped,
        list: list.map((a) => ({
          name: a.name,
          startAt: a.startAt,
          status: a.status,
        })),
      },
    };
  } else calls = callRaw;

  let pipeline: Report["pipeline"];
  if (pipelineRaw.ok) {
    for (const at of pipelineRaw.data.wonAt) bump(at, "sold");
    pipeline = { ok: true, data: pipelineRaw.data.summary };
  } else pipeline = pipelineRaw;

  let page: Report["page"] = null;
  if (!pageRaw.ok) page = pageRaw;
  else if (pageRaw.data) {
    for (const d of pageRaw.data.days) {
      const row = days.get(d.day);
      if (row) row.visits = d.visits;
    }
    page = { ok: true, data: pageRaw.data.summary };
  }

  return {
    generatedAt: now,
    stale,
    page,
    emails,
    texts,
    calls,
    pipeline,
    audience,
    days: [...days.values()].reverse(),
    shapes,
  };
}

/** A report with a failed or stand-in source is kept for a short while only, then read again. */
const PARTIAL_CACHE_MS = 2 * 60 * 1000;
/** Older than this, a kept report is too old to show while a new one is read: wait for the new one. */
const SHOW_OLD_MS = 6 * 60 * 60 * 1000;

let cached: { at: number; report: Report; complete: boolean } | null = null;
/** The read in progress, shared by everyone who asks while it runs (one read, not one each). */
let inflight: Promise<Report> | null = null;

function readNow(cfg: Config): Promise<Report> {
  inflight ??= build(cfg)
    .then((report) => {
      const complete =
        report.stale.length === 0 &&
        [
          report.emails,
          report.texts,
          report.calls,
          report.pipeline,
          report.audience,
          report.page,
        ].every((s) => s === null || s.ok);
      cached = { at: report.generatedAt, report, complete };
      return report;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * The report. Opening the page never waits on HighLevel when there's a recent report: it shows
 * that one at once and, once it's past its time (15 minutes, or 2 if something failed), reads a
 * new one in the background for the next visit. `fresh` (the Refresh button) waits for a new read.
 */
export async function blackFridayReport(
  fresh: boolean,
): Promise<Report | null> {
  const cfg = blackFridayConfig();
  if (!cfg) return null;
  if (fresh || !cached) return readNow(cfg);
  const age = Date.now() - cached.at;
  if (age < (cached.complete ? CACHE_MS : PARTIAL_CACHE_MS))
    return cached.report;
  if (age < SHOW_OLD_MS) {
    after(() => readNow(cfg).then(() => undefined));
    return cached.report;
  }
  return readNow(cfg);
}
