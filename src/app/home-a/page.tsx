import HomeView from "../components/HomeView";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME, SITE_DESCRIPTION } from "../../lib/site-config";

/**
 * PREVIEW ONLY (Ed, 2026-10-29): home version A, where the room fills on its own. The default
 * home (/) is version B, filling as you scroll. George flips between them with the Preview
 * switch. Not indexed, not in the sitemap. Once a version is picked: delete this route and the
 * loser in HomeView, and empty PREVIEW_VARIANTS in site-config.
 */
export const metadata = buildPageMetadata({
  title: `${SITE_NAME} — Recording, Podcast & Live Event Studios in Pennsauken, NJ`,
  description: SITE_DESCRIPTION,
  path: "/home-a",
  focusKeyword: "recording studio Pennsauken NJ",
  noindex: true,
});

export default function HomeA() {
  return <HomeView hero="fill" />;
}
