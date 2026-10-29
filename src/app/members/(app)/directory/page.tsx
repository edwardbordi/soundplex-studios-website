import { membersServer } from "../../../../lib/members/server";
import Directory, { type DirMember } from "./Directory";

/**
 * /members/directory — every active member, as profile cards (real, from the members database;
 * RLS lets an active member see active members). Never selects email.
 */
export default async function MembersDirectoryPage() {
  const sb = await membersServer();
  let list: DirMember[] = [];
  let meId = "";
  if (sb) {
    const [{ data: auth }, { data }] = await Promise.all([
      sb.auth.getUser(),
      sb.from("members").select("id, first_name, last_name, role, offers, looking, photo_url, socials").eq("status", "active").order("first_name"),
    ]);
    meId = auth.user?.id ?? "";
    list = ((data ?? []) as DirMember[]).map((m) => ({ ...m, socials: Array.isArray(m.socials) ? m.socials : [] }));
  }
  return <Directory list={list} meId={meId} />;
}
