"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CATEGORIES, categoriesOf } from "../../../../lib/members/categories";
import { startConversation } from "../../../../lib/members/messages";
import { usePresence, type Presence } from "../../../../lib/members/presence";
import { ROOMS } from "../../../../lib/venue/data";
import MemberCard from "../../MemberCard";
import FilterPanel, { ActiveFilters, filterCount, toggleIn, type FilterSel } from "../FilterPanel";
import { Em, PANEL, PageHead } from "../shared";

/** The card's foot: where they are right now, if they're at the Plex (and let members see). */
function presenceNote(at: Presence | undefined) {
  if (!at) return undefined;
  const room = ROOMS.find((r) => r.id === at.room)?.name ?? "the Plex";
  return (
    <>
      <span className={`h-2 w-2 shrink-0 rounded-full ${at.kind === "here" ? "bg-[#4cc773]" : "bg-[#d4a030]"}`} aria-hidden="true" />
      {at.kind === "here" ? `At the Plex · ${room}` : `On the way · ${room}`}
    </>
  );
}

/** Members: the Plex Collective as cards, searchable by name, what they do, offer or look for. */
export type DirMember = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  offers: string;
  looking: string;
  photo_url: string | null;
  socials: string[];
  phone: string | null;
  contact_email: string | null;
  /** Whether I can message them right now (their privacy settings and blocks). */
  can_message: boolean;
};

const whereLabel = (v: string) => (v === "here" ? "At the Plex now" : v === "onway" ? "On their way" : `In ${ROOMS.find((r) => r.id === v)?.name ?? v}`);
const catLabel = (v: string) => CATEGORIES.find((c) => c.id === v)?.label ?? v;

