"use client";

import { useState } from "react";
import ForwardArrow from "../ForwardArrow";

/**
 * Footer "Stay inspired": email → /api/newsletter → GHL_WEBHOOK_NEWSLETTER.
 *
 * One row, email only (Ed, 2026-10-28). Join doesn't send yet: it swaps the row for a small,
 * OPTIONAL "first name?" step, and only then sends, once, with or without the name. Asking
 * before sending (not after) keeps it to a single webhook call, so George's welcome email can't
 * fire twice. "Skip" sends straight away with just the email.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [hp, setHp] = useState("");
  const [step, setStep] = useState<"email" | "name">("email");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");

  const [checking, setChecking] = useState(false);
  // Said "No, it's right" to a typo suggestion: the final send skips the lookalike guess too.
  const [confirmed, setConfirmed] = useState(false);

  const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  /** Vet the address AT JOIN, before the name step (Ed: "ebordi@iclouf.com" sailed through):
   *  the same server check the other forms use (typo of a common provider → "Use @icloud.com",
   *  domain that can't receive mail → stop). Fails open: if the check itself can't be reached,
   *  carry on; the send runs the same check again anyway. */
  const verify = async (typoConfirmed = false, address = email) => {
    if (!looksLikeEmail(address)) {
      setError("That email doesn’t look right.");
      return;
    }
    setChecking(true);
    setError("");
    setSuggestion("");
    try {
      const r = await fetch("/api/check-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: address, typoConfirmed }) });
      const d = (await r.json().catch(() => ({ ok: true }))) as { ok?: boolean; error?: string; suggestion?: string };
      if (r.ok && d.ok === false) {
        setError(d.error || "That email doesn’t look right.");
        if (d.suggestion) setSuggestion(d.suggestion);
        setChecking(false);
        return;
      }
    } catch {
      /* fail open */
    }
    setConfirmed(typoConfirmed);
    setChecking(false);
    setStep("name");
  };

  const send = async (opts: { withName?: boolean } = {}) => {
    setState("sending");
    setError("");
    setSuggestion("");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          ...(opts.withName && name.trim() ? { firstName: name.trim() } : {}),
          company_site: hp,
          typoConfirmed: confirmed,
          page: window.location.pathname,
        }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; suggestion?: string };
      if (!r.ok || !d.ok) {
        // Back to the email row so they can fix it (typo suggestion, bad address…).
        setStep("email");
        setError(d.error || "Try again in a moment.");
        if (d.suggestion) setSuggestion(d.suggestion);
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Couldn’t send that just now.");
      setState("idle");
    }
  };

  if (state === "done") {
    const first = name.trim().split(/\s+/)[0];
    return <p className="nl__done vo-fade">{first ? `Thanks, ${first}. ` : ""}You’re on the list.</p>;
  }

  return (
    <form
      className="nl"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === "email") {
          void verify();
          return;
        }
        void send({ withName: true });
      }}
      noValidate
    >
      {step === "email" ? (
        // One frame, one row: the email and Join inside it.
        <div className="nl__frame">
          <input className="nl__input nl__input--email" type="email" autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => { setEmail(e.target.value); setSuggestion(""); setError(""); setConfirmed(false); }} required />
          <button type="submit" className="nl__btn group" disabled={state === "sending" || checking}>{checking ? "Checking…" : <>Join<ForwardArrow /></>}</button>
        </div>
      ) : (
        // The optional name, same frame, same row. Enter or Join sends; Skip sends without it.
        <div className="vo-fade">
          {/* Confirms the email they gave (Ed), with a way back if it's wrong. */}
          <p className="mb-2.5 flex min-w-0 items-center gap-2 text-[13px] text-white/60">
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="#d4a030" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
              <path d="M5 12l5 5 9-10" />
            </svg>
            <span className="shrink-0">Got your email:</span>
            <span className="truncate text-white">{email.trim()}</span>
            <button type="button" onClick={() => setStep("email")} className="shrink-0 text-white/45 underline-offset-2 transition-colors hover:text-white/80 hover:underline">
              Change
            </button>
          </p>
          <div className="nl__frame">
            <input className="nl__input nl__input--email" type="text" autoComplete="given-name" placeholder="First name (optional)" aria-label="First name, optional" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <button type="submit" className="nl__btn group" disabled={state === "sending"}>Join<ForwardArrow /></button>
          </div>
          <p className="mt-2 flex items-center gap-3 text-[12.5px] text-white/45">
            <span className="truncate">So we can say hi properly.</span>
            <button type="button" onClick={() => void send()} disabled={state === "sending"} className="shrink-0 underline-offset-2 transition-colors hover:text-white/80 hover:underline">
              Skip
            </button>
          </p>
        </div>
      )}
      <div className="sv__hp" aria-hidden="true"><label htmlFor="nl-company_site">Company site</label><input id="nl-company_site" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></div>
      {error && <p className="nl__error" role="alert">{error}</p>}
      {suggestion && (
        <p className="nl__suggest">
          {/* Fix it and carry straight on to the name step, or keep it as typed (re-checked
              without the lookalike guess; the mail-server check still runs). */}
          <button type="button" className="sv__link" onClick={() => { const fixed = `${email.split("@")[0]}@${suggestion}`; setEmail(fixed); void verify(false, fixed); }}>Use @{suggestion}</button>
          <button type="button" className="sv__link" onClick={() => void verify(true)}>No, it’s right</button>
        </p>
      )}
    </form>
  );
}
