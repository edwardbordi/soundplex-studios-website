import { promises as dns } from "node:dns";

/**
 * Email validation for lead-form endpoints.
 *
 * ── What actually stops junk, and what only looks like it does ─────────────
 * A stricter regex is the obvious move and close to useless: spam bots submit
 * syntactically perfect addresses. Tightening the pattern mostly rejects real
 * people with unusual-but-valid addresses (plus-tags, new TLDs, apostrophes),
 * which costs leads to prevent nothing.
 *
 * What does work is asking whether the domain can receive mail at all. A domain
 * with no MX records cannot be delivered to, so an address there is worthless
 * whether it came from a bot or a typo. That single DNS lookup catches:
 *   • invented domains  — the long tail of bot submissions
 *   • typo'd domains    — gmail.con, hotmial.com, outlok.com
 *
 * The second of those may matter more than the first. A typo'd address isn't
 * spam, it's a real lead whose preview link and follow-up silently go nowhere —
 * the failure looks like success on both ends, and nobody finds out until the
 * reveal call never gets booked.
 */

/** Deliberately permissive — reject the obviously-broken, not the unusual. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/**
 * Domain → can it receive mail. Cached for the life of the serverless instance.
 *
 * Most submissions are gmail.com / yahoo.com / outlook.com, so this collapses to
 * a handful of lookups. Only positives and definitive negatives are cached; a
 * transient failure must not be remembered as a verdict.
 */
const mxCache = new Map<string, boolean>();

/** Give up quickly — a slow resolver must not hold up a submission. */
const DNS_TIMEOUT_MS = 2500;

/**
 * Domains an MX check CANNOT protect against, because they're real.
 *
 * `iclouf.com` is registered, has a live mail server, and accepts mail — so the
 * DNS check passes it happily. It's a typosquat of icloud.com, and accepting
 * mail is the entire business model: misdirected email is the product.
 *
 * So a second test is needed, asking a different question. The MX lookup asks
 * "can mail be delivered here"; this asks "is this the domain they meant".
 *
 * Edit distance 1 only — deliberately conservative. Distance 2 starts matching
 * real, unrelated domains, and wrongly blocking someone's actual address is a
 * far worse outcome than letting one typo through.
 */
/**
 * ⚠️ SHORT DOMAINS ARE DELIBERATELY ABSENT. me.com, aol.com and live.com were
 * on this list and had to come off: the shorter the domain, the more REAL
 * domains sit one edit away from it.
 *
 *   ao.com   is one insertion from aol.com  — and is a large UK retailer
 *   line.com, like.com, five.com are each one edit from live.com
 *   we.com, he.com, be.com are each one edit from me.com
 *
 * Telling one of those visitors that their own address is a typo, and then
 * refusing it, is a far worse failure than letting a typo through. Only domains
 * long enough to have few plausible neighbours stay.
 */
const COMMON_MAIL_DOMAINS = [
  "gmail.com",
  "icloud.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "comcast.net",
  "verizon.net",
  "protonmail.com",
];

/** Levenshtein distance, capped — we only ever care whether it's exactly 1. */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 99;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** The domain they probably meant, or null if this one looks intentional. */
export function suggestDomain(domain: string): string | null {
  if (COMMON_MAIL_DOMAINS.includes(domain)) return null;
  for (const known of COMMON_MAIL_DOMAINS) {
    if (editDistance(domain, known) === 1) return known;
  }
  return null;
}

export type EmailCheck =
  | { ok: true }
  | { ok: false; reason: "malformed" | "undeliverable-domain" }
  | { ok: false; reason: "likely-typo"; suggestion: string };

/**
 * ⚠️ FAILS OPEN, on purpose.
 *
 * Three outcomes, and the distinction between the last two is the whole point:
 *   • MX records exist                     → accept
 *   • domain definitively has none / does
 *     not exist (NXDOMAIN, ENODATA)        → reject; mail could never arrive
 *   • lookup errored or timed out          → ACCEPT
 *
 * That last branch matters. A DNS blip is our problem, not the visitor's, and
 * this lib follows the standing rule that a lead endpoint never breaks on
 * OUR failures — a person who did their part never gets turned away. Rejecting
 * on an ambiguous result would trade a little junk for real leads lost at the
 * moment of intent — the wrong side of that trade.
 */
export async function checkEmail(
  email: string,
  /**
   * Set once the person has been shown the suggestion and said their address is
   * right. The lookalike test is a GUESS — no list of common domains can be
   * complete, and a real domain will eventually sit one edit from one of them.
   * Without this escape hatch that person simply cannot submit, and would be
   * told their own email address is a mistake on the way out.
   *
   * Only the guess is skipped. The MX check still runs, because "I'm sure"
   * doesn't make a domain able to receive mail.
   */
  { typoConfirmed = false }: { typoConfirmed?: boolean } = {},
): Promise<EmailCheck> {
  if (!looksLikeEmail(email)) return { ok: false, reason: "malformed" };

  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();

  // Checked BEFORE the MX lookup, because the domains this catches all pass MX.
  // A typosquat that runs a mail server is indistinguishable from a real one at
  // the DNS layer — that's the point of it.
  if (!typoConfirmed) {
    const suggestion = suggestDomain(domain);
    if (suggestion) return { ok: false, reason: "likely-typo", suggestion };
  }

  const cached = mxCache.get(domain);
  if (cached !== undefined) {
    return cached ? { ok: true } : { ok: false, reason: "undeliverable-domain" };
  }

  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("dns-timeout")), DNS_TIMEOUT_MS),
      ),
    ]);

    const deliverable = records.length > 0;
    mxCache.set(domain, deliverable);
    return deliverable ? { ok: true } : { ok: false, reason: "undeliverable-domain" };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;

    // A definitive "no such domain" or "no MX records" is a real answer, not a
    // failure, so it's safe to cache and safe to reject on.
    if (code === "ENOTFOUND" || code === "ENODATA") {
      mxCache.set(domain, false);
      return { ok: false, reason: "undeliverable-domain" };
    }

    // Anything else — timeout, SERVFAIL, resolver unreachable — is OUR problem.
    // Not cached: the next request should try again rather than inherit a
    // verdict we never actually reached.
    console.warn("[email] MX lookup inconclusive, accepting anyway", { domain, code });
    return { ok: true };
  }
}
