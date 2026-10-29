import { NextResponse } from "next/server";
import { SITE_NAME, SITE_URL } from "../../../lib/site-config";

/**
 * TEMPORARY — client-review feedback endpoint (the Notes widget and the
 * "Approve this version" button). Forwards to FEEDBACK_WEBHOOK_URL — a GHL
 * inbound webhook whose workflow emails the agency — when set; otherwise logs
 * and answers 200 (BUILD-ENV Law: read here, inside the handler). Delete with
 * the review kit at launch.
 */
export const runtime = "nodejs";

const MAX = { name: 80, title: 120, note: 2000, page: 300, version: 40, kind: 20, attestation: 300, reason: 1000, message: 1000 };

/** GHL HTML-escapes text and then sends it as plain text ("Let's" → "Let&#x27;s").
 *  Typographic quotes aren't escaped and read better in an email anyway. */
const friendly = (t: string) =>
  t.replace(/(^|[\s(\[])"/g, "$1\u201C").replace(/"/g, "\u201D").replace(/(^|[\s(\[])'/g, "$1\u2018").replace(/'/g, "\u2019");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  const s = (k: keyof typeof MAX) => friendly(String(body[k] ?? "").trim().slice(0, MAX[k]));
  const notes = Array.isArray(body.notes)
    ? (body.notes as unknown[]).slice(0, 50).map((n) => {
        const o = (n ?? {}) as Record<string, unknown>;
        return {
          page: String(o.page ?? "").slice(0, MAX.page),
          version: String(o.version ?? "").slice(0, MAX.version),
          title: friendly(String(o.title ?? "").trim().slice(0, MAX.title)),
          note: friendly(String(o.note ?? "").trim().slice(0, MAX.note)),
          at: String(o.at ?? "").slice(0, 40),
        };
      })
    : [];
  // Which site this came from. One GHL webhook can serve every site Realiiz
  // builds, so every payload names itself: the site, the address it was sent
  // from, the exact page, and the build. (Ported from The Fahr Group, 2026-10-29;
  // TODO: port to site-starter-pro too.)
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const previewUrl = host ? `${proto}://${host}` : "";
  const repo =
    process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : "";
  const kindRaw = s("kind");
  const kindLabel = kindRaw === "approval" ? "Approved" : kindRaw === "withdrawal" ? "Approval withdrawn" : "Feedback";
  const page = s("page");

  const payload = {
    /** The site's name from site-config (SITE_NAME). */
    site: SITE_NAME,
    /** The site's final address (SITE_URL). */
    siteUrl: SITE_URL,
    /** The address the reviewer was actually on (the preview deploy). */
    previewUrl,
    /** The full link to the page the feedback was sent from. */
    pageUrl: previewUrl && page ? `${previewUrl}${page.startsWith("/") ? page : `/${page}`}` : "",
    /** GitHub repo and branch of the build, when Vercel provides them. */
    repo,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "",
    /** Ready-made email subject: "[Site name] Feedback from Jane (3 notes)". */
    subject: "",
    kind: (["approval", "withdrawal"].includes(s("kind")) ? s("kind") : "notes") as "notes" | "approval" | "withdrawal",
    name: s("name"),
    version: s("version"),
    page: s("page"),
    notes: notes.filter((n) => n.title || n.note),
    /** The sign-off sentence the approver ticked, verbatim — so the record carries what they agreed to. */
    attestation: s("attestation"),
    /** The notes as plain lines, ready for an email body ("Title: note  [Page]"). */
    notesText: "",
    /** The message written to go with an approval (kind = approval). */
    message: s("message"),
    /** Why an approval is being withdrawn (kind = withdrawal). */
    reason: s("reason"),
    source: "preview-review",
    receivedAt: new Date().toISOString(),
  };
  payload.subject = `[${SITE_NAME}] ${kindLabel}${payload.name ? ` from ${payload.name}` : ""}${
    payload.kind === "notes" ? ` (${payload.notes.length} note${payload.notes.length === 1 ? "" : "s"})` : ""
  }`;
  payload.notesText = payload.notes
    .map((n) => `\u2022 ${n.title || n.note}${n.title && n.note ? `: ${n.note}` : ""}  [${n.page}]`)
    .join("\n");
  // Honeypot
  if (typeof body.company === "string" && body.company.trim()) return NextResponse.json({ ok: true });
  if (payload.kind === "notes" && payload.notes.length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to send." }, { status: 422 });
  }
  if (payload.kind === "approval" && (!payload.name || !payload.attestation)) {
    return NextResponse.json({ ok: false, error: "An approval needs a name and the ticked statement." }, { status: 422 });
  }
  if (payload.kind === "withdrawal" && (!payload.name || !payload.reason)) {
    return NextResponse.json({ ok: false, error: "Withdrawing needs a name and a reason." }, { status: 422 });
  }

  const webhook = process.env.FEEDBACK_WEBHOOK_URL;
  if (webhook) {
    try {
      const r = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        console.error("[feedback] webhook responded", r.status);
        return NextResponse.json({ ok: false, error: "Couldn't deliver." }, { status: 502 });
      }
    } catch (e) {
      console.error("[feedback] webhook failed", e);
      return NextResponse.json({ ok: false, error: "Couldn't deliver." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, delivered: true });
  }
  console.log("[feedback] (no FEEDBACK_WEBHOOK_URL set):", JSON.stringify(payload));
  return NextResponse.json({ ok: true, delivered: false });
}
