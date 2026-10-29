import HomeView from "./components/HomeView";
import { buildPageMetadata } from "../lib/seo";
import { SITE_NAME, SITE_DESCRIPTION } from "../lib/site-config";

export const metadata = buildPageMetadata({
  title: `${SITE_NAME} — Recording, Podcast & Live Event Studios in Pennsauken, NJ`,
  description: SITE_DESCRIPTION,
  path: "/",
  focusKeyword: "recording studio Pennsauken NJ",
});

/** Home, version A: the room fills on its own. (Version B, filling as you scroll: /home-b.) */
export default function Home() {
  return <HomeView hero="fill" />;
}
