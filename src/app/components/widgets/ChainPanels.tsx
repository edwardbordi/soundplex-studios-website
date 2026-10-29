import Image from "next/image";
import RunOnView from "../RunOnView";

/**
 * The chain as four photo panels (Ed, 2026-10-29, option B; home version C only): each step of
 * Ideas → Collaborations → Visibility → Opportunity gets a tall photo from the building, a
 * number, the word, and George's line for it. Side by side on desktop, a swipe row on phones.
 * The other home versions keep the gold line with dots (ChainRun).
 *
 * Animated (Ed: "animate the border around one card at a time, and pulse the last one"): when
 * the row scrolls into view, a gold line draws around card 1, then 2, then 3 — each photo
 * brightening as its border arrives, each border settling to a faint gold — and finally around
 * Opportunity, which keeps its border and breathes a soft gold glow. CSS in globals.css (.cp).
 * Reduced motion: the finished state, no movement.
 */
const STEPS = [
  { n: "01", word: "Ideas", line: "The environment sparks it.", img: "/flythrough/states/state-A.jpg", alt: "The WoodRoom, empty and lit, before anyone arrives" },
  { n: "02", word: "Collaborations", line: "The team shapes it.", img: "/flythrough/states/state-B-4.jpg", alt: "Three people deep in conversation on the WoodRoom floor" },
  { n: "03", word: "Visibility", line: "The blueprint directs it.", img: "/rooms/wood-room-2.webp", alt: "A guitarist mid-song on the SoundPlex stage" },
  { n: "04", word: "Opportunity", line: "The result.", img: "/flythrough/states/state-C-2.jpg", alt: "The WoodRoom full of people talking in groups" },
];

/**
 * The comet's journey (Ed, 2026-10-29: "traveling from card to card, hopping from one to the next").
 * Positions are along each card's border, 0–100, starting at the top-left corner and running
 * clockwise; on a 3:4 card the top edge is ~21 of the 100. Past 100 it carries on round (the dash
 * pattern repeats every 100), so 121 = "one more time across the top, to the top-right corner",
 * where it hops to the next card's top-left. Same speed throughout: ~100 per second.
 *   1: starts top-right, goes down the right side and round, across the top, off top-right
 *   2, 3: in at top-left, a full lap, across the top again, off top-right
 *   4: in at top-left, one lap, and it's done (same faint outline as the others; the gold word is the finish)
 */
const TAIL = 30;
const HEAD = 8;
const JOURNEY = [
  { from: 21, to: 121, start: 0, dur: 1.0 },
  { from: 0, to: 121, start: 1.0, dur: 1.2 },
  { from: 0, to: 121, start: 2.2, dur: 1.2 },
  { from: 0, to: 100, start: 3.4, dur: 1.0 },
];

export default function ChainPanels({ eyebrow }: { eyebrow?: string }) {
  return (
    <RunOnView className="cp" threshold={0.35}>
      {/* The eyebrow lives inside the run so it can go last: faint during the comet, then gold
          fills it left to right once Opportunity's border lands (Ed, 2026-10-29). */}
      {/* One sentence at a time (Ed): "Not rocket science." … a pause … "Human science." */}
      {eyebrow && (
        <p className="page-head__eyebrow">
          {eyebrow.split(/(?<=\.)\s+/).map((part, k) => (
            <span key={k} className="cp__eyebrow" style={{ ["--d" as string]: `${4.4 + k * 1.6}s` }}>
              {k > 0 && " "}
              {part}
            </span>
          ))}
        </p>
      )}
      <ol className="-mx-6 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {STEPS.map((s, i) => {
          const last = i === STEPS.length - 1;
          const j = JOURNEY[i];
          // A dash of length L whose leading end sits at position h has dashoffset L − h.
          const vars = {
            ["--i" as string]: i,
            ["--start" as string]: `${j.start}s`,
            ["--dur" as string]: `${j.dur}s`,
            ["--tail-from" as string]: TAIL - j.from,
            ["--tail-to" as string]: TAIL - j.to,
            ["--head-from" as string]: HEAD - j.from,
            ["--head-to" as string]: HEAD - j.to,
          };
          return (
            <li key={s.word} className={`relative w-[78%] shrink-0 snap-start sm:w-[46%] md:w-auto ${last ? "is-last" : ""}`} style={vars}>
              <figure className="cp__card group relative z-[1] aspect-[3/4] overflow-hidden rounded-[8px] border border-white/[0.08]">
                <Image src={s.img} alt={s.alt} fill sizes="(max-width: 768px) 78vw, 25vw" className="cp__img object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" aria-hidden />
                {/* The border that draws itself around the card. */}
                <svg className="cp__trace" aria-hidden="true">
                  {/* The resting border: a faint, full gold outline on every card, there before the
                      comet arrives and after it's gone (Ed: keep that look at start and finish). */}
                  <rect className="cp__rest" x="1" y="1" rx="7" ry="7" pathLength={100} />
                  {/* The comet: a faint tail and a brighter head. */}
                  <rect className="cp__tail" x="1" y="1" rx="7" ry="7" pathLength={100} />
                  <rect className="cp__head" x="1" y="1" rx="7" ry="7" pathLength={100} />
                </svg>
                <span className="absolute left-5 top-4 z-[3] font-[family-name:var(--font-poppins)] text-[12px] font-medium tracking-[0.22em] text-[#d4a030]">{s.n}</span>
                {/* The words wait at ~40% and light up as this card's comet finishes. */}
                <figcaption className="cp__words absolute inset-x-5 bottom-5 z-[3] text-left">
                  <span
                    className={`block leading-[1.05] ${
                      last
                        ? "font-[family-name:var(--font-lora)] text-[clamp(1.7rem,2.4vw,2.2rem)] italic text-[#e2b34e]"
                        : "font-[family-name:var(--font-poppins)] text-[clamp(1.45rem,2vw,1.85rem)] font-semibold tracking-tight text-white"
                    }`}
                  >
                    {s.word}
                  </span>
                  <span className="mt-2 block text-[14.5px] leading-snug text-white/70">{s.line}</span>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ol>
    </RunOnView>
  );
}
