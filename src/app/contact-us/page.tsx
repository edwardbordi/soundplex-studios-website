import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import OutboundArrow from "../components/OutboundArrow";
import JsonLd from "../components/JsonLd";
import ContactForm from "../components/widgets/ContactForm";
import GoogleReviews from "../components/widgets/GoogleReviews";
import TourCalendar from "../components/widgets/TourCalendar";
import { buildPageMetadata, breadcrumbJsonLd } from "../../lib/seo";
import { SITE_NAME, LOCATION, PHONE_DISPLAY, PHONE_TEL, CONTACT_EMAIL } from "../../lib/site-config";

/** /contact-us — the live site's URL. Form → GHL, map, hours, parking, the tour calendar, reviews. */
export const metadata = buildPageMetadata({
  title: `Contact & visit — ${SITE_NAME}, Pennsauken, NJ`,
  description: "Find SoundPlex at 6713 Rudderow Ave, Pennsauken, NJ. Hours, parking, a map, and a form that goes straight to George. Or book a tour and come see the place.",
  path: "/contact-us",
  focusKeyword: "SoundPlex Studios contact",
});

const MAPS = `https://maps.google.com/?q=${encodeURIComponent(`${SITE_NAME} ${LOCATION}`)}`;
const EMBED = "https://maps.google.com/maps?q=6713%20Rudderow%20Ave%2C%20Pennsauken%20Township%2C%20NJ%2008109&t=m&z=14&output=embed&iwloc=near";

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="page-head">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal eager><p className="page-head__eyebrow">Contact · Visit</p></Reveal>
            <Reveal eager delay={80}><h1 className="page-head__title">Say hi. <em>Or just come by.</em></h1></Reveal>
            <Reveal eager delay={160}><p className="page-head__lede">A question, an idea, a date you’re holding — drop it below and George reads it himself. If you’d rather see the place, book a tour; it’s on us.</p></Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="ct__grid">
            <Reveal><ContactForm /></Reveal>
            <Reveal delay={80}>
              <aside className="ct__facts">
                <div className="ct__fact">
                  <p className="page-head__eyebrow">Visit</p>
                  <a href={MAPS} target="_blank" rel="noopener noreferrer" className="ct__link group">{LOCATION}<OutboundArrow /></a>
                </div>
                <div className="ct__fact">
                  <p className="page-head__eyebrow">Hours</p>
                  <p>Monday to Saturday, 8 AM – 10 PM</p>
                  <p className="ct__muted">Show nights run later — check the event.</p>
                </div>
                <div className="ct__fact">
                  <p className="page-head__eyebrow">Call or text</p>
                  <a href={`tel:${PHONE_TEL}`} className="ct__link">{PHONE_DISPLAY}</a>
                  {CONTACT_EMAIL && <a href={`mailto:${CONTACT_EMAIL}`} className="ct__link">{CONTACT_EMAIL}</a>}
                </div>
                <div className="ct__fact">
                  <p className="page-head__eyebrow">Parking</p>
                  <p>On-site behind and alongside the building, plus street parking. Overflow at Pinsetter Bar &amp; Bowl, a two-minute walk east, and the Merchantville Walkway lot — a well-lit five-minute walk that lands at our back entrance.</p>
                </div>
              </aside>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <Reveal>
            <div className="ct__map">
              <iframe src={EMBED} title="Map to SoundPlex Studios" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <TourCalendar lead="Book a complimentary tour" />
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <GoogleReviews />
        </section>
      </main>
      <Footer />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact-us" }])} />
    </>
  );
}
