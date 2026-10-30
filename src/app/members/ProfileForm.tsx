"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import ForwardArrow from "../components/ForwardArrow";
import SocialTags from "./SocialTags";
import ContactIcons from "./ContactIcons";
import MessageLists from "./MessageLists";
import { alertPrefsFrom, playChime, readAlertPrefs, serverAlertPrefs, setAlertPrefs, subAlertPrefs, type MessagesFrom } from "../../lib/members/messages";
import { membersBrowser } from "../../lib/members/browser";
import { parseSocial, socialLabel } from "../../lib/social";
import { setSession } from "../../lib/venue/session";
import { formatPhone } from "../../lib/phone";
import { PASSWORD_RULES, passwordOk } from "../../lib/members/passwordRules";

/**
 * A member's profile + password (Ed, 2026-10-28).
 *   mode "setup"   first time, from the invite email: profile + choose a password (required)
 *   mode "reset"   from a forgot-password email: just a new password (required)
 *   mode "account" My profile, any time: profile, and a new password only if they type one
 *
 * 2026-10-30: two photos — the round avatar and a tall 4:5 "wall portrait" for the Connection
 * Wall (cropped in the browser, saved in color, shown black and white there) — plus a one-line
 * bio, and a second live preview styled like the wall's own card.
 *
 * Setup and account show a live "how members see you" card beside the form (sticky on desktop),
 * a profile photo (cropped square and shrunk in the browser, then stored in the "avatars" bucket
 * under the member's own folder; it saves straight away) and social accounts (the Root & Reach
 * tag field). Profile writes go through RLS: a member can only update their OWN row and only
 * the profile columns. The password goes to Supabase Auth and is never stored here.
 */
type Mode = "setup" | "reset" | "account";
type Fields = {
  first_name: string;
  last_name: string;
  role: string;
  offers: string;
  looking: string;
  show_me: boolean;
  on_wall: boolean;
  photo_url: string;
  /** The tall portrait for the Connection Wall (shown black and white there). */
  portrait_url: string;
  /** One line about them, under their name on the wall card. */
  bio: string;
  /** Contact details for other members only (never on the public wall). */
  phone: string;
  contact_email: string;
  /** Who can message me in the app: everyone, only people I allow, or no one. */
  messages_from: MessagesFrom;
  socials: string[];
};
type PhotoKind = "avatar" | "portrait";

const EMPTY: Fields = { first_name: "", last_name: "", role: "", offers: "", looking: "", show_me: true, on_wall: false, photo_url: "", portrait_url: "", bio: "", phone: "", contact_email: "", messages_from: "everyone", socials: [] };
/** Output sizes: the avatar is a 512px square; the wall portrait is 4:5 (the wall's frame), 900×1125. */
const SIZE: Record<PhotoKind, { w: number; h: number }> = { avatar: { w: 512, h: 512 }, portrait: { w: 900, h: 1125 } };

/** Center-crop to the target shape, shrink to fit, encode as WebP. Throws if the browser can't read it. */
async function cropWebp(file: File, out: { w: number; h: number }): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("unreadable"));
      i.src = url;
    });
    // The largest box of the target shape that fits the photo, centered (portraits: a touch high,
    // so heads aren't cropped).
    const ratio = out.w / out.h;
    let sw = img.naturalWidth;
    let sh = sw / ratio;
    if (sh > img.naturalHeight) {
      sh = img.naturalHeight;
      sw = sh * ratio;
    }
    const sx = (img.naturalWidth - sw) / 2;
    const sy = out.h > out.w ? (img.naturalHeight - sh) * 0.3 : (img.naturalHeight - sh) / 2;
    const scale = Math.min(1, out.w / sw);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    if (!blob) throw new Error("encode");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type SettingsTab = "profile" | "password" | "privacy";

