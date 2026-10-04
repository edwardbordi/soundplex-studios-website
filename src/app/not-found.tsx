import Link from "next/link";
import type { Metadata } from "next";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import ForwardArrow from "./components/ForwardArrow";
import { SITE_NAME } from "../lib/site-config";

/**
 * 404 — global, replaces Next's unstyled default.
 *
 * Deliberately short and non-apologetic: a wrong URL is a nothing event, and
 * the only useful thing a 404 can do is put the reader one click from
 * somewhere real.
 *
 * `not-found.tsx` can't export generateMetadata, so the title is static.
 * `robots: noindex` because a 404 must never accumulate in the index.
 */
export const metadata: Metadata = {
  title: `Page not found — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-start px-6 pb-32 pt-24 sm:pt-32">
          <div className="font-mono-label text-sm text-signal">404</div>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            This page doesn&apos;t exist.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate">
            Which is a shame, because plenty of other things do. Try one of
            these instead.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/"
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
            >
              Back to the homepage
            </Link>
            <Link
              href="/blog"
              className="font-mono-label group inline-flex items-center gap-2 text-sm text-ink"
            >
              Read the blog
              <ForwardArrow />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
