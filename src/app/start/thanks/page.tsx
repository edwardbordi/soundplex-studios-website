import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import TourCalendar from "../../components/widgets/TourCalendar";
import ForwardArrow from "../../components/ForwardArrow";
import { buildPageMetadata } from "../../../lib/seo";
import { SITE_NAME } from "../../../lib/site-config";
import { pathById } from "../../../lib/survey/flow";

/** The survey's landing. A real route (not a state) so analytics can count it. noindex. */
export const metadata = buildPageMetadata({
  title: `Thanks — ${SITE_NAME}`,
  description: "We've got it. Here's what happens next.",
  path: "/start/thanks",
  focusKeyword: "soundplex thanks",
  noindex: true,
});

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ path?: string; name?: string }> }) {
  const { path, name } = await searchParams;
  const p = pathById(path);
  const first = (name ?? "").trim().slice(0, 40);
  const title = p?.thanks.title ?? "Got it.";
  const body = p?.thanks.body ?? "We’ll be in touch shortly.";
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="thanks">
          <div className="mx-auto max-w-3xl px-6">
            <p className="thanks__eyebrow">{first ? `Thanks, ${first}.` : "Thanks."}</p>
            <h1 className="thanks__title">{title}</h1>
            <p className="thanks__body">{body}</p>
            {p?.id === "attend" && (
              <Link href="/studio-productions" className="card-cta group mt-6 inline-flex items-center gap-2 whitespace-nowrap">
                See what’s on<ForwardArrow />
              </Link>
            )}
          </div>
        </section>
        {(p?.thanks.calendar ?? true) && (
          <div className="mx-auto max-w-3xl px-6 pb-24">
            <TourCalendar lead={p?.thanks.calendarLead ?? "Book a tour"} />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
