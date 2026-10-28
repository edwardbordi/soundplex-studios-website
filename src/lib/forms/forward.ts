import { isAllowedOrigin } from "../api-guard";
import { checkEmail } from "../email";

/**
 * The one way every form on this site reaches GoHighLevel.
 *
 * Three forms, three inbound webhooks (COMPANY-FACTS.md §8): GHL_WEBHOOK_SURVEY,
 * GHL_WEBHOOK_CONTACT, GHL_WEBHOOK_NEWSLETTER. Each route calls `handleForm` with its
 * env var name and a `shape` function that turns the raw body into the payload GHL gets.
 *
 * Conventions (lib/api-guard.ts, api/check-site): same-origin gate, honeypot, email
 * sanity check that fails open on OUR failures, env read lazily inside the handler
 * (BUILD-ENV law). When the webhook is unset the route logs and answers
 * { ok: true, delivered: false } — the visitor is never turned away because we
 * haven't finished configuring the CRM.
 */

export type FormResult =
  | { ok: true; delivered: boolean }
  | { ok: false; status: number; error: string; suggestion?: string; field?: string };

const MAX_FIELD = 2000;

export function str(v: unknown, max = MAX_FIELD): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** GHL HTML-escapes plain text on the way in; typographic quotes survive and read better. */
export function friendly(t: string): string {
  return t
    .replace(/(^|[\s(\[])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(^|[\s(\[])'/g, "$1‘")
    .replace(/'/g, "’");
}

export function digits(v: unknown): string {
  return str(v, 40).replace(/\D/g, "");
}

export async function handleForm(
  request: Request,
  opts: {
    envVar: "GHL_WEBHOOK_SURVEY" | "GHL_WEBHOOK_CONTACT" | "GHL_WEBHOOK_NEWSLETTER";
    source: string;
    /** Honeypot field name — a hidden input real people never fill. */
    honeypot: string;
    /** Validate + shape. Return a payload, or an error. */
    shape: (body: Record<string, unknown>) => { payload: Record<string, unknown>; email: string } | { error: string; field?: string };
  },
): Promise<Response> {
  if (!isAllowedOrigin(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ ok: false, error: "Bad request" }, { status: 400 });

  // Honeypot: a filled field means a bot. Answer success so it moves on.
  if (str(body[opts.honeypot], 50)) return Response.json({ ok: true, delivered: false });

  const shaped = opts.shape(body);
  if ("error" in shaped) return Response.json({ ok: false, error: shaped.error, field: shaped.field }, { status: 422 });

  // Email: malformed → stop; likely typo → offer the fix once; undeliverable → stop; DNS blip → accept.
  const check = await checkEmail(shaped.email, { typoConfirmed: body.typoConfirmed === true });
  if (!check.ok) {
    if (check.reason === "likely-typo") {
      return Response.json(
        { ok: false, error: `Did you mean @${check.suggestion}?`, suggestion: check.suggestion, field: "email" },
        { status: 422 },
      );
    }
    const msg = check.reason === "malformed" ? "That email doesn’t look right." : "That email domain can’t receive mail — check the spelling.";
    return Response.json({ ok: false, error: msg, field: "email" }, { status: 422 });
  }

  const payload = {
    ...shaped.payload,
    source: opts.source,
    page: str(body.page, 300),
    receivedAt: new Date().toISOString(),
  };

  const webhook = process.env[opts.envVar];
  if (!webhook) {
    console.warn(`[forms] ${opts.envVar} is not set — ${opts.source} submission logged, not forwarded`, payload);
    return Response.json({ ok: true, delivered: false });
  }
  try {
    const r = await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) console.error(`[forms] ${opts.source} webhook responded`, r.status);
    return Response.json({ ok: true, delivered: r.ok });
  } catch (e) {
    console.error(`[forms] ${opts.source} webhook failed`, e);
    // Our failure, not theirs: thank them anyway, and the log has the submission.
    return Response.json({ ok: true, delivered: false });
  }
}
