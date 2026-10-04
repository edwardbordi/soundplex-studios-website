"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "../components/Reveal";
import ForwardArrow from "../components/ForwardArrow";

// Lightweight, fully-serializable card shape passed from the server page. We map
// the loader's posts down to just what the index renders (no MDX body, no Date
// objects) — keeps the client payload small and avoids serialization quirks.
export type BlogCard = {
  slug: string;
  title: string;
  excerpt: string;
  /** Longer/meta description — featured cards prefer whichever is more complete. */
  description: string;
  featured: boolean;
  heroImage: string | null;
  tags: string[];
  dateLabel: string;
  readMinutes: number;
};

// Four-corner registration ticks — the brand framing motif, signal-blue at the
// same strength used on the homepage testimonial cards.
const CORNER_TICKS = [
  "left-3.5 top-3.5 border-l border-t",
  "right-3.5 top-3.5 border-r border-t",
  "bottom-3.5 left-3.5 border-b border-l",
  "bottom-3.5 right-3.5 border-b border-r",
];

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`font-mono-label inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-signal bg-signal/10 text-signal-strong"
          : "border-line text-slate hover:border-slate/40 hover:text-ink"
      }`}
    >
      {label}
      <span className={active ? "text-signal/60" : "text-slate/40"}>{count}</span>
    </button>
  );
}

/**
 * One index card. Same design language at both sizes; `featured` just bumps the
 * title up a step and shows the longer blurb. The 2-column span for featured
 * cards is handled by the grid wrapper, not here.
 */
function PostCard({
  post,
  index,
  featured = false,
}: {
  post: BlogCard;
  index: number;
  featured?: boolean;
}) {
  // Featured cards use the more complete of description/excerpt; normal cards
  // keep the short excerpt.
  const blurb =
    featured && post.description.length > post.excerpt.length
      ? post.description
      : post.excerpt;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-colors hover:border-slate/40"
    >
      {CORNER_TICKS.map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={`pointer-events-none absolute z-10 h-2.5 w-2.5 border-signal/40 ${pos}`}
        />
      ))}

      {post.heroImage && (
        <div className="relative aspect-video w-full overflow-hidden border-b border-line bg-bone-2">
          {/* Image Law: next/image, not raw <img>. alt="" is correct HERE —
              the card's title/blurb already describe the destination, so the
              thumbnail is decorative; the post page's hero carries the real
              heroImageAlt. */}
          <Image
            src={post.heroImage}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
          {featured && (
            <span className="font-mono-label absolute left-6 top-6 z-20 rounded-full bg-signal px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-paper shadow-sm">
              Featured
            </span>
          )}
        </div>
      )}

      <div className="flex h-full flex-col p-8">
        <div className="flex items-baseline justify-between gap-3">
          <span className="eyebrow text-signal">
            <span className="whitespace-nowrap">{post.dateLabel}</span>{" "}
            <span className="whitespace-nowrap">· {post.readMinutes} min</span>
          </span>
          <span className="font-mono-label shrink-0 text-xs text-slate/40">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <h2
          className={`font-display mt-5 font-semibold leading-snug tracking-tight text-ink ${
            featured ? "text-3xl sm:text-4xl" : "text-2xl"
          }`}
        >
          {post.title}
        </h2>

        <p className="mt-3 text-base leading-relaxed text-slate">{blurb}</p>

        {post.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="font-mono-label text-xs text-slate/60">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-8">
          <span className="font-mono-label inline-flex items-center gap-2 text-sm text-ink">
            Read
            <ForwardArrow />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogFilter({ posts }: { posts: BlogCard[] }) {
  // null = "All". Single-select.
  const [selected, setSelected] = useState<string | null>(null);

  // Unique tags derived dynamically from the posts (with counts), sorted — so
  // new tags appear automatically as posts are added; nothing is hardcoded.
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  const visible = useMemo(
    () => (selected ? posts.filter((p) => p.tags.includes(selected)) : posts),
    [posts, selected],
  );

  // Featured posts sort to the front (then newest-first within each group);
  // every visible post appears exactly once. Featured cards span 2 columns.
  const ordered = useMemo(
    () => [
      ...visible.filter((p) => p.featured),
      ...visible.filter((p) => !p.featured),
    ],
    [visible],
  );

  // Clicking the active tag again clears the filter (back to "All").
  const toggle = (tag: string) =>
    setSelected((current) => (current === tag ? null : tag));

  return (
    <>
      <div
        className="mt-12 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter posts by tag"
      >
        <FilterChip
          label="All"
          count={posts.length}
          active={selected === null}
          onClick={() => setSelected(null)}
        />
        {tags.map(({ tag, count }) => (
          <FilterChip
            key={tag}
            label={`#${tag}`}
            count={count}
            active={selected === tag}
            onClick={() => toggle(tag)}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="font-mono-label mt-12 text-sm text-slate">
          No posts{selected ? ` tagged #${selected}` : ""} yet.
        </p>
      ) : (
        // One grid, featured-first. Featured cards span 2 of the 3 lg columns
        // (full row on sm, full width on mobile), so a regular card fills the
        // 3rd column of the featured row. `ordered` is each post exactly once.
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((post, i) => (
            <Reveal
              key={post.slug}
              delay={i * 60}
              className={post.featured ? "self-start sm:col-span-2" : undefined}
            >
              <PostCard post={post} index={i} featured={post.featured} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
