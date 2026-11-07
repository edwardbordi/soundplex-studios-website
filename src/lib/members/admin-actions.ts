"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { studio } from "../admin/studio";
import { membersAdmin, membersAdminConfigured } from "./server";
import { AUTH_LANDING, type MemberRow } from "./env";

/**
 * Studio's Members screen (Ed, 2026-10-28). Invitation only: George (or his team) invites a member
 * after checking the membership is paid; the member gets an email, clicks it, and is signed in.
 *
 * EVERY action re-checks Studio's admin session FIRST (studio.requireAdmin(); it throws when the
 * person isn't signed in to Studio for this site), and only then uses the service-role key.
 */
export type MembersResult = { ok: true; message?: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** A member row plus their sign-in state, for Studio's list. */
export type AdminMember = MemberRow & {
  /** Invited, but hasn't finished setting up (no password chosen yet). */
  pending: boolean;
  last_sign_in_at: string | null;
};

export async function listMembers(): Promise<{ ok: true; members: AdminMember[] } | { ok: false; error: string }> {
  await studio.requireAdmin();
  if (!membersAdminConfigured()) return { ok: false, error: "not-configured" };
  const admin = membersAdmin();
  const [{ data, error }, users] = await Promise.all([
    admin.from("members").select("*").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (error) return { ok: false, error: error.message };
  const byId = new Map((users.data?.users ?? []).map((u) => [u.id, u]));
  const members = ((data ?? []) as MemberRow[]).map((m) => {
    const u = byId.get(m.id);
    return { ...m, pending: !u?.user_metadata?.password_set, last_sign_in_at: u?.last_sign_in_at ?? null };
  });
  return { ok: true, members };
}

const landing = async (query: string) => `${await origin()}${AUTH_LANDING}?${query}`;

/**
 * Resend an invite (Ed, 2026-11-07) to someone who hasn't finished setting up. If they've never
 * opened the first one, it's the same invite email again. If they opened it but never chose a
 * password (or Supabase won't re-invite), they get a sign-in link instead, which lands on
 * "Set up your account" just the same.
 */
export async function resendInvite(id: string): Promise<MembersResult> {
  await studio.requireAdmin();
  if (!membersAdminConfigured()) return { ok: false, error: "The members database isn’t connected yet." };
  const admin = membersAdmin();
  const { data: m } = await admin.from("members").select("email, first_name").eq("id", id).maybeSingle();
  if (!m?.email) return { ok: false, error: "Couldn’t find that member." };
  const redirectTo = await landing(`next=${encodeURIComponent("/members")}`);

  const { data: u } = await admin.auth.admin.getUserById(id);
  if (u.user?.user_metadata?.password_set) return { ok: false, error: `${m.first_name || m.email} has already set up their account. Send a password reset instead.` };

  if (!u.user?.email_confirmed_at) {
    const { error } = await admin.auth.admin.inviteUserByEmail(m.email, { redirectTo, data: { first_name: m.first_name } });
    if (!error) return { ok: true, message: `Invite sent again to ${m.email}.` };
  }
  const { error } = await admin.auth.signInWithOtp({ email: m.email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } });
  if (error) return { ok: false, error: /rate|seconds/i.test(error.message) ? "An email was just sent. Wait a minute and try again." : `Couldn’t send it: ${error.message}` };
  return { ok: true, message: `A fresh sign-in link is on its way to ${m.email}. It takes them to “Set up your account”.` };
}

/** Send a member the "choose a new password" email (Ed, 2026-11-07). */
export async function sendPasswordReset(id: string): Promise<MembersResult> {
  await studio.requireAdmin();
  if (!membersAdminConfigured()) return { ok: false, error: "The members database isn’t connected yet." };
  const admin = membersAdmin();
  const { data: m } = await admin.from("members").select("email, first_name").eq("id", id).maybeSingle();
  if (!m?.email) return { ok: false, error: "Couldn’t find that member." };
  const { error } = await admin.auth.resetPasswordForEmail(m.email, {
    redirectTo: await landing(`reset=1&next=${encodeURIComponent("/members")}`),
  });
  if (error) return { ok: false, error: /rate|seconds/i.test(error.message) ? "An email was just sent. Wait a minute and try again." : `Couldn’t send it: ${error.message}` };
  return { ok: true, message: `Password reset sent to ${m.email}. The link lets them choose a new password.` };
}

export async function inviteMember(form: FormData): Promise<MembersResult> {
  const session = await studio.requireAdmin();
  if (!membersAdminConfigured()) return { ok: false, error: "The members database isn’t connected yet." };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const first = String(form.get("first_name") ?? "").trim().slice(0, 60);
  const last = String(form.get("last_name") ?? "").trim().slice(0, 60);
  const role = String(form.get("role") ?? "").trim().slice(0, 80);
  if (!EMAIL_RE.test(email)) return { ok: false, error: "That email doesn’t look right." };
  if (!first) return { ok: false, error: "Add their first name." };

  const admin = membersAdmin();
  const invitedBy = session.user.email ?? "Studio";

  // Already a member (maybe paused)? Re-activate instead of inviting twice.
  const { data: existing } = await admin.from("members").select("id, status").eq("email", email).maybeSingle();
  if (existing) {
    await admin.from("members").update({ status: "active", first_name: first, last_name: last, role }).eq("id", existing.id);
    revalidatePath("/admin/collective");
    return { ok: true, message: `${first} was already on the list. Their membership is active.` };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${await origin()}${AUTH_LANDING}?next=${encodeURIComponent("/members")}`,
    data: { first_name: first },
  });
  if (error || !data.user) {
    return { ok: false, error: /already|registered|exists/i.test(error?.message ?? "") ? "That email already has an account. Ask Ed to link it." : `Couldn’t send the invite: ${error?.message ?? "unknown error"}` };
  }

  const { error: rowError } = await admin.from("members").insert({
    id: data.user.id,
    email,
    first_name: first,
    last_name: last,
    role,
    status: "active",
    invited_by: invitedBy,
  });
  if (rowError) return { ok: false, error: `Invite sent, but saving the profile failed: ${rowError.message}` };

  revalidatePath("/admin/collective");
  return { ok: true, message: `Invite sent to ${email}.` };
}

export async function setMemberStatus(id: string, status: "active" | "paused"): Promise<MembersResult> {
  await studio.requireAdmin();
  if (!membersAdminConfigured()) return { ok: false, error: "The members database isn’t connected yet." };
  const admin = membersAdmin();
  const { error } = await admin.from("members").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  // Pausing also clears where they're checked in, so they vanish from "who's here" at once.
  if (status === "paused") await admin.from("check_ins").delete().eq("member_id", id);
  revalidatePath("/admin/collective");
  return { ok: true };
}

export async function removeMember(id: string): Promise<MembersResult> {
  await studio.requireAdmin();
  if (!membersAdminConfigured()) return { ok: false, error: "The members database isn’t connected yet." };
  // Deleting the login cascades to their profile, check-ins and RSVPs.
  const { error } = await membersAdmin().auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/collective");
  return { ok: true };
}
