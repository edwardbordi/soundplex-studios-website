"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PREVIEW_FEEDBACK_EMAIL, PREVIEW_TEST_URL, SITE_NAME } from "../../lib/site-config";
import { useEdgeDock } from "./useEdgeDock";
import { NoteIcon } from "./ReviewIcons";

/**
 * TEMPORARY — client review only. One card, three jobs, one at a time:
 *
 *  Notes    — write comments while looking at the thing. Each is tagged with
 *             the page it was written on, kept in this browser (private) until
 *             ticked and sent. Sent notes move to a folder at the bottom.
 *  Approve  — the sign-off: which home page, your name, a message to go with
 *             it, the attestation checkbox, then "Approve & send". Any ticked
 *             notes ride along.
 *  Withdraw — only while approved: a reason and your name, then "Withdraw
 *             approval". The team is told; the approval is cleared here.
 *
 * Everything posts to /api/feedback (→ FEEDBACK_WEBHOOK_URL → email). If that
 * isn't wired yet the card offers a pre-filled email or copy instead.
 * Same tab / drag / tuck behaviour as the other review widgets.
 */
const KEY = "review-notes";
type Note = { page: string; version: string; title: string; note: string; at: string; share?: boolean; sentAt?: string };
type Mode = "notes" | "approve" | "withdraw";
type Approval = { name: string; version: string; at: string };

const VERSION_LABEL: Record<string, string> = { "/": "A · Light", "/home-b": "B · Dark", "/home-c": "C · Video" };
const PAGE_LABEL: Record<string, string> = { "/services": "Services", "/about": "About", "/blog": "Blog", "/contact": "Contact", "/privacy": "Privacy", "/terms": "Terms" };
const VERSIONS = [
  { href: "/", label: "A · Light" },
  { href: "/home-b", label: "B · Dark" },
  { href: "/home-c", label: "C · Video" },
];
const ATTESTATION =
  "I have reviewed the entire site and I approve this design. You may proceed to finalize the cutover to production.";

/** "Home (A · Light)", "Services", "Blog: drywall-patch-what-to-expect" — what a note gets tagged with. */
function pageName(pathname: string) {
  if (VERSION_LABEL[pathname]) return `Home (${VERSION_LABEL[pathname]})`;
  if (PAGE_LABEL[pathname]) return PAGE_LABEL[pathname];
  const post = pathname.match(/^\/blog\/([^/]+)$/);
  if (post) return `Blog: ${post[1]}`;
  return pathname;
}
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

