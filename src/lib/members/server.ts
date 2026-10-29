import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { membersAnonKey, membersConfigured, membersUrl, type MemberRow } from "./env";

/**
 * Server-side access to the members project.
 *   membersServer() — AS THE VISITOR (their session cookie; RLS applies). For "who is this?".
 *   membersAdmin()  — AS THE SITE (service-role key; bypasses RLS). ONLY behind Studio's
 *                     requireAdmin() (invite / pause / remove) or a verified webhook. Never in a
 *                     response, never imported by a client component (server-only enforces it).
 */
export async function membersServer(): Promise<SupabaseClient | null> {
  if (!membersConfigured()) return null;
  const jar = await cookies();
  return createServerClient(membersUrl(), membersAnonKey(), {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        // Server components can't set cookies; route handlers / actions can. Ignore the former.
        try {
          for (const c of list) jar.set(c.name, c.value, c.options);
        } catch {
          /* read-only context */
        }
      },
    },
  });
}

export function membersAdminConfigured() {
  return membersConfigured() && !!process.env.MEMBERS_SUPABASE_SERVICE_ROLE_KEY;
}

export function membersAdmin(): SupabaseClient {
  const key = process.env.MEMBERS_SUPABASE_SERVICE_ROLE_KEY;
  if (!membersConfigured() || !key) throw new Error("Members project isn't configured (MEMBERS_SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(membersUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** The signed-in member's own row, or null (signed out, not a member, or not configured). */
export async function currentMember(): Promise<MemberRow | null> {
  const sb = await membersServer();
  if (!sb) return null;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("members").select("*").eq("id", auth.user.id).maybeSingle();
  return (data as MemberRow | null) ?? null;
}
