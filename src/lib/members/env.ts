/**
 * The members' Supabase project (soundplex-members), read lazily so the build needs none of it.
 * Not configured (no keys yet) → the site keeps the demo "preview" login, and Studio's Members
 * screen says what's missing. See .env.example → "Members (SoundPlex)".
 */
export const membersUrl = () => process.env.NEXT_PUBLIC_MEMBERS_SUPABASE_URL ?? "";
export const membersAnonKey = () => process.env.NEXT_PUBLIC_MEMBERS_SUPABASE_ANON_KEY ?? "";

/** True when the browser + server can talk to the members project. */
export const membersConfigured = () => !!(membersUrl() && membersAnonKey());

/** The profile row (public.members), as the app uses it. */
export type MemberRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  bio: string;
  offers: string;
  looking: string;
  photo_url: string | null;
  show_me: boolean;
  on_wall: boolean;
  status: "active" | "paused";
  invited_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Where the emailed sign-in / invite link lands (it finishes the sign-in, then moves on). */
export const AUTH_LANDING = "/members/welcome";
