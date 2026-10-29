import { studio } from "@/lib/admin/studio";
import { listMembers } from "@/lib/members/admin-actions";
import MembersManager from "./MembersManager";

/**
 * Studio → Members (Ed, 2026-10-28): invite a Plex Collective member (after checking their
 * membership is paid), pause a lapsed one, remove someone. Invitation only: no self-signup.
 */
export default async function MembersPage() {
  await studio.requireAdmin();
  const res = await listMembers();
  return <MembersManager initial={res.ok ? res.members : []} configured={res.ok || res.error !== "not-configured"} loadError={res.ok || res.error === "not-configured" ? null : res.error} />;
}
