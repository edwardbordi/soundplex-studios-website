"use client";

import Link from "next/link";
import { useState } from "react";
import ForwardArrow from "../../components/ForwardArrow";
import { membersBrowser } from "../../../lib/members/browser";
import { AUTH_LANDING } from "../../../lib/members/env";

/**
 * Member sign-in (Ed, 2026-10-28: "a real password instead of a magic link every time").
 *   • Email + password: the everyday way in. The email is the username.
 *   • Forgot password: a reset email → /members/welcome → choose a new one.
 *   • Email me a link instead: the old no-password way, kept as a quiet option.
 * INVITATION ONLY throughout: nothing here can create an account.
 */
type Mode = "password" | "link" | "reset";

export default function SignInForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState("");
  const sb = membersBrowser();

  if (!sb) return <p className="text-[15px] text-white/60">Member sign-in isn’t switched on yet.</p>;

  const landing = (extra = "") => `${window.location.origin}${AUTH_LANDING}?next=${encodeURIComponent(next)}${extra}`;
  const validEmail = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const friendly = (m: string) =>
    /rate|too many|seconds|limit/i.test(m)
      ? "Too many emails in a short time. Wait a few minutes, then try again."
      : /invalid login|credentials/i.test(m)
        ? "That email and password don’t match. Try again, or reset your password."
        : /not confirmed/i.test(m)
          ? "Finish setting up your account from the invite email first."
          : /signup|not allowed|not found/i.test(m)
            ? "That email isn’t on the members list. Use the address you were invited with, or ask George."
            : "Something went wrong. Try again in a moment.";

  const submit = async () => {
    if (!validEmail()) return setError("That email doesn’t look right.");
    setError("");
    setState("busy");
    if (mode === "password") {
      if (!password) {
        setState("idle");
        return setError("Enter your password.");
      }
      const { error: e } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (e) {
        setState("idle");
        return setError(friendly(e.message));
      }
      window.location.replace(next);
      return;
    }
    const { error: e } =
      mode === "reset"
        ? await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: landing("&reset=1") })
        : await sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: landing() } });
    if (e) {
      setState("idle");
      return setError(friendly(e.message));
    }
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div className="vo-fade max-w-[30rem] rounded-[8px] border border-white/10 bg-[#0b0b0b] p-6">
        <p className="font-[family-name:var(--font-poppins)] text-[18px] font-medium text-white">Check your email.</p>
        <p className="mt-2 text-[15px] leading-relaxed text-white/65">
          {mode === "reset" ? "We sent a link to choose a new password to " : "We sent a sign-in link to "}
          <span className="text-white">{email.trim()}</span>. Open it on this device. It works once and expires in an hour.
        </p>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setMode("password");
          }}
          className="card-cta mt-5"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  const field = "w-full rounded-[4px] border border-white/15 bg-[#0b0b0b] px-3.5 py-3 text-[16px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#d4a030]";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      noValidate
      className="max-w-[26rem]"
    >
      <label className="block text-[12px] uppercase tracking-[0.16em] text-white/50">
        Email
        <input
          className={`${field} mt-2 normal-case tracking-normal`}
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
      </label>

      {mode === "password" && (
        <label className="mt-4 block text-[12px] uppercase tracking-[0.16em] text-white/50">
          Password
          <input
            className={`${field} mt-2 normal-case tracking-normal`}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
        </label>
      )}

      {error && <p className="nl__error" role="alert">{error}</p>}

      <button type="submit" disabled={state === "busy"} className="evp__btn group mt-6 w-full justify-center">
        {state === "busy" ? "One moment…" : mode === "password" ? "Sign in" : mode === "reset" ? "Email me a reset link" : "Email me a sign-in link"}
        {state !== "busy" && <ForwardArrow />}
      </button>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[14px]">
        {mode === "password" ? (
          <>
            <button type="button" onClick={() => setMode("reset")} className="text-white/60 hover:text-[#e2b34e]">
              Forgot your password?
            </button>
            <button type="button" onClick={() => setMode("link")} className="text-white/60 hover:text-[#e2b34e]">
              Email me a link instead
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setMode("password")} className="text-white/60 hover:text-[#e2b34e]">
            ← Sign in with a password
          </button>
        )}
      </div>

      <p className="mt-8 text-[14px] text-white/50">
        Not a member yet? Membership starts with a tour.{" "}
        <Link href="/start?path=collective&from=member-sign-in" className="text-[#d4a030] hover:text-[#e2b34e]">
          Book one
        </Link>
      </p>
    </form>
  );
}
