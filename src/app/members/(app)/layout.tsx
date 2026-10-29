import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentMember } from "../../../lib/members/server";
import { membersConfigured } from "../../../lib/members/env";
import MemberShell from "./MemberShell";

/**
 * The members area (Ed, 2026-10-29): once you sign in, it stops being a website and becomes a
 * members' app — Studio-style shell (top bar + side menu on desktop, bottom tabs on a phone),
 * dark or light, with "Back to website" always one tap away.
 *
 * This layout is the GATE, on the server, for every page in (app): signed out → sign-in;
 * paused → a polite stop; not configured → a note. The sign-in and welcome pages sit OUTSIDE
 * this group, so they keep the website's look.
 */
export const metadata: Metadata = {
  title: "Members — SoundPlex Studios",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** The theme the member chose last time (MemberShell saves it as a cookie), so the server paints it: no flash, no script. */
const THEME_COOKIE = "sp-members-theme";

export default async function MembersAppLayout({ children }: { children: React.ReactNode }) {
  if (!membersConfigured()) {
    return (
      <Stop title="Members area coming soon" body="Member accounts aren’t switched on yet." />
    );
  }
  const me = await currentMember();
  if (!me) redirect("/members/sign-in?next=/members");
  if (me.status !== "active") {
    return (
      <Stop
        title="Your membership is paused"
        body="Your profile is safe. When your membership is active again, everything will be right where you left it. Questions? Call George at (609) 697-2077."
      />
    );
  }

  const theme = (await cookies()).get(THEME_COOKIE)?.value === "light" ? "light" : "dark";

  return (
    <div id="mx-root" className="mx min-h-dvh" data-mtheme={theme} suppressHydrationWarning>
      <MemberShell theme={theme} me={{ first: me.first_name, last: me.last_name, photo: me.photo_url ?? "", role: me.role, email: me.email }}>{children}</MemberShell>
    </div>
  );
}

function Stop({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="font-[family-name:var(--font-poppins)] text-[26px] font-medium">{title}</p>
        <p className="mt-3 text-(--mx-muted)">{body}</p>
        <Link href="/" className="evp__btn mt-8 inline-flex">
          Back to the website
        </Link>
      </div>
    </div>
  );
}
