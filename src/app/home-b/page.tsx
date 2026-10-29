import HomeView from "../components/HomeView";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME, SITE_DESCRIPTION } from "../../lib/site-config";

/**
 * PREVIEW ONLY (Ed, 2026-10-29): home version B, where the room fills as you scroll. The default
 * home (/) is version C, the fly-through. Not indexed, not in the sitemap. Delete with the other
 * preview once George picks.
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
