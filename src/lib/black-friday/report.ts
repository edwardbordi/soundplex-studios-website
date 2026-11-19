import "server-only";
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
};
export type StageRow = { name: string; open: number; value: number };

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
    truncated: boolean;
  }>;
  calls: Source<{
    booked: number;
    upcoming: number;
    held: number;
    noShow: number;
    cancelled: number;
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
  days: DayRow[];
  /** Field names only (never values) of one record per source, for ?debug=1. */
  shapes: Record<string, string[]>;
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

async function hl(
  cfg: Config,
  path: string,
  init?: { method?: "POST"; body?: Json },
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
    signal: AbortSignal.timeout(TIMEOUT_MS),
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
    if (err.status === 403)
      return `${err.message}. The token does not have permission for this.`;
    return err.message;
  }
  if (err instanceof Error && err.name === "TimeoutError")
    return "HighLevel took too long to answer. Try Refresh.";
  return err instanceof Error
    ? err.message
    : "Something went wrong reading this.";
}

async function source<T>(fn: () => Promise<T>): Promise<Source<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
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

type Message = {
  at: number;
  status: string;
  inbound: boolean;
  subject: string;
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
      });
    }
    cursor = str(data.nextCursor);
    if (!cursor || messages.length === 0) return { list, truncated: false };
  }
  return { list, truncated: true };
}

const FAILED = new Set(["failed", "undelivered", "bounced", "rejected"]);
const OPENED = new Set(["opened", "read", "clicked"]);
const notDelivered = (status: string) =>
  FAILED.has(status) || status === "pending" || status === "scheduled";

type Opportunity = {
  status: string;
  stageId: string;
  value: number;
  wonAt: number;
};

async function opportunities(
  cfg: Config,
  pipelineId: string,
  shapes: Report["shapes"],
): Promise<Opportunity[]> {
  const list: Opportunity[] = [];
  // The search has answered to both spellings over time; try the documented one, then the older.
  let snake = false;
  for (let page = 1; page <= 20; page++) {
    const params: Record<string, string | number> = snake
      ? {
          location_id: cfg.locationId,
          pipeline_id: pipelineId,
          status: "all",
          limit: 100,
          page,
        }
      : {
          locationId: cfg.locationId,
          pipelineId,
          status: "all",
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
      // Guard against a search that ignored the pipeline filter.
      if (str(o.pipelineId) && str(o.pipelineId) !== pipelineId) continue;
      list.push({
        status: str(o.status).toLowerCase(),
        stageId: str(o.pipelineStageId),
        value: num(o.monetaryValue),
        wonAt:
          time(o.lastStatusChangeAt) || time(o.updatedAt) || time(o.createdAt),
      });
    }
    if (rows.length < 100) break;
  }
  return list;
}

async function readPipeline(cfg: Config, shapes: Report["shapes"]) {
  const data = await hl(
    cfg,
    `/opportunities/pipelines?${qs({ locationId: cfg.locationId })}`,
  );
  const pipelines = arr(data.pipelines);
  const found = cfg.pipelineId
    ? pipelines.find((p) => str(p.id) === cfg.pipelineId)
    : pipelines.find((p) => /black\s*friday/i.test(str(p.name)));
  if (!found) {
    throw new Error(
      cfg.pipelineId
        ? "The pipeline named in BLACK_FRIDAY_PIPELINE_ID was not found in this account."
        : "No pipeline with “Black Friday” in its name was found. Create one in HighLevel (Opportunities, then Pipelines) and it shows up here.",
    );
  }
  const id = str(found.id);
  const opps = await opportunities(cfg, id, shapes);
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

type Appointment = { addedAt: number; startAt: number; status: string };

async function appointments(
  cfg: Config,
  shapes: Report["shapes"],
): Promise<Appointment[]> {
  const data = await hl(
    cfg,
    `/calendars/events?${qs({ locationId: cfg.locationId, calendarId: cfg.calendarId, startTime: CAMPAIGN_START, endTime: OFFER_END + 60 * 24 * 60 * 60 * 1000 })}`,
  );
  const events = arr(data.events);
  if (events[0]) shapes.appointment = Object.keys(events[0]);
  return events.map((e) => ({
    addedAt: time(e.dateAdded) || time(e.startTime),
    startAt: time(e.startTime),
    status: str(e.appointmentStatus).toLowerCase(),
  }));
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
      booked: 0,
      held: 0,
      sold: 0,
    });
  }
  const bump = (ms: number, key: Exclude<keyof DayRow, "day">) => {
    const row = days.get(dayOf(ms));
    if (row) row[key] += 1;
  };

  const [emailRaw, textRaw, callRaw, pipelineRaw, audience] = await Promise.all(
    [
      source(() => exportMessages(cfg, "Email", shapes)),
      source(() => exportMessages(cfg, "SMS", shapes)),
      source(() => appointments(cfg, shapes)),
      source(() => readPipeline(cfg, shapes)),
      source(async () => {
        const [all, booked] = await Promise.all([
          tagged(cfg, "bf26-soundplex"),
          tagged(cfg, "bf26-booked"),
        ]);
        return { tagged: all, booked };
      }),
    ],
  );

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
    const out = textRaw.data.list.filter((m) => !m.inbound);
    for (const m of out) bump(m.at, "texts");
    texts = {
      ok: true,
      data: {
        sent: out.length,
        delivered: out.filter((m) => !notDelivered(m.status)).length,
        failed: out.filter((m) => FAILED.has(m.status)).length,
        replies: textRaw.data.list.length - out.length,
        truncated: textRaw.data.truncated,
      },
    };
  } else texts = textRaw;

  let calls: Report["calls"];
  if (callRaw.ok) {
    const list = callRaw.data;
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
      },
    };
  } else calls = callRaw;

  let pipeline: Report["pipeline"];
  if (pipelineRaw.ok) {
    for (const at of pipelineRaw.data.wonAt) bump(at, "sold");
    pipeline = { ok: true, data: pipelineRaw.data.summary };
  } else pipeline = pipelineRaw;

  return {
    generatedAt: now,
    emails,
    texts,
    calls,
    pipeline,
    audience,
    days: [...days.values()].reverse(),
    shapes,
  };
}

let cached: { at: number; report: Report } | null = null;

/** The report, at most 15 minutes old; `fresh` (the Refresh button) reads everything again. */
export async function blackFridayReport(
  fresh: boolean,
): Promise<Report | null> {
  const cfg = blackFridayConfig();
  if (!cfg) return null;
  if (!fresh && cached && Date.now() - cached.at < CACHE_MS)
    return cached.report;
  const report = await build(cfg);
  cached = { at: report.generatedAt, report };
  return report;
}
