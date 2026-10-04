import Link from "next/link";
import Reveal from "../Reveal";
import Eyebrow from "../Eyebrow";

// Reusable hero widget. Props-driven — never hard-code page content here. Drop it into any page.
export interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function Hero({ eyebrow, title, subtitle, ctaLabel, ctaHref }: HeroProps) {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-16 pt-24 text-center">
      {eyebrow && (
        <Reveal eager>
          <Eyebrow tone="signal" align="center">{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal eager delay={80}>
        <h1 className="font-display mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
          {title}
        </h1>
      </Reveal>
      {subtitle && (
        <Reveal eager delay={140}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate">{subtitle}</p>
        </Reveal>
      )}
      {ctaLabel && ctaHref && (
        <Reveal eager delay={200}>
          <div className="mt-8">
            <Link
              href={ctaHref}
              className="font-mono-label rounded-full bg-ink px-6 py-3 text-sm text-bone-2 transition-opacity hover:opacity-90"
            >
              {ctaLabel}
            </Link>
          </div>
        </Reveal>
      )}
    </section>
  );
}