export default function Directory({ list, meId }: { list: DirMember[]; meId: string }) {
  const router = useRouter();
  const presence = usePresence();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<{ id: string; text: string } | null>(null);
  // Opens (or starts) your private conversation with them.
  const message = async (id: string) => {
    setErr(null);
    setBusy(id);
    const r = await startConversation(id);
    if (r.ok) return router.push(`/members/messages/${r.id}`);
    setBusy(null);
    setErr({ id, text: r.error });
  };

  // ── Filters (Ed, 2026-10-31): where they are, what they offer / look for, what they do ──
  const [flt, setFlt] = useState<FilterSel>({});
  const [panel, setPanel] = useState(false);
  const facts = useMemo(
    () => new Map(list.map((m) => [m.id, { offers: categoriesOf(`${m.role} ${m.offers}`), looking: categoriesOf(m.looking), role: m.role.trim() }])),
    [list],
  );
  const roles = useMemo(() => [...new Set(list.map((m) => m.role.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [list]);

  const passes = (m: DirMember, f: FilterSel, skip?: string) => {
    const x = facts.get(m.id);
    if (!x) return true;
    const at = presence.get(m.id);
    const on = (k: string) => (k === skip ? [] : (f[k] ?? []));
    if (on("offers").length && !on("offers").some((c) => x.offers.has(c))) return false;
    if (on("looking").length && !on("looking").some((c) => x.looking.has(c))) return false;
    if (on("roles").length && !on("roles").includes(x.role)) return false;
    if (on("where").length && !on("where").some((w) => (w === "here" ? at?.kind === "here" : w === "onway" ? at?.kind === "on_way" : at?.kind === "here" && at.room === w))) return false;
    if (on("msg").length && !m.can_message) return false;
    return true;
  };

  const needle = q.trim().toLowerCase();
  const searched = needle ? list.filter((m) => [m.first_name, m.last_name, m.role, m.offers, m.looking].join(" ").toLowerCase().includes(needle)) : list;
  const shown = searched.filter((m) => passes(m, flt));
  // Counts next to each option: how many you'd see if you ticked it (the other groups still apply).
  const countFor = (key: string, test: (m: DirMember) => boolean) => searched.filter((m) => passes(m, flt, key) && test(m)).length;
  const active = filterCount(flt);

  const chips = [
    ...(flt.where ?? []).map((v) => ({ key: "where", v, label: whereLabel(v) })),
    ...(flt.offers ?? []).map((v) => ({ key: "offers", v, label: `Offers: ${catLabel(v)}` })),
    ...(flt.looking ?? []).map((v) => ({ key: "looking", v, label: `Looking for: ${catLabel(v)}` })),
    ...(flt.roles ?? []).map((v) => ({ key: "roles", v, label: v })),
    ...(flt.msg ?? []).map((v) => ({ key: "msg", v, label: "Open to messages" })),
  ];

  return (
    <>
      <PageHead
        eyebrow="The Plex Collective"
        title={
          <>
            The <Em>members.</Em>
          </>
        }
        sub={`${list.length} member${list.length === 1 ? "" : "s"}. Find a drummer, a designer, a co-host, a second set of ears.`}
        right={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="relative block min-w-0 flex-1 sm:w-72 sm:flex-none">
              <span className="sr-only">Search members</span>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--mx-faint)" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, skill, need…"
                className="w-full rounded-[4px] border border-(--mx-line-strong) bg-(--mx-field) py-2.5 pl-9 pr-3 text-[15px] text-(--mx-text) outline-none placeholder:text-(--mx-faint) focus:border-(--mx-gold)"
              />
            </label>
            <FilterPanel
              open={panel}
              setOpen={setPanel}
              title="Filter members"
              noun="member"
              resultCount={shown.length}
              selected={flt}
              onToggle={(k, v) => setFlt((f) => toggleIn(f, k, v))}
              onClear={() => setFlt({})}
              groups={[
                {
                  key: "where",
                  title: "Where they are",
                  options: [
                    { v: "here", label: "At the Plex now", n: countFor("where", (m) => presence.get(m.id)?.kind === "here") },
                    ...ROOMS.map((r) => ({ v: r.id, label: `In ${r.name}`, n: countFor("where", (m) => presence.get(m.id)?.kind === "here" && presence.get(m.id)?.room === r.id) })),
                    { v: "onway", label: "On their way", n: countFor("where", (m) => presence.get(m.id)?.kind === "on_way") },
                  ],
                },
                { key: "offers", title: "Offers", options: CATEGORIES.map((c) => ({ v: c.id, label: c.label, n: countFor("offers", (m) => !!facts.get(m.id)?.offers.has(c.id)) })) },
                { key: "looking", title: "Looking for", options: CATEGORIES.map((c) => ({ v: c.id, label: c.label, n: countFor("looking", (m) => !!facts.get(m.id)?.looking.has(c.id)) })) },
                { key: "roles", title: "What they do", options: roles.map((r) => ({ v: r, label: r, n: countFor("roles", (m) => m.role.trim() === r) })) },
                { key: "msg", title: "Messages", options: [{ v: "open", label: "Open to messages from me", n: countFor("msg", (m) => m.can_message) }] },
              ]}
            />
          </div>
        }
      />

      <ActiveFilters chips={chips} onRemove={(k, v) => setFlt((f) => toggleIn(f, k, v))} onClear={() => setFlt({})} />

      {shown.length === 0 ? (
        <div className={`${PANEL} p-8 text-center text-(--mx-muted)`}>{needle || active ? "No one matches. Try fewer filters or a different search." : "No members yet."}</div>
      ) : (
        // Masonry (Ed, 2026-10-31): each card is as tall as its own content, packed into
        // columns (1 on phones, 2 on tablets, 3 on wide screens).
        <ul className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {shown.map((m) => {
            const me = m.id === meId;
            // The same card as the Settings preview (MemberCard, Ed 2026-10-31). Message only if
            // they allow it; your own card shows Edit profile instead.
            return (
              <li key={m.id} className="mb-5 break-inside-avoid">
                <MemberCard
                  m={m}
                  you={me}
                  canMessage={!me && m.can_message}
                  onMessage={() => void message(m.id)}
                  busy={busy === m.id}
                  error={err?.id === m.id ? err.text : undefined}
                  editHref={me ? "/members/settings" : undefined}
                  note={presenceNote(presence.get(m.id))}
                />
              </li>
            );
          })}
        </ul>
      )}
      {list.length <= 1 && <p className="mt-6 text-[13.5px] text-(--mx-faint)">As George invites members, they’ll show up here.</p>}
    </>
  );
}
