"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { membersBrowser } from "../../../lib/members/browser";
import { useUnreadMessages } from "../../../lib/members/messages";
import MessageToasts from "./MessageToasts";
import { ROOMS } from "../../../lib/venue/data";
import { setSession, useVenueSession } from "../../../lib/venue/session";

/**
 * The members' app frame (Ed, 2026-10-29: "on desktop it looks like the dashboard with a side
 * menu bar … and it should allow them to change the theme from light to dark").
 *   Desktop: a slim top bar (logo · Members · you) over a side menu, like Studio.
 *   Phone:   the same top bar, and the sections as a bottom tab bar (thumb reach).
 * The top bar follows the theme too (2026-10-30): black on dark, near-white on light with the
 * ink logo. "Back to website" lives in the side menu and the avatar menu.
 */
type Me = { first: string; last: string; photo: string; role: string; email: string };

export const NAV = [
  { href: "/members", label: "Now", d: "M3 12h4l3-8 4 16 3-8h4" },
  { href: "/members/calendar", label: "Calendar", d: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4" },
  { href: "/members/directory", label: "Members", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" },
  { href: "/members/rooms", label: "Rooms", d: "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M14 12h.01" },
  // Private member-to-member messages, in the app only (Ed, 2026-10-30), last in the menu. Shows an unread count.
  { href: "/members/messages", label: "Messages", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
] as const;
/** Settings (Profile, Password, Privacy tabs): bottom of the side menu, last of the phone tabs. */
// The Visibility Tracker's settings icon (two sliders), as one path (Ed, 2026-10-30).
export const SETTINGS = { href: "/members/settings", label: "Settings", d: "M4 7h9M14 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0M19 7h1M4 17h9M14 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0M19 17h1" };
const PROFILE_ICON = "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10";

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

// ── Side menu collapse (Ed, 2026-10-30: "like the Visibility Tracker"): icons only, 58px wide,
// remembered in this browser. ──
const SIDE_KEY = "sp-members-sidebar";
const SIDE_EVENT = "sp-members-sidebar";
const readCollapsed = () => {
  try {
    return localStorage.getItem(SIDE_KEY) === "1";
  } catch {
    return false;
  }
};
const subSide = (cb: () => void) => {
  window.addEventListener(SIDE_EVENT, cb);
  return () => window.removeEventListener(SIDE_EVENT, cb);
};
function toggleSide() {
  try {
    localStorage.setItem(SIDE_KEY, readCollapsed() ? "0" : "1");
  } catch {
    /* private mode: just this visit */
  }
  window.dispatchEvent(new Event(SIDE_EVENT));
}

// ── Unread messages: the badge on Messages. Live, plus a check whenever the page changes, a
// conversation is read, or every minute. ──
const MESSAGES = "/members/messages";

function Badge({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`grid h-[18px] min-w-[18px] place-items-center rounded-full bg-(--mx-gold) px-1 text-[10.5px] font-bold leading-none text-[#141414] ${className}`} aria-label={`${n} unread`}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

async function signOut() {
  const sb = membersBrowser();
  // Check out first (the database only lets you remove your own check-in).
  const uid = (await sb?.auth.getSession())?.data.session?.user.id;
  if (sb && uid) await sb.from("check_ins").delete().eq("member_id", uid);
  await sb?.auth.signOut();
  setSession({ member: false, checkedIn: null, onWay: null, photo: "" });
  window.location.assign("/");
}

/**
 * Check in / out from the top bar, on every members page (Ed, 2026-10-30: "it should be easy to
 * find"). Not checked in: "Check in" opens the rooms. Checked in: the room (tap to move) and a
 * Check out button, always there. Saved to the database by MemberBridge.
 */
function CheckInControl() {
  const s = useVenueSession();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const here = ROOMS.find((r) => r.id === s.checkedIn);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!s.member) return null;
  const pick = (id: string) => {
    setSession({ checkedIn: id, onWay: null });
    setOpen(false);
  };
  const chevron = <Ico d="M6 9l6 6 6-6" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />;

  return (
    <div ref={box} className="relative flex items-center gap-2">
      {here ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Checked into ${here.name}. Change room`}
          className="flex h-8 items-center gap-2 rounded-[4px] border border-[#4cc773]/45 bg-[#4cc773]/10 px-2.5 text-[13px] text-(--mx-text) transition-colors hover:border-[#4cc773]/80"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#4cc773]" aria-hidden="true" />
          <span className="sm:hidden">{here.short}</span>
          <span className="hidden sm:inline">{here.name}</span>
          {chevron}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d4a030]/70 px-3 text-[13px] font-medium text-(--mx-gold-text) transition-colors hover:bg-[#d4a030] hover:text-[#141414]"
        >
          Check in {chevron}
        </button>
      )}
      {here && (
        <button
          type="button"
          onClick={() => setSession({ checkedIn: null, onWay: null })}
          aria-label="Check out"
          title="Check out"
          className="flex h-8 items-center gap-1.5 rounded-[4px] border border-(--mx-line-strong) px-2 text-[13px] text-(--mx-soft) transition-colors hover:border-(--mx-muted) hover:text-(--mx-text) sm:px-3"
        >
          <Ico d={ICON.out} className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Check out</span>
        </button>
      )}

      {open && (
        <div role="menu" className="vo-pop absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-[8px] border border-(--mx-line) bg-(--mx-pop) py-1.5 text-(--mx-text) shadow-(--mx-shadow)">
          <p className="px-4 pb-1.5 pt-2 text-[11px] uppercase tracking-[0.16em] text-(--mx-faint)">{here ? "Move to" : "I’m in"}</p>
          {ROOMS.map((r) => {
            const on = r.id === s.checkedIn;
            return (
              <button
                key={r.id}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => pick(r.id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-(--mx-hover) ${on ? "font-medium" : ""}`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${on ? "bg-[#4cc773]" : "border border-(--mx-line-strong)"}`} aria-hidden="true" />
                {r.name}
                {on && <span className="ml-auto text-[12px] text-[#4cc773]">You’re here</span>}
              </button>
            );
          })}
          {here && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setSession({ checkedIn: null, onWay: null });
                setOpen(false);
              }}
              className="mt-1 flex w-full items-center gap-3 border-t border-(--mx-line) px-4 py-2.5 text-left text-[14px] text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)"
            >
              <Ico d={ICON.out} className="h-4 w-4" /> Check out
            </button>
          )}
        </div>
      )}
    </div>
  );
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
  const collapsed = useSyncExternalStore(subSide, readCollapsed, () => false);
  const s = useVenueSession();
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // The live session wins (a new photo or name shows at once); the server's copy fills the first paint.
  const photo = s.member && s.photo ? s.photo : me.photo;
  const first = (s.member && s.name) || me.first || "Member";
  const room = ROOMS.find((r) => r.id === s.checkedIn);
  const unread = useUnreadMessages(true, path);

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
      {/* Top bar: follows the theme (Ed, 2026-10-30: "in light mode make even the header
          light"). The logo swaps to an ink version on light (logos/soundplex-lockup-ink.png). */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-(--mx-line) bg-(--mx-top) px-4 text-(--mx-text) sm:px-5">
        <Link href="/members" className="flex items-center gap-3" aria-label="Members home">
          <Image src="/logos/soundplex-lockup.png" alt="SoundPlex" width={490} height={69} className="mx-logo--dark h-auto w-[118px] sm:w-[132px]" priority />
          <Image src="/logos/soundplex-lockup-ink.png" alt="SoundPlex" width={490} height={69} className="mx-logo--light h-auto w-[118px] sm:w-[132px]" priority />
          <span className="hidden border-l border-(--mx-line-strong) pl-3 text-[12px] uppercase tracking-[0.18em] text-(--mx-muted) sm:inline">Members</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <CheckInControl />
          <span className="hidden text-[13px] text-(--mx-muted) lg:inline">Welcome back, {first}</span>
          <div ref={box} className="relative">
            <button
              type="button"
              onClick={() => setMenu((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label={`Account menu for ${first}`}
              className="relative flex rounded-full ring-2 ring-[#d4a030] ring-offset-2 ring-offset-(--mx-top) transition-shadow hover:shadow-[0_0_0_5px_rgba(212,160,48,0.25)]"
            >
              <Avatar photo={photo} name={first} size={32} />
              {room && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-(--mx-top) bg-[#4cc773]" aria-hidden="true" />}
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
                  <Link href="/members/settings" role="menuitem" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-(--mx-hover)">
                    <Ico d={PROFILE_ICON} /> Profile &amp; settings
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
        {/* Side menu (desktop). Collapses to icons only; the choice is remembered. */}
        <aside className={`sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col border-r border-(--mx-line) bg-(--mx-side) transition-[width] duration-150 md:flex ${collapsed ? "w-[58px]" : "w-60"}`}>
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4" aria-label="Members">
            {NAV.map((n) => {
              const on = active(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  title={collapsed ? n.label : undefined}
                  aria-label={collapsed ? n.label : undefined}
                  className={`relative flex items-center rounded-[6px] py-2.5 text-[14.5px] transition-colors ${collapsed ? "mx-2 justify-center px-0" : "mx-3 gap-3 px-3"} ${on ? "bg-(--mx-hover) font-medium text-(--mx-text)" : "text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)"}`}
                >
                  {on && <span className={`absolute top-2 bottom-2 w-[3px] rounded-r bg-(--mx-gold) ${collapsed ? "-left-2" : "-left-3"}`} aria-hidden="true" />}
                  <span className={`relative ${on ? "text-(--mx-gold-text)" : ""}`}>
                    <Ico d={n.d} />
                    {collapsed && n.href === MESSAGES && unread > 0 && <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full border-2 border-(--mx-side) bg-(--mx-gold)" aria-hidden="true" />}
                  </span>
                  {!collapsed && n.label}
                  {!collapsed && n.href === MESSAGES && unread > 0 && <Badge n={unread} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>
          {/* Settings, above Collapse (Ed, 2026-10-30). Theme, back to website and sign out live in
              the avatar menu. */}
          <div className={`border-t border-(--mx-line) ${collapsed ? "px-2 py-3" : "p-3"}`}>
            {(() => {
              const on = active(SETTINGS.href);
              return (
                <Link
                  href={SETTINGS.href}
                  aria-current={on ? "page" : undefined}
                  title={collapsed ? SETTINGS.label : undefined}
                  aria-label={collapsed ? SETTINGS.label : undefined}
                  className={`relative flex items-center rounded-[6px] py-2.5 text-[14.5px] transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${on ? "bg-(--mx-hover) font-medium text-(--mx-text)" : "text-(--mx-muted) hover:bg-(--mx-hover) hover:text-(--mx-text)"}`}
                >
                  <span className={on ? "text-(--mx-gold-text)" : ""}>
                    <Ico d={SETTINGS.d} />
                  </span>
                  {!collapsed && SETTINGS.label}
                </Link>
              );
            })()}
          </div>
          {/* Collapse / expand, at the very bottom (as in the Visibility Tracker). */}
          <button
            type="button"
            onClick={toggleSide}
            aria-label={collapsed ? "Expand side menu" : "Collapse side menu"}
            title={collapsed ? "Expand" : "Collapse"}
            className={`flex items-center border-t border-(--mx-line) py-3 text-[13px] text-(--mx-faint) hover:text-(--mx-text) ${collapsed ? "justify-center" : "gap-3 px-6"}`}
          >
            <Ico d="M15 6l-6 6 6 6" className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && "Collapse"}
          </button>
        </aside>

        <main id="main" className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pt-8 md:pb-16 lg:px-12">
          {/* Left-aligned beside the side menu, not centered (Ed, 2026-10-30): switching between a
              long page and a short one must not move anything. */}
          <div className="max-w-6xl">{children}</div>
        </main>
      </div>

      {/* New-message pop-up + chime (switch either off in Settings → Privacy). */}
      <MessageToasts />

      {/* Bottom tabs (phone) */}
      {/* Five tabs on phones (Ed, 2026-10-30): Now, Calendar, Members, Rooms, Messages.
          Settings is in the avatar menu ("Profile & settings"), top right. */}
      <nav aria-label="Members" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-(--mx-line) bg-(--mx-side)/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {NAV.map((n) => {
          const on = active(n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${on ? "text-(--mx-gold-text)" : "text-(--mx-muted)"}`}>
              <span className="relative">
                <Ico d={n.d} className="h-[22px] w-[22px]" />
                {n.href === MESSAGES && unread > 0 && <Badge n={unread} className="absolute -right-2.5 -top-1.5" />}
              </span>
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
