import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import Eyebrow from "../components/Eyebrow";
import { formatPostDateShort, readingTimeMinutes } from "../../lib/blog/format";
import { getPostsForPage, totalBlogPages } from "../../lib/blog/pagination";
import BlogFilter, { type BlogCard } from "./BlogFilter";
import Pagination from "./Pagination";

/**
 * The shared archive renderer. /blog renders page 1; /blog/page/[page] renders
 * the rest — both through this component so header, cards and pager can never
 * drift apart.
 *
 * The tag filter (BlogFilter) scopes to the CURRENT page's posts, not the whole
 * archive — a deliberate tradeoff: the pager must be real server links for
 * crawlability, so the client filter only ever holds one page of cards. If a
 * site leans hard on tags, raise POSTS_PER_PAGE (lib/blog/pagination.ts) or
 * build tag pages; don't quietly ship the filter as if it searched everything.
 */
export default function BlogArchive({ page }: { page: number }) {
  const totalPages = totalBlogPages();

  const cards: BlogCard[] = getPostsForPage(page).map(
    ({ frontmatter: f, content }) => ({
      slug: f.slug,
      title: f.title,
      excerpt: f.excerpt,
      description: f.description,
      featured: f.featured ?? false,
      heroImage: f.heroImage ?? null,
      tags: f.tags ?? [],
      dateLabel: formatPostDateShort(f.publishedAt),
      readMinutes: readingTimeMinutes(content),
    }),
  );

  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28 lg:pt-32">
            {/* section header — same eyebrow → heading → lede rhythm as the site */}
            <div className="max-w-3xl">
              <Reveal>
                <Eyebrow tone="signal">Writing</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-display mt-6 text-pretty text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
                  Notes from the build.
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate">
                  Essays on AI, systems, and owning what you build — written from
                  the work, not the sidelines.
                </p>
              </Reveal>
            </div>

            {cards.length === 0 ? (
              <p className="font-mono-label mt-16 text-sm text-slate">
                No posts yet — check back soon.
              </p>
            ) : (
              <BlogFilter posts={cards} />
            )}

            <Pagination page={page} totalPages={totalPages} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
