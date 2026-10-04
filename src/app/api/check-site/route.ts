import { isAllowedOrigin, safeHostname } from "../../../lib/api-guard";

/**
 * POST /api/check-site — { url } → { live, title? }
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

    // Read only the first ~32KB — the <title> lives in the head.
    let html = "";
    const reader = res.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      while (html.length < 32768) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
      }
      reader.cancel().catch(() => {});
    }
    clearTimeout(timer);

    const title = /<title[^>]*>([^<]{1,120})/i.exec(html)?.[1]?.trim();
    return Response.json({ live: true, ...(title ? { title } : {}) });
  } catch {
    return Response.json({ live: false });
  }
}
