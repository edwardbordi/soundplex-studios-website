import { isAllowedOrigin, safeHostname } from "../../../lib/api-guard";

/**
 * POST /api/check-site — { url } → { live, title?, issues? }
 *
 * Used by the survey's website path ("Current website"): a live check, a screenshot, and a
 * short list of what's wrong with their site (SiteField.tsx).
 *
 * The template's EXAMPLE API route, demonstrating the conventions every
 * route here should follow (see lib/api-guard.ts):
 *   - same-origin gated (isAllowedOrigin)
 *   - SSRF-guarded outbound fetch: https/http only, no ports, public
 *     hostnames only (safeHostname), 6s timeout, body read capped
 *   - graceful shape on every failure — a dead URL is { live: false },
 *     never a 500
 *
 * What it's for: a lead form's "what's your website?" field can ping this
 * and greet the visitor with their own site title — a small "found it"
 * moment that also validates the URL. Delete the route if the site has no
 * such form; keep lib/api-guard.ts either way.
 */
export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const input =
    typeof (raw as { url?: unknown })?.url === "string"
      ? ((raw as { url: string }).url ?? "").trim().slice(0, 300)
      : "";
  if (!input) return Response.json({ live: false });

  // Normalize: people type "mycompany.com".
  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  let target: URL;
  try {
    target = new URL(candidate);
  } catch {
    return Response.json({ live: false });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:")
    return Response.json({ live: false });
  if (target.port) return Response.json({ live: false });
  if (!safeHostname(target.hostname)) return Response.json({ live: false });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const startedAt = Date.now();
    const res = await fetch(target.href, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SiteCheck/1.0)",
        Accept: "text/html",
      },
    });

    if (!res.ok) {
      clearTimeout(timer);
      // 403s often mean "alive but bot-shy" (Cloudflare etc.) — count as
      // live, but DON'T read the body: it's the block page, and its title
      // says nothing about their real site.
      return Response.json({ live: res.status === 403 });
    }

    // Read up to ~150KB — the head and early body, where the title, meta tags, schema and
    // tracking snippets live.
    let html = "";
    try {
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        while (html.length < 153600) {
          const { done, value } = await reader.read();
          if (done) break;
          html += decoder.decode(value, { stream: true });
        }
        reader.cancel().catch(() => {});
      }
    } catch {
      /* partial HTML is fine — "live" is the main answer */
    }
    const loadMs = Date.now() - startedAt;
    clearTimeout(timer);

    let title = /<title[^>]*>([^<]{1,200})/i.exec(html)?.[1]
      ?.replace(/&amp;/g, "&").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
    // Challenge/error pages sometimes come back 200 — never echo those as their site.
    if (title && /forbidden|access denied|just a moment|attention required|error|not found|\b40\d\b|\b50\d\b/i.test(title)) title = undefined;

    // Quick audit (the website survey path — George resells websites): what's BAD only,
    // generous checks so a healthy site is never flagged. Same list as the Realiiz survey.
    const issues: string[] = [];
    const lower = html.toLowerCase();
    if (html) {
      if (loadMs > 1500) issues.push(`Slow to load — ${(loadMs / 1000).toFixed(1)}s to respond`);
      if (!res.url.startsWith("https:")) issues.push("Not secure — no HTTPS");
      if (!/name=["']?viewport/.test(lower)) issues.push("Not set up for phones — missing viewport");
      if (!lower.includes("application/ld+json") && !lower.includes("schema.org")) issues.push("No structured data — hard for Google and AI search to read");
      if (!/googletagmanager|gtag\(|google-analytics|fbq\(|hotjar|clarity|plausible|matomo|segment\.com/.test(lower)) issues.push("No visitor analytics detected — flying blind on traffic");
      if (!/name=["']?description/.test(lower)) issues.push("Missing meta description — weak search snippet");
    }

    return Response.json({ live: true, ...(title ? { title } : {}), ...(issues.length ? { issues: issues.slice(0, 4) } : {}) });
  } catch {
    return Response.json({ live: false });
  }
}
