"use client";

/**
 * The survey — /start. Every CTA on the site lands here.
 *
 * The questions live in src/lib/survey/flow.ts; this renders whatever that says. One
 * question per screen. The first screen picks a path; the sequence is DERIVED from the
 * path on every render, so the progress bar counts the steps this path actually has,
 * Back and Forward walk the real sequence, and adding a question is a data edit.
 *
 * Answers autosave to sessionStorage (contact is the last step — an abandonment at
 * question four must not lose everything). Answers from a path you switched away from
 * are kept, not deleted, so switching back costs nothing; only the current path's
 * answers are submitted.
 *
 * Pre-selecting from a link: `/start?path=room&room=wood-room`. Unknown values ignored.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ForwardArrow from "../ForwardArrow";
import BackArrow from "../BackArrow";
import Image from "next/image";
import DatePicker from "./DatePicker";
import RangePicker from "./RangePicker";
import SiteField from "./SiteField";
import { CONTACT_FIELDS, PATHS, Q1, USES, pathById, type Option, type PathId, type Question, type RoomContext } from "../../../lib/survey/flow";

const STORAGE_KEY = "soundplex-start";
const AUTO_ADVANCE_MS = 240;

type Answers = Record<string, string | string[]>;
type Contact = { firstName: string; lastName: string; email: string; phone: string; business: string };
const EMPTY_CONTACT: Contact = { firstName: "", lastName: "", email: "", phone: "", business: "" };

type Step =
  | { id: "intent"; part: "Start here" }
  | { id: string; part: string; question: Question }
  | { id: "contact"; part: "You" };

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** One line for "what you said" on a step — the progress-bar tooltip. */
function summarize(q: Question, answers: Answers): string {
  const v = answers[q.id];
  if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return "";
  if (q.kind === "single") {
    if (v === "other") {
      const t = answers[`${q.id}_other`];
      return typeof t === "string" && t.trim() ? `${t.trim()}${q.other?.suffix ? ` ${q.other.suffix}` : ""}` : "Something else";
    }
    return q.options.find((o) => o.value === v)?.label ?? "";
  }
  if (q.kind === "multi" && Array.isArray(v)) {
    const labels = v.map((x) => q.options.find((o) => o.value === x)?.label).filter(Boolean) as string[];
    return labels.length > 2 ? `${labels[0]} +${labels.length - 1} more` : labels.join(", ");
  }
  if (q.kind === "date" && typeof v === "string") {
    return new Date(`${v}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (q.id === "headcount") return `${t} people`;
    return t.length > 36 ? `${t.slice(0, 34)}…` : t;
  }
  return "";
}

type Saved = { stepId?: string; furthest?: number; path?: PathId; answers?: Answers; contact?: Partial<Contact> };

export default function Survey({ initialPath, initialAnswers, entry, rooms = [] }: { initialPath?: string; initialAnswers?: Record<string, string>; entry?: string; rooms?: RoomContext[] }) {
  const router = useRouter();
  const [path, setPath] = useState<PathId | "">((pathById(initialPath)?.id as PathId) ?? "");
  const [answers, setAnswers] = useState<Answers>(() => ({ ...(initialAnswers ?? {}) }));
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  // A pre-selected path (deep link) lands on its first question that the link didn't already
  // answer — a room card passes the room, a transformation passes room + use.
  const preset = pathById(initialPath);
  const firstOpenRaw = preset ? preset.questions.findIndex((q) => !initialAnswers?.[q.id]) : 0;
  const firstOpen = firstOpenRaw === -1 ? (preset?.questions.length ?? 0) : firstOpenRaw; // all answered → contact
  const [stepId, setStepId] = useState<string>(preset ? (preset.questions[firstOpen]?.id ?? "contact") : "intent");
  const [furthest, setFurthest] = useState(preset ? 1 + firstOpen : 0);
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [sending, setSending] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [typoConfirmed, setTypoConfirmed] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const stepRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const restored = useRef(false);
  const mounted = useRef(false);
  const leaving = useRef(false);

  /* ── Sequence, derived from the path ─────────────────────────────────── */
  const current = path ? pathById(path) : undefined;
  const sequence = useMemo<Step[]>(() => {
    const steps: Step[] = [{ id: "intent", part: "Start here" }];
    if (current) {
      for (const q of current.questions) steps.push({ id: q.id, part: current.choice, question: q });
      steps.push({ id: "contact", part: "You" });
    }
    return steps;
  }, [current]);

  const rawIndex = sequence.findIndex((s) => s.id === stepId);
  const index = rawIndex === -1 ? 0 : rawIndex;
  const step = sequence[index];
  const total = sequence.length;

  /* ── The room you're renting, once you've picked one (or a link picked it) ─────────────
     Every later step says so, offers only what that room is used for, and knows its size. */
  const room = path === "room" && typeof answers.room === "string" ? rooms.find((r) => r.slug === answers.room) : undefined;
  const roomStep = sequence.findIndex((s) => s.id === "room");
  const tailor = (q: Question): Question => {
    if (!room) return q;
    if (q.id === "use" && q.kind === "single") {
      const options = q.options.filter((o) => o.value === "other" || room.uses.includes(o.value));
      return { ...q, label: `What are you using ${room.ref} for?`, options: options.length > 1 ? options : q.options };
    }
    if (q.id === "headcount" && q.kind === "text" && room.capacity) {
      return { ...q, help: `${room.ref.replace(/^the /, "The ")} holds up to ${room.capacity}${/\d$/.test(room.capacity) ? " people" : ""}.` };
    }
    return q;
  };

  /* ── Restore + autosave ───────────────────────────────────────────────── */
  useEffect(() => {
    if (initialPath) {
      restored.current = true;
      return; // a deep link beats a stale session
    }
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        /* eslint-disable react-hooks/set-state-in-effect -- one-time mount restore */
        if (saved.path && pathById(saved.path)) setPath(saved.path);
        if (saved.answers) setAnswers(saved.answers);
        if (saved.contact) setContact({ ...EMPTY_CONTACT, ...saved.contact });
        if (saved.stepId) setStepId(saved.stepId);
        if (typeof saved.furthest === "number") setFurthest(saved.furthest);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      /* ignore */
    }
    restored.current = true;
  }, [initialPath]);

  useEffect(() => {
    if (!restored.current || leaving.current) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ stepId, furthest, path: path || undefined, answers, contact } satisfies Saved));
    } catch {
      /* best effort */
    }
  }, [stepId, furthest, path, answers, contact]);

  /* ── Focus on step change ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    stepRef.current?.focus({ preventScroll: true });
    const el = stepRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stepId]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  /* ── Navigation ───────────────────────────────────────────────────────── */
  const goTo = useCallback((i: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    setError("");
    setInvalid("");
    setConfirmReset(false); // an unanswered "start over?" doesn't follow them to the next step
    setStepId(sequence[i]?.id ?? "intent");
    setFurthest((f) => Math.max(f, i));
  }, [sequence]);

  const answered = useCallback((s: Step): boolean => {
    if (s.id === "intent") return !!path;
    if (s.id === "contact") return false;
    const q = (s as { question: Question }).question;
    const v = answers[q.id];
    if ("optional" in q && q.optional) return true;
    if (q.kind === "single" && v === "other") {
      const t = answers[`${q.id}_other`];
      return typeof t === "string" && t.trim().length > 0;
    }
    if (Array.isArray(v)) return v.length > 0;
    return typeof v === "string" && v.trim().length > 0;
  }, [answers, path]);

  const next = useCallback(() => {
    if (!step) return;
    if (!answered(step)) {
      setError(step.id === "intent" ? "Pick one to carry on." : "An answer, please — or skip if it says optional.");
      return;
    }
    goTo(index + 1);
  }, [step, answered, goTo, index]);

  const choosePath = useCallback((id: PathId) => {
    setPath(id);
    setError("");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setStepId(pathById(id)!.questions[0]?.id ?? "contact");
      setFurthest((f) => Math.max(f, 1));
    }, AUTO_ADVANCE_MS);
  }, []);

  const chooseSingle = useCallback((qid: string, v: string) => {
    setAnswers((a) => {
      const nextA: Answers = { ...a, [qid]: v };
      // Switching rooms drops a use the new room isn't booked for.
      if (qid === "room" && typeof a.use === "string" && a.use !== "other") {
        const r = rooms.find((x) => x.slug === v);
        if (r && !r.uses.includes(a.use)) delete nextA.use;
      }
      return nextA;
    });
    setError("");
    if (timer.current) window.clearTimeout(timer.current);
    if (v === "other") return; // the "tell us what" box opens; Continue moves on
    timer.current = window.setTimeout(() => goTo(index + 1), AUTO_ADVANCE_MS);
  }, [goTo, index, rooms]);
  const toggleMulti = (qid: string, v: string) => {
    setAnswers((a) => {
      const cur = Array.isArray(a[qid]) ? (a[qid] as string[]) : [];
      return { ...a, [qid]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });
    setError("");
  };
  const setText = (qid: string, v: string) => setAnswers((a) => ({ ...a, [qid]: v }));

  const startOver = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setPath("");
    setAnswers({});
    setContact(EMPTY_CONTACT);
    setStepId("intent");
    setFurthest(0);
    setError("");
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  /* ── Submit ───────────────────────────────────────────────────────────── */
  const submit = async (confirmTypo = false) => {
    if (!current || sending) return;
    setError("");
    setInvalid("");
    setSuggestion("");
    const own: Answers = {};
    for (const q of current.questions) {
      if (answers[q.id] !== undefined) own[q.id] = answers[q.id];
      if (answers[q.id] === "other" && answers[`${q.id}_other`] !== undefined) own[`${q.id}_other`] = answers[`${q.id}_other`];
    }
    setSending(true);
    try {
      const r = await fetch("/api/survey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: current.id,
          answers: own,
          ...contact,
          company_site: honeypot,
          typoConfirmed: confirmTypo || typoConfirmed,
          entry: entry ?? "",
          page: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: string; suggestion?: string };
      if (!r.ok || !data.ok) {
        setError(data.error || "Something went wrong — try again, or call (609) 697-2077.");
        if (data.field) setInvalid(data.field);
        if (data.suggestion) setSuggestion(data.suggestion);
        return;
      }
      leaving.current = true;
      try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      const q = new URLSearchParams({ path: current.id, name: contact.firstName });
      router.push(`/start/thanks?${q.toString()}`);
    } catch {
      setError("Couldn’t send that. Check your connection and try again, or call (609) 697-2077.");
    } finally {
      setSending(false);
    }
  };

  if (!step) return null;
  const q: Question | null = step.id !== "intent" && step.id !== "contact" ? tailor((step as { question: Question }).question) : null;
  const part = room && step.id !== "intent" ? `Renting ${room.ref}` : step.part;
  const showRoom = !!room && step.id !== "intent" && step.id !== "room";
  const v = q ? answers[q.id] : undefined;
  const canBack = index > 0;
  const canForward = index < total - 1 && index < furthest && answered(step);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="sv">
      {/* Progress: hidden on the first screen — there's no path to measure yet. */}
      {step.id === "intent" ? (
        <p className="sv__part">Start here</p>
      ) : (
        <div className="sv__progress">
          <div className="sv__progress-row">
            <p className="sv__part">{part}</p>
            <p className="sv__count">{index} of {total - 1}</p>
          </div>
          <ol className="sv__bar">
            {sequence.slice(1).map((s, i) => {
              const n = i + 1;
              const reached = n <= furthest;
              // Hover (or keyboard focus) on a step you've reached says which question it was and
              // what you answered — so going back is a choice, not a guess.
              const sq = "question" in s ? tailor(s.question) : null;
              const name = sq ? sq.label : "Your details";
              const said = sq ? summarize(sq, answers) : "";
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={!reached || n === index}
                    onClick={() => goTo(n)}
                    aria-label={reached ? `Go back to step ${n}: ${name}${said ? ` (${said})` : ""}` : `Step ${n} — still to come`}
                    aria-current={n === index ? "step" : undefined}
                    className={`sv__seg${n < index ? " is-done" : n === index ? " is-here" : ""}${reached && n !== index ? " is-link" : ""}`}
                  >
                    <span />
                    {reached && n !== index && (
                      <span className={`sv__tip${n === 1 ? " is-first" : n === total - 1 ? " is-last" : ""}`} aria-hidden>
                        <span className="sv__tip-n">Step {n}</span>
                        <span className="sv__tip-q">{name}</span>
                        {said && <span className="sv__tip-a">{said}</span>}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* The room you're renting: one line, a thumbnail, and a way to switch. */}
      {showRoom && room && (
        <div className="sv__room">
          <div className="sv__room-img"><Image src={room.image} alt={room.imageAlt} fill sizes="64px" className="object-cover" /></div>
          <div className="sv__room-text">
            <p className="sv__room-name">{room.name}</p>
            <p className="sv__room-meta">{[room.tagline, room.capacity && `up to ${room.capacity}${/\d$/.test(room.capacity) ? " people" : ""}`].filter(Boolean).join(" · ")}</p>
          </div>
          {roomStep > 0 && <button type="button" className="sv__link sv__room-change" onClick={() => goTo(roomStep)}>Change</button>}
        </div>
      )}

      <div ref={stepRef} tabIndex={-1} className="sv__step">
        {step.id === "intent" && (
          <>
            <h2 className="sv__q">{Q1.label}</h2>
            <p className="sv__help">{Q1.help}</p>
            <div className="sv__cards">
              {PATHS.map((p) => (
                <Card key={p.id} selected={path === p.id} label={p.choice} note={p.choiceNote} onClick={() => choosePath(p.id)} />
              ))}
            </div>
          </>
        )}

        {q && (
            <>
              <h2 className="sv__q">{q.label}</h2>
              {q.help && <p className="sv__help">{q.help}</p>}
              {q.kind === "single" && (
                <div className="sv__cards">
                  {q.options.map((o) => (
                    <Card
                      key={o.value}
                      selected={v === o.value}
                      label={o.label}
                      note={o.note}
                      onClick={() => chooseSingle(q.id, o.value)}
                      /* "Which room?" shows each room's photo; "Not sure yet" gets an empty frame so the cards line up. */
                      {...(q.id === "room" ? { thumb: rooms.find((r) => r.slug === o.value)?.image ?? "" } : {})}
                    />
                  ))}
                </div>
              )}
              {/* "Something else" opens a box to say what — and waits for Continue instead of auto-advancing. */}
              {/* A number ("exactly how many hours"): a − / + stepper, not the browser's spinner. */}
              {q.kind === "single" && v === "other" && q.other?.input === "number" && (
                <RangePicker
                  value={typeof answers[`${q.id}_other`] === "string" ? (answers[`${q.id}_other`] as string) : ""}
                  onChange={(s) => setText(`${q.id}_other`, s)}
                  onEnter={next}
                  unit={q.other.suffix ?? ""}
                  label={`How many ${q.other.suffix ?? ""}`}
                  min={1}
                  max={24}
                  step={0.5}
                  start={Number(q.other.placeholder) || 4}
                />
              )}
              {q.kind === "single" && v === "other" && q.other?.input !== "number" && (
                <div className={`sv__other${q.other?.suffix ? " has-suffix" : ""}`}>
                  <input
                    className="sv__input sv__input--other"
                    type="text"
                    autoFocus
                    maxLength={160}
                    aria-label={q.other?.suffix ? `How many ${q.other.suffix}` : "Tell us what"}
                    placeholder={q.other?.placeholder ?? (q.id === "use" ? "Tell us what you’re booking it for" : "Tell us a little more")}
                    value={typeof answers[`${q.id}_other`] === "string" ? (answers[`${q.id}_other`] as string) : ""}
                    onChange={(e) => setText(`${q.id}_other`, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); next(); } }}
                    aria-invalid={invalid === q.id || undefined}
                  />
                  {q.other?.suffix && <span className="sv__other-suffix" aria-hidden>{q.other.suffix}</span>}
                </div>
              )}
              {q.kind === "multi" && (
                <div className="sv__cards">
                  {q.options.map((o) => (
                    <Card key={o.value} multi selected={Array.isArray(v) && v.includes(o.value)} label={o.label} note={o.note} onClick={() => toggleMulti(q.id, o.value)} />
                  ))}
                </div>
              )}
              {q.kind === "text" && q.id === "headcount" && (
                <RangePicker
                  value={typeof v === "string" ? v : ""}
                  onChange={(s) => setText(q.id, s)}
                  onEnter={next}
                  unit="people"
                  one="person"
                  label={q.label}
                  min={1}
                  start={Number(q.placeholder) || 40}
                  {...(room?.capacity && /^\d+$/.test(room.capacity) ? { max: Number(room.capacity), fullLabel: "full" } : { max: 200 })}
                />
              )}
              {q.kind === "text" && q.input === "url" && (
                <SiteField value={typeof v === "string" ? v : ""} onChange={(s) => setText(q.id, s)} onEnter={next} placeholder={q.placeholder} invalid={invalid === q.id} />
              )}
              {q.kind === "text" && q.id !== "headcount" && q.input !== "url" && (
                <input
                  className="sv__input"
                  type={q.input === "number" ? "number" : "text"}
                  inputMode={q.input === "number" ? "numeric" : undefined}
                  placeholder={q.placeholder}
                  value={typeof v === "string" ? v : ""}
                  onChange={(e) => setText(q.id, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); next(); } }}
                  aria-invalid={invalid === q.id || undefined}
                />
              )}
              {q.kind === "date" && (
                <DatePicker
                  value={typeof v === "string" ? v : ""}
                  onChange={(d) => setText(q.id, d)}
                  label={q.label}
                  preview={{
                    ...(room ? { roomName: room.name, image: room.image, imageAlt: room.imageAlt } : {}),
                    ...(typeof answers.use === "string"
                      ? { what: answers.use === "other" && typeof answers.use_other === "string" && answers.use_other.trim() ? answers.use_other.trim() : USES.find((u) => u.value === answers.use && u.value !== "other")?.label }
                      : {}),
                  }}
                />
              )}
              {q.kind === "textarea" && (
                <textarea className="sv__input sv__textarea" rows={5} placeholder={q.placeholder} value={typeof v === "string" ? v : ""} onChange={(e) => setText(q.id, e.target.value)} />
              )}
            </>
        )}

        {step.id === "contact" && current && (
          <form
            onSubmit={(e) => { e.preventDefault(); void submit(); }}
            noValidate
          >
            <h2 className="sv__q">Where should we reach you?</h2>
            <p className="sv__help">{current.phoneRequired ? "George calls room inquiries back, so a number helps." : "Email is enough. A number is optional."}</p>
            <div className="sv__fields">
              {CONTACT_FIELDS.map((f) => {
                const optional = f.id === "phone" && !current.phoneRequired;
                return (
                  <div key={f.id} className={f.id === "email" || f.id === "phone" ? "sv__field sv__field--wide" : "sv__field"}>
                    <label className="sv__label" htmlFor={`sv-${f.id}`}>
                      {f.label}{optional && <span className="sv__opt"> — optional</span>}
                    </label>
                    <input
                      id={`sv-${f.id}`}
                      className="sv__input"
                      type={f.type}
                      autoComplete={f.autocomplete}
                      inputMode={f.type === "tel" ? "tel" : f.type === "email" ? "email" : undefined}
                      placeholder={f.id === "phone" ? "(555) 555-5555" : undefined}
                      value={contact[f.id]}
                      onChange={(e) => {
                        const val = f.id === "phone" ? formatPhone(e.target.value) : e.target.value;
                        setContact((c) => ({ ...c, [f.id]: val }));
                        if (f.id === "email") { setSuggestion(""); setTypoConfirmed(false); }
                      }}
                      aria-invalid={invalid === f.id || undefined}
                      aria-describedby={invalid === f.id && error ? `sv-${f.id}-error` : undefined}
                      required={!optional}
                    />
                    {/* A problem with this field shows right under it — "Did you mean …@icloud.com?" included. */}
                    {invalid === f.id && error && <p id={`sv-${f.id}-error`} className="sv__error sv__error--field" role="alert">{error}</p>}
                    {f.id === "email" && suggestion && (
                      <div className="sv__suggest">
                        <button type="button" className="sv__btn sv__btn--primary" onClick={() => {
                          const local = contact.email.split("@")[0];
                          setContact((c) => ({ ...c, email: `${local}@${suggestion}` }));
                          setSuggestion(""); setError(""); setInvalid("");
                        }}>Use @{suggestion}</button>
                        <button type="button" className="sv__link" onClick={() => { setSuggestion(""); setTypoConfirmed(true); void submit(true); }}>No, my address is right</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {(current.id === "room" || current.id === "collective" || current.id === "produce" || current.id === "website") && (
                <div className="sv__field sv__field--wide">
                  <label className="sv__label" htmlFor="sv-business">Business or project<span className="sv__opt"> — optional</span></label>
                  <input id="sv-business" className="sv__input" type="text" autoComplete="organization" value={contact.business} onChange={(e) => setContact((c) => ({ ...c, business: e.target.value }))} />
                </div>
              )}
            </div>
            {/* Honeypot — real people never see or fill this. */}
            <div className="sv__hp" aria-hidden="true">
              <label htmlFor="sv-company_site">Company site</label>
              <input id="sv-company_site" name="company_site" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            {/* Errors that aren't about one field (network, server) stay down by the button. */}
            {error && !CONTACT_FIELDS.some((f) => f.id === invalid) && <p className="sv__error" role="alert">{error}</p>}

            <div className="sv__nav">
              <button type="button" className="sv__back group" onClick={() => goTo(index - 1)}><BackArrow />Back</button>
              <button type="submit" className="sv__btn sv__btn--primary group" disabled={sending}>
                {sending ? "Sending…" : "Send it"}<ForwardArrow />
              </button>
            </div>
            <p className="sv__fine">We’ll only use this to get back to you. No lists, no spam.</p>
          </form>
        )}

        {step.id !== "contact" && error && <p className="sv__error" role="alert">{error}</p>}

        {step.id !== "contact" && (
          <div className="sv__nav">
            {canBack ? <button type="button" className="sv__back group" onClick={() => goTo(index - 1)}><BackArrow />Back</button> : <span />}
            <div className="sv__nav-right">
              {/* One way on, never two: Continue where the step has one; Forward only on tap-to-answer
                  steps you've come Back to (they auto-advance, so there's no Continue to press). */}
              {canForward && !(step.id !== "intent" && (q?.kind !== "single" || v === "other")) && (
                <button type="button" className="sv__back group" onClick={() => goTo(index + 1)}>Forward<ForwardArrow /></button>
              )}
              {step.id !== "intent" && (q?.kind !== "single" || v === "other") && (
                <button type="button" className="sv__btn sv__btn--primary group" onClick={next}>Continue<ForwardArrow /></button>
              )}
            </div>
          </div>
        )}

        {step.id !== "intent" && (
          // Start over asks once — one tap shouldn't erase every answer (same pattern as the apply flow we built before).
          confirmReset ? (
            <p className="sv__reset sv__reset--confirm" role="group" aria-label="Start over?">
              <span>Clear every answer and begin again?</span>
              <button type="button" className="sv__link" onClick={() => { setConfirmReset(false); startOver(); }}>Yes, start over</button>
              <button type="button" className="sv__link sv__link--quiet" onClick={() => setConfirmReset(false)}>Keep what I have</button>
            </p>
          ) : (
            <p className="sv__reset">
              Wrong path? <button type="button" className="sv__link" onClick={() => setConfirmReset(true)}>Start over</button>
            </p>
          )
        )}
      </div>
    </div>
  );
}

function Card({ label, note, selected, multi, onClick, thumb }: { label: string; note?: string; selected: boolean; multi?: boolean; onClick: () => void; thumb?: string }) {
  return (
    <button type="button" role={multi ? "checkbox" : "radio"} aria-checked={selected} onClick={onClick} className={`sv__card${selected ? " is-selected" : ""}${thumb !== undefined ? " has-thumb" : ""}`}>
      <span className={`sv__tick${multi ? " sv__tick--square" : ""}`} aria-hidden>{selected ? "✓" : ""}</span>
      {thumb !== undefined && (
        <span className={`sv__thumb${thumb ? "" : " is-empty"}`} aria-hidden>
          {thumb ? <Image src={thumb} alt="" fill sizes="96px" className="object-cover" /> : "?"}
        </span>
      )}
      <span className="sv__card-text">
        <span className="sv__card-label">{label}</span>
        {note && <span className="sv__card-note">{note}</span>}
      </span>
    </button>
  );
}

export type { Option };
