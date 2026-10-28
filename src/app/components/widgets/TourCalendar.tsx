import { PHONE_DISPLAY, PHONE_TEL } from "../../../lib/site-config";

/**
 * George's tour calendar — a GoHighLevel calendar embed, by id from
 * NEXT_PUBLIC_TOUR_CALENDAR_ID (public by nature; see .env.example). Until the id is set
 * it degrades to the phone number, so the thank-you page is never a dead end.
 */
export default function TourCalendar({ lead = "Book a tour" }: { lead?: string }) {
  const id = process.env.NEXT_PUBLIC_TOUR_CALENDAR_ID;
  return (
    <section className="cal" aria-labelledby="cal-title">
      <p className="cal__eyebrow">{lead}</p>
      {id ? (
        <>
          <h2 id="cal-title" className="cal__title">Pick a time that suits you.</h2>
          <div className="cal__frame">
            <iframe
              src={`https://api.leadconnectorhq.com/widget/booking/${id}`}
              title="Book a tour of SoundPlex"
              loading="lazy"
              scrolling="no"
              style={{ width: "100%", border: "none", minHeight: 700 }}
            />
          </div>
        </>
      ) : (
        <>
          <h2 id="cal-title" className="cal__title">Call or text and we’ll find a time.</h2>
          <a href={`tel:${PHONE_TEL}`} className="cal__phone">{PHONE_DISPLAY}</a>
          <p className="cal__note">Monday to Saturday, 8 AM to 10 PM.</p>
        </>
      )}
    </section>
  );
}
