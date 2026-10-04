import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site-config";

/**
 * robots.txt — Next 16 file convention (app/robots.ts).
 * Permissive: allow all crawlers, point to the sitemap on the production domain.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
