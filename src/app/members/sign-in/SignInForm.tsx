"use client";

import Link from "next/link";
import { useState } from "react";
import ForwardArrow from "../../components/ForwardArrow";
import { membersBrowser } from "../../../lib/members/browser";
import { AUTH_LANDING } from "../../../lib/members/env";

/**
 * Members sign in with an emailed link: no passwords. INVITATION ONLY: shouldCreateUser is off,
 * so an address George hasn't invited gets a kind "not on the list" (never a new account).
 */
export default function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const sb = membersBrowser();

  if (!sb) {
    return <p className="text-[15px] text-white/60">Member sign-in isn’t switched on yet.</p>;
  }

  const send = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("That email doesn’t look right.");
      return;
    }
    setState("sending");
    setError("");
    const { error: e } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}${AUTH_LANDING}?next=${encodeURIComponent(next)}`,
      },
    });
    if (e) {
      setState("idle");
      setError(
        /signup|not allowed|not found|user/i.test(e.message)
          ? "That email isn’t on the members list. Use the address you were invited with, or ask George."
          : /rate|too many|seconds/i.test(e.message)
            ? "We just sent one. Give it a minute, then try again."
            : "Couldn’t send the link just now. Try again in a moment.",
      );
      return;
    }
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div className="vo-fade rounded-[8px] border border-white/10 bg-[#0b0b0b] p-6">
        <p className="font-[family-name:var(--font-poppins)] text-[18px] font-medium text-white">Check your email.</p>
        <p className="mt-2 text-[15px] leading-relaxed text-white/65">
          We sent a sign-in link to <span className="text-white">{email.trim()}</span>. Open it on this device and you’re in. It works once and expires in an hour.
        </p>
        <button type="button" onClick={() => setState("idle")} className="card-cta mt-5">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
      noValidate
      className="max-w-[26rem]"
    >
      <label htmlFor="member-email" className="text-[12px] uppercase tracking-[0.16em] text-white/50">
        Your email
      </label>
      <div className="nl__frame mt-2">
        <input
          id="member-email"
          className="nl__input nl__input--email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          autoFocus
        />
        <button type="submit" className="nl__btn group" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : <>Send link<ForwardArrow /></>}
        </button>
      </div>
      {error && <p className="nl__error" role="alert">{error}</p>}
      <p className="mt-6 text-[14px] text-white/50">
        Not a member yet? Membership starts with a tour.{" "}
        <Link href="/start?path=collective&from=member-sign-in" className="text-[#d4a030] hover:text-[#e2b34e]">
          Book one
        </Link>
      </p>
    </form>
  );
}
