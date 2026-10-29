"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { membersBrowser } from "../../../lib/members/browser";

/**
 * Finishes a sign-in from an emailed link, whichever shape the link has:
 *   ?code=…                    a sign-in link from this browser (PKCE)
 *   ?token_hash=…&type=…       a custom email template's link
 *   #access_token=…            an invite (the Supabase client picks it up by itself)
 * Then sends them on to ?next (a page on this site only).
 */
export default function FinishSignIn() {
  const [state, setState] = useState<"working" | "failed">("working");

  useEffect(() => {
    const sb = membersBrowser();
    if (!sb) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to finish without the members project
      setState("failed");
      return;
    }
    const url = new URL(window.location.href);
    const raw = url.searchParams.get("next") ?? "";
    const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/studio-productions#members";
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as "magiclink" | "invite" | "email" | null;

    const finish = async () => {
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) return setState("failed");
      } else if (tokenHash && type) {
        const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) return setState("failed");
      }
      // Invites arrive as #access_token=…; the client reads the hash on load. Confirm there's a session.
      const { data } = await sb.auth.getSession();
      if (!data.session) return setState("failed");
      window.location.replace(next);
    };
    void finish();
  }, []);

  if (state === "failed") {
    return (
      <>
        <h1 className="page-head__title">
          That link <em>didn’t work.</em>
        </h1>
        <p className="page-head__lede">Sign-in links work once, on the device they were requested from, for an hour. Ask for a fresh one.</p>
        <Link href="/members/sign-in" className="evp__btn group mt-8 inline-flex">
          Send me a new link
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
