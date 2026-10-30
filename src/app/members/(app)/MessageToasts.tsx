"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { membersBrowser } from "../../../lib/members/browser";
import { alertPrefsFrom, myConversations, onNewMessage, playChime, readAlertPrefs, serverAlertPrefs, subAlertPrefs, type Msg } from "../../../lib/members/messages";
import PresenceAvatar from "./PresenceAvatar";
import { pushFeed } from "../../../lib/venue/feed";

/**
 * Message alerts (Ed, 2026-10-30): when a message arrives anywhere in the members area, a pop-up
 * bottom right (above the tabs on phones) and a soft chime. Each can be switched off in
 * Settings → Privacy → Message alerts. Nothing for the conversation you're already reading.
 */
type Sender = { first_name: string; last_name: string; photo_url: string | null };
type Toast = { id: string; conv: string; from: string; body: string; sender: Sender };

const SHOW_MS = 6500;

export default function MessageToasts({ place = "app" }: { place?: "app" | "site" }) {
  const path = usePathname() ?? "";
  const prefs = alertPrefsFrom(useSyncExternalStore(subAlertPrefs, readAlertPrefs, serverAlertPrefs));
  const [toasts, setToasts] = useState<Toast[]>([]);
  // The latest values, read from inside the live listener without re-subscribing.
  const live = useRef({ path, prefs, place });
  useEffect(() => {
    live.current = { path, prefs, place };
  });

  useEffect(() => {
    const sb = membersBrowser();
    if (!sb) return;
    let me = "";
    void sb.auth.getSession().then(({ data }) => {
      me = data.session?.user.id ?? "";
    });
    const people = new Map<string, Sender>();

    const off = onNewMessage(async (m: Msg) => {
      if (!me || m.sender_id === me) return;
      const { path: p, prefs: a } = live.current;
      // Already reading this conversation, and looking at it: no alert.
      if (p === `/members/messages/${m.conversation_id}` && document.visibilityState === "visible") return;
      if (a.chime) playChime();
      if (!a.popup) return;
      // Who sent it: from my conversation list (it carries the other member's name and photo),
      // then the members table. Only a real answer is remembered.
      let sender = people.get(m.conversation_id);
      if (!sender) {
        const list = await myConversations();
        const c = list?.find((x) => x.id === m.conversation_id);
        if (c) sender = { first_name: c.first_name, last_name: c.last_name, photo_url: c.photo_url };
        else if (m.sender_id) {
          const { data } = await sb.from("members").select("first_name, last_name, photo_url").eq("id", m.sender_id).maybeSingle();
          if (data) sender = data as Sender;
        }
        if (sender) people.set(m.conversation_id, sender);
      }
      sender ??= { first_name: "A member", last_name: "", photo_url: null };
      // On the website, the "Live at SoundPlex" feed notes it too (only you see your feed).
      if (live.current.place === "site") pushFeed({ audience: "members", kind: "message", who: { name: [sender.first_name, sender.last_name].filter(Boolean).join(" "), photo: sender.photo_url ?? undefined }, text: "sent you a message" });
      const t: Toast = { id: m.id, conv: m.conversation_id, from: m.sender_id, body: m.body, sender };
      // One per conversation (the newest), at most three on screen.
      setToasts((cur) => [...cur.filter((x) => x.conv !== t.conv), t].slice(-3));
      window.setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), SHOW_MS);
    });
    return off;
  }, []);

  // Opening the conversation clears its pop-up.
  useEffect(() => {
    const m = path.match(/^\/members\/messages\/(.+)$/);
    if (!m) return;
    const conv = m[1];
    const t = window.setTimeout(() => setToasts((cur) => cur.filter((x) => x.conv !== conv)), 0);
    return () => window.clearTimeout(t);
  }, [path]);

  if (!toasts.length) return null;
  // Members area: bottom right (above the phone tabs). Website: top right, just under the header
  // and near your avatar, so it never sits on the "Live at SoundPlex" feed (bottom right).
  const where =
    place === "site"
      ? "fixed inset-x-3 z-[70] flex flex-col items-end gap-2.5 sm:inset-x-auto sm:right-5"
      : "fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-2.5 sm:inset-x-auto sm:right-5 md:bottom-5";
  return (
    <div className={`pointer-events-none ${where}`} style={place === "site" ? { top: "calc(var(--hdr-h, 76px) + 12px)" } : undefined} aria-live="polite">
      {toasts.map((t) => {
        const name = [t.sender.first_name, t.sender.last_name].filter(Boolean).join(" ");
        return (
          <div key={t.id} className="mx-toast pointer-events-auto relative w-full max-w-[22rem] overflow-hidden rounded-[10px] rounded-bl-none border border-[#d4a030]/45 bg-(--mx-pop) text-(--mx-text) shadow-(--mx-shadow)">
            <Link href={`/members/messages/${t.conv}`} onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} className="flex items-start gap-3 p-3.5 pr-10">
              <PresenceAvatar id={t.from} photo={t.sender.photo_url} name={t.sender.first_name} size={40} bg="var(--mx-pop)" />
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-[0.16em] text-(--mx-gold-text)">New message</span>
                <span className="mt-0.5 block truncate text-[14.5px] font-medium">{name}</span>
                <span className="mt-0.5 line-clamp-2 block text-[13.5px] leading-snug text-(--mx-muted)">{t.body}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}
              aria-label="Dismiss"
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-(--mx-faint) hover:bg-(--mx-hover) hover:text-(--mx-text)"
            >
              ×
            </button>
            <span className="mx-toast__bar absolute bottom-0 left-0 h-[2px] bg-(--mx-gold)" style={{ animationDuration: `${SHOW_MS}ms` }} aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
}
