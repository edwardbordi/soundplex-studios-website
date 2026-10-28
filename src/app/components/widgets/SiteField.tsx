"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The website path's "Current website" field, with a live look at their site (Ed, 2026-10-28 —
 * the same moment as the Realiiz apply survey). As they type a domain we ask /api/check-site,
 * show "Found it" or "Can't reach it" inside the field, and — when it's live — a screenshot of
 * their site plus the few things wrong with it. Never blocks Continue; it's a "we already
 * looked" moment, and the issues are George's opener on the call.
 *
 * State is keyed by URL so nothing is set synchronously in an effect: while the result on hand
 * is for a different address, we're "checking".
 */

type Result = { url: string; live: boolean; title?: string; issues?: string[] };
const looksLikeDomain = (s: string) => /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(s);

export default function SiteField({ value, onChange, onEnter, placeholder, invalid }: { value: string; onChange: (v: string) => void; onEnter: () => void; placeholder?: string; invalid?: boolean }) {
  const url = value.trim();
  const [result, setResult] = useState<Result | null>(null);
  const latest = useRef(url);

  useEffect(() => {
    latest.current = url;
    if (!looksLikeDomain(url)) return;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/check-site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
        const d = (await res.json().catch(() => ({}))) as { live?: boolean; title?: unknown; issues?: unknown };
        if (latest.current !== url) return; // they kept typing
        setResult({
          url,
          live: Boolean(d.live),
          ...(typeof d.title === "string" ? { title: d.title } : {}),
          ...(Array.isArray(d.issues) ? { issues: d.issues.filter((i): i is string => typeof i === "string") } : {}),
        });
      } catch {
        if (latest.current === url) setResult({ url, live: false });
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [url]);

  const status: "idle" | "checking" | Result = !looksLikeDomain(url) ? "idle" : result?.url === url ? result : "checking";

  return (
    <div className="sf">
      <div className="sf__field">
        <input
          className="sv__input sf__input"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
          aria-invalid={invalid || undefined}
          aria-describedby="sf-status"
        />
        {status === "checking" && <span className="sf__chip"><span className="sf__spin" aria-hidden />Checking</span>}
        {typeof status === "object" && status.live && <span className="sf__chip is-ok">✓ Found it</span>}
        {typeof status === "object" && !status.live && <span className="sf__chip is-warn">Can’t reach it</span>}
      </div>

      <p id="sf-status" className="sf__line" aria-live="polite">
        {status === "checking" && "Looking for your site…"}
        {typeof status === "object" && status.live && <>Found it — {status.title ? <>“{status.title}” is live.</> : "your site is live."} We’ll take a look before we talk.</>}
        {typeof status === "object" && !status.live && "We couldn’t reach that address. Double-check it, or carry on — it’s optional."}
      </p>

      {typeof status === "object" && status.live && (
        <>
          <SitePeek key={status.url} url={status.url} />
          {status.issues && status.issues.length > 0 && (
            <ul className="sf__issues" aria-label="What we spotted">
              {status.issues.map((i) => <li key={i}>{i}</li>)}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/**
 * A screenshot of their site via WordPress's public mShots renderer (keyless; the first
 * request for a domain takes a few seconds, so we retry on a timer). Fails silently.
 */
function SitePeek({ url }: { url: string }) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (loaded || failed) return;
    const t = window.setInterval(() => setAttempt((a) => (a >= 6 ? a : a + 1)), 4000);
    return () => window.clearInterval(t);
  }, [loaded, failed]);

  if (failed) return null;
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const src = `https://s0.wp.com/mshots/v1/${encodeURIComponent(target)}?w=640&r=${attempt}`;

  return (
    <figure className="sf__peek">
      <div className="sf__peek-bar" aria-hidden>
        <span /><span /><span />
        <em>{target.replace(/^https?:\/\//, "").replace(/\/$/, "")}</em>
      </div>
      <div className="sf__peek-shot">
        {!loaded && <div className="sf__peek-skeleton" aria-hidden><i /><i /><i /><b /><b /><b /></div>}
        {/* eslint-disable-next-line @next/next/no-img-element -- third-party screenshot service; next/image can't optimize a shot that's still generating */}
        <img
          key={attempt}
          src={src}
          alt="A snapshot of your current website"
          className={loaded ? "is-loaded" : ""}
          onLoad={(e) => { if (e.currentTarget.naturalWidth >= 600) setLoaded(true); }}
          onError={() => { if (attempt >= 6) setFailed(true); }}
        />
      </div>
    </figure>
  );
}
