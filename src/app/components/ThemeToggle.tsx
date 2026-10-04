"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "site-theme";

/** The layout's theme scope element — the class lives there, not on <html>,
    so the choice persists across pages and never leaks site-wide. */
function themeScope(): HTMLElement | null {
  return document.getElementById("theme-scope");
}

/**
 * Light/dark toggle for the site. Toggles .theme-dark on the
 * layout's theme scope (globals.css re-maps the design tokens under that
 * class) and persists the choice — localStorage is the source of truth, so
 * the theme sticks across every page, client-side navigation, and
 * reloads (the layout's bootstrap script applies it before first paint).
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Sync from the persisted choice (source of truth) and make sure the
    // scope class matches. One-time mount read — not a render cascade.
    // Saved choice wins; with no saved choice, follow the system
    // preference (which most OSes auto-switch by time of day — so
    // day-light/night-dark comes free, per visitor, per timezone).
    let saved = false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      saved = stored
        ? stored === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(saved);
    themeScope()?.classList.toggle("theme-dark", saved);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    themeScope()?.classList.toggle("theme-dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* storage unavailable — theme just won't persist */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line/70 bg-transparent text-slate/70 transition-all duration-150 hover:border-line hover:bg-paper hover:text-ink"
    >
      {dark ? (
        /* sun */
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
      ) : (
        /* moon — the universal "switch to dark" glyph */
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
