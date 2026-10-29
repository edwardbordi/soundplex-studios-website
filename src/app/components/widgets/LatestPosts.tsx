import Link from "next/link";
import ForwardArrow from "../ForwardArrow";
import PostsRail from "./PostsRail";

export type PostCard = { slug: string; title: string; excerpt: string; heroImage: string; heroImageAlt: string; publishedAt: string };

/** The latest six from the Spotlight, as a sideways row (pinned on desktop, swiped on phones). */
export default function LatestPosts({ posts }: { posts: PostCard[] }) {
  if (posts.length === 0) return null;
  const head = (
    <div className="up__head">
      <div>
        <p className="page-head__eyebrow">From the Spotlight</p>
        <h2 id="lp-h" className="up__h">Notes from the building.</h2>
      </div>
      <Link href="/blog" className="card-cta group inline-flex items-center gap-2 whitespace-nowrap">All posts<ForwardArrow /></Link>
    </div>
  );
  return (
    <section className="lp" aria-labelledby="lp-h">
      <div className="mx-auto max-w-6xl px-6">
        <PostsRail posts={posts} head={head} />
      </div>
    </section>
  );
}
