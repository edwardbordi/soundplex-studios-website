"use client";

import Link from "next/link";
import { parseSocial, socialLabel } from "../../lib/social";
import ContactIcons from "./ContactIcons";
import PresenceAvatar from "./(app)/PresenceAvatar";

/**
 * A member's card, the ONE design used by both the Members directory and the "How members see
 * you" preview in Settings (Ed, 2026-10-31: "the member cards do not match the preview").
 * Gold top bar · avatar (gold border, check-in dot) · name · role · offers / looking for ·
 * message, call, email icons · social links · a note at the foot.
 */
export type CardMember = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  offers: string;
  looking: string;
  photo_url: string | null;
  phone: string | null;
  contact_email: string | null;
  socials: string[];
};

export default function MemberCard({
  m,
  you = false,
  canMessage = false,
  onMessage,
  busy = false,
  error,
  editHref,
  note,
  className = "",
}: {
  m: CardMember;
  /** Your own card: a "You" tag, and Edit profile instead of a message button. */
  you?: boolean;
  canMessage?: boolean;
  /** Without it (the preview), the message icon shows but does nothing. */
  onMessage?: () => void;
  busy?: boolean;
  error?: string;
  editHref?: string;
  /** The line at the foot (e.g. "Members see you when you're in the building"). */
  note?: React.ReactNode;
  className?: string;
}) {
  const name = [m.first_name.trim(), m.last_name.trim()].filter(Boolean).join(" ") || "Member";
  const role = m.role.trim();
  const offers = m.offers.trim();
  const looking = m.looking.trim();
  const showIcons = !!(m.phone?.trim() || m.contact_email?.trim() || canMessage);

  return (
    <div className={`flex flex-col overflow-hidden rounded-[8px] rounded-bl-none border border-[#d4a030]/30 bg-(--mx-raised) ${className}`}>
      <div className="h-1 bg-[#d4a030]" />
      <div className="p-6 text-center">
        <span className="inline-flex">
          <PresenceAvatar id={m.id} photo={m.photo_url} name={m.first_name} size={80} bg="var(--mx-raised)" />
        </span>
        <p className="mt-4 flex items-center justify-center gap-2 font-[family-name:var(--font-poppins)] text-[19px] font-medium leading-tight text-(--mx-text)">
          {name}
          {you && <span className="rounded-[3px] bg-(--mx-hover) px-1.5 py-px text-[11px] uppercase tracking-wider text-(--mx-muted)">You</span>}
        </p>
        {role && <p className="mt-1 text-[14px] text-(--mx-gold-text)">{role}</p>}
      </div>

      {(offers || looking) && (
        <dl className="space-y-3 border-t border-(--mx-line) px-6 py-5 text-[14px]">
          {offers && (
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-(--mx-faint)">Offers</dt>
              <dd className="mt-1 text-(--mx-soft)">{offers}</dd>
            </div>
          )}
          {looking && (
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-(--mx-faint)">Looking for</dt>
              <dd className="mt-1 text-(--mx-soft)">{looking}</dd>
            </div>
          )}
        </dl>
      )}

      {showIcons && (
        <div className="border-t border-(--mx-line) px-6 py-4">
          <div className="flex justify-center">
            <ContactIcons name={m.first_name || name} phone={m.phone} email={m.contact_email} canMessage={canMessage} onMessage={onMessage} busy={busy} />
          </div>
          {error && <p className="mt-2 text-center text-[13px] text-[#e2735e]">{error}</p>}
        </div>
      )}

      {m.socials.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2 border-t border-(--mx-line) px-6 py-5">
          {m.socials.map((s) => {
            const info = parseSocial(s);
            const { platform, name: handle } = socialLabel(info);
            const text = platform ?? handle;
            return (
              <li key={s}>
                {info.url && !info.problem ? (
                  <a href={info.url} target="_blank" rel="noopener noreferrer" title={handle} className="inline-flex rounded-[4px] border border-(--mx-line-strong) px-2.5 py-1 text-[12.5px] text-(--mx-soft) transition-colors hover:border-[#d4a030]/60 hover:text-(--mx-text)">
                    {text}
                  </a>
                ) : (
                  <span className="inline-flex rounded-[4px] border border-(--mx-line-strong) px-2.5 py-1 text-[12.5px] text-(--mx-muted)">{text}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(note || editHref) && (
        <div className="mt-auto flex items-center gap-2 border-t border-(--mx-line) px-6 py-4 text-[12.5px] leading-none text-(--mx-faint)">
          <span className="flex min-w-0 items-center gap-2">{note}</span>
          {editHref && (
            <Link href={editHref} className="ml-auto shrink-0 text-[13px] text-(--mx-gold-text) hover:underline">
              Edit profile
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
