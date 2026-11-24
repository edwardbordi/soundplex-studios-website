"use client";

import { useEffect, useState } from "react";
import { pushDataLayerEvent } from "./AnalyticsBeacon";
import ForwardArrow from "./ForwardArrow";
import { formatPhone } from "../../lib/phone";
import { SITE_TIMEZONE } from "../../lib/site-config";
import { SMS_CONSENT_LEAD } from "../../lib/sms-consent";

/**
 * The Ask widget's two actions, shown inside the conversation (Ed, 2026-11-24):
 *   BookFlow  George's real open times (HighLevel) → pick one → name, email, mobile → booked.
 *   TextFlow  name, mobile, message → George texts them back (as realiiz.com's "Text Ed").
 * Both report back with onDone(summary), which the widget keeps in the conversation.
 */

const field =
  "w-full rounded-[6px] border border-white/15 bg-white/[0.03] px-3 py-2 text-[16px] text-white placeholder:text-white/35 focus:border-[#d4a030]/70 focus:outline-none sm:text-[13.5px]";
/** The website's own gold button (.evp__btn: square corners, Poppins capitals, an arrow), full width. */
const primary = "evp__btn group w-full justify-center disabled:pointer-events-none disabled:opacity-50";

/** The flow's top line: what it is, and a way back to the chat if they change their mind. */
function FlowHead({ title, onCancel }: { title: string; onCancel: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="font-[family-name:var(--font-poppins)] text-[11px] font-medium uppercase tracking-[0.16em] text-[#e2b34e]">{title}</span>
      <button type="button" onClick={onCancel} className="flex shrink-0 items-center gap-1 text-[12px] text-white/50 transition-colors hover:text-white" aria-label="Close this and go back to the chat">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
        Back to chat
      </button>
    </div>
  );
}

const dayLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: SITE_TIMEZONE });
const whenLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: SITE_TIMEZONE });

function Consent({ on, set, required }: { on: boolean; set: (v: boolean) => void; required?: boolean }) {
  return (
    <label className="flex items-start gap-2 text-[11px] leading-snug text-white/45">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4a030]" required={required} />
      <span>
        {SMS_CONSENT_LEAD}{" "}
        {/* Kept together so "· Terms" never wraps onto a line of its own. */}
        <span className="whitespace-nowrap">
          <a href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-white/80">
            Privacy
          </a>
          {" · "}
          <a href="/terms" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-white/80">
            Terms
          </a>
        </span>
      </span>
    </label>
  );
}

/* ───────────── Book a time with George ───────────── */

type Day = { day: string; slots: string[] };

