import { isAllowedOrigin } from "../../../lib/api-guard";
import { checkEmail } from "../../../lib/email";

/**
 * POST /api/check-email — { email, typoConfirmed? } → { ok, error?, suggestion? }
 *
 * The same email check the form endpoints run when they submit (lib/email.ts: malformed →
 * likely typo of a common provider → can this domain receive mail?), on its own, so a form
 * can check BEFORE it sends. The footer newsletter needs it: Join asks for an optional first
 * name before sending (one webhook call), so the address has to be vetted at Join, not after
 * (Ed, 2026-10-28: "ebordi@iclouf.com" got through to the name step).
 *
 * Same-origin gated. Fails open on DNS trouble, like checkEmail itself. Nothing is stored or sent.
 */
export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: { email?: unknown; typoConfirmed?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";

  const check = await checkEmail(email, { typoConfirmed: body.typoConfirmed === true });
  if (check.ok) return Response.json({ ok: true });
  if (check.reason === "likely-typo") return Response.json({ ok: false, error: `Did you mean @${check.suggestion}?`, suggestion: check.suggestion });
  return Response.json({
    ok: false,
    error: check.reason === "malformed" ? "That email doesn’t look right." : "That email domain can’t receive mail. Check the spelling.",
  });
}
