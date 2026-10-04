import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import Reveal from "../../components/Reveal";
import Eyebrow from "../../components/Eyebrow";
import BackArrow from "../../components/BackArrow";
import JsonLd from "../../components/JsonLd";
import SectionRail from "../../components/SectionRail";
import { getAllPosts, getAllSlugs, getPostBySlug } from "../../../lib/blog/posts";
import { getH2Sections } from "../../../lib/blog/headings";
import { formatPostDate, readingTimeMinutes } from "../../../lib/blog/format";
import { SITE_URL, SITE_NAME, OG_IMAGE_PATH } from "../../../lib/site-config";
import { breadcrumbJsonLd } from "../../../lib/seo";
import mdxComponents from "../mdx-components";

/** Up to `limit` other posts, ranked by shared tags (most overlap first), newest as the tiebreak. */
function relatedPosts(slug: string, tags: string[], limit = 2) {
  const tagSet = new Set(tags);
  return getAllPosts()
    .filter((p) => p.frontmatter.slug !== slug)
    .map((p) => ({ p, overlap: p.frontmatter.tags.filter((t) => tagSet.has(t)).length }))
    .sort((a, b) => b.overlap - a.overlap || b.p.frontmatter.publishedAt.getTime() - a.p.frontmatter.publishedAt.getTime())
    .slice(0, limit)
    .map((x) => x.p);
}

/** Resolve a frontmatter path/URL to an absolute URL (leaves absolute URLs as-is). */
function toAbsoluteUrl(pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

// Static generation: one prerendered page per slug; unknown slugs 404.
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}
export const dynamicParams = false;

// Per-post metadata: title + description from frontmatter, canonical (respecting
// a `canonical` frontmatter override), and OG/Twitter using the post's own hero
// (ogImage override → heroImage) as an absolute image. focusKeyword feeds SEO QA
// only — never a meta keywords tag.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const f = post.frontmatter;
  const pageTitle = f.seoTitle ?? f.title;
  const canonical = f.canonical ?? `/blog/${slug}`;
  const ogImagePath = f.ogImage ?? f.heroImage;
  const images = ogImagePath ? [toAbsoluteUrl(ogImagePath)] : undefined;

  return {
    title: `${pageTitle} — ${SITE_NAME}`,
    description: f.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: pageTitle,
      description: f.description,
      url: canonical,
      publishedTime: f.publishedAt.toISOString(),
      modifiedTime: (f.updatedAt ?? f.publishedAt).toISOString(),
      authors: [f.author],
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: f.description,
      images,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { frontmatter, content } = post;
  const { publishedAt, updatedAt } = frontmatter;
  // Estimated read time (shared with the index cards so both agree).
  const readMinutes = readingTimeMinutes(content);
  // Section-nav rail (same component as the home page), driven by the post's
  // <h2>s. ids are github-slugger slugs that match the rehype-slug DOM anchors.
  // Prepend a "Top" entry that targets the article wrapper (id="top").
  const sections = [
    { id: "top", label: "Top" },
    ...getH2Sections(content),
  ];
  // Only surface "Updated" when it's genuinely newer than the publish date.
  const showUpdated = !!updatedAt && updatedAt.getTime() !== publishedAt.getTime();

  // Article structured data — dates feed dateModified; image is the post's hero.
  const canonicalUrl = toAbsoluteUrl(frontmatter.canonical ?? `/blog/${slug}`);
  const articleImage = toAbsoluteUrl(
    frontmatter.ogImage ?? frontmatter.heroImage ?? OG_IMAGE_PATH,
  );
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: publishedAt.toISOString(),
    dateModified: (updatedAt ?? publishedAt).toISOString(),
    author: {
      "@type": "Person",
      name: frontmatter.author,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logos/mark-ink.svg`,
      },
    },
    image: articleImage,
    url: canonicalUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  };

  // Breadcrumb structured data (schema only — the visible design keeps its "All writing" back-link).
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Writing", path: "/blog" },
    { name: frontmatter.title, path: `/blog/${slug}` },
  ]);

  const related = relatedPosts(slug, frontmatter.tags);

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumb} />
      <Nav />
      {sections.length > 0 && <SectionRail sections={sections} />}
      <main id="main" className="flex-1">
        {/* Constrained reading column (≈70ch) — same measure as the legal pages */}
        <article id="top" className="mx-auto max-w-(--w-prose) px-6 pb-24 pt-12 sm:pt-16">
          <Reveal>
            <Link
              href="/blog"
              className="group font-mono-label inline-flex items-center gap-2 text-sm text-slate transition-colors hover:text-ink"
            >
              <BackArrow />
              All writing
            </Link>
          </Reveal>

          <header className="mt-8 border-b border-line pb-10">
            <Reveal>
              <Eyebrow tone="signal">Writing</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="font-display mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
                {frontmatter.title}
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-label text-sm text-slate">
                <time dateTime={publishedAt.toISOString()}>
                  Published {formatPostDate(publishedAt)}
                </time>
                {showUpdated && updatedAt && (
                  <>
                    <span className="text-slate/40" aria-hidden="true">
                      ·
                    </span>
                    <time dateTime={updatedAt.toISOString()}>
                      Updated {formatPostDate(updatedAt)}
                    </time>
                  </>
                )}
                <span className="text-slate/40" aria-hidden="true">
                  ·
                </span>
                <span>{frontmatter.author}</span>
                <span className="text-slate/40" aria-hidden="true">
                  ·
                </span>
                <span className="rounded-full bg-signal/10 px-2.5 py-0.5 text-xs text-signal-strong">
                  {readMinutes} min read
                </span>
              </div>
            </Reveal>
          </header>

          {frontmatter.heroImage && (
            <Reveal delay={160}>
              <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-bone-2">
                {/* Image Law: next/image + real alt from heroImageAlt. 1400×788
                    matches the 16:9 hero convention; priority because it's the
                    LCP element on a post. */}
                <Image
                  src={frontmatter.heroImage}
                  alt={frontmatter.heroImageAlt ?? ""}
                  width={1400}
                  height={788}
                  sizes="(max-width: 960px) 100vw, 896px"
                  priority
                  className="block h-auto w-full"
                />
              </div>
            </Reveal>
          )}

          {/* The article body is NOT wrapped in <Reveal>: a single reveal around
              the full long-form body relies on an IntersectionObserver ratio
              threshold that very tall posts can never reach, leaving the text
              stuck at opacity:0. Long-form reading content renders immediately. */}
          <div className="blog-prose mt-12">
            <MDXRemote
              source={content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeSlug],
                },
              }}
            />
          </div>

          {related.length > 0 && (
            <section className="mt-16 border-t border-line pt-10">
              <h2 className="font-mono-label text-sm text-slate">Keep reading</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.frontmatter.slug}
                    href={`/blog/${r.frontmatter.slug}`}
                    className="group block rounded-2xl border border-line p-5 transition-colors hover:border-slate/50"
                  >
                    <h3 className="font-display text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-signal-strong">
                      {r.frontmatter.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate">
                      {r.frontmatter.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-16 border-t border-line pt-8">
            <Link
              href="/blog"
              className="group font-mono-label inline-flex items-center gap-2 text-sm text-slate transition-colors hover:text-ink"
            >
              <BackArrow />
              Back to all writing
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
