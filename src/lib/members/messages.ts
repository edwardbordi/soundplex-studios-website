"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { membersBrowser } from "./browser";

/**
 * Member-to-member messages (Ed, 2026-10-30): in the app only, never SMS or email.
 * Private two-person conversations. The database only lets the two people in a conversation
 * read it, and writes go through checked functions (see supabase/migrations/…_member_messages.sql).
 */
export type Convo = {
  id: string;
  other_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  role: string;
  /** Whether I can still message them (their setting, their allowed list, and blocks). */
  can_message: boolean;
  last_body: string;
  last_sender: string;
  last_at: string;
  unread: number;
};
export type Msg = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };

export const MSG_MAX = 2000;
/** Fired when a conversation is marked read, so the unread badge updates at once. */
export const READ_EVENT = "sp-messages-read";

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

const friendly = (m = "") =>
  /not accepting/i.test(m) ? "They aren’t taking messages right now." : /not an active/i.test(m) ? "Your membership is paused." : "Couldn’t send. Try again in a moment.";

export async function startConversation(other: string): Promise<Result<{ id: string }>> {
  const sb = membersBrowser();
  if (!sb) return { ok: false, error: "Messages aren’t switched on yet." };
  const { data, error } = await sb.rpc("start_conversation", { other });
  if (error || typeof data !== "string") return { ok: false, error: friendly(error?.message) };
  return { ok: true, id: data };
}

export async function sendMessage(conv: string, body: string): Promise<Result<{ msg: Msg }>> {
  const sb = membersBrowser();
  if (!sb) return { ok: false, error: "Messages aren’t switched on yet." };
  const { data, error } = await sb.rpc("send_message", { conv, msg: body.slice(0, MSG_MAX) });
  if (error || !data) return { ok: false, error: friendly(error?.message) };
  return { ok: true, msg: data as Msg };
}

export async function markRead(conv: string) {
  const sb = membersBrowser();
  if (!sb) return;
  await sb.rpc("mark_read", { conv });
  window.dispatchEvent(new Event(READ_EVENT));
}

export async function myConversations(): Promise<Convo[] | null> {
  const sb = membersBrowser();
  if (!sb) return null;
  const { data, error } = await sb.rpc("my_conversations");
  return error ? null : ((data ?? []) as Convo[]);
}

/** Messages in a conversation, oldest first: the latest 200, or only those after `since`. */
export async function loadMessages(conv: string, since?: string): Promise<Msg[] | null> {
  const sb = membersBrowser();
  if (!sb) return null;
  let q = sb.from("messages").select("id, conversation_id, sender_id, body, created_at").eq("conversation_id", conv);
  if (since) q = q.gt("created_at", since);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(200);
  return error ? null : ((data ?? []) as Msg[]).reverse();
}

// ── Privacy (Settings → Privacy): who can message me, my allowed list, my blocked list ──
export type MessagesFrom = "everyone" | "allowed" | "nobody";
export type PrefRule = "allow" | "block";
export type Pref = { member_id: string; rule: PrefRule };

/** My allowed and blocked lists (only I can read them). */
export async function loadPrefs(): Promise<Pref[] | null> {
  const sb = membersBrowser();
  if (!sb) return null;
  const { data, error } = await sb.from("message_prefs").select("member_id, rule");
  return error ? null : ((data ?? []) as Pref[]);
}

/** Put someone on my allowed or blocked list (a person is on one list at most), or take them off. */
export async function setPref(memberId: string, rule: PrefRule | null): Promise<boolean> {
  const sb = membersBrowser();
  if (!sb) return false;
  const { data } = await sb.auth.getUser();
  const me = data.user?.id;
  if (!me) return false;
  const { error } = rule
    ? await sb.from("message_prefs").upsert({ owner_id: me, member_id: memberId, rule }, { onConflict: "owner_id,member_id" })
    : await sb.from("message_prefs").delete().eq("owner_id", me).eq("member_id", memberId);
  return !error;
}

