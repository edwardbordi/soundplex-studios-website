"use client";

/**
 * Round icon buttons on a member card (Ed, 2026-10-30): call · email · message.
 *   Call and email open the phone's own app (tel: / mailto:), and only show when the member
 *   added them. Message opens a private conversation in the members area, and only shows when
 *   the member allows messages. Hover shows the number / address on desktop.
 * With no onMessage (the profile preview), the message icon is shown but does nothing.
 */
export const CONTACT_ICON = {
  phone:
    "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
};

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const BTN = "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors";
const QUIET = `${BTN} border-(--mx-line-strong) text-(--mx-soft) hover:border-(--mx-gold) hover:text-(--mx-gold-text)`;
const GOLD = `${BTN} border-[#d4a030]/70 bg-[#d4a030]/10 text-(--mx-gold-text) hover:bg-(--mx-gold) hover:text-[#141414]`;

export default function ContactIcons({
  name,
  phone,
  email,
  canMessage,
  onMessage,
  busy = false,
}: {
  name: string;
  phone?: string | null;
  email?: string | null;
  canMessage?: boolean;
  onMessage?: () => void;
  busy?: boolean;
}) {
  const tel = phone?.trim();
  const mail = email?.trim();
  if (!tel && !mail && !canMessage) return null;
  return (
    <div className="flex items-center gap-2">
      {canMessage &&
        (onMessage ? (
          <button type="button" onClick={onMessage} disabled={busy} title={`Message ${name}`} aria-label={`Message ${name}`} className={`${GOLD} disabled:opacity-60`}>
            {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : <Glyph d={CONTACT_ICON.message} />}
          </button>
        ) : (
          <span title="Members can message you" className={GOLD}>
            <Glyph d={CONTACT_ICON.message} />
          </span>
        ))}
      {tel && (
        <a href={`tel:${tel.replace(/[^\d+]/g, "")}`} title={tel} aria-label={`Call ${name}, ${tel}`} className={QUIET}>
          <Glyph d={CONTACT_ICON.phone} />
        </a>
      )}
      {mail && (
        <a href={`mailto:${mail}`} title={mail} aria-label={`Email ${name}, ${mail}`} className={QUIET}>
          <Glyph d={CONTACT_ICON.mail} />
        </a>
      )}
    </div>
  );
}
