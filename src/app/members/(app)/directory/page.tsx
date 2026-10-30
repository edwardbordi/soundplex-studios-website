import { membersServer } from "../../../../lib/members/server";
import Directory, { type DirMember } from "./Directory";

/**
 * /members/directory — every active member, as profile cards (real, from the members database;
 * RLS lets an active member see active members). Never selects the sign-in email; shows the
 * member's own optional phone and contact email (members-only, never on the public wall).
 * The message icon shows only for people you can message (their privacy settings and blocks,
 * checked by the database: messageable_ids).
 */
export default async function MembersDirectoryPage() {
  const sb = await membersServer();
  let list: DirMember[] = [];
  let meId = "";
  if (sb) {
    const [{ data: auth }, { data }, { data: ok }] = await Promise.all([
      sb.auth.getUser(),
      sb.from("members").select("id, first_name, last_name, role, offers, looking, photo_url, socials, phone, contact_email").eq("status", "active").order("first_name"),
      sb.rpc("messageable_ids"),
    ]);
    meId = auth.user?.id ?? "";
    const canMsg = new Set(Array.isArray(ok) ? (ok as string[]) : []);
    list = ((data ?? []) as Omit<DirMember, "can_message">[]).map((m) => ({ ...m, socials: Array.isArray(m.socials) ? m.socials : [], can_message: canMsg.has(m.id) }));
  }
  return <Directory list={list} meId={meId} />;
}