async function post(body: Record<string, unknown>): Promise<"delivered" | "fallback" | "error"> {
  try {
    const r = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await r.json()) as { ok?: boolean; delivered?: boolean };
    return data.ok && data.delivered ? "delivered" : "fallback";
  } catch {
    return "error";
  }
}
const mailto = (subject: string, body: string) =>
  PREVIEW_FEEDBACK_EMAIL ? `mailto:${PREVIEW_FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : "";

export default function NotesWidget() {
  const pathname = usePathname() ?? "/";
  const here = pageName(pathname);
  const [tucked, setTucked] = useState(true);
  const [mode, setMode] = useState<Mode>("notes");
  const [name, setName] = useState("");
  const [approved, setApproved] = useState<Approval | null>(null);

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [sent, setSent] = useState<Note[]>([]);
  const [showSent, setShowSent] = useState(false);
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [notesStatus, setNotesStatus] = useState<"idle" | "sending" | "sent" | "fallback" | "error">("idle");

  // Approve
  const [approveVersion, setApproveVersion] = useState("A · Light");
  const [approveMsg, setApproveMsg] = useState("");
  const [attest, setAttest] = useState(false);
  const [approveStatus, setApproveStatus] = useState<"idle" | "sending" | "fallback" | "error">("idle");

  // Withdraw
  const [reason, setReason] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState<"idle" | "sending" | "fallback" | "error">("idle");

  const { side, drag, frameRef, grip, tabGrip, wasDrag, panelStyle, tabStyle } = useEdgeDock(`${KEY}-v2`, { side: "l", topPx: 132 });

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        setTucked(localStorage.getItem(`${KEY}-tucked`) !== "0");
        setNotes(JSON.parse(localStorage.getItem(`${KEY}-list`) ?? "[]"));
        setSent(JSON.parse(localStorage.getItem(`${KEY}-sent`) ?? "[]"));
        setName(localStorage.getItem(`${KEY}-name`) ?? "");
        setApproved(JSON.parse(localStorage.getItem(`${KEY}-approved`) ?? "null"));
      } catch {}
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const persist = (k: string, v: unknown) => {
    try {
      localStorage.setItem(`${KEY}-${k}`, typeof v === "string" ? v : JSON.stringify(v));
    } catch {}
  };
  const set = (v: boolean) => {
    setTucked(v);
    persist("tucked", v ? "1" : "0");
  };
  const saveNotes = (list: Note[]) => {
    setNotes(list);
    persist("list", list);
  };
  const saveSent = (list: Note[]) => {
    setSent(list);
    persist("sent", list);
  };
  const saveApproved = (a: Approval | null) => {
    setApproved(a);
    if (a) persist("approved", a);
    else {
      try {
        localStorage.removeItem(`${KEY}-approved`);
      } catch {}
    }
  };

  // ---- notes
  const isShared = (n: Note) => n.share !== false;
  const selected = notes.filter(isShared);
  const notesText = () =>
    selected.map((n) => `• ${n.title || n.note}${n.note && n.title ? `: ${n.note}` : ""}  [${n.page}]`).join("\n");
  const archive = (which: Note[]) => {
    const stamp = new Date().toISOString();
    saveSent([...which.map((n) => ({ ...n, sentAt: stamp })), ...sent].slice(0, 200));
    saveNotes(notes.filter((n) => !which.includes(n)));
  };
  const addNote = () => {
    const t = title.trim();
    if (!t) return;
    if (editing !== null) saveNotes(notes.map((n, j) => (j === editing ? { ...n, title: t, note: draft.trim() } : n)));
    else saveNotes([...notes, { page: here, version: VERSION_LABEL[pathname] ?? "", title: t, note: draft.trim(), at: new Date().toISOString(), share: true }]);
    setEditing(null);
    setTitle("");
    setDraft("");
    setNotesStatus("idle");
  };
  const editNote = (i: number) => {
    setEditing(i);
    setTitle(notes[i].title);
    setDraft(notes[i].note);
  };
  const cancelEdit = () => {
    setEditing(null);
    setTitle("");
    setDraft("");
  };
  const removeNote = (i: number) => {
    saveNotes(notes.filter((_, j) => j !== i));
    if (editing === i) cancelEdit();
    else if (editing !== null && editing > i) setEditing(editing - 1);
  };
  const resend = (i: number) => {
    const n = sent[i];
    saveSent(sent.filter((_, j) => j !== i));
    saveNotes([...notes, { ...n, sentAt: undefined, share: true }]);
    setNotesStatus("idle");
  };
  const sendNotes = async () => {
    if (!selected.length) return;
    setNotesStatus("sending");
    persist("name", name);
    const r = await post({ kind: "notes", name, page: pathname, notes: selected });
    if (r === "delivered") archive(selected);
    setNotesStatus(r === "delivered" ? "sent" : r);
  };
  const copyNotes = async () => {
    try {
      await navigator.clipboard.writeText(notesText());
      archive(selected);
      setNotesStatus("sent");
    } catch {}
  };

  // ---- approve
  const openApprove = () => {
    setApproveVersion(VERSION_LABEL[pathname] ?? "A · Light");
    setAttest(false);
    setApproveStatus("idle");
    setMode("approve");
  };
  const sendApproval = async () => {
    setApproveStatus("sending");
    persist("name", name);
    const r = await post({ kind: "approval", name, version: approveVersion, page: pathname, message: approveMsg.trim(), notes: selected, attestation: ATTESTATION });
    if (r === "delivered") {
      archive(selected);
      saveApproved({ name, version: approveVersion, at: new Date().toISOString() });
      setApproveMsg("");
      setMode("notes");
      return;
    }
    setApproveStatus(r);
  };
  const approvalMailto = mailto(
    `Site approved — ${SITE_NAME}`,
    `${name ? `From ${name}\n\n` : ""}${ATTESTATION}\n\nHome page: ${approveVersion}${approveMsg.trim() ? `\n\n${approveMsg.trim()}` : ""}${selected.length ? `\n\nNotes:\n${notesText()}` : ""}\n\n${PREVIEW_TEST_URL}`,
  );

  // ---- withdraw
  const sendWithdrawal = async () => {
    setWithdrawStatus("sending");
    persist("name", name);
    const r = await post({ kind: "withdrawal", name, version: approved?.version ?? "", page: pathname, reason: reason.trim() });
    if (r === "delivered") {
      saveApproved(null);
      setReason("");
      setMode("notes");
      setWithdrawStatus("idle");
      return;
    }
    setWithdrawStatus(r);
  };
  const withdrawalMailto = mailto(
    `Approval withdrawn — ${SITE_NAME}`,
    `${name ? `From ${name}\n\n` : ""}I'm withdrawing my approval of the site (home page ${approved?.version ?? ""}).\n\nReason: ${reason.trim()}\n\n${PREVIEW_TEST_URL}`,
  );

  const left = side === "l";
  const field = "w-full rounded-sm border border-paper/20 bg-ink-2 px-2.5 py-2 text-sm text-paper placeholder:text-paper/35 focus:border-signal focus:outline-none";
  const fallbackBox = (text: string, href: string, onCopy?: () => void) => (
    <div className="mt-2 text-sm text-paper/85">
      <p>Delivery isn&apos;t wired up yet — send it the old-fashioned way:</p>
      <div className="mt-2 flex gap-2">
        {href && (
          <a href={href} className="font-display flex min-h-9 flex-1 items-center justify-center rounded-sm bg-signal text-sm font-semibold uppercase text-paper hover:bg-signal-strong">
            {text}
          </a>
        )}
        {onCopy && (
          <button type="button" onClick={onCopy} className="font-display flex min-h-9 flex-1 items-center justify-center rounded-sm border border-paper/30 text-sm font-semibold uppercase text-paper hover:border-signal-light">
            Copy notes
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={frameRef}
        role="region"
        aria-label="Feedback — notes, approve or withdraw"
        aria-hidden={tucked}
        inert={tucked}
        style={{ ...panelStyle, colorScheme: "dark" }}
        className={`fixed z-[55] w-max min-w-[min(92vw,360px)] max-w-[calc(100vw-2rem)] border-t-4 border-signal bg-ink p-4 text-paper shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${
          left ? "left-4" : "right-4"
        } ${drag?.what === "panel" ? "" : "transition-transform duration-300 ease-out motion-reduce:transition-none"} ${
          tucked ? `pointer-events-none ${left ? "-translate-x-[calc(100%+2rem)]" : "translate-x-[calc(100%+2rem)]"}` : ""
        }`}
      >
        {/* Header: grip + tuck */}
        <div className="flex items-start justify-between gap-3">
          <p
            {...grip}
            title="Drag to move"
            className={`font-display flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-paper/60 select-none touch-none ${
              drag?.what === "panel" ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3 fill-current opacity-70">
              <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
            </svg>
            Feedback
          </p>
          <button type="button" onClick={() => set(true)} aria-label="Tuck away" className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-sm text-paper hover:bg-signal">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2.5">
              {left ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
            </svg>
          </button>
        </div>

        {/* Mode switch */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-sm bg-ink-2 p-1" role="tablist" aria-label="What would you like to do?">
          {(
            [
              ["notes", "Notes"],
              ["approve", "Approve"],
              ["withdraw", "Withdraw"],
            ] as [Mode, string][]
          ).map(([m, label]) => {
            const disabled = m === "withdraw" && !approved;
            const on = mode === m;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={on}
                disabled={disabled}
                onClick={() => (m === "approve" ? openApprove() : setMode(m))}
                title={disabled ? "Nothing to withdraw — the site isn't approved yet" : undefined}
                className={`font-display min-h-9 rounded-sm text-sm font-semibold uppercase tracking-[0.04em] disabled:opacity-35 ${
                  on ? "bg-signal text-paper" : "text-paper/80 hover:text-paper"
                }`}
              >
                {label}
                {m === "notes" && selected.length > 0 && <span className="ml-1.5 rounded-sm bg-paper/15 px-1 text-[0.65rem]">{selected.length}</span>}
              </button>
            );
          })}
        </div>
        {/* Status line: where things stand */}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-paper/60">
          {approved ? (
            <>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-signal-light" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
              <span>
                <span className="text-signal-light">Approved</span> by {approved.name} · {when(approved.at)} · {approved.version}
              </span>
            </>
          ) : (
            <span>Not yet approved.</span>
          )}
        </p>

        {/* ---------------- NOTES ---------------- */}
        {mode === "notes" && (
          <div className="mt-3">
            <p className="text-xs text-paper/60">
              Private to you until you send. Each note is tagged with the page you&apos;re on — this one: <span className="text-paper">{here}</span>.
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addNote();
              }}
              placeholder="Title — e.g. Phone number on About"
              className={`mt-3 ${field} font-semibold placeholder:font-normal`}
            />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote();
              }}
              rows={3}
              placeholder="Details (optional) — e.g. make it bigger, it's hard to tap"
              className={`scroll-dark mt-2 block min-h-20 min-w-full resize ${field}`}
              style={{ maxWidth: "calc(100vw - 4rem)", maxHeight: "60vh" }}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[0.7rem] text-paper/45">{editing !== null ? "Editing a note" : "⌘/Ctrl + Enter to add"}</span>
              <span className="flex items-center gap-1">
                {editing !== null && (
                  <button type="button" onClick={cancelEdit} className="font-display flex min-h-9 items-center rounded-sm px-2 text-sm font-semibold uppercase tracking-[0.04em] text-paper/70 hover:text-paper">
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={addNote}
                  disabled={!title.trim()}
                  className={`font-display flex min-h-9 items-center rounded-sm px-3 text-sm font-semibold uppercase tracking-[0.04em] disabled:opacity-40 ${
                    editing !== null ? "bg-signal text-paper hover:bg-signal-strong" : "border border-paper/30 text-paper hover:border-signal-light hover:text-signal-light"
                  }`}
                >
                  {editing !== null ? "Update note" : "Add note"}
                </button>
              </span>
            </div>

            {notes.length > 0 && (
              <>
                <ul className="scroll-dark mt-3 max-h-40 space-y-2 overflow-y-auto border-t border-paper/10 pt-3 pr-1 text-sm">
                  {notes.map((n, i) => (
                    <li key={n.at + i} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isShared(n)}
                        onChange={(e) => saveNotes(notes.map((m, j) => (j === i ? { ...m, share: e.target.checked } : m)))}
                        aria-label="Include this note when sending"
                        title="Ticked = goes to the team when you send"
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-signal)]"
                      />
                      <button
                        type="button"
                        onClick={() => editNote(i)}
                        title="Click to read or change"
                        className={`min-w-0 flex-1 rounded-sm px-1 text-left hover:bg-ink-2 ${editing === i ? "bg-ink-2 ring-1 ring-signal" : ""}`}
                      >
                        <span className={`block ${isShared(n) ? "text-paper" : "text-paper/60"}`}>{n.title || n.note}</span>
                        <span className="block text-[0.7rem] text-paper/45">{n.page}</span>
                      </button>
                      <button type="button" onClick={() => removeNote(i)} aria-label="Remove this note" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-paper/50 hover:bg-signal hover:text-paper">
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3 stroke-current" fill="none" strokeWidth="3">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className={`mt-3 ${field}`} />
                <button
                  type="button"
                  onClick={sendNotes}
                  disabled={notesStatus === "sending" || selected.length === 0}
                  className="font-display mt-2 flex min-h-11 w-full items-center justify-center rounded-sm bg-signal text-lg font-semibold text-paper hover:bg-signal-strong disabled:opacity-50"
                >
                  {notesStatus === "sending"
                    ? "Sending…"
                    : selected.length === 0
                      ? "Tick the notes to send"
                      : `Send ${selected.length} ${selected.length === 1 ? "note" : "notes"} to the design team`}
                </button>
              </>
            )}
            {notesStatus === "sent" && <p className="mt-2 text-sm text-signal-light">Sent — thank you.</p>}
            {notesStatus === "error" && <p className="mt-2 text-sm text-signal-light">Couldn&apos;t send just now. Try again in a moment.</p>}
            {notesStatus === "fallback" && fallbackBox("Email them", mailto(`Preview notes — ${SITE_NAME}`, `${name ? `From ${name}\n\n` : ""}${notesText()}\n\n${PREVIEW_TEST_URL}`), copyNotes)}

            {sent.length > 0 && (
              <div className="mt-4 border-t border-paper/10 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSent((v) => !v)}
                  aria-expanded={showSent}
                  className="flex w-full items-center justify-between py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-paper/50 hover:text-paper"
                >
                  <span className="flex items-center gap-1.5">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    Sent · {sent.length}
                  </span>
                  <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-3 w-3 stroke-current transition-transform motion-reduce:transition-none ${showSent ? "rotate-180" : ""}`} fill="none" strokeWidth="3">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {showSent && (
                  <ul className="scroll-dark mt-1 max-h-44 space-y-1 overflow-y-auto pr-1 text-sm">
                    {sent.map((n, i) => (
                      <li key={(n.sentAt ?? "") + n.at + i} className="flex items-start gap-2 rounded-sm px-1 py-1 hover:bg-ink-2">
                        <span className="min-w-0 flex-1">
                          <span title={n.note || undefined} className="block text-paper/80">{n.title || n.note}</span>
                          <span className="block text-[0.7rem] text-paper/45">
                            {n.page}
                            {n.sentAt ? ` · sent ${when(n.sentAt)}` : ""}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => resend(i)}
                          title="Put it back in the list to send again"
                          className="font-display shrink-0 rounded-sm border border-paper/25 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-paper/70 hover:border-signal-light hover:text-signal-light"
                        >
                          Resend
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------------- APPROVE ---------------- */}
        {mode === "approve" && (
          <div className="mt-3">
            <p className="font-display text-xl font-bold uppercase leading-none">{approved ? "Approve again" : "Approve the site"}</p>
            <p className="mt-1 text-xs text-paper/60">
              {approved ? "Approving again after changes? The newest approval is the one that counts." : "A dated sign-off, in writing, so the team can move toward launch."}
            </p>
            <p className="mt-3 text-sm text-paper/85">Which home page?</p>
            <div className="mt-1.5 flex gap-1" role="radiogroup" aria-label="Home page version">
              {VERSIONS.map((v) => (
                <button
                  key={v.href}
                  type="button"
                  role="radio"
                  aria-checked={approveVersion === v.label}
                  onClick={() => setApproveVersion(v.label)}
                  className={`font-display flex min-h-9 flex-1 items-center justify-center rounded-sm text-xs font-semibold uppercase tracking-[0.04em] ${
                    approveVersion === v.label ? "bg-signal text-paper" : "border border-paper/30 text-paper hover:border-signal-light"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={`mt-2 ${field}`} />
            <textarea
              value={approveMsg}
              onChange={(e) => setApproveMsg(e.target.value)}
              rows={3}
              placeholder="A message to go with your approval (optional) — e.g. Looks great, go ahead"
              className={`scroll-dark mt-2 block ${field}`}
            />
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-sm border border-paper/20 bg-ink-2 p-2.5 text-sm leading-snug text-paper">
              <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-signal)]" />
              <span>{ATTESTATION}</span>
            </label>
            {selected.length > 0 && (
              <p className="mt-2 text-xs text-paper/60">
                Your {selected.length} ticked {selected.length === 1 ? "note" : "notes"} under Notes {selected.length === 1 ? "goes" : "go"} with it.
              </p>
            )}
            {approveStatus === "fallback" ? (
              fallbackBox("Email your approval", approvalMailto)
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={sendApproval}
                  disabled={approveStatus === "sending" || !name.trim() || !attest}
                  className="font-display flex min-h-11 flex-1 items-center justify-center rounded-sm bg-signal text-base font-semibold uppercase tracking-[0.04em] text-paper hover:bg-signal-strong disabled:opacity-50"
                >
                  {approveStatus === "sending" ? "Sending…" : "Approve & send"}
                </button>
                <button type="button" onClick={() => setMode("notes")} className="font-display flex min-h-11 items-center rounded-sm px-3 text-sm font-semibold uppercase text-paper/70 hover:text-paper">
                  Cancel
                </button>
              </div>
            )}
            {approveStatus === "error" && <p className="mt-2 text-sm text-signal-light">Couldn&apos;t send just now. Try again in a moment.</p>}
          </div>
        )}

        {/* ---------------- WITHDRAW ---------------- */}
        {mode === "withdraw" && approved && (
          <div className="mt-3">
            <p className="font-display text-xl font-bold uppercase leading-none">Withdraw your approval</p>
            <p className="mt-1 text-xs text-paper/60">The team stops moving toward launch and gets your reason.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="What changed? — e.g. Hold on, I want to rethink the About page first"
              className={`scroll-dark mt-3 block ${field}`}
            />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={`mt-2 ${field}`} />
            {withdrawStatus === "fallback" ? (
              fallbackBox("Email the withdrawal", withdrawalMailto)
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={sendWithdrawal}
                  disabled={withdrawStatus === "sending" || !name.trim() || !reason.trim()}
                  className="font-display flex min-h-11 flex-1 items-center justify-center rounded-sm bg-signal text-base font-semibold uppercase tracking-[0.04em] text-paper hover:bg-signal-strong disabled:opacity-50"
                >
                  {withdrawStatus === "sending" ? "Sending…" : "Withdraw approval"}
                </button>
                <button type="button" onClick={() => setMode("notes")} className="font-display flex min-h-11 items-center rounded-sm px-3 text-sm font-semibold uppercase text-paper/70 hover:text-paper">
                  Cancel
                </button>
              </div>
            )}
            {withdrawStatus === "error" && <p className="mt-2 text-sm text-signal-light">Couldn&apos;t send just now. Try again in a moment.</p>}
          </div>
        )}

        <p className="mt-4 border-t border-paper/10 pt-3 text-[0.7rem] leading-snug text-paper/45">Build-preview widget — it won&apos;t appear on the live site.</p>
      </div>

      {/* The tab. */}
      <button
        type="button"
        tabIndex={tucked ? 0 : -1}
        {...tabGrip}
        onClick={() => {
          if (!wasDrag()) set(false);
        }}
        aria-label="Feedback — notes, approve or withdraw"
        aria-hidden={!tucked}
        inert={!tucked}
        style={tabStyle}
        className={`group font-display fixed z-50 flex h-7 items-center gap-1 bg-ink/85 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-paper/90 select-none touch-none hover:bg-ink hover:text-paper ${
          drag?.what === "tab" ? "cursor-grabbing" : "cursor-grab transition-transform duration-300 ease-out motion-reduce:transition-none"
        } ${left ? "left-0 rounded-r-sm px-1.5" : "right-0 rounded-l-sm px-1.5 flex-row-reverse"} ${
          tucked ? "" : `pointer-events-none ${left ? "-translate-x-full" : "translate-x-full"}`
        }`}
      >
        <NoteIcon />
        {selected.length > 0 && <span className="rounded-sm bg-signal px-1 text-[0.6rem] leading-4 text-paper">{selected.length}</span>}
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100 motion-reduce:transition-none">
          Feedback
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-2.5 w-2.5 stroke-current opacity-60" fill="none" strokeWidth="3">
          {left ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
        </svg>
      </button>
    </>
  );
}