export function BookFlow({ path, onDone, onCancel }: { path: string; onDone: (summary: string) => void; onCancel: () => void }) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState("");
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", note: "" });
  const [sms, setSms] = useState(false);
  const [typoOk, setTypoOk] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [state, setState] = useState<"pick" | "details" | "busy">("pick");
  const [err, setErr] = useState("");
  const [fax, setFax] = useState("");

  const loadSlots = () => {
    setDays(null);
    setLoadErr("");
    fetch("/api/ask/slots")
      .then((r) => r.json())
      .then((d: { enabled?: boolean; days?: Day[]; error?: string }) => {
        if (!d.enabled) return setLoadErr("Booking isn’t open here yet. Use the short form at /start, or call (609) 697-2077.");
        if (d.error || !d.days?.length) return setLoadErr(d.error ?? "No open times in the next two weeks. Text George instead, or call (609) 697-2077.");
        setDays(d.days);
        setDayIdx(0);
      })
      .catch(() => setLoadErr("Couldn’t read George’s calendar just now. Try again in a moment."));
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load the open times once, on show
  useEffect(loadSlots, []);

  const submit = async (confirmTypo = false) => {
    setErr("");
    setState("busy");
    pushDataLayerEvent("ask_book_submit", { page: path });
    try {
      const r = await fetch("/api/ask/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slot, ...f, smsConsent: sms, page: path, typoConfirmed: confirmTypo || typoOk, fax }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; taken?: boolean; suggestion?: string };
      if (d.ok) {
        pushDataLayerEvent("ask_book_done", { page: path });
        onDone(`Booked: ${whenLabel(slot)} with George. A confirmation is on its way to ${f.email}.`);
        return;
      }
      setErr(d.error ?? "Couldn’t book it just now.");
      if (d.suggestion) setSuggestion(d.suggestion);
      if (d.taken) {
        setSlot("");
        setState("pick");
        loadSlots();
        return;
      }
      setState("details");
    } catch {
      setErr("Couldn’t book it just now. Try again, or call (609) 697-2077.");
      setState("details");
    }
  };

  const head = <FlowHead title="Book a time with George" onCancel={onCancel} />;
  if (loadErr)
    return (
      <div className="mt-2 rounded-[8px] border border-white/10 p-3 text-[12.5px] text-white/60">
        {head}
        {loadErr}
      </div>
    );
  if (!days)
    return (
      <div className="mt-2 rounded-[8px] border border-white/10 p-3 text-[12.5px] text-white/50">
        {head}
        Reading George’s calendar…
      </div>
    );

  const d = days[dayIdx];
  return (
    <div className="mt-2 rounded-[8px] border border-[#d4a030]/35 p-3">
      {head}
      {state === "pick" || !slot ? (
        <>
          <div className="text-[12px] text-white/50">Pick a day, then a time (Eastern):</div>
          {err && <div className="mt-1.5 text-[12px] text-[#e2b34e]">{err}</div>}
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {days.map((x, i) => (
              <button
                key={x.day}
                type="button"
                onClick={() => setDayIdx(i)}
                className={`shrink-0 rounded-[6px] border px-3 py-1.5 text-[12px] transition-colors ${i === dayIdx ? "border-[#d4a030] bg-[#d4a030]/15 text-[#e2b34e]" : "border-white/15 text-white/65 hover:border-white/35"}`}
              >
                {dayLabel(x.day)}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {d.slots.slice(0, 12).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSlot(s);
                  setErr("");
                  setState("details");
                }}
                className="rounded-[6px] border border-white/15 py-1.5 text-[12.5px] text-white/80 transition-colors hover:border-[#d4a030]/70 hover:text-[#e2b34e]"
              >
                {timeLabel(s)}
              </button>
            ))}
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-2"
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-[13px] font-medium text-white">{whenLabel(slot)}</div>
            <button type="button" onClick={() => setState("pick")} className="shrink-0 text-[12px] text-white/50 underline underline-offset-2 hover:text-white">
              Change
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={field} placeholder="First name" autoComplete="given-name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} required maxLength={60} />
            <input className={field} placeholder="Last name" autoComplete="family-name" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} maxLength={60} />
          </div>
          <input
            className={field}
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={f.email}
            onChange={(e) => {
              setF({ ...f, email: e.target.value });
              setSuggestion("");
              setTypoOk(false);
            }}
            required
            maxLength={254}
          />
          {suggestion && (
            <div className="flex flex-wrap items-center gap-3 text-[12px]">
              <button
                type="button"
                className="font-medium text-[#e2b34e] underline underline-offset-2"
                onClick={() => {
                  setF({ ...f, email: `${f.email.split("@")[0]}@${suggestion}` });
                  setSuggestion("");
                  setErr("");
                }}
              >
                Use @{suggestion}
              </button>
              <button
                type="button"
                className="text-white/50 underline underline-offset-2"
                onClick={() => {
                  setTypoOk(true);
                  setSuggestion("");
                  void submit(true);
                }}
              >
                No, it’s right
              </button>
            </div>
          )}
          <input className={field} type="tel" inputMode="tel" placeholder="Mobile" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: formatPhone(e.target.value) })} required />
          <input className={field} placeholder="What would you like to talk about? (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={600} />
          <Consent on={sms} set={setSms} />
          {/* Honeypot: real people never see it. */}
          <input className="hidden" tabIndex={-1} autoComplete="off" value={fax} onChange={(e) => setFax(e.target.value)} aria-hidden="true" />
          {err && <div className="text-[12px] text-[#e2b34e]">{err}</div>}
          <button type="submit" disabled={state === "busy"} className={primary}>
            {state === "busy" ? "Booking…" : "Book this time"}
            {state !== "busy" && <ForwardArrow />}
          </button>
        </form>
      )}
    </div>
  );
}

