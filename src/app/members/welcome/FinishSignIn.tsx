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
type Outcome = "failed" | "setup" | "reset" | "go";

/**
 * One attempt per link (Ed, 2026-11-07: "the first time it says the link doesn't work, but a
 * refresh works"). Two things used to race for the same one-time code: the Supabase client,
 * which finishes ?code links on its own as the page loads, and this page's own exchange (twice,
 * in dev, under React Strict Mode). One use signs you in, the other is told "already used" — so
 * the page said "didn't work" while you were in fact signed in. Now: the attempt is shared per
 * URL, an error only counts if no fresh session exists, and the code is cleared from the
 * address bar afterwards so a refresh never reuses it.
 */
const attempts = new Map<string, Promise<Outcome>>();

async function finishLink(href: string): Promise<Outcome> {
  const sb = membersBrowser();
  if (!sb) return "failed";
  const url = new URL(href);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as "magiclink" | "invite" | "email" | "recovery" | null;
  const reset = url.searchParams.get("reset") === "1" || type === "recovery" || /type=recovery/.test(url.hash);

  let error: unknown = null;
  if (code) error = (await sb.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) error = (await sb.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user) return "failed";
  // The code was "already used" — fine if it was used to sign THIS visit in (the client got there
  // first): the session is brand new. An older session with a failed link is still a failure.
  if (error) {
    const last = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
    if (Date.now() - last > 2 * 60_000) return "failed";
  }
  if (reset) return "reset";
  if (!user.user_metadata?.password_set) return "setup";
  return "go";
}

export default function FinishSignIn() {
  const [state, setState] = useState<"working" | "failed" | "setup" | "reset">("working");
  const [next, setNext] = useState("/members");

  useEffect(() => {
    const sb = membersBrowser();
    if (!sb) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to finish without the members project
      setState("failed");
      return;
    }
    const href = window.location.href;
    const url = new URL(href);
    const raw = url.searchParams.get("next") ?? "";
    const dest = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/members";
    setNext(dest);

    let alive = true;
    let attempt = attempts.get(href);
    if (!attempt) {
      attempt = finishLink(href);
      attempts.set(href, attempt);
    }
    void attempt.then((outcome) => {
      if (!alive) return;
      if (outcome === "go") return window.location.replace(dest);
      if (outcome !== "failed") {
        // Signed in: take the one-time code out of the address bar, so a refresh can't reuse it.
        const clean = new URL(href);
        ["code", "token_hash", "type"].forEach((k) => clean.searchParams.delete(k));
        if (outcome === "reset") clean.searchParams.set("reset", "1");
        window.history.replaceState(null, "", clean.pathname + clean.search);
      }
      setState(outcome);
    });
    return () => {
      alive = false;
    };
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
