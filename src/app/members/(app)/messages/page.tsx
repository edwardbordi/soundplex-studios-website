import type { Metadata } from "next";
import { membersServer } from "../../../../lib/members/server";
import Inbox from "./Inbox";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

/** /members/messages — your private conversations with other members (in the app only). */
export default async function MessagesPage() {
  const sb = await membersServer();
  const meId = sb ? ((await sb.auth.getUser()).data.user?.id ?? "") : "";
  return <Inbox meId={meId} active={null} />;
}
