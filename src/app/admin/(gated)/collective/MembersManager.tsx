"use client";

import { useState, useTransition } from "react";
import { Button, Card, EmptyState, PageHeader, StatusPill, Tabs } from "@realiizlabs/admin/shell";
import { inviteMember, removeMember, setMemberStatus } from "@/lib/members/admin-actions";
import type { MemberRow } from "@/lib/members/env";

/**
 * The Members screen inside Studio, built from Studio's own pieces (PageHeader, Tabs, the
 * rz-table, StatusPill) so it matches the Connection Wall and every other list (Ed, 2026-10-28).
 */
type Filter = "all" | "active" | "paused";

const fullName = (m: MemberRow) => [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function MembersManager({ initial, configured, loadError }: { initial: MemberRow[]; configured: boolean; loadError: string | null }) {
  const [members, setMembers] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  const [inviting, setInviting] = useState(initial.length === 0);

  if (!configured) {
    return (
      <>
        <PageHeader eyebrow="People/members" title="Members" />
        <Card title="The members database isn’t connected yet">
          <p>Add these to the site’s environment variables (Vercel → Settings → Environment Variables), then redeploy:</p>
          <ul className="mt-2 list-disc pl-6 font-mono text-sm">
            <li>NEXT_PUBLIC_MEMBERS_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_MEMBERS_SUPABASE_ANON_KEY</li>
            <li>MEMBERS_SUPABASE_SERVICE_ROLE_KEY</li>
          </ul>
        </Card>
      </>
    );
  }

  const shown = members.filter((m) => filter === "all" || m.status === filter);
  const count = (s: "active" | "paused") => members.filter((m) => m.status === s).length;

  const invite = (form: HTMLFormElement) => {
    const data = new FormData(form);
    start(async () => {
      const res = await inviteMember(data);
      setMsg(res.ok ? { ok: true, text: res.message ?? "Invite sent." } : { ok: false, text: res.error });
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
      setMsg({ ok: true, text: s === "paused" ? `${m.first_name || m.email} is paused. They can sign in but see nothing.` : `${m.first_name || m.email} is active again.` });
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

  const linkBtn = "cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[inherit] hover:underline disabled:opacity-50";

  return (
    <>
      <PageHeader
        eyebrow="People/members"
        title="Members"
        subtitle="The Plex Collective. Invite someone once their membership is paid; they get an email to set up their account. Pause a membership that lapses; they keep their profile but see nothing."
        actions={
          <Button variant="primary" onClick={() => setInviting((v) => !v)}>
            {inviting ? "Close" : "Invite member"}
          </Button>
        }
      />

      {inviting && (
        <form
          className="mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            invite(e.currentTarget);
          }}
        >
          <Card title="Invite a member">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="acct-field">
                <label htmlFor="inv-first" className="acct-label">First name</label>
                <input id="inv-first" name="first_name" required className="acct-input" />
              </div>
              <div className="acct-field">
                <label htmlFor="inv-last" className="acct-label">Last name</label>
                <input id="inv-last" name="last_name" className="acct-input" />
              </div>
              <div className="acct-field">
                <label htmlFor="inv-role" className="acct-label">What they do</label>
                <input id="inv-role" name="role" placeholder="Producer, vocalist…" className="acct-input" />
              </div>
              <div className="acct-field">
                <label htmlFor="inv-email" className="acct-label">Email</label>
                <input id="inv-email" name="email" type="email" required className="acct-input" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Sending…" : "Send invite"}
              </Button>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>They’ll get an email to choose a password and fill in their profile.</span>
            </div>
          </Card>
        </form>
      )}

      {msg && (
        <p role="status" className={`mb-4 text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}
      {loadError && <p className="mb-4 text-sm text-red-600">Couldn’t load the list: {loadError}</p>}

      {members.length === 0 ? (
        <EmptyState title="No members yet">Invite the first one above.</EmptyState>
      ) : (
        <>
          <Tabs
            label="Show"
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            options={[
              { value: "all", label: "All", suffix: String(members.length) },
              { value: "active", label: "Active", suffix: String(count("active")) },
              { value: "paused", label: "Paused", suffix: String(count("paused")) },
            ]}
          />
          <div className="rz-table-wrap">
            <table className="rz-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th className="rz-fit">Invited</th>
                  <th className="rz-fit">Status</th>
                  <th className="rz-fit" />
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="rz-muted">Nobody here with that filter.</td>
                  </tr>
                ) : (
                  shown.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span>{fullName(m)}</span>
                        {m.role && <span className="rz-muted"> · {m.role}</span>}
                        <div className="rz-muted rz-slug">{m.email}</div>
                      </td>
                      <td className="rz-muted rz-fit" title={m.invited_by ? `Invited by ${m.invited_by}` : undefined}>
                        {fmtDate(m.created_at)}
                      </td>
                      <td className="rz-fit">
                        <StatusPill tone={m.status === "active" ? "up" : "neutral"}>{m.status === "active" ? "Active" : "Paused"}</StatusPill>
                      </td>
                      <td className="rz-fit">
                        {m.status === "active" ? (
                          <button type="button" disabled={pending} onClick={() => status(m, "paused")} className={linkBtn}>
                            Pause
                          </button>
                        ) : (
                          <button type="button" disabled={pending} onClick={() => status(m, "active")} className={linkBtn}>
                            Reactivate
                          </button>
                        )}
                        {" · "}
                        <button type="button" disabled={pending} onClick={() => remove(m)} className={`${linkBtn} text-red-600`}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
