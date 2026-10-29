"use client";

import { useEffect, useState } from "react";
import ForwardArrow from "../components/ForwardArrow";
import { membersBrowser } from "../../lib/members/browser";
import type { MemberRow } from "../../lib/members/env";

/**
 * A member's profile + password, in one form (Ed, 2026-10-28).
 *   mode "setup"   first time, from the invite email: profile + choose a password (required)
 *   mode "reset"   from a forgot-password email: just a new password (required)
 *   mode "account" My profile, any time: profile, and a new password only if they type one
 * The profile writes go through RLS: a member can only update their OWN row, and only the
 * profile columns (never status). The password goes to Supabase Auth and is never stored here.
 */
type Mode = "setup" | "reset" | "account";
type Fields = Pick<MemberRow, "first_name" | "last_name" | "role" | "offers" | "looking" | "show_me" | "on_wall">;

const MIN = 8;

export default function ProfileForm({ mode, next = "/studio-productions#members" }: { mode: Mode; next?: string }) {
  const sb = membersBrowser();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [f, setF] = useState<Fields>({ first_name: "", last_name: "", role: "", offers: "", looking: "", show_me: true, on_wall: false });
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!sb) return;
    void (async () => {
      const { data } = await sb.auth.getUser();
      const u = data.user;
      if (!u) {
        window.location.replace(`/members/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setEmail(u.email ?? "");
      setUserId(u.id);
      const { data: row } = await sb.from("members").select("first_name, last_name, role, offers, looking, show_me, on_wall").eq("id", u.id).maybeSingle();
      if (row) {
        const r = row as Partial<Record<keyof Fields, string | boolean | null>>;
        const str = (v: unknown) => (typeof v === "string" ? v : "");
        setF({
          first_name: str(r.first_name),
          last_name: str(r.last_name),
          role: str(r.role),
          offers: str(r.offers),
          looking: str(r.looking),
          show_me: r.show_me !== false,
          on_wall: r.on_wall === true,
        });
      }
      setLoaded(true);
    })();
  }, [sb]);

  if (!sb) return <p className="text-white/60">Member accounts aren’t switched on yet.</p>;
  if (!loaded) return <p className="text-white/50">Loading your profile…</p>;

  const needsPw = mode !== "account";
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setMsg(null);
    if (mode !== "reset" && !f.first_name.trim()) return setMsg({ ok: false, text: "Add your first name." });
    if (needsPw || pw) {
      if (pw.length < MIN) return setMsg({ ok: false, text: `Choose a password of at least ${MIN} characters.` });
      if (pw !== pw2) return setMsg({ ok: false, text: "The two passwords don’t match." });
    }
    setBusy(true);
    if (mode !== "reset") {
      const { error } = await sb
        .from("members")
        .update({
          first_name: f.first_name.trim().slice(0, 60),
          last_name: f.last_name.trim().slice(0, 60),
          role: f.role.trim().slice(0, 80),
          offers: f.offers.trim().slice(0, 400),
          looking: f.looking.trim().slice(0, 400),
          show_me: f.show_me,
          on_wall: f.on_wall,
        })
        .eq("id", userId);
      if (error) {
        setBusy(false);
        return setMsg({ ok: false, text: "Couldn’t save your profile. Try again in a moment." });
      }
    }
    if (needsPw || pw) {
      const { error } = await sb.auth.updateUser({ password: pw, data: { password_set: true } });
      if (error) {
        setBusy(false);
        return setMsg({
          ok: false,
          text: /different|same/i.test(error.message) ? "Choose a password you haven’t used here before." : /weak|short|length/i.test(error.message) ? "That password is too easy to guess. Try a longer one." : "Couldn’t set your password. Try again in a moment.",
        });
      }
    }
    setBusy(false);
    if (mode === "account") {
      setPw("");
      setPw2("");
      setMsg({ ok: true, text: pw ? "Saved, including your new password." : "Saved." });
      return;
    }
    window.location.replace(next);
  };

  const field = "w-full rounded-[4px] border border-white/15 bg-[#0b0b0b] px-3.5 py-3 text-[16px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#d4a030]";
  const label = "block text-[12px] uppercase tracking-[0.16em] text-white/50";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      noValidate
      className="max-w-[36rem]"
    >
      <p className="text-[14px] text-white/50">
        Signed in as <span className="text-white/80">{email}</span>. That’s your username.
      </p>

      {mode !== "reset" && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className={label}>
            First name
            <input className={`${field} mt-2 normal-case tracking-normal`} autoComplete="given-name" value={f.first_name} onChange={(e) => set("first_name", e.target.value)} />
          </label>
          <label className={label}>
            Last name
            <input className={`${field} mt-2 normal-case tracking-normal`} autoComplete="family-name" value={f.last_name} onChange={(e) => set("last_name", e.target.value)} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            What you do
            <input className={`${field} mt-2 normal-case tracking-normal`} placeholder="Producer, vocalist, brand designer…" value={f.role} onChange={(e) => set("role", e.target.value)} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            What you can offer other members
            <textarea rows={2} className={`${field} mt-2 resize-y normal-case tracking-normal`} placeholder="Mixing, photography, a room full of gear…" value={f.offers} onChange={(e) => set("offers", e.target.value)} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            What you’re looking for
            <textarea rows={2} className={`${field} mt-2 resize-y normal-case tracking-normal`} placeholder="A drummer, a co-host, feedback on a pitch…" value={f.looking} onChange={(e) => set("looking", e.target.value)} />
          </label>
          <Toggle on={f.show_me} onChange={(v) => set("show_me", v)} title="Show me to other members" note="When you check in, other members see you’re in the building." />
          <Toggle on={f.on_wall} onChange={(v) => set("on_wall", v)} title="OK to feature me on the public wall" note="George may add you to the Connection Wall on the website." />
        </div>
      )}

      <div className={`grid gap-5 sm:grid-cols-2 ${mode === "reset" ? "mt-8" : "mt-10 border-t border-white/[0.08] pt-8"}`}>
        <p className="text-[15px] text-white/70 sm:col-span-2">{mode === "account" ? "Change your password (leave blank to keep it)" : mode === "reset" ? "Choose a new password" : "Choose a password, for signing in from now on"}</p>
        <label className={label}>
          Password
          <input className={`${field} mt-2 normal-case tracking-normal`} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={`At least ${MIN} characters`} />
        </label>
        <label className={label}>
          Type it again
          <input className={`${field} mt-2 normal-case tracking-normal`} type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </label>
      </div>

      {msg && (
        <p role="status" className={`mt-5 text-[14px] ${msg.ok ? "text-[#e2b34e]" : "text-[#ff8a80]"}`}>
          {msg.text}
        </p>
      )}

      <button type="submit" disabled={busy} className="evp__btn group mt-8">
        {busy ? "Saving…" : mode === "setup" ? "Finish setting up" : mode === "reset" ? "Save my new password" : "Save changes"}
        {!busy && <ForwardArrow />}
      </button>
    </form>
  );
}

function Toggle({ on, onChange, title, note }: { on: boolean; onChange: (v: boolean) => void; title: string; note: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-start gap-3 rounded-[6px] border border-white/10 bg-white/[0.02] p-4 text-left transition-colors hover:border-white/25 sm:col-span-2">
      <span className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-[4px] transition-colors ${on ? "bg-[#d4a030]" : "bg-white/15"}`} aria-hidden>
        <span className={`absolute top-1 h-4 w-4 rounded-[3px] bg-white shadow transition-all ${on ? "left-5" : "left-1"}`} />
      </span>
      <span>
        <span className="block text-[15px] text-white">{title}</span>
        <span className="mt-0.5 block text-[13px] text-white/50">{note}</span>
      </span>
    </button>
  );
}
