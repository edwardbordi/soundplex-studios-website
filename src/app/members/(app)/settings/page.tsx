import Link from "next/link";
import ProfileForm, { type SettingsTab } from "../../ProfileForm";
import { Em, PageHead } from "../shared";

/**
 * /members/settings?tab=profile|password|privacy (Ed, 2026-10-30): the member's settings, in tabs.
 *   Profile  — photos, about you, where to find you, contact details, with the live previews
 *   Password — change it, with the rules lighting up as they're met
 *   Privacy  — who sees you, and where (more permissions to come)
 * Theme, back to website and sign out live in the avatar menu.
 */
const TABS: { id: SettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "password", label: "Password" },
  { id: "privacy", label: "Privacy" },
];

export default async function MemberSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: raw } = await searchParams;
  const tab: SettingsTab = TABS.some((t) => t.id === raw) ? (raw as SettingsTab) : "profile";
  return (
    <>
      <PageHead
        eyebrow="Settings"
        title={
          <>
            Your <Em>settings.</Em>
          </>
        }
      />
      <nav className="mb-8 flex gap-1 border-b border-(--mx-line)" aria-label="Settings">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <Link
              key={t.id}
              href={`/members/settings?tab=${t.id}`}
              scroll={false}
              aria-current={on ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-2.5 text-[14.5px] transition-colors ${on ? "border-(--mx-gold) font-medium text-(--mx-text)" : "border-transparent text-(--mx-muted) hover:text-(--mx-text)"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {/* key: a fresh form per tab, so each loads and saves on its own. */}
      <ProfileForm key={tab} mode="account" section={tab} />
    </>
  );
}
