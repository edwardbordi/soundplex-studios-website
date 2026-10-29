/**
 * Social account helpers for member profiles (ported from Root & Reach). Pure functions, safe in both
 * client and server code.
 *
 * Each entry in the social field is a link or a bare handle. These helpers
 * work out which platform it is, turn it into a clean link anyone can
 * click, catch obvious typos ("instagran.com", spaces in a handle) and say
 * whether a real "does it exist?" check is possible. YouTube answers that
 * honestly (a missing channel is a real 404), and so do TikTok's and X's
 * public embed services. Instagram and LinkedIn put up login walls and
 * Facebook returns a normal page for anything, so for those we never claim
 * to have checked.
 */

export type PlatformId = "instagram" | "tiktok" | "facebook" | "youtube" | "linkedin" | "x" | "pinterest" | "threads";

export const PLATFORMS: Record<PlatformId, { label: string; host: string; hosts: string[]; path: (h: string) => string; handle: RegExp }> = {
  instagram: { label: "Instagram", host: "instagram.com", hosts: ["instagram.com", "instagr.am"], path: (h) => h, handle: /^[a-z0-9._]{1,30}$/i },
  tiktok: { label: "TikTok", host: "tiktok.com", hosts: ["tiktok.com"], path: (h) => `@${h}`, handle: /^[a-z0-9._]{2,24}$/i },
  facebook: { label: "Facebook", host: "facebook.com", hosts: ["facebook.com", "fb.com", "fb.me"], path: (h) => h, handle: /^[a-z0-9.\-]{2,50}$/i },
  youtube: { label: "YouTube", host: "youtube.com", hosts: ["youtube.com", "youtu.be"], path: (h) => `@${h}`, handle: /^[a-z0-9._\-]{3,30}$/i },
  linkedin: { label: "LinkedIn", host: "linkedin.com", hosts: ["linkedin.com"], path: (h) => `in/${h}`, handle: /^[a-z0-9\-]{3,100}$/i },
  x: { label: "X", host: "x.com", hosts: ["x.com", "twitter.com"], path: (h) => h, handle: /^[a-z0-9_]{1,15}$/i },
  pinterest: { label: "Pinterest", host: "pinterest.com", hosts: ["pinterest.com", "pin.it"], path: (h) => h, handle: /^[a-z0-9_]{3,30}$/i },
  threads: { label: "Threads", host: "threads.net", hosts: ["threads.net", "threads.com"], path: (h) => `@${h}`, handle: /^[a-z0-9._]{1,30}$/i },
};

/** Platforms where we can really tell if an account exists. */
export const CHECKABLE: PlatformId[] = ["youtube", "tiktok", "x"];

/** The choices offered for a bare "@handle". */
export const ASK_PLATFORMS: PlatformId[] = ["instagram", "tiktok", "facebook"];

export type SocialInfo = {
  raw: string;
  platform: PlatformId | null;
  /** The account name without "@", when we could find one. */
  handle: string;
  /** A clean, clickable link, when the platform is known. */
  url: string | null;
  /** "instagran.com" → "instagram.com" */
  typoHost?: string;
  /** Something about it looks wrong (spaces, characters the platform doesn't allow). */
  problem?: string;
  /** True only where a real existence check works (YouTube, TikTok, X). */
  checkable: boolean;
};

function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function platformForHost(host: string): PlatformId | null {
  const h = host.toLowerCase().replace(/^(www\.|m\.|mobile\.)/, "");
  for (const id of Object.keys(PLATFORMS) as PlatformId[]) if (PLATFORMS[id].hosts.includes(h)) return id;
  return null;
}

function nearPlatform(host: string): string | undefined {
  const h = host.toLowerCase().replace(/^(www\.|m\.)/, "");
  for (const p of Object.values(PLATFORMS)) for (const known of p.hosts) {
    const dist = lev(h, known);
    if (dist > 0 && dist <= 2 && known.length > 6) return known;
  }
  return undefined;
}

/** Work out what an entry is. */
export function parseSocial(input: string): SocialInfo {
  const raw = input.trim();
  const base: SocialInfo = { raw, platform: null, handle: "", url: null, checkable: false };
  if (!raw) return base;

  // A bare handle: "@rootandreach" or "rootandreach" (no dot-com anywhere).
  const looksLikeLink = /\.[a-z]{2,}(\/|$)/i.test(raw) || /^https?:\/\//i.test(raw);
  if (!looksLikeLink) {
    const handle = raw.replace(/^@+/, "");
    return { ...base, handle, problem: /\s/.test(handle) ? "Handles can't have spaces" : undefined };
  }

  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ...base, problem: "That link doesn't look right" };
  }
  const platform = platformForHost(u.hostname);
  if (!platform) {
    const typoHost = nearPlatform(u.hostname);
    return { ...base, url: u.href, typoHost };
  }

  const parts = u.pathname.split("/").filter(Boolean);
  let handle = "";
  if (platform === "linkedin") handle = parts[0] === "in" || parts[0] === "company" ? parts[1] ?? "" : parts[0] ?? "";
  else if (platform === "youtube" && (parts[0] === "c" || parts[0] === "user" || parts[0] === "channel")) handle = parts[1] ?? "";
  else if (platform === "facebook" && parts[0] === "profile.php") handle = u.searchParams.get("id") ?? "";
  else handle = (parts[0] ?? "").replace(/^@/, "");
  handle = decodeURIComponent(handle);

  const p = PLATFORMS[platform];
  const url = handle ? `https://${p.host}/${u.pathname.replace(/^\/+|\/+$/g, "")}${platform === "facebook" && parts[0] === "profile.php" ? u.search : ""}` : `https://${p.host}/`;
  const problem = !handle
    ? "Add the account name to the link"
    : /\s/.test(handle)
      ? "Handles can't have spaces"
      : platform !== "facebook" && !p.handle.test(handle)
        ? `That doesn't look like a ${p.label} name`
        : undefined;
  // Where a real "does it exist?" answer is possible: a YouTube "@handle" page
  // is a true 404 when missing; TikTok and X answer through their public
  // embed (oEmbed) services. Instagram, Facebook and LinkedIn hide it.
  const checkable =
    !problem &&
    !!handle &&
    ((platform === "youtube" && (parts[0] ?? "").startsWith("@")) || platform === "tiktok" || platform === "x");
  return { ...base, platform, handle, url, problem, checkable };
}

/** Turn a bare handle into a link for the platform they picked. */
export function socialFromHandle(handle: string, platform: PlatformId): string {
  const h = handle.replace(/^@+/, "").trim();
  return `${PLATFORMS[platform].host}/${PLATFORMS[platform].path(h)}`;
}

/** Fix a near-miss host: "instagran.com/x" → "instagram.com/x". */
export function fixSocialHost(raw: string, host: string): string {
  return raw.replace(/^(https?:\/\/)?(www\.)?[^/]+/i, `$1$2${host}`);
}

/** Short label for the list: "Instagram" + "@rootandreach". */
export function socialLabel(info: SocialInfo): { platform: string | null; name: string } {
  if (info.platform) return { platform: PLATFORMS[info.platform].label, name: info.handle ? `@${info.handle}` : info.raw };
  if (info.url) return { platform: null, name: info.raw.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/+$/, "") };
  return { platform: null, name: `@${info.handle}` };
}

/** A clickable link for a saved entry (null for a bare handle with no platform). */
export function socialHref(raw: string): string | null {
  const info = parseSocial(raw);
  return info.url && !info.problem ? info.url : null;
}
