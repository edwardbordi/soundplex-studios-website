"use client";

import { useEffect } from "react";
import { membersBrowser } from "../../lib/members/browser";
import { getVenueSession, onVenueSession, setSession } from "../../lib/venue/session";
import { PRESENCE_EVENT } from "../../lib/members/presence";
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

    // Check-ins live in the database (Ed, 2026-10-30), so other members see who's at the Plex
    // (the dot on avatars). The database copy wins on load (it lapses on its own: 4 h here,
    // 1 h on the way); after that, every check-in, move or check-out here is saved there.
    let me: string | null = null;
    let synced: { checkedIn: string | null; onWay: string | null } = { checkedIn: null, onWay: null };

    const saveCheckIn = async (userId: string, at: typeof synced) => {
      const room = at.checkedIn ?? at.onWay;
      if (room) {
        const here = !!at.checkedIn;
        await sb
          .from("check_ins")
          .upsert(
            { member_id: userId, room, kind: here ? "here" : "on_way", created_at: new Date().toISOString(), expires_at: new Date(Date.now() + (here ? 4 : 1) * 3_600_000).toISOString() },
            { onConflict: "member_id" },
          );
      } else {
        await sb.from("check_ins").delete().eq("member_id", userId);
      }
      window.dispatchEvent(new Event(PRESENCE_EVENT));
    };

    const unwatch = onVenueSession(() => {
      const s = getVenueSession();
      if (!me || !s.member) return;
      if (s.checkedIn === synced.checkedIn && s.onWay === synced.onWay) return;
      synced = { checkedIn: s.checkedIn, onWay: s.onWay };
      void saveCheckIn(me, synced);
    });

    const load = async (userId: string | null) => {
      if (!userId) {
        me = null;
        setSession({ member: false, checkedIn: null, onWay: null, photo: "" });
        return;
      }
      const [{ data }, { data: ci }] = await Promise.all([
        sb.from("members").select("first_name, show_me, status, photo_url").eq("id", userId).maybeSingle(),
        sb.from("check_ins").select("room, kind").eq("member_id", userId).maybeSingle(),
      ]);
      const row = data as Pick<MemberRow, "first_name" | "show_me" | "status" | "photo_url"> | null;
      if (!row || row.status !== "active") {
        me = null;
        setSession({ member: false, checkedIn: null, onWay: null, photo: "" });
        return;
      }
      const c = ci as { room: string; kind: "here" | "on_way" } | null;
      synced = { checkedIn: c?.kind === "here" ? c.room : null, onWay: c?.kind === "on_way" ? c.room : null };
      me = userId;
      setSession({ member: true, name: row.first_name, showMe: row.show_me, photo: row.photo_url ?? "", ...synced });
    };

    void sb.auth.getUser().then(({ data }) => load(data.user?.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => void load(s?.user?.id ?? null));
    return () => {
      sub.subscription.unsubscribe();
      unwatch();
    };
  }, []);
  return null;
}
