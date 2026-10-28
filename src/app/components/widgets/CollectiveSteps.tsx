import Link from "next/link";
import Reveal from "../Reveal";
import ForwardArrow from "../ForwardArrow";

/**
 * The Plex Collective's three-step model (COMPANY-FACTS §5 — George's words). Used as a
 * band on the home and as the spine of /membership. `compact` is the home version.
 */
export const STEPS = [
  { n: "01", name: "Membership", price: "$75 / month · 3-month minimum", line: "Access to the ecosystem.", items: ["The creative environment", "The entrepreneurial community", "Events and networking", "Local Lens opportunities", "Creative collaboration", "Discovery sessions"] },
  { n: "02", name: "The Creator Blueprint", price: "Call for pricing", line: "Turning ideas into direction.", items: ["Your story", "Your positioning", "Your audience", "Your content direction", "Your visibility strategy"] },
  { n: "03", name: "Amplify", price: "Pricing menu on your visit", line: "Bringing your story to life.", items: ["Amplify your story", "Amplify your strategy", "Amplify your content", "Amplify your exposure", "Amplify your experience"] },
];

export default function CollectiveSteps({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`cs${compact ? " cs--compact" : ""}`}>
      {STEPS.map((s, i) => (
        <Reveal key={s.n} delay={i * 80}>
          <article className="cs__step">
            <p className="cs__n">Step {s.n}</p>
            <h3 className="cs__name">{s.name}</h3>
            <p className="cs__line">{s.line}</p>
            {!compact && <ul className="cs__items">{s.items.map((x) => <li key={x}>{x}</li>)}</ul>}
            <p className="cs__price">{s.price}</p>
          </article>
        </Reveal>
      ))}
      {compact && (
        <Reveal delay={260}>
          <div className="cs__cta">
            <p className="cs__motto">The environment sparks it. The team shapes it. The blueprint directs it. <em>The result is opportunity.</em></p>
            <Link href="/start?path=collective" className="evp__btn group">Join the Collective<ForwardArrow /></Link>
            <Link href="/membership" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">How it works<ForwardArrow /></Link>
          </div>
        </Reveal>
      )}
    </div>
  );
}
