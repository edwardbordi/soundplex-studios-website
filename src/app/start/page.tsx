import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Survey from "../components/widgets/Survey";
import { buildPageMetadata } from "../../lib/seo";
import { SITE_NAME } from "../../lib/site-config";
import { ROOMS } from "../../lib/survey/flow";

/**
 * /start — the one front door. Every CTA on the site lands here. The survey opens on its
 * own question; there is no masthead, because on a phone a masthead pushes the first
 * answer below the fold. noindex: it's a funnel, not a page to rank.
 * `?path=room&room=wood-room` pre-selects (see lib/survey/flow.ts).
 */
export const metadata = buildPageMetadata({
  title: `Start here — ${SITE_NAME}`,
  description: "Rent a room, come to a show, join the Plex Collective, make something, or get a website built. Tell us what brings you to SoundPlex and we'll take it from there.",
  path: "/start",
  focusKeyword: "soundplex start",
  noindex: true,
});

export default async function StartPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const initialAnswers: Record<string, string> = {};
  if (params.room && ROOMS.some((r) => r.value === params.room)) initialAnswers.room = params.room;
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <h1 className="sr-only">Start here — what brings you to SoundPlex?</h1>
        <Survey initialPath={params.path} initialAnswers={initialAnswers} entry={params.from} />
      </main>
      <Footer />
    </>
  );
}
