import { ForbiddenError } from "@realiizlabs/admin/auth";
import { navFromContentTypes } from "@realiizlabs/admin/forms";
import { getSiteBranding, profileOf } from "@realiizlabs/admin/auth";
import { StudioAwaitingInstall, StudioNoAccess, StudioNotConfigured, StudioShellFrame } from "@realiizlabs/admin/studio-ui";
import * as actions from "@/lib/admin/actions";
import { studio } from "@/lib/admin/studio";
import { adminSetup } from "@/lib/admin/env";
import { SITE_NAME } from "@/lib/site-config";
import { StudioProvider } from "@/lib/admin/StudioProvider";
import { contentTypes } from "@/lib/admin/content-types";

/**
 * The gate for the shell. Each PAGE in this group also calls studio.requireAdmin()
 * first (layouts and pages render in parallel), and every action re-checks.
 */
export default async function GatedLayout({ children }: { children: React.ReactNode }) {
  const nav = [{ id: "dashboard", label: "Dashboard", href: "/admin", icon: "home" }, ...navFromContentTypes(contentTypes)];
  const pinnedNav = [{ id: "settings", label: "Settings", href: "/admin/account" }];
  const frame = (props: { user: Parameters<typeof StudioShellFrame>[0]["user"]; role: string | null; nav: typeof nav; branding?: { name: string; logoUrl: string | null; whiteLabel?: boolean | null } | null; update?: Parameters<typeof StudioShellFrame>[0]["update"] }, body: React.ReactNode) => (
    <StudioShellFrame siteName={SITE_NAME} logoUrl="/logos/favicon.svg" siteUrl="/" pinnedNav={pinnedNav} {...props}>{body}</StudioShellFrame>
  );

  if (!studio.isConfigured()) return frame({ user: null, role: null, nav: [] }, <StudioNotConfigured checks={adminSetup()} supportName={studio.config.supportName} siteName={SITE_NAME} />);

  const session = await studio.requireAdmin().then(
    (s) => ({ ok: true as const, s }),
    (err: unknown) => {
      if (err instanceof ForbiddenError) return { ok: false as const, actual: err.actual };
      throw err;
    },
  );
  if (!session.ok) return frame({ user: null, role: null, nav: [] }, <StudioNoAccess actual={session.actual} />);

  const { user, role } = session.s;
  // Configured and signed in, but the repository owner hasn't installed the app yet: a waiting page, not a 500.
  const access = await studio.readers.repoAccess();
  if (access.state === "app-not-installed") {
    return frame({ user: { email: user.email ?? "", name: null, avatarUrl: null }, role, nav: [] }, <StudioAwaitingInstall repo={access} supportName={studio.config.supportName} siteName={SITE_NAME} />);
  }
  const client = await studio.identityClient();
  const manages = role === "owner" || role === "staff";
  const [branding, me, update] = await Promise.all([
    getSiteBranding(client, studio.config.env().siteId).catch(() => null),
    client.auth.getUser().then((r) => profileOf(r.data.user)),
    manages ? studio.readers.studioUpdate() : Promise.resolve(null),
  ]);
  return (
    <StudioProvider actions={{ ...actions }}>
      {frame({ user: { email: user.email ?? "", name: me.name, avatarUrl: me.avatarUrl }, role, nav, branding: branding ? { name: branding.name, logoUrl: branding.logoUrl, whiteLabel: branding.whiteLabel } : null, update }, children)}
    </StudioProvider>
  );
}
