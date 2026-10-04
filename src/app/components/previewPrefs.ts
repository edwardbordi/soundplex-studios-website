"use client";

import { useEffect, useState } from "react";

/**
 * TEMPORARY — which review widgets are showing. One record in localStorage,
 * shared by the Review menu (in the utility bar) and PreviewChrome (which
 * renders the widgets); a custom event keeps the two in step.
 */
export type PreviewPrefs = { walkthrough: boolean; versions: boolean; speed: boolean; notes: boolean; needs: boolean };
const KEY = "review-widgets";
const EVENT = "review-widgets-change";
const DEFAULTS: PreviewPrefs = { walkthrough: false, versions: false, speed: false, notes: false, needs: false };

export const WIDGETS: { key: keyof PreviewPrefs; label: string; hint: string; icon: "play" | "layout" | "gauge" | "note" | "needs" }[] = [
  { key: "walkthrough", label: "Walkthrough", hint: "A short video on what this preview is", icon: "play" },
  { key: "versions", label: "Home page versions", hint: "A · Light, B · Dark, C · Video", icon: "layout" },
  { key: "notes", label: "Feedback", hint: "Leave notes, approve the site, or withdraw an approval", icon: "note" },
  { key: "speed", label: "Page speed", hint: "Live paint time and PageSpeed scores", icon: "gauge" },
  { key: "needs", label: "Show what we still need", hint: "Outlines the spots waiting on you", icon: "needs" },
];

export function readPrefs(): PreviewPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export function writePrefs(next: PreviewPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** Subscribe to the prefs; null until read on the client (render nothing then). */
export function usePreviewPrefs(): [PreviewPrefs | null, (next: PreviewPrefs) => void] {
  const [prefs, setPrefs] = useState<PreviewPrefs | null>(null);
  useEffect(() => {
    const sync = () => setPrefs(readPrefs());
    const raf = requestAnimationFrame(sync);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [prefs, writePrefs];
}
