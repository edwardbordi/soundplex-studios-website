"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { MSG_MAX, READ_EVENT, loadMessages, markRead, mergeMsgs, myConversations, onNewMessage, sendMessage, setPref, type Convo, type Msg } from "../../../../lib/members/messages";
import { Ico } from "../MemberShell";
import PresenceAvatar from "../PresenceAvatar";
import { PANEL, useNow } from "../shared";

/**
 * Messages (Ed, 2026-10-30): private conversations between two members, in the app only.
 *   Desktop: your conversations on the left, the open one on the right.
 *   Phone:   the list, or the open conversation (with a back arrow), one at a time.
 * New messages arrive live; a slow check every 15s covers a dropped connection.
 */
export type ThreadOther = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  role: string;
  /** I can message them now (their settings, their allowed list, blocks). */
  can_message: boolean;
  /** I blocked them. */
  blocked: boolean;
  gone: boolean;
};
export type Active = { id: string; other: ThreadOther; me: { first_name: string; photo_url: string | null }; initial: Msg[] } | null;

const fullName = (a: { first_name: string; last_name: string }) => [a.first_name, a.last_name].filter(Boolean).join(" ") || "Member";
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function ago(iso: string, now: Date) {
  const d = new Date(iso);
  const mins = Math.round((now.getTime() - d.getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (d.toDateString() === now.toDateString()) return time(iso);
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function dayLabel(iso: string, now: Date) {
  const d = new Date(iso);
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

// The panel fills the screen below the top bar (phone: above the bottom tabs).
const FRAME = "h-[calc(100dvh-12rem)] min-h-[26rem] md:h-[calc(100dvh-9.5rem)]";

// ── Full screen (Ed, 2026-10-31): the messages window can fill the whole screen, over the top
// bar, side menu and phone tabs. Kept while you move between conversations (this visit). ──
const FULL_EVENT = "sp-messages-full";
let fullNow = false;
const subFull = (cb: () => void) => {
  window.addEventListener(FULL_EVENT, cb);
  return () => window.removeEventListener(FULL_EVENT, cb);
};
const setFull = (v: boolean) => {
  fullNow = v;
  window.dispatchEvent(new Event(FULL_EVENT));
};
const useFull = () => useSyncExternalStore(subFull, () => fullNow, () => false);

function FullToggle({ className = "" }: { className?: string }) {
  const full = useFull();
  return (
    <button
      type="button"
      onClick={() => setFull(!full)}
      aria-label={full ? "Exit full screen" : "Full screen"}
      title={full ? "Exit full screen (Esc)" : "Full screen"}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-[4px] border border-(--mx-line-strong) text-(--mx-muted) transition-colors hover:border-(--mx-gold) hover:text-(--mx-text) ${className}`}
    >
      <Ico d={full ? "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" : "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"} className="h-4 w-4" />
    </button>
  );
}

export default function Inbox({ meId, active }: { meId: string; active: Active }) {
  const full = useFull();
  useEffect(() => {
    if (!full) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setFull(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [full]);
  return (
    <div
      className={`grid overflow-hidden lg:grid-cols-[19rem_1fr] ${
        full ? "fixed inset-0 z-[55] bg-(--mx-panel-solid) pb-[env(safe-area-inset-bottom)]" : `${PANEL} ${FRAME}`
      }`}
    >
      <div className={`${active ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-(--mx-line) lg:border-r`}>
        <List meId={meId} activeId={active?.id ?? null} showToggle={!active} />
      </div>
      {active ? (
        <Thread key={active.id} meId={meId} active={active} />
      ) : (
        <div className="hidden place-items-center p-10 text-center lg:grid">
          <div>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#d4a030]/50 text-(--mx-gold-text)">
              <Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" className="h-6 w-6" />
            </span>
            <p className="mt-4 font-[family-name:var(--font-poppins)] text-[17px] font-medium">Pick a conversation</p>
            <p className="mt-1 text-[14px] text-(--mx-muted)">Or find someone in Members and tap the message icon.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function List({ meId, activeId, showToggle }: { meId: string; activeId: string | null; showToggle: boolean }) {
  const now = useNow();
  const [list, setList] = useState<Convo[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await myConversations();
      if (!alive) return;
      if (r) setList(r);
      else setFailed(true);
    };
    void load();
    const off = onNewMessage(() => void load());
    const onRead = () => void load();
    window.addEventListener(READ_EVENT, onRead);
    const t = window.setInterval(load, 30_000);
    return () => {
      alive = false;
      off();
      window.removeEventListener(READ_EVENT, onRead);
      window.clearInterval(t);
    };
  }, []);

  return (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-(--mx-line) px-5">
        <h1 className="font-[family-name:var(--font-poppins)] text-[18px] font-medium">Messages</h1>
        {showToggle && <FullToggle className="ml-auto" />}
      </div>
      <div className="mx-scroll mx-scroll--panel min-h-0 flex-1 overflow-y-auto">
        {list === null ? (
          <p className="p-5 text-[14px] text-(--mx-muted)">{failed ? "Couldn’t load your messages. Refresh in a moment." : "Loading…"}</p>
        ) : list.length === 0 ? (
          <div className="p-6 text-[14px] text-(--mx-muted)">
            <p>No conversations yet.</p>
            <p className="mt-2">
              Find someone in{" "}
              <Link href="/members/directory" className="text-(--mx-gold-text) hover:underline">
                Members
              </Link>{" "}
              and tap the message icon on their card.
            </p>
          </div>
        ) : (
          <ul>
            {list.map((c) => {
              const on = c.id === activeId;
              const unread = c.unread > 0 && !on;
              return (
                <li key={c.id}>
                  <Link
                    href={`/members/messages/${c.id}`}
                    aria-current={on ? "page" : undefined}
                    className={`relative flex items-center gap-3 border-b border-(--mx-line) px-5 py-3.5 transition-colors ${on ? "bg-(--mx-hover)" : "hover:bg-(--mx-hover)"}`}
                  >
                    {on && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-(--mx-gold)" aria-hidden="true" />}
                    <PresenceAvatar id={c.other_id} photo={c.photo_url} name={c.first_name} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className={`truncate text-[15px] ${unread ? "font-semibold text-(--mx-text)" : "font-medium"}`}>{fullName(c)}</span>
                        <span className="ml-auto shrink-0 text-[12px] text-(--mx-faint)">{now ? ago(c.last_at, now) : ""}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={`truncate text-[13.5px] ${unread ? "text-(--mx-soft)" : "text-(--mx-muted)"}`}>
                          {c.last_sender === meId ? "You: " : ""}
                          {c.last_body}
                        </span>
                        {unread && (
                          <span className="ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-(--mx-gold) px-1.5 text-[11px] font-bold text-[#141414]" aria-label={`${c.unread} unread`}>
                            {c.unread > 9 ? "9+" : c.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

type Shown = Msg & { pending?: boolean };

function Thread({ meId, active }: { meId: string; active: NonNullable<Active> }) {
  const { id, other } = active;
  const now = useNow();
  const [msgs, setMsgs] = useState<Shown[]>(active.initial);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const lastAt = useRef(active.initial.at(-1)?.created_at);
  const router = useRouter();
  const canSend = other.can_message && !other.gone && !other.blocked;
  const name = fullName(other);
  const [blocking, setBlocking] = useState(false);
  // Block / unblock from the conversation; the page reloads its rules from the database.
  const toggleBlock = async () => {
    if (!other.blocked && !window.confirm(`Block ${name}? They won’t be able to message you, and you won’t be able to message them. You can unblock them any time.`)) return;
    setBlocking(true);
    const ok = await setPref(other.id, other.blocked ? null : "block");
    setBlocking(false);
    if (ok) router.refresh();
    else setErr("Couldn’t update. Try again in a moment.");
  };

  const read = useCallback(() => {
    if (document.visibilityState === "visible") void markRead(id);
  }, [id]);

  // Live: new messages in this conversation; mark them read while it's open.
  useEffect(() => {
    read();
    const add = (list: Msg[]) => {
      const mine = list.filter((m) => m.conversation_id === id);
      if (!mine.length) return;
      setMsgs((cur) => mergeMsgs(cur, mine));
      const newest = mine[mine.length - 1].created_at;
      if (!lastAt.current || newest > lastAt.current) lastAt.current = newest;
      if (mine.some((m) => m.sender_id !== meId)) read();
    };
    const off = onNewMessage((m) => add([m]));
    const t = window.setInterval(async () => {
      const r = await loadMessages(id, lastAt.current);
      if (r) add(r);
    }, 15_000);
    document.addEventListener("visibilitychange", read);
    return () => {
      off();
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", read);
    };
  }, [id, meId, read]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending || !canSend) return;
    setErr("");
    setSending(true);
    const temp: Shown = { id: `temp-${Date.now()}`, conversation_id: id, sender_id: meId, body, created_at: new Date().toISOString(), pending: true };
    setMsgs((cur) => [...cur, temp]);
    setText("");
    const r = await sendMessage(id, body);
    setSending(false);
    if (r.ok) {
      setMsgs((cur) => mergeMsgs(cur.filter((m) => m.id !== temp.id), [r.msg]));
      if (!lastAt.current || r.msg.created_at > lastAt.current) lastAt.current = r.msg.created_at;
    } else {
      setMsgs((cur) => cur.filter((m) => m.id !== temp.id));
      setText(body);
      setErr(r.error);
    }
    box.current?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-(--mx-line) px-4 sm:px-5">
        <Link href="/members/messages" aria-label="All messages" className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text) lg:hidden">
          <Ico d="M15 6l-6 6 6 6" />
        </Link>
        <PresenceAvatar id={other.id} photo={other.photo_url} name={other.first_name} size={38} />
        <span className="min-w-0">
          <span className="block truncate text-[15.5px] font-medium">{name}</span>
          {other.role && <span className="block truncate text-[12.5px] text-(--mx-gold-text)">{other.role}</span>}
        </span>
        <span className="ml-auto hidden items-center gap-1.5 text-[12px] text-(--mx-faint) xl:flex">
          <Ico d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" className="h-3.5 w-3.5" /> Only you two see this
        </span>
        {!other.gone && (
          <button
            type="button"
            onClick={() => void toggleBlock()}
            disabled={blocking}
            className="ml-auto shrink-0 rounded-[4px] border border-(--mx-line-strong) px-2.5 py-1 text-[12.5px] text-(--mx-muted) transition-colors hover:border-[#e2735e]/60 hover:text-(--mx-text) disabled:opacity-50 xl:ml-3"
          >
            {other.blocked ? "Unblock" : "Block"}
          </button>
        )}
        <FullToggle className={other.gone ? "ml-auto" : "ml-2"} />
      </div>

      <div ref={scroller} className="mx-scroll mx-scroll--panel min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
        {msgs.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <PresenceAvatar id={other.id} photo={other.photo_url} name={other.first_name} size={64} />
              <p className="mt-3 text-[15px] font-medium">{name}</p>
              <p className="mt-1 text-[14px] text-(--mx-muted)">{canSend ? `Say hello. Only you and ${other.first_name || "they"} will see this.` : ""}</p>
            </div>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {msgs.map((m, i) => {
              const mine = m.sender_id === meId;
              const prev = msgs[i - 1];
              const newDay = now && (!prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString());
              const gap = prev && (prev.sender_id !== m.sender_id || new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() > 10 * 60_000);
              // Photos beside the bubbles (Ed, 2026-10-30): on the last message of each run from
              // the same person, like iMessage; a spacer keeps the others lined up.
              const next = msgs[i + 1];
              const endsRun =
                !next || next.sender_id !== m.sender_id || new Date(next.created_at).getTime() - new Date(m.created_at).getTime() > 10 * 60_000 || new Date(next.created_at).toDateString() !== new Date(m.created_at).toDateString();
              const who = mine ? active.me : other;
              return (
                <li key={m.id}>
                  {newDay && now && <p className="my-4 text-center text-[11.5px] uppercase tracking-[0.16em] text-(--mx-faint)">{dayLabel(m.created_at, now)}</p>}
                  <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""} ${gap && !newDay ? "mt-3" : ""}`}>
                    {endsRun ? <PresenceAvatar id={m.sender_id} photo={who.photo_url} name={who.first_name} size={28} /> : <span className="w-9 shrink-0" aria-hidden="true" />}
                    <div
                      className={`max-w-[75%] whitespace-pre-wrap break-words rounded-[14px] px-3.5 py-2 text-[15px] leading-snug ${
                        mine ? "rounded-br-[4px] bg-(--mx-gold) text-[#141414]" : "rounded-bl-[4px] border border-(--mx-line) bg-(--mx-raised) text-(--mx-text)"
                      } ${m.pending ? "opacity-60" : ""}`}
                    >
                      {m.body}
                      {now && <span className={`ml-2 inline-block translate-y-px text-[11px] ${mine ? "text-[#141414]/60" : "text-(--mx-faint)"}`}>{m.pending ? "Sending…" : time(m.created_at)}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="shrink-0 border-t border-(--mx-line) p-3 sm:p-4">
        {err && <p className="mb-2 px-1 text-[13px] text-[#e2735e]">{err}</p>}
        {canSend ? (
          <form
            onSubmit={send}
            className="flex items-end gap-2 rounded-[26px] border border-(--mx-line-strong) bg-(--mx-field) py-1.5 pl-5 pr-1.5 transition-colors focus-within:border-(--mx-gold)"
          >
            {/* One pill with the send button inside, like the Ask box on realiiz.com (Ed, 2026-10-30).
                A single gold ring on focus (the field itself draws no outline). */}
            <label className="sr-only" htmlFor="msg-box">
              Message {name}
            </label>
            <textarea
              id="msg-box"
              ref={box}
              rows={1}
              value={text}
              maxLength={MSG_MAX}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              placeholder={`Message ${other.first_name || name}…`}
              className="mx-compose field-sizing-content max-h-40 min-h-10 flex-1 resize-none self-center border-0 bg-transparent py-2 text-[16px] leading-snug text-(--mx-text) shadow-none outline-none ring-0 placeholder:text-(--mx-faint) focus:outline-none focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              aria-label="Send"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-(--mx-gold) text-[#141414] transition-opacity disabled:opacity-35"
            >
              <Ico d="M12 19V5M5 12l7-7 7 7" />
            </button>
          </form>
        ) : (
          <p className="px-1 py-2 text-center text-[14px] text-(--mx-muted)">
            {other.gone ? "This member is no longer active." : other.blocked ? `You blocked ${other.first_name || name}. Unblock them to message again.` : `${other.first_name || name} isn’t taking messages right now.`}
          </p>
        )}
      </div>
    </div>
  );
}
