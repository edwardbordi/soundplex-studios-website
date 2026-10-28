import Reveal from "../Reveal";

/**
 * Google reviews, server-side via the Places API. Reads GOOGLE_PLACES_API_KEY and
 * GOOGLE_PLACE_ID lazily (BUILD-ENV law); renders nothing when either is missing or the
 * call fails. Cached by Next's fetch cache for a day. No Google JS reaches the browser.
 */
type Review = { author_name: string; rating: number; text: string; relative_time_description: string };

async function fetchReviews(): Promise<{ rating?: number; total?: number; reviews: Review[] } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const place = process.env.GOOGLE_PLACE_ID;
  if (!key || !place) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place)}&fields=rating,user_ratings_total,reviews&reviews_sort=newest&key=${key}`;
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) return null;
    const j = (await r.json()) as { result?: { rating?: number; user_ratings_total?: number; reviews?: Review[] } };
    const res = j.result;
    if (!res) return null;
    return { rating: res.rating, total: res.user_ratings_total, reviews: (res.reviews ?? []).filter((x) => x.rating >= 4 && x.text).slice(0, 6) };
  } catch {
    return null;
  }
}

export default async function GoogleReviews() {
  const data = await fetchReviews();
  if (!data || data.reviews.length === 0) return null;
  return (
    <section className="gr" aria-labelledby="gr-h">
      <Reveal>
        <p className="page-head__eyebrow">On Google</p>
        <h2 id="gr-h" className="gr__h">
          {data.rating ? `${data.rating.toFixed(1)} out of 5` : "What people say"}
          {data.total ? <span className="gr__total"> · {data.total} reviews</span> : null}
        </h2>
      </Reveal>
      <ul className="gr__list">
        {data.reviews.map((rv, i) => (
          <li key={i}>
            <Reveal delay={i * 60}>
              <blockquote className="gr__card">
                <p className="gr__stars" aria-label={`${rv.rating} stars`}>{"★".repeat(rv.rating)}</p>
                <p className="gr__text">{rv.text.length > 280 ? rv.text.slice(0, 277).trimEnd() + "…" : rv.text}</p>
                <footer className="gr__who">{rv.author_name} · {rv.relative_time_description}</footer>
              </blockquote>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