// ── Alerts (Settings → Privacy → Message alerts): a pop-up and a chime when a message arrives.
// Saved in this browser, so the chime can be on at the desk and off on the phone. ──
export type AlertPrefs = { popup: boolean; chime: boolean };
const ALERT_KEY = "sp-members-alerts";
const ALERT_EVENT = "sp-members-alerts";
const ALERT_DEFAULT = "11";
const readAlertRaw = () => {
  try {
    return localStorage.getItem(ALERT_KEY) ?? ALERT_DEFAULT;
  } catch {
    return ALERT_DEFAULT;
  }
};
export const alertPrefsFrom = (raw: string): AlertPrefs => ({ popup: raw[0] !== "0", chime: raw[1] !== "0" });
export const readAlertPrefs = () => readAlertRaw();
export const subAlertPrefs = (cb: () => void) => {
  window.addEventListener(ALERT_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(ALERT_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
export const serverAlertPrefs = () => ALERT_DEFAULT;
export function setAlertPrefs(p: AlertPrefs) {
  try {
    localStorage.setItem(ALERT_KEY, `${p.popup ? 1 : 0}${p.chime ? 1 : 0}`);
  } catch {
    /* private mode: just this visit */
  }
  window.dispatchEvent(new Event(ALERT_EVENT));
}

/** A soft two-note chime, made in the browser (no sound file). Quietly does nothing if the browser won't play yet. */
let audio: AudioContext | null = null;
export function playChime() {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    [
      [880, 0],
      [1318.5, 0.12],
    ].forEach(([hz, at]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.0001, t + at);
      gain.gain.exponentialRampToValueAtTime(0.18, t + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + at);
      osc.stop(t + at + 0.65);
    });
  } catch {
    /* no audio: the pop-up is enough */
  }
}

// ── Live: one shared realtime channel per tab, fanned out to every listener. RLS means it
// only ever carries messages from your own conversations. ──
const listeners = new Set<(m: Msg) => void>();
let channel: RealtimeChannel | null = null;

export function onNewMessage(cb: (m: Msg) => void): () => void {
  const sb = membersBrowser();
  if (!sb) return () => {};
  listeners.add(cb);
  if (!channel && !opening) {
    opening = true;
    void (async () => {
      // Sign the live connection in as this member, so the database's privacy rules see who's
      // listening (Ed, 2026-10-30: the pop-up came through with no text and no sender).
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      opening = false;
      if (!listeners.size || channel) return;
      if (token) await sb.realtime.setAuth(token);
      // A unique topic, so a quick unsubscribe/resubscribe (React Strict Mode) never reuses a closing channel.
      channel = sb
        .channel(`member-messages-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
          void (async () => {
            const m = await fullMessage(p.new as Partial<Msg>);
            if (m) for (const l of listeners) l(m);
          })();
        })
        .subscribe();
    })();
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && channel) {
      void sb.removeChannel(channel);
      channel = null;
    }
  };
}
let opening = false;

/**
 * The live alert is only a nudge: read the message itself through the normal (privacy-checked)
 * query. With an id, that one message; without, the newest message in any of my conversations.
 */
async function fullMessage(raw: Partial<Msg> | null | undefined): Promise<Msg | null> {
  if (raw?.id && raw.body && raw.sender_id && raw.conversation_id && raw.created_at) return raw as Msg;
  const sb = membersBrowser();
  if (!sb) return null;
  const cols = "id, conversation_id, sender_id, body, created_at";
  const { data } = raw?.id
    ? await sb.from("messages").select(cols).eq("id", raw.id).maybeSingle()
    : await sb.from("messages").select(cols).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data as Msg | null) ?? null;
}

/**
 * My unread message count: live, plus a check when `refreshKey` changes (e.g. the page), when a
 * conversation is read, and every minute. Off (0) when `enabled` is false (not a member).
 * Used by the members area's Messages item and the website's account menu.
 */
export function useUnreadMessages(enabled: boolean, refreshKey?: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = async () => {
      const list = await myConversations();
      if (alive && list) setN(list.reduce((a, c) => a + c.unread, 0));
    };
    void load();
    const off = onNewMessage(() => void load());
    const onRead = () => void load();
    window.addEventListener(READ_EVENT, onRead);
    const t = window.setInterval(load, 60_000);
    return () => {
      alive = false;
      off();
      window.removeEventListener(READ_EVENT, onRead);
      window.clearInterval(t);
    };
  }, [enabled, refreshKey]);
  return enabled ? n : 0;
}

/** Merge new messages into a list: no duplicates, oldest first. */
export function mergeMsgs(list: Msg[], add: Msg[]): Msg[] {
  const seen = new Set(list.map((m) => m.id));
  const out = [...list, ...add.filter((m) => !seen.has(m.id))];
  return out.sort((a, b) => a.created_at.localeCompare(b.created_at));
}
