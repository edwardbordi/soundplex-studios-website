import HomeView from "./components/HomeView";
import { buildPageMetadata } from "../lib/seo";
import { SITE_NAME, SITE_DESCRIPTION } from "../lib/site-config";

export const metadata = buildPageMetadata({
  title: `${SITE_NAME} — Recording, Podcast & Live Event Studios in Pennsauken, NJ`,
  description: SITE_DESCRIPTION,
  path: "/",
  focusKeyword: "recording studio Pennsauken NJ",
});

/**
 * Home: version C, the fly-through in through the front doors (Ed, 2026-10-29: the default now).
 * Previews: A (the room fills on its own) at /home-a, B (fills as you scroll) at /home-b.
 * ?night= picks the fly-through's night (only the ready ones are offered).
 */
export default async function Home({ searchParams }: { searchParams: Promise<{ night?: string }> }) {
  const { night } = await searchParams;
  return <HomeView hero="flythrough" night={night} />;
}
