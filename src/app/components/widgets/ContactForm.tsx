"use client";

import { useState } from "react";
import ForwardArrow from "../ForwardArrow";

/** The contact form → /api/contact → GHL_WEBHOOK_CONTACT. Same email-typo flow as the survey. */
export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [field, setField] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [typoConfirmed, setTypoConfirmed] = useState(false);

  const send = async (confirm = false) => {
    setState("sending"); setError(""); setField(""); setSuggestion("");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, company_site: hp, typoConfirmed: confirm || typoConfirmed, page: window.location.pathname }) });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: string; suggestion?: string };
      if (!r.ok || !d.ok) { setError(d.error || "Something went wrong — try again or call."); setField(d.field ?? ""); if (d.suggestion) setSuggestion(d.suggestion); setState("idle"); return; }
      setState("done");
    } catch { setError("Couldn’t send that. Check your connection, or call (609) 697-2077."); setState("idle"); }
  };

  if (state === "done") {
    return <div className="cf__done"><p className="page-head__eyebrow">Sent</p><p className="cf__done-text">Thanks — George reads these himself. Expect a reply within a day or two.</p></div>;
  }
  return (
    <form className="cf" onSubmit={(e) => { e.preventDefault(); void send(); }} noValidate>
      <div className="sv__fields">
        <div className="sv__field"><label className="sv__label" htmlFor="cf-name">Name</label><input id="cf-name" className="sv__input" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={field === "name" || undefined} required /></div>
        <div className="sv__field"><label className="sv__label" htmlFor="cf-phone">Phone<span className="sv__opt"> — optional</span></label><input id="cf-phone" className="sv__input" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="sv__field sv__field--wide"><label className="sv__label" htmlFor="cf-email">Email</label><input id="cf-email" className="sv__input" type="email" autoComplete="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setSuggestion(""); setTypoConfirmed(false); }} aria-invalid={field === "email" || undefined} required />
          {/* A typo check shows right under the address, where they're looking. */}
          {field === "email" && error && <p className="sv__error sv__error--field" role="alert">{error}</p>}
          {suggestion && (
            <div className="sv__suggest">
              <button type="button" className="sv__btn sv__btn--primary" onClick={() => { setForm({ ...form, email: `${form.email.split("@")[0]}@${suggestion}` }); setSuggestion(""); setError(""); setField(""); }}>Use @{suggestion}</button>
              <button type="button" className="sv__link" onClick={() => { setSuggestion(""); setTypoConfirmed(true); void send(true); }}>No, my address is right</button>
            </div>
          )}
        </div>
        <div className="sv__field sv__field--wide"><label className="sv__label" htmlFor="cf-msg">Message</label><textarea id="cf-msg" className="sv__input sv__textarea" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} aria-invalid={field === "message" || undefined} required /></div>
      </div>
      <div className="sv__hp" aria-hidden="true"><label htmlFor="cf-company_site">Company site</label><input id="cf-company_site" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></div>
      {error && field !== "email" && <p className="sv__error" role="alert">{error}</p>}
      <div className="cf__actions">
        <button type="submit" className="sv__btn sv__btn--primary group" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send"}<ForwardArrow /></button>
      </div>
    </form>
  );
}
