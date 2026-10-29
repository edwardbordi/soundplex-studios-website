"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { membersBrowser } from "../../../lib/members/browser";
import { ROOMS } from "../../../lib/venue/data";
import { setSession, useVenueSession } from "../../../lib/venue/session";

/**
 * The members' app frame (Ed, 2026-10-29: "on desktop it looks like the dashboard with a side
 * menu bar … and it should allow them to change the theme from light to dark").
 *   Desktop: a slim top bar (logo · Members · you) over a side menu, like Studio.
 *   Phone:   the same top bar, and the sections as a bottom tab bar (thumb reach).
 * The top bar stays black in both themes (the gold-and-white logo needs it); everything
 * below follows the theme. "Back to website" lives in the side menu and the avatar menu.
 */
type Me = { first: string; last: string; photo: string; role: string; email: string };

export const NAV = [
  { href: "/members", label: "Now", d: "M3 12h4l3-8 4 16 3-8h4" },
  { href: "/members/calendar", label: "Calendar", d: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4" },
  { href: "/members/directory", label: "Members", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" },
  { href: "/members/rooms", label: "Rooms", d: "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M14 12h.01" },
  { href: "/members/account", label: "Profile", d: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10" },
] as const;

const ICON = {
  back: "M19 12H5M12 19l-7-7 7-7",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  sun: "M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
};

export function Ico({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// ── Theme: the attribute on #mx-root is the truth (the layout sets it from the cookie) ──
const THEME_EVENT = "sp-members-theme";
const readTheme = () => (document.getElementById("mx-root")?.getAttribute("data-mtheme") === "light" ? "light" : "dark");
const subTheme = (cb: () => void) => {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
};
function setTheme(t: "light" | "dark") {
  document.getElementById("mx-root")?.setAttribute("data-mtheme", t);
  // A cookie (not localStorage) so the server can paint the right theme on the next visit.
  document.cookie = `sp-members-theme=${t}; path=/members; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event(THEME_EVENT));
}
function useTheme(initial: "light" | "dark") {
  return useSyncExternalStore(subTheme, readTheme, () => initial);
}

async function signOut() {
  await membersBrowser()?.auth.signOut();
  setSession({ member: false, checkedIn: null, onWay: null, photo: "" });
  window.location.assign("/");
}

export function Avatar({ photo, name, size }: { photo: string; name: string; size: number }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element -- member photo from Supabase storage
    return <img src={photo} alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <span style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }} className="grid shrink-0 place-items-center rounded-full bg-(--mx-gold) font-bold text-[#050505]">
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

export default function MemberShell({ me, theme: initialTheme, children }: { me: Me; theme: "light" | "dark"; children: React.ReactNode }) {
  const path = usePathname() ?? "/members";
  const theme = useTheme(initialTheme);
  const s = useVenueSession();
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // The live session wins (a new photo or name shows at once); the server's copy fills the first paint.
  const photo = s.member && s.photo ? s.photo : me.photo;
  const first = (s.member && s.name) || me.first || "Member";
  const room = ROOMS.find((r) => r.id === s.checkedIn);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  const active = (href: string) => (href === "/members" ? path === "/members" : path.startsWith(href));
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <div style={{ ["--mx-sticky" as string]: "56px" }}>
      {/* Top bar: always black */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-[#050505] px-4 text-white sm:px-5">
        <Link href="/members" className="flex items-center gap-3" aria-label="Members home">
          <Image src="/logos/soundplex-lockup.png" alt="SoundPlex" width={490} height={69} className="h-auto w-[118px] sm:w-[132px]" priority />
          <span className="hidden border-l border-white/15 pl-3 text-[12px] uppercase tracking-[0.18em] text-white/55 sm:inline">Members</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {room && (
            <span className="hidden items-center gap-2 rounded-[4px] border border-[#4cc773]/40 bg-[#4cc773]/10 px-2.5 py-1 text-[12.5px] text-white/85 md:flex">
              <span className="h-2 w-2 rounded-full bg-[#4cc773]" aria-hidden="true" /> {room.name}
            </span>
          )}
          <span className="hidden text-[13px] text-white/60 lg:inline">Welcome back, {first}</span>
          <div ref={box} className="relative">
            <button
              type="button"
              onClick={() => setMenu((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label={`Account menu for ${first}`}
              className="relative flex rounded-full ring-2 ring-[#d4a030] ring-offset-2 ring-offset-[#050505] transition-shadow hover:shadow-[0_0_0_5px_rgba(212,160,48,0.25)]"
            >
              <Avatar photo={photo} name={first} size={32} />
              {room && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#050505] bg-[#4cc773]" aria-hidden="true" />}
            </button>
            {menu && (
              <div role="menu" className="vo-pop absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-[8px] border border-(--mx-line) bg-(--mx-pop) text-(--mx-text) shadow-(--mx-shadow)">
                <div className="flex items-center gap-3 border-b border-(--mx-line) p-4">
                  <Avatar photo={photo} name={first} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{[first, me.last].filter(Boolean).join(" ")}</span>
                    <span className="block truncate text-[12.5px] text-(--mx-muted)">{me.email}</span>
                  </span>
                </div>
                <div className="py-1.5 text-[14px]">
                  <Link href="/members/account" role="menuitem" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-(--mx-hover)">
                    <Ico d={NAV[4].d} /> Profile &amp; password
                  </Link>
                  <button type="button" role="menuitem" onClick={toggleTheme} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-(--mx-hover)">
                    <Ico d={theme === "light" ? ICON.moon : ICON.sun} /> {theme === "light" ? "Dark mode" : "Light mode"}
                  </button>
                  <Link href="/" role="menuitem" className="flex items-center gap-3 px-4 py-2.5 hover:bg-(--mx-hover)">
                    <Ico d={ICON.back} /> Back to website
                  </Link>
                </div>
                <button type="button" role="menuitem" onClick={() => void signOut()} className="flex w-full items-center gap-3 border-t border-(--mx-line) px-4 py-3 text-left text-[14px] text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)">
                  <Ico d={ICON.out} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Side menu (desktop) */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col border-r border-(--mx-line) bg-(--mx-side) md:flex">
          <nav className="flex-1 overflow-y-auto py-4" aria-label="Members">
            {NAV.map((n) => {
              const on = active(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={`relative mx-3 flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-[14.5px] transition-colors ${on ? "bg-(--mx-hover) font-medium text-(--mx-text)" : "text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)"}`}
                >
                  {on && <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r bg-(--mx-gold)" aria-hidden="true" />}
                  <span className={on ? "text-(--mx-gold-text)" : ""}>
                    <Ico d={n.d} />
                  </span>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-(--mx-line) p-3 text-[13.5px]">
            <button type="button" onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-left text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)">
              <Ico d={theme === "light" ? ICON.moon : ICON.sun} className="h-4 w-4" />
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>
            <Link href="/" className="group flex items-center gap-3 rounded-[6px] px-3 py-2 text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)">
              <Ico d={ICON.back} className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to website
            </Link>
            <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-left text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)">
              <Ico d={ICON.out} className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pt-8 md:pb-16 lg:px-12">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Bottom tabs (phone) */}
      <nav aria-label="Members" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-(--mx-line) bg-(--mx-side)/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {NAV.map((n) => {
          const on = active(n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${on ? "text-(--mx-gold-text)" : "text-(--mx-muted)"}`}>
              <Ico d={n.d} className="h-[22px] w-[22px]" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
