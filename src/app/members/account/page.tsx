import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import ProfileForm from "../ProfileForm";
import { buildPageMetadata } from "../../../lib/seo";
import { SITE_NAME } from "../../../lib/site-config";

export const metadata = buildPageMetadata({
  title: `My profile — ${SITE_NAME}`,
  description: "Your Plex Collective profile and password.",
  path: "/members/account",
  focusKeyword: "soundplex member profile",
  noindex: true,
});

/** /members/account: a member edits their profile and changes their password (signed in only). */
export default function MemberAccountPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="page-head">
          <div className="mx-auto max-w-6xl px-6">
            <p className="page-head__eyebrow">The Plex Collective</p>
            <h1 className="page-head__title">
              My <em>profile.</em>
            </h1>
            <p className="page-head__lede">Your photo, your work, and where members can find you.</p>
            <div className="mt-10">
              <ProfileForm mode="account" />
            </div>
          </div>
        </section>
      </main>
      <Footer hero={false} />
    </>
  );
}
