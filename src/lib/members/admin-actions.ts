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

export async function listMembers(): Promise<{ ok: true; members: MemberRow[] } | { ok: false; error: string }> {
  await studio.requireAdmin();
  if (!membersAdminConfigured()) return { ok: false, error: "not-configured" };
  const { data, error } = await membersAdmin().from("members").select("*").order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, members: (data ?? []) as MemberRow[] };
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
    revalidatePath("/admin/members");
    return { ok: true, message: `${first} was already on the list. Their membership is active.` };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${await origin()}${AUTH_LANDING}?next=${encodeURIComponent("/studio-productions#members")}`,
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

  revalidatePath("/admin/members");
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
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function removeMember(id: string): Promise<MembersResult> {
  await studio.requireAdmin();
  if (!membersAdminConfigured()) return { ok: false, error: "The members database isn’t connected yet." };
  // Deleting the login cascades to their profile, check-ins and RSVPs.
  const { error } = await membersAdmin().auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/members");
  return { ok: true };
}
