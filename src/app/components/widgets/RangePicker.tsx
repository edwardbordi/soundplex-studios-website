"use client";

/**
 * The survey's number picker (Ed, 2026-10-28, option C): a big number with its unit, a gold
 * slider underneath, and five tick labels — the last one "80 · full" when it's a room's
 * capacity. The number itself is an input, so an exact figure can be typed (and can go past
 * the slider's end; George would rather hear "95" than have it clipped).
 *
 * Built on a real <input type="range"> so keyboard, touch and screen readers all work.
 * Value in and out is a string ("" = not answered yet, shown dimmed at `start`).
 */
export default function RangePicker({
  value, onChange, onEnter, unit, one, min = 1, max, step = 1, start, fullLabel, label,
}: {
  value: string; onChange: (v: string) => void; onEnter: () => void;
  unit: string; one?: string; min?: number; max: number; step?: number; start: number;
  /** Shown after the last tick: "full" for a room's capacity. */
  fullLabel?: string;
  label: string;
}) {
  const n = Number(value);
  const has = value !== "" && Number.isFinite(n);
  const shown = has ? n : start;
  const pct = Math.max(0, Math.min(100, ((Math.min(shown, max) - min) / (max - min)) * 100));
  const ticks = [min, ...[1, 2, 3].map((i) => Math.round((max * i) / 4)), max];

  return (
    <div className="rp">
      <div className={`rp__readout${has ? "" : " is-empty"}`}>
        <input
          className="rp__num"
          type="text"
          inputMode="decimal"
          maxLength={5}
          aria-label={`${label} — type a number`}
          value={has ? value : ""}
          placeholder={String(start)}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
          style={{ width: `${Math.max(2, String(has ? value : start).length) + 0.4}ch` }}
        />
        <span className="rp__unit">{shown === 1 ? (one ?? unit.replace(/s$/, "")) : unit}</span>
        {has && n > max && fullLabel && <span className="rp__over">more than the room holds — we’ll talk options</span>}
      </div>
      <input
        className="rp__range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(shown, max)}
        aria-label={label}
        aria-valuetext={`${shown} ${shown === 1 ? (one ?? unit) : unit}`}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
        style={{ ["--rp-pct" as string]: `${pct}%` }}
      />
      <div className="rp__ticks" aria-hidden>
        {ticks.map((t, i) => (
          <span key={i}>{i === ticks.length - 1 && fullLabel ? `${t} · ${fullLabel}` : t}</span>
        ))}
      </div>
      {!has && <p className="rp__hint">Slide, or tap the number to type it.</p>}
    </div>
  );
}
