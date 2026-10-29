"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import ForwardArrow from "../components/ForwardArrow";
import SocialTags from "./SocialTags";
import { membersBrowser } from "../../lib/members/browser";
import { parseSocial, socialLabel } from "../../lib/social";
import { setSession } from "../../lib/venue/session";

/**
 * A member's profile + password (Ed, 2026-10-28).
 *   mode "setup"   first time, from the invite email: profile + choose a password (required)
 *   mode "reset"   from a forgot-password email: just a new password (required)
 *   mode "account" My profile, any time: profile, and a new password only if they type one
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
  socials: string[];
};

const MIN = 8;
const PHOTO_PX = 512;
const EMPTY: Fields = { first_name: "", last_name: "", role: "", offers: "", looking: "", show_me: true, on_wall: false, photo_url: "", socials: [] };

/** Center-crop to a square, shrink to 512px, encode as WebP. Throws if the browser can't read it. */
async function squareWebp(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("unreadable"));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(PHOTO_PX, side);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    if (!blob) throw new Error("encode");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ProfileForm({ mode, next = "/members" }: { mode: Mode; next?: string }) {
  const sb = membersBrowser();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [f, setF] = useState<Fields>(EMPTY);
  const [socialDraft, setSocialDraft] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      const { data: row } = await sb.from("members").select("first_name, last_name, role, offers, looking, show_me, on_wall, photo_url, socials").eq("id", u.id).maybeSingle();
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
          socials: Array.isArray(r.socials) ? (r.socials as unknown[]).filter((s): s is string => typeof s === "string") : [],
        });
      }
      setLoaded(true);
    })();
  }, [sb]);

  if (!sb) return <p className="text-(--mx-muted)">Member accounts aren’t switched on yet.</p>;
  if (!loaded) return <p className="text-(--mx-muted)">Loading your profile…</p>;

  const needsPw = mode !== "account";
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((x) => ({ ...x, [k]: v }));

  // ── Photo: saves on its own, straight away ──
  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoMsg(null);
    if (!file.type.startsWith("image/")) return setPhotoMsg({ ok: false, text: "That isn’t an image. Try a JPG or PNG." });
    if (file.size > 20 * 1024 * 1024) return setPhotoMsg({ ok: false, text: "That photo is over 20 MB. Try a smaller one." });
    setPhotoBusy(true);
    try {
      const blob = await squareWebp(file);
      // Safari can't encode WebP and hands back a PNG: name and label the file by what it really is.
      const type = blob.type === "image/webp" || blob.type === "image/png" || blob.type === "image/jpeg" ? blob.type : "image/png";
      const path = `${userId}/${Date.now()}.${type.split("/")[1]}`;
      const { error: upErr } = await sb.storage.from("avatars").upload(path, blob, { contentType: type, cacheControl: "31536000" });
      if (upErr) {
        console.error("[avatar] upload failed:", upErr);
        throw new Error(/bucket not found/i.test(upErr.message) ? "no-bucket" : /row-level security|policy|unauthorized/i.test(upErr.message) ? "denied" : "upload");
      }
      const url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error: dbErr } = await sb.from("members").update({ photo_url: url }).eq("id", userId);
      if (dbErr) {
        console.error("[avatar] saving photo_url failed:", dbErr);
        throw new Error("db");
      }
      set("photo_url", url);
      setSession({ photo: url });
      setPhotoMsg({ ok: true, text: "Photo updated." });
      // Tidy up: keep only the new file in their folder.
      const { data: files } = await sb.storage.from("avatars").list(userId);
      const old = (files ?? []).map((x) => `${userId}/${x.name}`).filter((p) => p !== path);
      if (old.length) await sb.storage.from("avatars").remove(old);
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setPhotoMsg({
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
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setPhotoMsg(null);
    const { error } = await sb.from("members").update({ photo_url: null }).eq("id", userId);
    if (error) {
      setPhotoBusy(false);
      return setPhotoMsg({ ok: false, text: "Couldn’t remove your photo. Try again in a moment." });
    }
    const { data: files } = await sb.storage.from("avatars").list(userId);
    if (files?.length) await sb.storage.from("avatars").remove(files.map((x) => `${userId}/${x.name}`));
    set("photo_url", "");
    setSession({ photo: "" });
    setPhotoBusy(false);
    setPhotoMsg({ ok: true, text: "Photo removed." });
  };

  // ── Everything else: saves with the button ──
  const save = async () => {
    setMsg(null);
    if (mode !== "reset" && !f.first_name.trim()) return setMsg({ ok: false, text: "Add your first name." });
    if (needsPw || pw) {
      if (pw.length < MIN) return setMsg({ ok: false, text: `Choose a password of at least ${MIN} characters.` });
      if (pw !== pw2) return setMsg({ ok: false, text: "The two passwords don’t match." });
    }
    setBusy(true);
    if (mode !== "reset") {
      // Anything typed in the socials field but never "added" still counts.
      const draft = socialDraft.replace(/,+$/, "").trim();
      const socials = (draft && !f.socials.includes(draft) ? [...f.socials, draft] : f.socials).slice(0, 8).map((s) => s.slice(0, 200));
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

  const passwordBlock = (
    <div className={mode === "reset" ? "" : section}>
      {mode !== "reset" && (
        <>
          <p className={sectionTitle}>Password</p>
          <p className={sectionNote}>{mode === "account" ? "Leave blank to keep your current one." : "For signing in from now on, with your email."}</p>
        </>
      )}
      <div className={`grid gap-5 sm:grid-cols-2 ${mode === "reset" ? "" : "mt-5"}`}>
        <label className={label}>
          {mode === "account" ? "New password" : "Password"}
          <input className={`${field} mt-2 normal-case tracking-normal`} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={`At least ${MIN} characters`} />
        </label>
        <label className={label}>
          Type it again
          <input className={`${field} mt-2 normal-case tracking-normal`} type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </label>
      </div>
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

  const fullName = [f.first_name, f.last_name].map((s) => s.trim()).filter(Boolean).join(" ") || "Your name";

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
      <div className="min-w-0 space-y-6">
        <p className="text-[14px] text-(--mx-muted)">
          Signed in as <span className="text-(--mx-soft)">{email}</span>. That’s your username.
        </p>

        {/* Photo */}
        <div
          className={`${section} transition-colors ${drag ? "border-[#d4a030]/70 bg-[#d4a030]/[0.06]" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void uploadPhoto(e.dataTransfer.files?.[0]);
          }}
        >
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoBusy}
              aria-label={f.photo_url ? "Change your photo" : "Add a photo"}
              className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 ring-[#d4a030] ring-offset-4 ring-offset-(--mx-bg)"
            >
              <Avatar url={f.photo_url} name={f.first_name} size={96} />
              <span className="absolute inset-0 grid place-items-center bg-black/55 text-[12px] font-medium uppercase tracking-[0.14em] text-(--mx-text) opacity-0 transition-opacity group-hover:opacity-100">
                {photoBusy ? "…" : f.photo_url ? "Change" : "Add"}
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p className={sectionTitle}>Your photo</p>
              <p className={sectionNote}>A clear photo of your face works best. Drop one here or choose a file.</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px]">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy} className="font-medium text-(--mx-gold-text) hover:text-(--mx-gold-text) disabled:opacity-50">
                  {photoBusy ? "Saving…" : f.photo_url ? "Choose a new photo" : "Choose a photo"}
                </button>
                {f.photo_url && !photoBusy && (
                  <button type="button" onClick={() => void removePhoto()} className="text-(--mx-muted) hover:text-(--mx-text)">
                    Remove
                  </button>
                )}
                {photoMsg && <span className={photoMsg.ok ? "text-(--mx-gold-text)" : "text-(--mx-error)"}>{photoMsg.text}</span>}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void uploadPhoto(e.target.files?.[0])} />
          </div>
        </div>

        {/* About you */}
        <div className={section}>
          <p className={sectionTitle}>About you</p>
          <p className={sectionNote}>What other members see on your card.</p>
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

        {/* Privacy */}
        <div className={section}>
          <p className={sectionTitle}>Privacy</p>
          <div className="mt-5 grid gap-3">
            <Toggle on={f.show_me} onChange={(v) => set("show_me", v)} title="Show me to other members" note="When you check in, other members see you’re in the building." />
            <Toggle on={f.on_wall} onChange={(v) => set("on_wall", v)} title="OK to feature me on the public wall" note="George may add you to the Connection Wall on the website." />
          </div>
        </div>

        {passwordBlock}

        {actions}
      </div>

      {/* How members see you */}
      <aside className="lg:sticky lg:top-[calc(var(--mx-sticky,var(--hdr-h,96px))+24px)]">
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
          <p className="border-t border-(--mx-line) px-6 py-4 text-[12.5px] text-(--mx-faint)">
            {f.show_me ? (
              <>
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4cc773] align-middle" aria-hidden="true" />
                Members see you when you’re in the building
              </>
            ) : (
              "Hidden when you’re in the building"
            )}
          </p>
        </div>
      </aside>
    </form>
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
