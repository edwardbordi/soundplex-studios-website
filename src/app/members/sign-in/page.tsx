import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import SignInForm from "./SignInForm";
import { buildPageMetadata } from "../../../lib/seo";
import { SITE_NAME } from "../../../lib/site-config";

export const metadata = buildPageMetadata({
  title: `Member sign-in — ${SITE_NAME}`,
  description: "Sign in to the Plex Collective members’ side of SoundPlex Studios.",
  path: "/members/sign-in",
  focusKeyword: "soundplex member sign in",
  noindex: true,
});

/** /members/sign-in?next=/somewhere — the emailed-link sign-in for Plex Collective members. */
export default async function MemberSignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only ever send people back to a page on this site.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/studio-productions#members";
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="page-head">
          <div className="mx-auto max-w-6xl px-6">
            <p className="page-head__eyebrow">The Plex Collective</p>
            <h1 className="page-head__title">
              Members, <em>welcome back.</em>
            </h1>
            <p className="page-head__lede">Sign in with the email George invited you with and the password you chose.</p>
            <div className="mt-10">
              <SignInForm next={safeNext} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
