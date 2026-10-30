"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startConversation } from "../../../../lib/members/messages";
import { parseSocial, socialLabel } from "../../../../lib/social";
import ContactIcons from "../../ContactIcons";
import PresenceAvatar from "../PresenceAvatar";
import { Em, PANEL, PageHead } from "../shared";

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

export default function Directory({ list, meId }: { list: DirMember[]; meId: string }) {
  const router = useRouter();
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
  const needle = q.trim().toLowerCase();
  const shown = needle ? list.filter((m) => [m.first_name, m.last_name, m.role, m.offers, m.looking].join(" ").toLowerCase().includes(needle)) : list;

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
          <label className="relative block w-full sm:w-72">
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
        }
      />

      {shown.length === 0 ? (
        <div className={`${PANEL} p-8 text-center text-(--mx-muted)`}>{needle ? `No one matches “${q.trim()}”.` : "No members yet."}</div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((m) => {
            const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || "Member";
            const me = m.id === meId;
            return (
              <li key={m.id} className="flex flex-col overflow-hidden rounded-[8px] rounded-bl-none border border-(--mx-line) bg-(--mx-raised)">
                <div className="h-1 bg-(--mx-gold)" />
                <div className="flex items-center gap-4 p-5">
                  <PresenceAvatar id={m.id} photo={m.photo_url} name={m.first_name} size={56} bg="var(--mx-raised)" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-[family-name:var(--font-poppins)] text-[17px] font-medium">{name}</span>
                      {me && <span className="shrink-0 rounded-[3px] bg-(--mx-hover) px-1.5 py-px text-[11px] uppercase tracking-wider text-(--mx-muted)">You</span>}
                    </span>
                    {m.role && <span className="mt-0.5 block text-[14px] text-(--mx-gold-text)">{m.role}</span>}
                  </span>
                </div>
                {(m.offers || m.looking) && (
                  <dl className="space-y-3 border-t border-(--mx-line) px-5 py-4 text-[14px]">
                    {m.offers && (
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.16em] text-(--mx-faint)">Offers</dt>
                        <dd className="mt-1 text-(--mx-soft)">{m.offers}</dd>
                      </div>
                    )}
                    {m.looking && (
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.16em] text-(--mx-faint)">Looking for</dt>
                        <dd className="mt-1 text-(--mx-soft)">{m.looking}</dd>
                      </div>
                    )}
                  </dl>
                )}
                {/* Message · call · email, as icons (Ed, 2026-10-30). Message only if they allow it. */}
                {!me && (m.phone || m.contact_email || m.can_message) && (
                  <div className="border-t border-(--mx-line) px-5 py-3.5">
                    <ContactIcons name={m.first_name || name} phone={m.phone} email={m.contact_email} canMessage={m.can_message} onMessage={() => void message(m.id)} busy={busy === m.id} />
                    {err?.id === m.id && <p className="mt-2 text-[13px] text-[#e2735e]">{err.text}</p>}
                  </div>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-(--mx-line) px-5 py-4">
                  {m.socials.map((s) => {
                    const info = parseSocial(s);
                    const { platform, name: handle } = socialLabel(info);
                    return info.url && !info.problem ? (
                      <a key={s} href={info.url} target="_blank" rel="noopener noreferrer" title={handle} className="rounded-[4px] border border-(--mx-line-strong) px-2.5 py-1 text-[12.5px] text-(--mx-soft) transition-colors hover:border-(--mx-gold) hover:text-(--mx-text)">
                        {platform ?? handle}
                      </a>
                    ) : null;
                  })}
                  {me && (
                    <Link href="/members/settings" className="ml-auto text-[13px] text-(--mx-gold-text) hover:underline">
                      Edit profile
                    </Link>
                  )}
                  {!me && m.socials.length === 0 && <span className="text-[12.5px] text-(--mx-faint)">No links yet</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {list.length <= 1 && <p className="mt-6 text-[13.5px] text-(--mx-faint)">As George invites members, they’ll show up here.</p>}
    </>
  );
}
