import Link from "next/link";
import Image from "next/image";
import Reveal from "../Reveal";
import ForwardArrow from "../ForwardArrow";

export type PostCard = { slug: string; title: string; excerpt: string; heroImage: string; heroImageAlt: string; publishedAt: string };

/** The latest three from the Spotlight. */
export default function LatestPosts({ posts }: { posts: PostCard[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="lp" aria-labelledby="lp-h">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="up__head">
            <div>
              <p className="page-head__eyebrow">From the Spotlight</p>
              <h2 id="lp-h" className="up__h">Notes from the building.</h2>
            </div>
            <Link href="/blog" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">All posts<ForwardArrow /></Link>
          </div>
        </Reveal>
        <div className="lp__grid">
          {posts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 60}>
              <article className="lp__card">
                <Link href={`/blog/${p.slug}`} className="lp__photo" aria-label={p.title}>
                  <Image src={p.heroImage} alt={p.heroImageAlt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                </Link>
                <p className="lp__date">{new Date(p.publishedAt + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                <h3 className="lp__title"><Link href={`/blog/${p.slug}`}>{p.title}</Link></h3>
                <p className="lp__ex">{p.excerpt}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
