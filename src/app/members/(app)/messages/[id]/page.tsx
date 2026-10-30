import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Msg } from "../../../../../lib/members/messages";
import { membersServer } from "../../../../../lib/members/server";
import Inbox, { type ThreadOther } from "../Inbox";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

/**
 * /members/messages/[id] — one private conversation. The database only returns it to the two
 * people in it, so anyone else (or a bad id) gets a 404.
 */
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await membersServer();
  if (!sb) notFound();
  const user = (await sb.auth.getUser()).data.user;
  if (!user) notFound();
  const { data: c } = await sb.from("conversations").select("id, member_a, member_b").eq("id", id).maybeSingle();
  if (!c) notFound();
  const otherId = c.member_a === user.id ? c.member_b : c.member_a;

  const [{ data: o }, { data: msgs }, { data: can }, { data: pref }, { data: mine }] = await Promise.all([
    sb.from("members").select("id, first_name, last_name, photo_url, role, status").eq("id", otherId).maybeSingle(),
    sb.from("messages").select("id, conversation_id, sender_id, body, created_at").eq("conversation_id", id).order("created_at", { ascending: false }).limit(200),
    // Their settings, their allowed list and blocks: the database decides.
    sb.rpc("can_message", { target: otherId }),
    // Did I block them? (Only I can read my own list.)
    sb.from("message_prefs").select("rule").eq("owner_id", user.id).eq("member_id", otherId).maybeSingle(),
    // My own photo, beside my messages.
    sb.from("members").select("first_name, photo_url").eq("id", user.id).maybeSingle(),
  ]);
  const me = { first_name: mine?.first_name ?? "", photo_url: mine?.photo_url ?? null };

  // A member who's been paused or removed can't be seen (or messaged); keep the history readable.
  const blocked = pref?.rule === "block";
  const other: ThreadOther = o
    ? { id: o.id, first_name: o.first_name ?? "", last_name: o.last_name ?? "", photo_url: o.photo_url ?? null, role: o.role ?? "", can_message: can === true, blocked, gone: o.status !== "active" }
    : { id: otherId, first_name: "Former", last_name: "member", photo_url: null, role: "", can_message: false, blocked, gone: true };

  return <Inbox meId={user.id} active={{ id, other, me, initial: ((msgs ?? []) as Msg[]).reverse() }} />;
}
