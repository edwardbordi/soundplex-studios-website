"use client";

import { useState } from "react";
import ForwardArrow from "../ForwardArrow";

/** Footer "Stay inspired": first name + email → /api/newsletter → GHL_WEBHOOK_NEWSLETTER. */
export default function NewsletterForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [focused, setFocused] = useState(false);

  const send = async (confirm = false) => {
    setState("sending"); setError(""); setSuggestion("");
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ firstName, email, company_site: hp, typoConfirmed: confirm, page: window.location.pathname }) });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; suggestion?: string };
      if (!r.ok || !d.ok) { setError(d.error || "Try again in a moment."); if (d.suggestion) setSuggestion(d.suggestion); setState("idle"); return; }
      setState("done");
    } catch { setError("Couldn’t send that just now."); setState("idle"); }
  };

  if (state === "done") return <p className="nl__done">You’re on the list. Once a month, what’s on.</p>;
  return (
    <form className="nl" onSubmit={(e) => { e.preventDefault(); void send(); }} noValidate>
      {/* One frame, the button inside it (the footer-form pattern from the template's sibling sites). */}
      {/* Compact on one line until they click in; then it opens into two (name above, email +
          Join below) so a long address has room. Folds back if they leave it empty. */}
      <div
        className={`nl__frame${focused || firstName || email ? " is-open" : ""}`}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}
      >
        <input className="nl__input nl__input--name" type="text" autoComplete="given-name" placeholder="Name" aria-label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <input className="nl__input nl__input--email" type="email" autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => { setEmail(e.target.value); setSuggestion(""); }} required />
        <button type="submit" className="nl__btn group" disabled={state === "sending"}>Join<ForwardArrow /></button>
      </div>
      <div className="sv__hp" aria-hidden="true"><label htmlFor="nl-company_site">Company site</label><input id="nl-company_site" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></div>
      {error && <p className="nl__error" role="alert">{error}</p>}
      {suggestion && (
        <p className="nl__suggest">
          <button type="button" className="sv__link" onClick={() => { setEmail(`${email.split("@")[0]}@${suggestion}`); setSuggestion(""); setError(""); }}>Use @{suggestion}</button>
          <button type="button" className="sv__link" onClick={() => { setSuggestion(""); void send(true); }}>No, it’s right</button>
        </p>
      )}
    </form>
  );
}
