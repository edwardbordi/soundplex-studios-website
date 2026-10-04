import { StudioAccount, ADMIN_VERSION } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";

/** Account — My Profile · Change Password · Team · Business · Studio. Data for every tab is loaded here. */
export default async function AccountPage() {
  const { user, role } = await studio.requireAdmin();
  const manages = role === "owner" || role === "staff";
  const a = studio.actions;
  const [me, team, branding, update, setup] = await Promise.all([
    a.loadMe(),
    manages ? a.loadTeam() : Promise.resolve(null),
    manages ? a.loadBranding() : Promise.resolve(null),
    manages ? studio.readers.studioUpdate() : Promise.resolve(null),
    // Whether the repo checks for updates weekly — Studio switches it on itself the first time through.
    manages ? studio.readers.studioSetup() : Promise.resolve(null),
  ]);
  return <StudioAccount me={{ email: me.email, name: me.name, displayName: me.displayName, avatarUrl: me.avatarUrl }} manages={manages} team={team} branding={branding} myUserId={user.id} myRole={role} update={update} setup={setup} version={ADMIN_VERSION} />;
}
