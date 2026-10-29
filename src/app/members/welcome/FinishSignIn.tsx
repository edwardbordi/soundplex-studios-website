"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { membersBrowser } from "../../../lib/members/browser";
import ProfileForm from "../ProfileForm";

/**
 * Where every emailed link lands (invite, sign-in link, password reset). It finishes the
 * sign-in, whichever shape the link has:
 *   ?code=…                 a link requested from this browser (PKCE)
 *   ?token_hash=…&type=…    a custom email template's link
 *   #access_token=…         an invite / reset (the Supabase client reads the hash itself)
 * then:
 *   • first time (no password yet)  → "Set up your account": profile + choose a password
 *   • forgot-password (?reset=1)    → "Choose a new password"
 *   • otherwise                     → straight on to ?next
 */
export default function FinishSignIn() {
  const [state, setState] = useState<"working" | "failed" | "setup" | "reset">("working");
  const [next, setNext] = useState("/studio-productions#members");

  useEffect(() => {
    const sb = membersBrowser();
    if (!sb) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to finish without the members project
      setState("failed");
      return;
    }
    const url = new URL(window.location.href);
    const raw = url.searchParams.get("next") ?? "";
    const dest = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/studio-productions#members";
    setNext(dest);
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as "magiclink" | "invite" | "email" | "recovery" | null;
    const reset = url.searchParams.get("reset") === "1" || type === "recovery" || /type=recovery/.test(window.location.hash);

    const finish = async () => {
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) return setState("failed");
      } else if (tokenHash && type) {
        const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) return setState("failed");
      }
      const { data } = await sb.auth.getUser();
      if (!data.user) return setState("failed");
      if (reset) return setState("reset");
      if (!data.user.user_metadata?.password_set) return setState("setup");
      window.location.replace(dest);
    };
    void finish();
  }, []);

  if (state === "setup" || state === "reset") {
    return (
      <>
        <h1 className="page-head__title">{state === "setup" ? <>Set up your <em>account.</em></> : <>Choose a new <em>password.</em></>}</h1>
        <p className="page-head__lede">{state === "setup" ? "Tell the other members who you are, and choose a password. From now on you sign in with your email and that password." : "Then you’re signed in."}</p>
        <div className="mt-10">
          <ProfileForm mode={state} next={next} />
        </div>
      </>
    );
  }
  if (state === "failed") {
    return (
      <>
        <h1 className="page-head__title">
          That link <em>didn’t work.</em>
        </h1>
        <p className="page-head__lede">Email links work once, on the device they were requested from, for an hour. Sign in with your password, or ask for a fresh link.</p>
        <Link href="/members/sign-in" className="evp__btn group mt-8 inline-flex">
          Go to sign in
        </Link>
      </>
    );
  }
  return (
    <>
      <h1 className="page-head__title">
        Signing you <em>in…</em>
      </h1>
      <p className="page-head__lede">One moment.</p>
    </>
  );
}
