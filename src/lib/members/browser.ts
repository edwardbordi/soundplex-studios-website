"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { membersAnonKey, membersConfigured, membersUrl } from "./env";

/**
 * The members' Supabase client for the browser: one per tab. The session lives in cookies
 * (@supabase/ssr), so the server can read it too. Null when the members project isn't set up.
 */
let client: SupabaseClient | null = null;

export function membersBrowser(): SupabaseClient | null {
  if (!membersConfigured()) return null;
  if (!client) client = createBrowserClient(membersUrl(), membersAnonKey());
  return client;
}
