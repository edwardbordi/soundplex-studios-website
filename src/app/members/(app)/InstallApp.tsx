"use client";

import { useEffect, useState } from "react";
import { membersBrowser } from "../../../lib/members/browser";

/**
 * "Put SoundPlex on your home screen" (Ed, 2026-11-24): a small card at the top of the members
 * area, on phones only, until the member installs it or says no.
 *
 *   Android (Chrome): an Install button that brings up the phone's own install prompt.
 *   iPhone (Safari):  the two taps to do it by hand (Share, then Add to Home Screen), since
 *                     iPhones don't offer an install button to websites.
 *
 * Never shows inside the installed app, on a computer, or after "Not now".
 *
 * Remembered on the member's ACCOUNT, not just this browser (Ed, 2026-11-24: it came back after
 * signing out and in). On an iPhone the home-screen app and Safari keep separate storage, and a
 * sign-in link opens Safari, so Safari never knew the app was installed. Now: opening the app
 * from the home screen saves app_installed on the member (Supabase user metadata), "Not now"
 * saves install_card_dismissed, and either one hides the card everywhere.
 */

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "sp-install-dismissed";

export default function InstallApp() {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    let alive = true;
    const sb = membersBrowser();
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Opened from the home screen: remember it on the account, once, and show nothing.
    if (standalone) {
      void sb?.auth.getUser().then(({ data }) => {
        if (data.user && !data.user.user_metadata?.app_installed) void sb.auth.updateUser({ data: { app_installed: true } });
      });
      return;
    }

    let dismissedHere = false;
    try {
      dismissedHere = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    const phone = window.matchMedia("(max-width: 820px)").matches;
    if (dismissedHere || !phone) return;

    let accountSaysHide = false;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
      setPlatform((p) => (p === null && !accountSaysHide ? "android" : p));
    };
    const onInstalled = () => {
      setPlatform(null);
      void sb?.auth.updateUser({ data: { app_installed: true } });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Ask the account before showing anything: installed (on any device) or "Not now" hides it.
    void (async () => {
      const { data } = sb ? await sb.auth.getUser() : { data: { user: null } };
      const meta = data.user?.user_metadata ?? {};
      if (!alive) return;
      if (meta.app_installed || meta.install_card_dismissed) {
        accountSaysHide = true;
        setPlatform(null);
        return;
      }
      const ua = navigator.userAgent;
      const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
      if (ios) setPlatform("ios");
    })();

    return () => {
      alive = false;
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setPlatform(null);
    void membersBrowser()?.auth.updateUser({ data: { install_card_dismissed: true } });
  };

  if (!platform) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-[8px] rounded-bl-none border border-[#d4a030]/45 bg-(--mx-panel) p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- a 40px icon, no need for next/image */}
      <img src="/app/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-[9px]" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-(--mx-text)">Put SoundPlex on your home screen</p>
        {platform === "ios" ? (
          <p className="mt-1 text-[13.5px] text-(--mx-muted)">
            Tap the Share button{" "}
            <svg viewBox="0 0 24 24" className="inline h-4 w-4 -translate-y-px align-middle" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share">
              <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
            </svg>{" "}
            in Safari, then <span className="text-(--mx-soft)">Add to Home Screen</span>. It opens straight into the members area, like an app.
          </p>
        ) : (
          <p className="mt-1 text-[13.5px] text-(--mx-muted)">One tap, and it opens straight into the members area, like an app.</p>
        )}
        <div className="mt-3 flex items-center gap-4">
          {platform === "android" && prompt && (
            <button
              type="button"
              onClick={async () => {
                await prompt.prompt();
                const { outcome } = await prompt.userChoice;
                if (outcome === "accepted") setPlatform(null);
                setPrompt(null);
              }}
              className="rounded-[4px] bg-(--mx-gold) px-4 py-2 text-[13.5px] font-semibold text-[#141414]"
            >
              Install
            </button>
          )}
          <button type="button" onClick={dismiss} className="text-[13.5px] text-(--mx-muted) underline underline-offset-4 hover:text-(--mx-text)">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
