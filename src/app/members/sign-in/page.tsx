import Image from "next/image";
import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import SignInForm from "./SignInForm";
import { buildPageMetadata } from "../../../lib/seo";
import { SITE_NAME } from "../../../lib/site-config";
import { MEMBERS } from "../../../lib/venue/data";

export const metadata = buildPageMetadata({
  title: `Member sign-in — ${SITE_NAME}`,
  description: "Sign in to the Plex Collective members’ side of SoundPlex Studios.",
  path: "/members/sign-in",
  focusKeyword: "soundplex member sign in",
  noindex: true,
});

/**
 * /members/sign-in?next=/somewhere (Ed, 2026-10-28). Left: the welcome, who's in, and what's
 * inside. Right: the sign-in card floating on the Wood Room, its edges fading into the black.
 * "In the building now" is SAMPLE until real check-ins land (members phase 3); the site-wide
 * Live pill is hidden on /members pages so the two never disagree.
 */
const HERE_NOW = MEMBERS.slice(0, 4);

const INSIDE: { title: string; note: string; d: string }[] = [
  { title: "Who’s here now", note: "See who’s in which room before you head over.", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" },
  { title: "Members-only nights", note: "RSVP in one tap, and see who else is going.", d: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4" },
  { title: "20% off every ticket", note: "Your member price shows when you’re signed in.", d: "M9 14l6-6M9.5 8.5h.01M14.5 13.5h.01M5 3h14v18l-3.5-2-3.5 2-3.5-2L5 21z" },
];

export default async function MemberSignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only ever send people back to a page on this site.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/studio-productions#members";
  const bookTour = (
    <p className="text-[14px] text-white/50">
      Not a member yet? Membership starts with a tour.{" "}
      <Link href="/start?path=collective&from=member-sign-in" className="text-[#d4a030] hover:text-[#e2b34e]">
        Book one
      </Link>
    </p>
  );
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="py-[clamp(28px,5vw,64px)]">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <div>
              <p className="page-head__eyebrow">The Plex Collective</p>
              <h1 className="page-head__title">
                Members, <em>welcome back.</em>
              </h1>
              <p className="page-head__lede">Your rooms, your people, your nights.</p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex">
                  {HERE_NOW.map((m, i) => (
                    <span key={m.name} className={`relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#050505] ${i ? "-ml-3" : ""}`}>
                      <Image src={m.photo} alt="" fill sizes="40px" className="object-cover" />
                    </span>
                  ))}
                </div>
                <p className="text-[14px] leading-snug text-white/70">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4cc773] align-middle shadow-[0_0_0_3px_rgba(76,199,115,0.18)]" aria-hidden="true" />
                  {HERE_NOW.length} members in the building now
                </p>
              </div>

              <ul className="mt-9 space-y-5 border-t border-white/[0.08] pt-8 max-lg:hidden">
                {INSIDE.map((x) => (
                  <li key={x.title} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] rounded-bl-none border border-[#d4a030]/30 text-[#d4a030]">
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={x.d} />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-[15px] text-white">{x.title}</span>
                      <span className="mt-0.5 block text-[14px] text-white/50">{x.note}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-9 max-lg:hidden">{bookTour}</div>
            </div>

            {/* The lounge: the Wood Room, warm and visible, fading into the page on every side. */}
            <div className="relative flex min-h-[600px] items-center justify-center px-4 py-12 max-sm:-mx-6 max-sm:min-h-[560px]">
              <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_65%_60%_at_50%_50%,#000_25%,transparent_100%)]" aria-hidden="true">
                <Image src="/rooms/wood-room-3.webp" alt="" fill priority sizes="(min-width: 1024px) 640px, 100vw" className="object-cover opacity-60" />
                <div className="absolute inset-0 bg-[#050505]/45" />
              </div>
              <div className="relative w-full max-w-[24rem] rounded-[8px] rounded-bl-none border border-[#d4a030]/35 bg-[#0a0a0a]/[0.9] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.65)] backdrop-blur-md sm:p-8">
                <p className="font-[family-name:var(--font-poppins)] text-[24px] font-medium leading-none text-white">
                  Sign <em className="font-[family-name:var(--font-lora)] font-normal text-[#e2b34e]">in.</em>
                </p>
                <div className="mt-6">
                  <SignInForm next={safeNext} />
                </div>
              </div>
            </div>

            <div className="lg:hidden">{bookTour}</div>
          </div>
        </section>
      </main>
      <Footer hero={false} />
    </>
  );
}
