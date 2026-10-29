import HomeView from "../components/HomeView";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME, SITE_DESCRIPTION } from "../../lib/site-config";

/**
 * PREVIEW ONLY (Ed, 2026-10-29): home version B, where the room fills as you scroll. George
 * flips between A (/) and B with the Preview switch. Not indexed, not in the sitemap.
 * Once a version is picked: delete this route and the loser in HomeView, and empty
 * PREVIEW_VARIANTS in site-config.
 */
export const metadata = buildPageMetadata({
  title: `${SITE_NAME} — Recording, Podcast & Live Event Studios in Pennsauken, NJ`,
  description: SITE_DESCRIPTION,
  path: "/home-b",
  focusKeyword: "recording studio Pennsauken NJ",
  noindex: true,
});

export default function HomeB() {
  return <HomeView hero="scroll" />;
}
