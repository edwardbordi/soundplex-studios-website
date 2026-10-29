import RunOnView from "../RunOnView";

/**
 * "Ideas become collaborations → Collaborations become visibility → Visibility becomes
 * opportunity" (George's line, /membership) as a chain that RUNS when it scrolls into view —
 * the stepper from the Surveillance Review home, in SoundPlex gold (Ed, 2026-10-28).
 *
 * Premium pass (Ed picked 1 + 3 + 5): the chain GROWS — grey and small at Ideas, bigger and
 * brighter gold at each step, solid gold at Opportunity; a soft glow blooms behind Opportunity
 * once the run lands and keeps breathing; and the section is a centered statement, the line
 * fading out at both ends, George's motto underneath. Timings in globals.css (.ch).
 * Under reduced motion: the finished chain, glow on, nothing moving.
 */
const STOPS = [
  { word: "Ideas", color: "#77736c", size: 16 },
  { word: "Collaborations", color: "#a8822f", size: 20 },
  { word: "Visibility", color: "#d4a030", size: 25 },
  { word: "Opportunity", color: "#ffd27a", size: 31 },
];
const VERBS = ["become", "become", "becomes"];

export default function ChainRun() {
  return (
    <RunOnView className="ch">
      <p className="sr-only">Ideas become collaborations. Collaborations become visibility. Visibility becomes opportunity.</p>
      <ol className="ch__list" aria-hidden>
        <li className="ch__lead ch__lead--in" style={{ ["--to" as string]: STOPS[0].color }} />
        <li className="ch__lead ch__lead--out" style={{ ["--from" as string]: STOPS[3].color }} />
        {VERBS.map((v, i) => (
          // The line segments only: the "become" labels over the line were dropped (Ed,
          // 2026-10-29: obvious from the line, and they looked cluttered). The screen-reader
          // sentence above still says "become".
          <li key={`seg${i}-${v}`} className="ch__seg" style={{ ["--i" as string]: i, ["--from" as string]: STOPS[i].color, ["--to" as string]: STOPS[i + 1].color }} />
        ))}
        {STOPS.map((s, i) => (
          <li
            key={s.word}
            className={`ch__stop${i === STOPS.length - 1 ? " is-last" : ""}${i === 0 ? " is-first" : ""}`}
            style={{ ["--i" as string]: i, ["--c" as string]: s.color, ["--size" as string]: `${s.size}px` }}
          >
            {i === STOPS.length - 1 && <span className="ch__glow" />}
            <span className="ch__nodebox"><span className="ch__node"><span className="ch__ring" /><span className="ch__dot" /></span></span>
            <span className="ch__word">{s.word}</span>
          </li>
        ))}
      </ol>
      {/* Two lines on purpose, the first one bigger (Ed): the setup, then the payoff. */}
      <p className="ch__motto">
        <span className="ch__motto-1">The environment sparks it. The team shapes it.</span>
        <span className="ch__motto-2">The blueprint directs it. <em>The result is opportunity.</em></span>
      </p>
    </RunOnView>
  );
}
