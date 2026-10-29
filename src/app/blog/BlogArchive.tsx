import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import Eyebrow from "../components/Eyebrow";
import { formatPostDateShort, readingTimeMinutes } from "../../lib/blog/format";
import { getPostsForPage, totalBlogPages } from "../../lib/blog/pagination";
import { getAllPosts } from "../../lib/blog/posts";
import BlogFilter, { type BlogCard } from "./BlogFilter";
import Pagination from "./Pagination";

/**
 * The shared archive renderer. /blog renders page 1; /blog/page/[page] renders
 * the rest — both through this component so header, cards and pager can never
 * drift apart.
 *
 * The tag filter (BlogFilter) gets every post: its counts are archive-wide and a tag shows all
 * its posts (Ed, 2026-10-28). "All" stays the paged list, so the pager remains real server
 * links for crawlability.
 */
export default function BlogArchive({ page }: { page: number }) {
  const totalPages = totalBlogPages();

  const toCard = ({ frontmatter: f, content }: ReturnType<typeof getAllPosts>[number]): BlogCard => ({
      slug: f.slug,
      title: f.title,
      excerpt: f.excerpt,
      description: f.description,
      featured: f.featured ?? false,
      heroImage: f.heroImage ?? null,
      tags: f.tags ?? [],
      dateLabel: formatPostDateShort(f.publishedAt),
      readMinutes: readingTimeMinutes(content),
  });
  const cards: BlogCard[] = getPostsForPage(page).map(toCard);
  // Every post, newest first — the filter's counts and tag results cover the whole archive.
  const allCards: BlogCard[] = getAllPosts()
    .slice()
    .sort((a, b) => b.frontmatter.publishedAt.getTime() - a.frontmatter.publishedAt.getTime())
    .map(toCard);

  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28 lg:pt-32">
            {/* section header — same eyebrow → heading → lede rhythm as the site */}
            <div className="max-w-3xl">
              <Reveal>
                <Eyebrow tone="signal">From the Spotlight</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-display mt-6 text-pretty text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
                  Notes from the building.
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate">
                  Recording and podcast how-tos, the rooms, the building’s history, and what’s been
                  happening at SoundPlex.
                </p>
              </Reveal>
            </div>

            {cards.length === 0 ? (
              <p className="font-mono-label mt-16 text-sm text-slate">
                No posts yet — check back soon.
              </p>
            ) : (
              <BlogFilter posts={cards} all={allCards} />
            )}

            <Pagination page={page} totalPages={totalPages} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
