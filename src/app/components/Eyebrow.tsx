/** Mono eyebrow label with a leading hairline tick — the "data/measurement"
 * voice used across sections. Shared by the homepage and subpages. */
export default function Eyebrow({
  children,
  tone = "slate",
  align = "start",
}: {
  children: React.ReactNode;
  tone?: "slate" | "signal" | "bone";
  /** Horizontal alignment of the tick+label row. Use "center" inside centered heroes. */
  align?: "start" | "center";
}) {
  const color =
    tone === "signal"
      ? "text-signal"
      : tone === "bone"
        ? "text-bone/55"
        : "text-slate";
  const justify = align === "center" ? "justify-center" : "justify-start";
  return (
    <div className={`eyebrow flex items-center gap-2.5 ${justify} ${color}`}>
      <span className="h-px w-6 bg-current opacity-50" aria-hidden="true" />
      {children}
    </div>
  );
}