/* ───────────── A member books a room (members area) ───────────── */

export type BookableRoom = { slug: string; name: string };

/**
 * Pick the room (if the chat didn't already), how long, then a start time where the whole stretch
 * is free on that room's calendar. No contact form: it books as the signed-in member (the server
 * uses their profile). House rules: two hours minimum; the food fee is mentioned.
 */
export function RoomBookFlow({
  path,
  room: initialRoom,
  rooms,
  memberName,
  onDone,
  onCancel,
}: {
  path: string;
  room: string;
  rooms: BookableRoom[];
  memberName: string;
  onDone: (summary: string) => void;
  onCancel: () => void;
}) {
  const [room, setRoom] = useState(initialRoom && rooms.some((r) => r.slug === initialRoom) ? initialRoom : rooms.length === 1 ? rooms[0].slug : "");
  const [hours, setHours] = useState(2);
  const [days, setDays] = useState<Day[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const roomName = rooms.find((r) => r.slug === room)?.name ?? "";

  const load = (slug: string) => {
    setDays(null);
    setLoadErr("");
    setSlot("");
    fetch(`/api/ask/slots?room=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d: { enabled?: boolean; days?: Day[]; error?: string }) => {
        if (!d.enabled) return setLoadErr("That room can’t be booked here yet. Text George and he’ll set it up.");
        if (d.error) return setLoadErr(d.error);
        setDays(d.days ?? []);
        setDayIdx(0);
      })
      .catch(() => setLoadErr("Couldn’t read the room’s calendar just now. Try again in a moment."));
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- reload when the room changes
  useEffect(() => void (room && load(room)), [room]);

  // Start times where every hour of the booking is free (the calendar lists hourly starts).
  const fits = (all: Set<number>, s: string) => {
    const t = Date.parse(s);
    for (let h = 1; h < hours; h++) if (!all.has(t + h * 3_600_000)) return false;
    return true;
  };
  const allStarts = new Set((days ?? []).flatMap((d) => d.slots.map((s) => Date.parse(s))));
  const usable = (days ?? []).map((d) => ({ day: d.day, slots: d.slots.filter((s) => fits(allStarts, s)) })).filter((d) => d.slots.length);
  const today = usable[Math.min(dayIdx, Math.max(0, usable.length - 1))];
  const endLabel = slot ? timeLabel(new Date(Date.parse(slot) + hours * 3_600_000).toISOString()) : "";

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/ask/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room, hours, slot, note, page: path }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; taken?: boolean };
      if (d.ok) {
        pushDataLayerEvent("ask_room_booked", { page: path, room });
        onDone(`Booked: ${roomName}, ${whenLabel(slot)} to ${endLabel} (${hours} hours). The confirmation is on its way to your email.`);
        return;
      }
      setErr(d.error ?? "Couldn’t book it just now.");
      if (d.taken) load(room);
    } catch {
      setErr("Couldn’t book it just now. Try again, or text George.");
    } finally {
      setBusy(false);
    }
  };

  const chip = (on: boolean) =>
    `shrink-0 rounded-[6px] border px-3 py-1.5 text-[12px] transition-colors ${on ? "border-[#d4a030] bg-[#d4a030]/15 text-[#e2b34e]" : "border-white/15 text-white/65 hover:border-white/35"}`;

  return (
    <div className="mt-2 space-y-2.5 rounded-[8px] border border-[#d4a030]/35 p-3">
      <FlowHead title="Book a room" onCancel={onCancel} />
      <div>
        <div className="text-[12px] text-white/50">Room</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {rooms.map((r) => (
            <button key={r.slug} type="button" onClick={() => setRoom(r.slug)} className={chip(r.slug === room)}>
              {r.name}
            </button>
          ))}
        </div>
      </div>
      {room && (
        <div>
          <div className="text-[12px] text-white/50">How long (two hours minimum)</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[2, 3, 4, 5, 6, 8].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setHours(h);
                  setSlot("");
                }}
                className={chip(h === hours)}
              >
                {h === 8 ? "All day" : `${h} hours`}
              </button>
            ))}
          </div>
        </div>
      )}
      {room && loadErr && <div className="text-[12.5px] text-white/60">{loadErr}</div>}
      {room && !loadErr && !days && <div className="text-[12.5px] text-white/50">Reading the {roomName} calendar…</div>}
      {room && days && !slot && (
        <div>
          <div className="text-[12px] text-white/50">Start time (Eastern)</div>
          {usable.length === 0 ? (
            <div className="mt-1.5 text-[12.5px] text-white/60">No {hours}-hour openings in the next two weeks. Try fewer hours, or text George.</div>
          ) : (
            <>
              <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                {usable.map((x, i) => (
                  <button key={x.day} type="button" onClick={() => setDayIdx(i)} className={chip(x.day === today?.day)}>
                    {dayLabel(x.day)}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {today?.slots.slice(0, 12).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className="rounded-[6px] border border-white/15 py-1.5 text-[12.5px] text-white/80 transition-colors hover:border-[#d4a030]/70 hover:text-[#e2b34e]"
                  >
                    {timeLabel(s)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {room && slot && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-2"
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-[13px] font-medium text-white">
              {roomName}, {whenLabel(slot)} to {endLabel}
            </div>
            <button type="button" onClick={() => setSlot("")} className="shrink-0 text-[12px] text-white/50 underline underline-offset-2 hover:text-white">
              Change
            </button>
          </div>
          <input className={field} placeholder="What’s it for? (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
          <div className="text-[11.5px] text-white/45">
            Booking as {memberName || "you"}. Cleanup is included; food or drink adds a $50 cleaning fee.
          </div>
          {err && <div className="text-[12px] text-[#e2b34e]">{err}</div>}
          <button type="submit" disabled={busy} className={primary}>
            {busy ? "Booking…" : `Book the ${roomName}`}
            {!busy && <ForwardArrow />}
          </button>
        </form>
      )}
    </div>
  );
}

/* ───────────── Text George ───────────── */

export function TextFlow({
  path,
  onDone,
  onCancel,
  prefill,
}: {
  path: string;
  onDone: (summary: string) => void;
  onCancel: () => void;
  /** A signed-in member: their name and number, already filled in. */
  prefill?: { firstName: string; phone: string };
}) {
  const [f, setF] = useState({ firstName: prefill?.firstName ?? "", phone: prefill?.phone ? formatPhone(prefill.phone) : "", message: "" });
  const [sms, setSms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fax, setFax] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!sms) return setErr("Tick the box so George can text you back.");
        setErr("");
        setBusy(true);
        pushDataLayerEvent("ask_text_submit", { page: path });
        try {
          const r = await fetch("/api/ask/text", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...f, smsConsent: true, page: path, fax }),
          });
          const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
          if (d.ok) return onDone(`Sent. George will text you back at ${f.phone}, usually within a few hours.`);
          setErr(d.error ?? "Couldn’t send it just now.");
        } catch {
          setErr("Couldn’t send it just now. Try again, or call (609) 697-2077.");
        } finally {
          setBusy(false);
        }
      }}
      className="mt-2 space-y-2 rounded-[8px] border border-[#d4a030]/35 p-3"
    >
      <FlowHead title="Text George" onCancel={onCancel} />
      <div className="text-[12px] text-white/50">George reads these himself and texts you back.</div>
      <div className="grid grid-cols-2 gap-2">
        <input className={field} placeholder="First name" autoComplete="given-name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} required maxLength={60} />
        <input className={field} type="tel" inputMode="tel" placeholder="Mobile" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: formatPhone(e.target.value) })} required />
      </div>
      <textarea className={`${field} min-h-[4.5rem] resize-none`} placeholder="Your message" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required maxLength={600} />
      <Consent on={sms} set={setSms} required />
      <input className="hidden" tabIndex={-1} autoComplete="off" value={fax} onChange={(e) => setFax(e.target.value)} aria-hidden="true" />
      {err && <div className="text-[12px] text-[#e2b34e]">{err}</div>}
      <button type="submit" disabled={busy} className={primary}>
        {busy ? "Sending…" : "Send to George"}
        {!busy && <ForwardArrow />}
      </button>
    </form>
  );
}
