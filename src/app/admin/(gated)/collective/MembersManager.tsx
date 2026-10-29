"use client";

import { useState, useTransition } from "react";
import { inviteMember, removeMember, setMemberStatus } from "@/lib/members/admin-actions";
import type { MemberRow } from "@/lib/members/env";

/**
 * The Members screen inside Studio. Neutral styling (currentColor + opacity) so it sits in
 * Studio's own shell, whatever its theme.
 */
export default function MembersManager({ initial, configured, loadError }: { initial: MemberRow[]; configured: boolean; loadError: string | null }) {
  const [members, setMembers] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  if (!configured) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="mt-3 opacity-70">The members database isn’t connected yet. Add these to the site’s environment variables (Vercel → Settings → Environment Variables), then redeploy:</p>
        <ul className="mt-3 list-disc pl-6 font-mono text-sm opacity-80">
          <li>NEXT_PUBLIC_MEMBERS_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_MEMBERS_SUPABASE_ANON_KEY</li>
          <li>MEMBERS_SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
      </div>
    );
  }

  const shown = members.filter((m) => filter === "all" || m.status === filter);
  const count = (s: "active" | "paused") => members.filter((m) => m.status === s).length;

  const invite = (form: HTMLFormElement) => {
    const data = new FormData(form);
    start(async () => {
      const res = await inviteMember(data);
      setMsg(res.ok ? { ok: true, text: res.message ?? "Done." } : { ok: false, text: res.error });
      if (res.ok) {
        form.reset();
        window.location.reload(); // pick up the new row (the server revalidated the list)
      }
    });
  };

  const status = (m: MemberRow, s: "active" | "paused") =>
    start(async () => {
      const res = await setMemberStatus(m.id, s);
      if (!res.ok) return setMsg({ ok: false, text: res.error });
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, status: s } : x)));
      setMsg({ ok: true, text: s === "paused" ? `${m.first_name} is paused. They can sign in but see nothing.` : `${m.first_name} is active again.` });
    });

  const remove = (m: MemberRow) => {
    if (!window.confirm(`Remove ${m.first_name || m.email} completely? This deletes their login, profile, check-ins and RSVPs. To keep them for later, Pause instead.`)) return;
    start(async () => {
      const res = await removeMember(m.id);
      if (!res.ok) return setMsg({ ok: false, text: res.error });
      setMembers((list) => list.filter((x) => x.id !== m.id));
      setMsg({ ok: true, text: `${m.first_name || m.email} was removed.` });
    });
  };

  const input = "w-full rounded-md border border-current/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-current/50";

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">Members</h1>
      <p className="mt-1 text-sm opacity-70">The Plex Collective. Invite someone once their membership is paid; they get an email with a link that signs them in. Pause a membership that lapses; they keep their profile but see nothing.</p>

      {/* Invite */}
      <form
        className="mt-6 grid gap-3 rounded-lg border border-current/15 p-4 sm:grid-cols-[1fr_1fr_1fr_1.4fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          invite(e.currentTarget);
        }}
      >
        <label className="text-xs opacity-70">
          First name
          <input name="first_name" required className={`${input} mt-1`} />
        </label>
        <label className="text-xs opacity-70">
          Last name
          <input name="last_name" className={`${input} mt-1`} />
        </label>
        <label className="text-xs opacity-70">
          What they do
          <input name="role" placeholder="Producer, vocalist…" className={`${input} mt-1`} />
        </label>
        <label className="text-xs opacity-70">
          Email
          <input name="email" type="email" required className={`${input} mt-1`} />
        </label>
        <button type="submit" disabled={pending} className="h-[38px] rounded-md bg-[#d4a030] px-4 text-sm font-semibold text-black hover:bg-[#e2b34e] disabled:opacity-60">
          {pending ? "Working…" : "Send invite"}
        </button>
      </form>

      {msg && (
        <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}
      {loadError && <p className="mt-3 text-sm text-red-600">Couldn’t load the list: {loadError}</p>}

      {/* List */}
      <div className="mt-8 flex items-center gap-2 text-sm">
        {(["all", "active", "paused"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-md border px-3 py-1 ${filter === f ? "border-current/50 font-medium" : "border-current/15 opacity-70"}`}>
            {f === "all" ? `All ${members.length}` : f === "active" ? `Active ${count("active")}` : `Paused ${count("paused")}`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 text-sm opacity-60">{members.length ? "Nobody here with that filter." : "No members yet. Invite the first one above."}</p>
      ) : (
        <ul className="mt-4 divide-y divide-current/10 rounded-lg border border-current/15">
          {shown.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email}
                  {m.role && <span className="ml-2 text-sm font-normal opacity-60">{m.role}</span>}
                </p>
                <p className="truncate text-sm opacity-60">
                  {m.email} · invited {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {m.invited_by ? ` by ${m.invited_by}` : ""}
                  {m.on_wall ? " · OK to show on the wall" : ""}
                </p>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${m.status === "active" ? "bg-emerald-500/15 text-emerald-700" : "bg-current/10 opacity-70"}`}>{m.status === "active" ? "Active" : "Paused"}</span>
              <div className="flex gap-2 text-sm">
                {m.status === "active" ? (
                  <button type="button" disabled={pending} onClick={() => status(m, "paused")} className="rounded-md border border-current/20 px-3 py-1 hover:border-current/50">
                    Pause
                  </button>
                ) : (
                  <button type="button" disabled={pending} onClick={() => status(m, "active")} className="rounded-md border border-current/20 px-3 py-1 hover:border-current/50">
                    Reactivate
                  </button>
                )}
                <button type="button" disabled={pending} onClick={() => remove(m)} className="rounded-md border border-red-500/30 px-3 py-1 text-red-600 hover:border-red-500/60">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
