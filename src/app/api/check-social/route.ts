import { isAllowedOrigin } from "../../../lib/api-guard";
import { parseSocial } from "../../../lib/social";

/**
 * POST /api/check-social — { value } → { found: true | false | null }
 * (Ported from Root & Reach for the SoundPlex member profile, 2026-10-28.)
 *
 * A real existence check, only where the platform answers honestly:
 *   - YouTube: the "@handle" page is a true 404 when the channel is missing.
 *   - TikTok: its public embed service (oEmbed) returns the creator for a
 *     real profile and an error for a missing one.
 *   - X: same, through publish.twitter.com's oEmbed.
 * Anything unclear (blocked, rate-limited, timed out) is { found: null },
 * "can't tell", so the form never shows a mark it didn't earn. Requests go
 * only to those fixed hosts, rebuilt from the parsed handle; nothing from
 * the request is used as a URL.
 */
export const runtime = "nodejs";

const SAFE = /^[a-z0-9._\-]{1,40}$/i;

async function get(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SiteCheck/1.0)" },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function exists(platform: string, handle: string): Promise<boolean | null> {
  const h = encodeURIComponent(handle);
  if (platform === "youtube") {
    const res = await get(`https://www.youtube.com/@${h}`);
    res?.body?.cancel().catch(() => {});
    if (!res) return null;
    return res.status === 404 ? false : res.ok ? true : null;
  }
  const endpoint =
    platform === "tiktok"
      ? `https://www.tiktok.com/oembed?url=${encodeURIComponent(`https://www.tiktok.com/@${handle}`)}`
      : platform === "x"
        ? `https://publish.twitter.com/oembed?omit_script=true&url=${encodeURIComponent(`https://twitter.com/${handle}`)}`
        : null;
  if (!endpoint) return null;
  const res = await get(endpoint);
  if (!res) return null;
  if (res.status === 400 || res.status === 404) return false;
  if (!res.ok) return null;
  try {
    const data = (await res.json()) as { author_name?: string; author_url?: string; html?: string };
    return data.author_name || data.author_url || data.html ? true : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  let value = "";
  try {
    const body = (await request.json()) as { value?: unknown };
    value = typeof body?.value === "string" ? body.value.slice(0, 300) : "";
  } catch {
    return Response.json({ found: null });
  }

  const info = parseSocial(value);
  if (!info.checkable || !info.platform || !SAFE.test(info.handle)) return Response.json({ found: null });
  return Response.json({ found: await exists(info.platform, info.handle) });
}
