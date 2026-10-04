import { StudioHelp } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";

/** Help centre — placeholder until ADMIN-05c. */
export default async function HelpPage() {
  await studio.requireAdmin();
  return <StudioHelp />;
}
