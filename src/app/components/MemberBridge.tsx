"use client";

import { useEffect } from "react";
import { membersBrowser } from "../../lib/members/browser";
import { setSession } from "../../lib/venue/session";
import type { MemberRow } from "../../lib/members/env";

/**
 * Keeps the site's member session (lib/venue/session: what the board, the account menu and the
 * members' area read) in step with the REAL sign-in (Supabase), once the members project is
 * connected. Mounted once in the root layout; renders nothing.
 *   signed in + active  → member: true, their first name, their "show me" setting
 *   signed in + paused  → member: false (they can sign in, but see nothing)
 *   signed out          → member: false, no check-in
 * With the members project NOT connected it does nothing, and the demo login keeps working.
 */
export default function MemberBridge() {
  useEffect(() => {
    const sb = membersBrowser();
    if (!sb) return;

    // Safety net (Ed, 2026-10-28): an emailed link that lands on the WRONG page (Supabase falls back
    // to its Site URL when a redirect isn't on its allow list) arrives as ?code=… on, say, the home
    // page, and nothing signs you in. Hand it to /members/welcome, which finishes the job (and asks
    // for a password if there isn't one yet). Studio's own sign-in (/admin) is left alone.
    const here = new URL(window.location.href);
    const code = here.searchParams.get("code");
    if (code && !here.pathname.startsWith("/members/welcome") && !here.pathname.startsWith("/admin")) {
      here.searchParams.delete("code");
      const next = here.pathname + (here.search || "") + here.hash;
      window.location.replace(`/members/welcome?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next === "/" ? "/members" : next)}`);
      return;
    }

    const load = async (userId: string | null) => {
      if (!userId) {
        setSession({ member: false, checkedIn: null, onWay: null, photo: "" });
        return;
      }
      const { data } = await sb.from("members").select("first_name, show_me, status, photo_url").eq("id", userId).maybeSingle();
      const row = data as Pick<MemberRow, "first_name" | "show_me" | "status" | "photo_url"> | null;
      if (!row || row.status !== "active") {
        setSession({ member: false, checkedIn: null, onWay: null, photo: "" });
        return;
      }
      setSession({ member: true, name: row.first_name, showMe: row.show_me, photo: row.photo_url ?? "" });
    };

    void sb.auth.getUser().then(({ data }) => load(data.user?.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => void load(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}
