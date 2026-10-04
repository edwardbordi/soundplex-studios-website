import Reveal from "../Reveal";

// Reusable review / testimonial widget. Pass items via props and drop it into any page
// (home, services, a landing page…). Build once, reuse everywhere.
export interface Testimonial {
  quote: string;
  name: string;
  role?: string;
}

export default function Testimonials({
  heading = "What clients say",
  items,
}: {
  heading?: string;
  items: Testimonial[];
}) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="font-display text-center text-2xl font-semibold text-ink">{heading}</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <Reveal key={i}>
            <figure className="h-full rounded-2xl border border-line p-6">
              <blockquote className="text-sm leading-relaxed text-ink">“{t.quote}”</blockquote>
              <figcaption className="mt-4 text-xs text-slate">
                {t.name}
                {t.role ? ` · ${t.role}` : ""}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
