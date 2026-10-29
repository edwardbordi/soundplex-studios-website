import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import FinishSignIn from "./FinishSignIn";
import { buildPageMetadata } from "../../../lib/seo";
import { SITE_NAME } from "../../../lib/site-config";

export const metadata = buildPageMetadata({
  title: `Signing you in — ${SITE_NAME}`,
  description: "Finishing your Plex Collective sign-in.",
  path: "/members/welcome",
  focusKeyword: "soundplex member sign in",
  noindex: true,
});

/** Where the emailed sign-in and invite links land: finishes the sign-in, then moves on. */
export default function WelcomePage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="page-head">
          <div className="mx-auto max-w-6xl px-6">
            <p className="page-head__eyebrow">The Plex Collective</p>
            <FinishSignIn />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