export default function ProfileForm({ mode, next = "/members", section: tabProp }: { mode: Mode; next?: string; section?: SettingsTab }) {
  // In Settings (mode "account") the form is split into tabs (Ed, 2026-10-30): Profile,
  // Password, Privacy. Setup (from the invite) still shows everything on one page.
  // (The prop is renamed here: `section` is also the panel style below.)
  const tab: SettingsTab | null = mode === "account" ? (tabProp ?? "profile") : null;
  const sb = membersBrowser();
  const [loaded, setLoaded] = useState(false);
  // The profile row couldn't be read (e.g. a database update not run yet): never show, or save, a blank form.
  const [loadErr, setLoadErr] = useState(false);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [f, setF] = useState<Fields>(EMPTY);
  const [socialDraft, setSocialDraft] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState<PhotoKind | null>(null);
  const [photoMsg, setPhotoMsg] = useState<{ kind: PhotoKind; ok: boolean; text: string } | null>(null);
  const [drag, setDrag] = useState<PhotoKind | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const portraitRef = useRef<HTMLInputElement>(null);
  // Opens on the member card alone (Ed, 2026-10-30); "Both" and "Wall card" are a tap away.
  const [preview, setPreview] = useState<"both" | "member" | "wall">("member");
  // The contact email gets the same check as the site's forms (/api/check-email): malformed,
  // a likely typo ("Did you mean @gmail.com?"), or a domain that can't receive mail.
  const [emailCheck, setEmailCheck] = useState<{ error: string; suggestion?: string } | null>(null);
  const [emailTypoOk, setEmailTypoOk] = useState(false);
  // The chip at the end of the field once it's settled: verified, fixed (with undo), or kept as typed.
  const [emailStatus, setEmailStatus] = useState<{ kind: "ok" } | { kind: "fixed"; prev: string } | { kind: "kept" } | null>(null);

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
      const { data: row, error: rowErr } = await sb
        .from("members")
        .select("first_name, last_name, role, bio, offers, looking, show_me, on_wall, photo_url, portrait_url, phone, contact_email, messages_from, socials")
        .eq("id", u.id)
        .maybeSingle();
      if (rowErr) {
        setLoadErr(true);
        setLoaded(true);
        return;
      }
      if (row) {
        const r = row as Partial<Record<keyof Fields, unknown>>;
        const str = (v: unknown) => (typeof v === "string" ? v : "");
        setF({
          first_name: str(r.first_name),
          last_name: str(r.last_name),
          role: str(r.role),
          offers: str(r.offers),
          looking: str(r.looking),
          show_me: r.show_me !== false,
          on_wall: r.on_wall === true,
          photo_url: str(r.photo_url),
          portrait_url: str(r.portrait_url),
          bio: str(r.bio),
          phone: formatPhone(str(r.phone)),
          contact_email: str(r.contact_email),
          messages_from: r.messages_from === "allowed" || r.messages_from === "nobody" ? r.messages_from : "everyone",
          socials: Array.isArray(r.socials) ? (r.socials as unknown[]).filter((s): s is string => typeof s === "string") : [],
        });
      }
      setLoaded(true);
    })();
  }, [sb]);

  if (!sb) return <p className="text-(--mx-muted)">Member accounts aren’t switched on yet.</p>;
  if (!loaded) return <p className="text-(--mx-muted)">Loading your profile…</p>;
  if (loadErr) return <p className="text-(--mx-muted)">Couldn’t load your profile. Refresh in a moment; if it keeps happening, tell George.</p>;

  const needsPw = mode !== "account" || tab === "password";
  // Which parts this screen saves: the profile fields everywhere except the reset and password screens.
  const doProfile = mode !== "reset" && tab !== "password";
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((x) => ({ ...x, [k]: v }));

  // ── Photos: each saves on its own, straight away ──
  // Two kinds in the member's own folder: "avatar-…" (the round photo) and "portrait-…" (the
  // tall wall portrait). Older avatars have no prefix; they count as avatars when tidying.
  const COLUMN: Record<PhotoKind, "photo_url" | "portrait_url"> = { avatar: "photo_url", portrait: "portrait_url" };
  const isKind = (name: string, kind: PhotoKind) => (kind === "portrait" ? name.startsWith("portrait-") : !name.startsWith("portrait-"));
  const tidy = async (kind: PhotoKind, keep?: string) => {
    const { data: files } = await sb.storage.from("avatars").list(userId);
    const old = (files ?? []).filter((x) => isKind(x.name, kind)).map((x) => `${userId}/${x.name}`).filter((p) => p !== keep);
    if (old.length) await sb.storage.from("avatars").remove(old);
  };

  const uploadPhoto = async (kind: PhotoKind, file: File | undefined) => {
    if (!file) return;
    setPhotoMsg(null);
    if (!file.type.startsWith("image/")) return setPhotoMsg({ kind, ok: false, text: "That isn’t an image. Try a JPG or PNG." });
    if (file.size > 20 * 1024 * 1024) return setPhotoMsg({ kind, ok: false, text: "That photo is over 20 MB. Try a smaller one." });
    setPhotoBusy(kind);
    try {
      const blob = await cropWebp(file, SIZE[kind]);
      // Safari can't encode WebP and hands back a PNG: name and label the file by what it really is.
      const type = blob.type === "image/webp" || blob.type === "image/png" || blob.type === "image/jpeg" ? blob.type : "image/png";
      const path = `${userId}/${kind}-${Date.now()}.${type.split("/")[1]}`;
      const { error: upErr } = await sb.storage.from("avatars").upload(path, blob, { contentType: type, cacheControl: "31536000" });
      if (upErr) {
        console.error(`[${kind}] upload failed:`, upErr);
        throw new Error(/bucket not found/i.test(upErr.message) ? "no-bucket" : /row-level security|policy|unauthorized/i.test(upErr.message) ? "denied" : "upload");
      }
      const url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error: dbErr } = await sb.from("members").update({ [COLUMN[kind]]: url }).eq("id", userId);
      if (dbErr) {
        console.error(`[${kind}] saving the url failed:`, dbErr);
        throw new Error("db");
      }
      set(COLUMN[kind], url);
      if (kind === "avatar") setSession({ photo: url });
      setPhotoMsg({ kind, ok: true, text: kind === "avatar" ? "Photo updated." : "Portrait updated." });
      await tidy(kind, path);
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setPhotoMsg({
        kind,
        ok: false,
        text:
          m === "unreadable"
            ? "Couldn’t read that image. Try a JPG or PNG."
            : m === "no-bucket"
              ? "Photo storage isn’t set up yet (the avatars bucket is missing)."
              : m === "denied"
                ? "Photo upload isn’t allowed for this account yet (storage permissions)."
                : m === "db"
                  ? "The photo uploaded but couldn’t be saved to your profile."
                  : "Couldn’t save your photo. Try again in a moment.",
      });
    } finally {
      setPhotoBusy(null);
      if (fileRef.current) fileRef.current.value = "";
      if (portraitRef.current) portraitRef.current.value = "";
    }
  };

  const removePhoto = async (kind: PhotoKind) => {
    setPhotoBusy(kind);
    setPhotoMsg(null);
    const { error } = await sb.from("members").update({ [COLUMN[kind]]: null }).eq("id", userId);
    if (error) {
      setPhotoBusy(null);
      return setPhotoMsg({ kind, ok: false, text: "Couldn’t remove it. Try again in a moment." });
    }
    await tidy(kind);
    set(COLUMN[kind], "");
    if (kind === "avatar") setSession({ photo: "" });
    setPhotoBusy(null);
    setPhotoMsg({ kind, ok: true, text: kind === "avatar" ? "Photo removed." : "Portrait removed." });
  };

  /** True when the contact email is empty or passes the forms' check. Fails open on network trouble. */
  const checkContactEmail = async (typoConfirmed = emailTypoOk, value = f.contact_email): Promise<boolean> => {
    const address = value.trim();
    if (!address) {
      setEmailCheck(null);
      setEmailStatus(null);
      return true;
    }
    try {
      const r = await fetch("/api/check-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: address, typoConfirmed }) });
      const d = (await r.json().catch(() => ({ ok: true }))) as { ok?: boolean; error?: string; suggestion?: string };
      if (r.ok && d.ok === false) {
        setEmailCheck({ error: d.error || "That email doesn’t look right.", suggestion: d.suggestion });
        setEmailStatus(null);
        return false;
      }
    } catch {
      /* fail open */
      return true;
    }
    setEmailCheck(null);
    // Keep a "fixed" or "kept" chip; otherwise mark it verified.
    setEmailStatus((cur) => (cur && cur.kind !== "ok" ? cur : { kind: "ok" }));
    return true;
  };

  // ── Everything else: saves with the button ──
  const save = async () => {
    setMsg(null);
    if (doProfile && !f.first_name.trim()) return setMsg({ ok: false, text: "Add your first name." });
    if (doProfile && f.phone.trim() && f.phone.replace(/\D/g, "").length !== 10) return setMsg({ ok: false, text: "Enter a 10-digit phone number, or leave it blank." });
    if (doProfile && !(await checkContactEmail())) return setMsg({ ok: false, text: "Check your email for members, above." });
    if (needsPw || pw) {
      if (!passwordOk(pw, pw2)) return setMsg({ ok: false, text: "Your password needs to meet every rule below it." });
    }
    setBusy(true);
    if (doProfile) {
      // Anything typed in the socials field but never "added" still counts.
      const draft = socialDraft.replace(/,+$/, "").trim();
      const socials = (draft && !f.socials.includes(draft) ? [...f.socials, draft] : f.socials).slice(0, 8).map((s) => s.slice(0, 200));
      const { error } = await sb
        .from("members")
        .update({
          first_name: f.first_name.trim().slice(0, 60),
          last_name: f.last_name.trim().slice(0, 60),
          role: f.role.trim().slice(0, 80),
          bio: f.bio.trim().slice(0, 300),
          phone: f.phone.trim().slice(0, 32) || null,
          contact_email: f.contact_email.trim().slice(0, 254) || null,
          offers: f.offers.trim().slice(0, 400),
          looking: f.looking.trim().slice(0, 400),
          show_me: f.show_me,
          on_wall: f.on_wall,
          messages_from: f.messages_from,
          socials,
        })
        .eq("id", userId);
      if (error) {
        setBusy(false);
        return setMsg({ ok: false, text: "Couldn’t save your profile. Try again in a moment." });
      }
      setF((x) => ({ ...x, socials }));
      setSocialDraft("");
      setSession({ name: f.first_name.trim(), showMe: f.show_me });
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

  const field = "w-full rounded-[4px] border border-(--mx-line-strong) bg-(--mx-field) px-3.5 py-3 text-[16px] text-(--mx-text) outline-none transition-colors placeholder:text-(--mx-faint) focus:border-[#d4a030]";
  const label = "block text-[12px] uppercase tracking-[0.16em] text-(--mx-muted)";
  const section = "rounded-[8px] rounded-bl-none border border-(--mx-line) bg-(--mx-panel) p-5 sm:p-7";
  const sectionTitle = "font-[family-name:var(--font-poppins)] text-[17px] font-medium text-(--mx-text)";
  const sectionNote = "mt-1 text-[14px] text-(--mx-muted)";

  const privacyBlock = (
    <div className={section}>
      <p className={sectionTitle}>Privacy</p>
      <p className={sectionNote}>Who sees you, and where. Change these any time.</p>
      <div className="mt-5 grid gap-3">
        <Toggle on={f.show_me} onChange={(v) => set("show_me", v)} title="Show me to other members" note="When you check in, other members see you’re in the building." />
        <Toggle on={f.on_wall} onChange={(v) => set("on_wall", v)} title="OK to feature me on the public wall" note="George may add your portrait, role, line about you, offer and what you’re looking for to the Connection Wall on the website. Never your contact details." />
      </div>

      {/* Messages (Ed, 2026-10-30): who can message me, plus my allowed and blocked lists.
          The database enforces all of it. In the app only, never by text or email. */}
      <div className="mt-7 border-t border-(--mx-line) pt-6">
        <p className="text-[15px] font-medium text-(--mx-text)">Who can message me</p>
        <p className="mt-1 text-[13.5px] text-(--mx-muted)">Private messages here in the members area. Only the two of you see them.</p>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-[6px] border border-(--mx-line) bg-(--mx-field) p-1 text-[13.5px]" role="radiogroup" aria-label="Who can message me">
          {(
            [
              ["everyone", "Everyone"],
              ["allowed", "People I allow"],
              ["nobody", "No one"],
            ] as const
          ).map(([id, text]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={f.messages_from === id}
              onClick={() => set("messages_from", id)}
              className={`rounded-[4px] px-2 py-2 transition-colors ${f.messages_from === id ? "bg-(--mx-gold) font-medium text-[#141414]" : "text-(--mx-muted) hover:text-(--mx-text)"}`}
            >
              {text}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-(--mx-faint)">
          {f.messages_from === "everyone"
            ? "Any member can message you, except people you block. Saved when you press Save."
            : f.messages_from === "allowed"
              ? "Only the people on your allowed list can message you. Saved when you press Save."
              : "No one can message you. Your conversations stay, but no one can reply. Saved when you press Save."}
        </p>
        {userId && <MessageLists meId={userId} mode={f.messages_from} />}
      </div>

      {/* Message alerts (Ed, 2026-10-30): saved in this browser straight away. */}
      <div className="mt-7 border-t border-(--mx-line) pt-6">
        <p className="text-[15px] font-medium text-(--mx-text)">Message alerts</p>
        <p className="mt-1 text-[13.5px] text-(--mx-muted)">While you’re in the members area. Saved on this device, straight away.</p>
        <AlertToggles />
      </div>
    </div>
  );

  const passwordBlock = (
    <div className={mode === "reset" ? "" : section}>
      {mode !== "reset" && (
        <>
          <p className={sectionTitle}>Password</p>
          <p className={sectionNote}>{mode === "account" ? "Leave blank to keep your current one." : "For signing in from now on, with your email."}</p>
        </>
      )}
      <div className={`grid gap-5 sm:grid-cols-2 ${mode === "reset" ? "" : "mt-5"}`}>
        <PasswordField label={mode === "account" ? "New password" : "Password"} labelClass={label} fieldClass={field} value={pw} onChange={setPw} />
        <PasswordField label="Type it again" labelClass={label} fieldClass={field} value={pw2} onChange={setPw2} />
      </div>
      {/* The rules light up as they're met (Ed, 2026-10-30: like the Visibility Tracker). On My
          profile they appear once a new password is being typed; at setup and reset, always. */}
      {(mode !== "account" || pw || pw2) && (
        // Under each field, its own rules: the first four under the password, "Passwords match"
        // under "Type it again" (Ed, 2026-10-30).
        <div className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-2" aria-label="Password rules">
          {[PASSWORD_RULES.filter((r) => r.id !== "match"), PASSWORD_RULES.filter((r) => r.id === "match")].map((group, g) => (
            <ul key={g} className="space-y-2">
              {group.map((r) => {
                const met = pw.length > 0 && r.test(pw, pw2);
                return (
                  <li key={r.id} className={`flex items-center gap-2 text-[13.5px] transition-colors ${met ? "text-(--mx-gold-text)" : "text-(--mx-faint)"}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                      {met ? (
                        <>
                          <circle cx="12" cy="12" r="10" fill="#d4a030" />
                          <path d="M7.5 12.5l3 3 5.5-6.5" fill="none" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      )}
                    </svg>
                    <span>
                      {r.label}
                      <span className="sr-only">{met ? " (met)" : " (not met yet)"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      )}
    </div>
  );

  const actions = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <button type="submit" disabled={busy} className="evp__btn group">
        {busy ? "Saving…" : mode === "setup" ? "Finish setting up" : mode === "reset" ? "Save my new password" : "Save changes"}
        {!busy && <ForwardArrow />}
      </button>
      {msg && (
        <p role="status" className={`text-[14px] ${msg.ok ? "text-(--mx-gold-text)" : "text-(--mx-error)"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void save();
  };

  // ── Reset: just the password ──
  if (mode === "reset") {
    return (
      <form onSubmit={onSubmit} noValidate className="max-w-[36rem]">
        <p className="text-[14px] text-(--mx-muted)">
          Signed in as <span className="text-(--mx-soft)">{email}</span>.
        </p>
        <div className="mt-8">{passwordBlock}</div>
        <div className="mt-8">{actions}</div>
      </form>
    );
  }

  // ── Settings → Password: just the password ──
  if (tab === "password") {
    return (
      <form onSubmit={onSubmit} noValidate className="max-w-[44rem] space-y-6">
        <p className="text-[14px] text-(--mx-muted)">
          Signed in as <span className="text-(--mx-soft)">{email}</span>. That’s your username.
        </p>
        {passwordBlock}
        {actions}
      </form>
    );
  }

  // ── Settings → Privacy: who sees you, where ──
  if (tab === "privacy") {
    return (
      <form onSubmit={onSubmit} noValidate className="max-w-[44rem] space-y-6">
        {privacyBlock}
        {actions}
      </form>
    );
  }

  const fullName = [f.first_name, f.last_name].map((s) => s.trim()).filter(Boolean).join(" ") || "Your name";

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
      <div className="min-w-0 space-y-6">
        <p className="text-[14px] text-(--mx-muted)">
          Signed in as <span className="text-(--mx-soft)">{email}</span>. That’s your username.
        </p>

        {/* Photos: the round avatar, and the tall portrait for the Connection Wall. Each saves on
            its own, and each takes a dropped file. */}
        <div className={section}>
          <p className={sectionTitle}>Your photos</p>
          <p className={sectionNote}>Drop a photo on either one, or choose a file. Each saves straight away.</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <PhotoSlot
              kind="avatar"
              title="Profile photo"
              note="A clear photo of your face. Shows on your avatar and in the members area."
              url={f.photo_url}
              name={f.first_name}
              busy={photoBusy === "avatar"}
              drag={drag === "avatar"}
              msg={photoMsg?.kind === "avatar" ? photoMsg : null}
              onPick={() => fileRef.current?.click()}
              onDrop={(file) => void uploadPhoto("avatar", file)}
              onDrag={(on) => setDrag(on ? "avatar" : null)}
              onRemove={() => void removePhoto("avatar")}
            />
            <PhotoSlot
              kind="portrait"
              title="Wall portrait"
              note="Waist up, standing or seated, plain background. Shown in black and white on the Connection Wall."
              url={f.portrait_url}
              name={f.first_name}
              busy={photoBusy === "portrait"}
              drag={drag === "portrait"}
              msg={photoMsg?.kind === "portrait" ? photoMsg : null}
              onPick={() => portraitRef.current?.click()}
              onDrop={(file) => void uploadPhoto("portrait", file)}
              onDrag={(on) => setDrag(on ? "portrait" : null)}
              onRemove={() => void removePhoto("portrait")}
            />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void uploadPhoto("avatar", e.target.files?.[0])} />
          <input ref={portraitRef} type="file" accept="image/*" className="hidden" onChange={(e) => void uploadPhoto("portrait", e.target.files?.[0])} />
        </div>

        {/* About you */}
        <div className={section}>
          <p className={sectionTitle}>About you</p>
          <p className={sectionNote}>What other members see on your card. If you’re featured on the public Connection Wall, these show there too (not your contact details or social links).</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
              A line about you
              <textarea rows={2} className={`${field} mt-2 resize-y normal-case tracking-normal`} placeholder="Interviews South Jersey business owners upstairs in Studio A, one long conversation at a time." value={f.bio} onChange={(e) => set("bio", e.target.value)} />
            </label>
            <label className={`${label} sm:col-span-2`}>
              What you can offer other members
              <textarea rows={2} className={`${field} mt-2 resize-y normal-case tracking-normal`} placeholder="Mixing, photography, a room full of gear…" value={f.offers} onChange={(e) => set("offers", e.target.value)} />
            </label>
            <label className={`${label} sm:col-span-2`}>
              What you’re looking for
              <textarea rows={2} className={`${field} mt-2 resize-y normal-case tracking-normal`} placeholder="A drummer, a co-host, feedback on a pitch…" value={f.looking} onChange={(e) => set("looking", e.target.value)} />
            </label>
          </div>
        </div>

        {/* Socials */}
        <div className={section}>
          <p className={sectionTitle}>Where to find you</p>
          <p className={sectionNote}>Instagram, TikTok, YouTube, your website… so members can follow your work.</p>
          <div className="mt-5">
            <label htmlFor="profile-socials" className={`${label} mb-2`}>
              Social accounts and links
            </label>
            <SocialTags id="profile-socials" tags={f.socials} onChange={(v) => set("socials", v)} pending={socialDraft} onPendingChange={setSocialDraft} />
          </div>
        </div>

        {/* Contact: members only */}
        <div className={section}>
          <p className={sectionTitle}>How members can reach you</p>
          <p className={sectionNote}>Optional. Only signed-in members see these, on your card and in the members directory. Never on the public website.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className={label}>
              Phone
              <input className={`${field} mt-2 normal-case tracking-normal`} type="tel" inputMode="tel" autoComplete="tel" placeholder="(609) 555-0123" value={f.phone} onChange={(e) => set("phone", formatPhone(e.target.value))} />
            </label>
            <label className={label}>
              Email for members
              <span className="relative mt-2 block normal-case tracking-normal">
                <input
                  className={`${field} ${emailStatus ? "pr-32" : ""} ${emailCheck ? "border-(--mx-error)" : ""}`}
                  type="email"
                  autoComplete="email"
                  placeholder={email || "you@example.com"}
                  value={f.contact_email}
                  onChange={(e) => {
                    set("contact_email", e.target.value);
                    setEmailCheck(null);
                    setEmailStatus(null);
                    setEmailTypoOk(false);
                  }}
                  onBlur={() => void checkContactEmail()}
                />
                {/* The chip at the end of the field once it's settled. */}
                {emailStatus && (
                  <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-[4px] bg-[#4cc773]/12 px-2 py-1 text-[12px] font-medium text-(--mx-ok)">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d="M3.5 8.3 6.5 11l6-6.2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {emailStatus.kind === "ok" ? "Verified" : emailStatus.kind === "kept" ? "Kept as typed" : "Fixed"}
                    {emailStatus.kind === "fixed" && (
                      <button
                        type="button"
                        className="ml-1 border-l border-current/30 pl-1.5 text-(--mx-muted) hover:text-(--mx-text)"
                        onClick={() => {
                          const prev = emailStatus.prev;
                          set("contact_email", prev);
                          setEmailStatus(null);
                          void checkContactEmail(false, prev);
                        }}
                      >
                        Undo
                      </button>
                    )}
                  </span>
                )}
              </span>
              {/* Not right: the problem, and for a likely typo, the fix as one tap. */}
              {emailCheck && (
                <span className="mt-2.5 block normal-case tracking-normal" role="alert">
                  {emailCheck.suggestion ? (
                    <span className="block rounded-[6px] border border-(--mx-line-strong) bg-(--mx-panel) p-3">
                      <span className="block text-[13.5px] text-(--mx-soft)">
                        Did you mean <span className="font-medium text-(--mx-text)">{f.contact_email.trim().replace(/@.*$/, `@${emailCheck.suggestion}`)}</span>?
                      </span>
                      <span className="mt-2.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-[4px] bg-(--mx-gold) px-3 py-1.5 text-[13px] font-semibold text-[#141414] hover:brightness-110"
                          onClick={() => {
                            const prev = f.contact_email.trim();
                            const fixed = prev.replace(/@.*$/, `@${emailCheck.suggestion}`);
                            set("contact_email", fixed);
                            setEmailCheck(null);
                            setEmailStatus({ kind: "fixed", prev });
                            void checkContactEmail(false, fixed);
                          }}
                        >
                          Use @{emailCheck.suggestion}
                        </button>
                        <button
                          type="button"
                          className="rounded-[4px] border border-(--mx-line-strong) px-3 py-1.5 text-[13px] text-(--mx-soft) hover:border-(--mx-gold) hover:text-(--mx-text)"
                          onClick={() => {
                            setEmailTypoOk(true);
                            setEmailStatus({ kind: "kept" });
                            void checkContactEmail(true);
                          }}
                        >
                          Keep mine
                        </button>
                      </span>
                    </span>
                  ) : (
                    <span className="text-[13px] text-(--mx-error)">{emailCheck.error}</span>
                  )}
                </span>
              )}
            </label>
          </div>
        </div>

        {/* At setup everything is on one page; in Settings these have their own tabs. */}
        {mode !== "account" && privacyBlock}
        {mode !== "account" && passwordBlock}

        {actions}
      </div>

      {/* How members see you */}
      <aside className="lg:sticky lg:top-[calc(var(--mx-sticky,var(--hdr-h,96px))+24px)]">
        {/* Which preview(s) to show (Ed, 2026-10-30). */}
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-[6px] border border-(--mx-line) bg-(--mx-panel) p-1 text-[13px]" role="tablist" aria-label="Preview">
          {(
            [
              ["both", "Both"],
              ["member", "Member card"],
              ["wall", "Wall card"],
            ] as const
          ).map(([id, text]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={preview === id}
              onClick={() => setPreview(id)}
              className={`rounded-[4px] px-2 py-1.5 transition-colors ${preview === id ? "bg-(--mx-gold) font-medium text-[#141414]" : "text-(--mx-muted) hover:text-(--mx-text)"}`}
            >
              {text}
            </button>
          ))}
        </div>

        {preview !== "wall" && (
        <>
        <p className="text-[12px] uppercase tracking-[0.16em] text-(--mx-faint)">How members see you</p>
        <div className="mt-3 overflow-hidden rounded-[8px] rounded-bl-none border border-[#d4a030]/30 bg-(--mx-raised)">
          <div className="h-1 bg-[#d4a030]" />
          <div className="p-6 text-center">
            <div className="mx-auto h-20 w-20 overflow-hidden rounded-full ring-2 ring-[#d4a030] ring-offset-4 ring-offset-(--mx-raised)">
              <Avatar url={f.photo_url} name={f.first_name} size={80} />
            </div>
            <p className="mt-5 font-[family-name:var(--font-poppins)] text-[19px] font-medium leading-tight text-(--mx-text)">{fullName}</p>
            {f.role.trim() && <p className="mt-1 text-[14px] text-(--mx-gold-text)">{f.role.trim()}</p>}
          </div>
          {(f.offers.trim() || f.looking.trim()) && (
            <dl className="space-y-3 border-t border-(--mx-line) px-6 py-5 text-[14px]">
              {f.offers.trim() && (
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-(--mx-faint)">Offers</dt>
                  <dd className="mt-1 text-(--mx-soft)">{f.offers.trim()}</dd>
                </div>
              )}
              {f.looking.trim() && (
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-(--mx-faint)">Looking for</dt>
                  <dd className="mt-1 text-(--mx-soft)">{f.looking.trim()}</dd>
                </div>
              )}
            </dl>
          )}
          {/* Message · call · email, as icons (Ed, 2026-10-30), as other members see them. */}
          {(f.phone.trim() || f.contact_email.trim() || f.messages_from !== "nobody") && (
            <div className="flex justify-center border-t border-(--mx-line) px-6 py-4">
              <ContactIcons name={f.first_name.trim() || "you"} phone={f.phone} email={f.contact_email} canMessage={f.messages_from !== "nobody"} />
            </div>
          )}
          {f.socials.length > 0 && (
            <ul className="flex flex-wrap gap-2 border-t border-(--mx-line) px-6 py-5">
              {f.socials.map((s) => {
                const info = parseSocial(s);
                const { platform, name } = socialLabel(info);
                const text = platform ?? name;
                return (
                  <li key={s}>
                    {info.url && !info.problem ? (
                      <a href={info.url} target="_blank" rel="noopener noreferrer" title={name} className="inline-flex rounded-[4px] border border-(--mx-line-strong) px-2.5 py-1 text-[12.5px] text-(--mx-soft) transition-colors hover:border-[#d4a030]/60 hover:text-(--mx-text)">
                        {text}
                      </a>
                    ) : (
                      <span className="inline-flex rounded-[4px] border border-(--mx-line-strong) px-2.5 py-1 text-[12.5px] text-(--mx-muted)">{text}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="flex items-center gap-2 border-t border-(--mx-line) px-6 py-4 text-[12.5px] leading-none text-(--mx-faint)">
            {f.show_me ? (
              <>
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#4cc773]" aria-hidden="true" />
                Members see you when you’re in the building
              </>
            ) : (
              "Hidden when you’re in the building"
            )}
          </p>
        </div>

        </>
        )}

        {/* On the Connection Wall: the same pieces as the wall's card (Ed, 2026-10-29), always on
            the wall's dark, whatever the members-area theme. */}
        {preview !== "member" && (
        <>
        <p className={`${preview === "both" ? "mt-8" : ""} text-[12px] uppercase tracking-[0.16em] text-(--mx-faint)`}>On the Connection Wall</p>
        <div className="mt-3 rounded-[8px] bg-[#0d0a08] p-5 text-white">
          <div className="wall__frame mx-auto max-w-[11rem]">
            {f.portrait_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- member portrait from Supabase storage
              <img src={f.portrait_url} alt="" className="wall__photo absolute inset-0 h-full w-full" />
            ) : (
              <span className="wall__initials">{(f.first_name.trim()[0] ?? "?").toUpperCase()}</span>
            )}
          </div>
          <div className="mt-5">
            {f.role.trim() && <p className="wall__card-eyebrow">{f.role.trim()}</p>}
            <p className="wall__card-title">{fullName}</p>
            {/* Public, matching the real wall's card (Ed, 2026-10-30): role, name, the line about
                you, what they offer and what they're looking for. Only for members who switch on
                "OK to feature me on the public wall". */}
            {f.bio.trim() ? (
              <p className="wall__story !text-[0.95rem]">{f.bio.trim()}</p>
            ) : (
              <p className="wall__story !text-[0.95rem] italic opacity-50">Your line about you goes here.</p>
            )}
            {(f.offers.trim() || f.looking.trim()) && (
              <dl className="wall__facts">
                {f.offers.trim() && (
                  <>
                    <dt>I offer</dt>
                    <dd>{f.offers.trim()}</dd>
                  </>
                )}
                {f.looking.trim() && (
                  <>
                    <dt>I’m looking for</dt>
                    <dd>{f.looking.trim()}</dd>
                  </>
                )}
              </dl>
            )}
          </div>
        </div>
        {/* Framed so it isn't missed (Ed, 2026-10-30): this is what goes public. */}
        <div className="mt-4 flex gap-3.5 rounded-[8px] rounded-bl-none border border-[#d4a030]/45 bg-[linear-gradient(135deg,rgba(212,160,48,0.12),rgba(212,160,48,0.03))] p-4 shadow-[inset_0_1px_0_rgba(212,160,48,0.15)]">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d4a030]/60 text-(--mx-gold-text)">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-(--mx-gold-text)">{f.on_wall ? "Public on the website" : "Not on the wall"}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-(--mx-soft)">
              {f.on_wall
                ? "George may feature you on the website’s Connection Wall. Your photo, role, name, line about you, what you offer and what you’re looking for are public there. Never your contact details."
                : "Only shown if you turn on “OK to feature me on the public wall” in Privacy."}
            </p>
          </div>
        </div>
        </>
        )}
      </aside>
    </form>
  );
}

/** Pop-up and chime for new messages; the chime plays once when switched on, as a sample. */
function AlertToggles() {
  const prefs = alertPrefsFrom(useSyncExternalStore(subAlertPrefs, readAlertPrefs, serverAlertPrefs));
  return (
    <div className="mt-4 grid gap-3">
      <Toggle on={prefs.popup} onChange={(v) => setAlertPrefs({ ...prefs, popup: v })} title="Pop-up" note="A note bottom right with who it’s from and the start of the message. Tap it to reply." />
      <Toggle
        on={prefs.chime}
        onChange={(v) => {
          setAlertPrefs({ ...prefs, chime: v });
          if (v) playChime();
        }}
        title="Chime"
        note="A soft two-note sound when a message arrives."
      />
    </div>
  );
}

/** A password input with a show/hide eye (masked by default), as in the Visibility Tracker. */
function PasswordField({ label, labelClass, fieldClass, value, onChange }: { label: string; labelClass: string; fieldClass: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <label className={labelClass}>
      {label}
      <span className="relative mt-2 block normal-case tracking-normal">
        <input className={`${fieldClass} pr-11`} type={show ? "text" : "password"} autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)} />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[4px] text-(--mx-faint) hover:text-(--mx-text)"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {show ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
        </button>
      </span>
    </label>
  );
}

/** One photo upload: a preview you can click or drop on, its words, and choose / remove. */
function PhotoSlot({
  kind,
  title,
  note,
  url,
  name,
  busy,
  drag,
  msg,
  onPick,
  onDrop,
  onDrag,
  onRemove,
}: {
  kind: PhotoKind;
  title: string;
  note: string;
  url: string;
  name: string;
  busy: boolean;
  drag: boolean;
  msg: { ok: boolean; text: string } | null;
  onPick: () => void;
  onDrop: (file: File | undefined) => void;
  onDrag: (on: boolean) => void;
  onRemove: () => void;
}) {
  const portrait = kind === "portrait";
  return (
    <div
      className={`flex gap-4 rounded-[6px] p-2 transition-colors ${drag ? "bg-[#d4a030]/[0.08] ring-1 ring-[#d4a030]/60" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        onDrag(true);
      }}
      onDragLeave={() => onDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDrag(false);
        onDrop(e.dataTransfer.files?.[0]);
      }}
    >
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        aria-label={url ? `Change your ${title.toLowerCase()}` : `Add a ${title.toLowerCase()}`}
        className={`group relative shrink-0 overflow-hidden ${
          portrait ? "h-[7.5rem] w-24 rounded-[4px] ring-1 ring-[#d4a030]/50" : "h-24 w-24 rounded-full ring-2 ring-[#d4a030] ring-offset-4 ring-offset-(--mx-bg)"
        }`}
      >
        {portrait ? (
          url ? (
            // eslint-disable-next-line @next/next/no-img-element -- member portrait from Supabase storage
            <img src={url} alt="" className="h-full w-full object-cover grayscale" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-[#2a2420] font-[family-name:var(--font-lora)] text-2xl italic text-white/50">{(name.trim()[0] ?? "?").toUpperCase()}</span>
          )
        ) : (
          <Avatar url={url} name={name} size={96} />
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/55 text-[12px] font-medium uppercase tracking-[0.14em] text-white opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? "…" : url ? "Change" : "Add"}
        </span>
      </button>
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-(--mx-text)">{title}</p>
        <p className="mt-1 text-[13px] leading-snug text-(--mx-muted)">{note}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px]">
          <button type="button" onClick={onPick} disabled={busy} className="font-medium text-(--mx-gold-text) disabled:opacity-50">
            {busy ? "Saving…" : url ? "Choose a new one" : "Choose a photo"}
          </button>
          {url && !busy && (
            <button type="button" onClick={onRemove} className="text-(--mx-muted) hover:text-(--mx-text)">
              Remove
            </button>
          )}
        </div>
        {msg && <p className={`mt-1.5 text-[13px] ${msg.ok ? "text-(--mx-gold-text)" : "text-(--mx-error)"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}

/** The member's photo, or their initial on gold. A plain <img>: it lives in Supabase storage. */
function Avatar({ url, name, size }: { url: string; name: string; size: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- member photo from Supabase storage (not a site asset)
    return <img src={url} alt="" width={size} height={size} className="h-full w-full object-cover" />;
  }
  return (
    <span className="grid h-full w-full place-items-center bg-[#d4a030] font-bold text-[#050505]" style={{ fontSize: Math.round(size * 0.4) }}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

function Toggle({ on, onChange, title, note }: { on: boolean; onChange: (v: boolean) => void; title: string; note: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-start gap-3 rounded-[6px] border border-(--mx-line) bg-(--mx-panel) p-4 text-left transition-colors hover:border-(--mx-line-strong)">
      <span className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-[4px] transition-colors ${on ? "bg-[#d4a030]" : "bg-(--mx-line-strong)"}`} aria-hidden>
        <span className={`absolute top-1 h-4 w-4 rounded-[3px] bg-white shadow transition-all ${on ? "left-5" : "left-1"}`} />
      </span>
      <span>
        <span className="block text-[15px] text-(--mx-text)">{title}</span>
        <span className="mt-0.5 block text-[13px] text-(--mx-muted)">{note}</span>
      </span>
    </button>
  );
}
