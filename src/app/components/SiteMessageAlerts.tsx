"use client";

import { usePathname } from "next/navigation";
import { membersConfigured } from "../../lib/members/env";
import { useVenueSession } from "../../lib/venue/session";
import MessageToasts from "../members/(app)/MessageToasts";

/**
 * New-message alerts on the WEBSITE (Ed, 2026-10-30: "they might have the site open but not be
 * in the members area"). Same pop-up and chime as the members area (and the same settings in
 * Settings → Privacy → Message alerts), top right under the header. Signed-in members only:
 * for visitors it renders nothing and loads nothing. The members area has its own; Studio
 * (/admin) gets none.
 */
export default function SiteMessageAlerts() {
  const path = usePathname() ?? "";
  const { member } = useVenueSession();
  if (!member || !membersConfigured() || path.startsWith("/members") || path.startsWith("/admin")) return null;
  return <MessageToasts place="site" />;
}
