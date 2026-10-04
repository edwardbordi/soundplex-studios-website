import { SITE_URL } from "./site-config";

/**
 * API-route conventions kit — the guards every route in this template
 * should use. Two exports:
 *
 *  - isAllowedOrigin(request): same-origin gate. Browsers attach Origin to
 *    cross-site POSTs and page JS cannot forge it, so other sites and
 *    naive scripts are blocked without shipping any secret to the client.
 *    Origin IS forgeable by a non-browser script — this is proportionate
 *    for endpoints whose worst case is a junk CRM contact; pair it with a
 *    honeypot field for the actual traffic (dumb form-spam bots).
 *    Localhost and *.vercel.app are allowed outside production so dev and
 *    preview deploys work.
 *
 *  - safeHostname(host): SSRF guard for any route that fetches a
 *    user-supplied URL. Public-looking domains only: no IP literals, no
 *    localhost/.local/.internal. Combine with https-only, no-port, a
 *    short timeout, and a response-size cap (see api/check-site).
 */

export function isAllowedOrigin(request: Request): boolean {
  const origin =
    request.headers.get("origin") ??
    (() => {
      const referer = request.headers.get("referer");
      if (!referer) return null;
      try {
        return new URL(referer).origin;
      } catch {
        return null;
      }
    })();
  if (!origin) return false;
  try {
    const site = new URL(SITE_URL);
    const allowed = [SITE_URL, `${site.protocol}//www.${site.host}`];
    if (allowed.includes(origin)) return true;
  } catch {
    /* SITE_URL is a constant */
  }
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.VERCEL_ENV === "preview"
  ) {
    try {
      const host = new URL(origin).hostname;
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".vercel.app")
      )
        return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/** Hostname must look like a public domain: letters/digits/hyphens with at
    least one dot, not an IP literal, not localhost/.local/.internal. */
export function safeHostname(host: string): boolean {
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host)) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  const lower = host.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) return false;
  if (lower.endsWith(".local") || lower.endsWith(".internal")) return false;
  return true;
}
