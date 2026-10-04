import { StudioAcceptInvite, StudioNotConfigured, StudioShellFrame } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";
import { SITE_NAME } from "@/lib/site-config";

/** Invitation landing page — the invite token arrives in the URL hash, so the last step is client-side. */
export default function AcceptInvitePage() {
  const frame = (body: React.ReactNode) => <StudioShellFrame siteName={SITE_NAME} logoUrl="/logos/favicon.svg" user={null} role={null} nav={[]}>{body}</StudioShellFrame>;
  if (!studio.isConfigured()) return frame(<StudioNotConfigured />);
  const { url, anonKey } = studio.config.env().identity;
  return frame(<StudioAcceptInvite url={url} anonKey={anonKey} />);
}
