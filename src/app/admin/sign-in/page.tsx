import { StudioNotConfigured, StudioShellFrame, StudioSignIn } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";
import { adminSetup } from "@/lib/admin/env";
import { SITE_NAME } from "@/lib/site-config";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const frame = (body: React.ReactNode) => <StudioShellFrame siteName={SITE_NAME} logoUrl="/logos/favicon.svg" user={null} role={null} nav={[]}>{body}</StudioShellFrame>;
  if (!studio.isConfigured()) return frame(<StudioNotConfigured checks={adminSetup()} supportName={studio.config.supportName} siteName={SITE_NAME} />);
  // No query string: Supabase matches this against its Redirect URLs allow-list EXACTLY.
  const redirectTo = `${await studio.config.baseUrl()}/admin/auth/callback`;
  const { url, anonKey } = studio.config.env().identity;
  return frame(<StudioSignIn url={url} anonKey={anonKey} redirectTo={redirectTo} siteName={SITE_NAME} error={error} />);
}
