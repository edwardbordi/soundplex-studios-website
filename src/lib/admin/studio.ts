import "server-only";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createStudio } from "@realiizlabs/admin/studio";
import { SITE_NAME, SITE_TIMEZONE } from "../site-config";
import { contentTypes, PUBLIC_URLS } from "./content-types";
import { adminConfigured, brokerConfig, deployHookUrl, identityPublicConfig, repoConfig, serviceConfig, siteId } from "./env";

/**
 * The one place this site's Studio is assembled. Everything the package cannot
 * know arrives as functions, read per request — so `next build` with no env set
 * still succeeds (BUILD-ENV law) and server-only keys never leave env.ts.
 */
export const studio = createStudio({
  contentTypes,
  publicUrls: PUBLIC_URLS,
  env: () => ({ siteId: siteId(), repo: repoConfig(), identity: identityPublicConfig(), broker: brokerConfig(), service: serviceConfig(), deployHookUrl: deployHookUrl() }),
  isConfigured: adminConfigured,
  cookies: () => cookies(),
  baseUrl: async () => {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    return `${proto}://${host}`;
  },
  revalidate: revalidatePath,
  siteName: SITE_NAME,
  supportName: "your web team",
  timezone: SITE_TIMEZONE,
});
