"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PREVIEW_CHROME } from "../../lib/site-config";
import { usePreviewPrefs } from "./previewPrefs";
import ReviewMenu from "./ReviewMenu";

// Every widget is off until the reviewer switches it on in the eye menu, and its
// code isn't downloaded until then either — a cold visit (and Lighthouse) gets
// the nub and nothing else.
const Walkthrough = dynamic(() => import("./Walkthrough"), { ssr: false });
const VariantToggle = dynamic(() => import("./VariantToggle"), { ssr: false });
const NotesWidget = dynamic(() => import("./NotesWidget"), { ssr: false });
const SpeedBadge = dynamic(() => import("./SpeedBadge"), { ssr: false });

/**
 * TEMPORARY — everything that floats on the page only for the client review:
 * walkthrough video, home version switch, Feedback widget, speed badge, and the
 * "what we still need" outlines. All hidden by default; the reviewer turns them
 * on from the eye menu (ReviewMenu / previewPrefs). One flag (PREVIEW_CHROME)
 * turns it all off for launch; then delete this file, the widgets, ReviewMenu,
 * previewPrefs and /home-b, /home-c.
 */
export default function PreviewChrome() {
  const pathname = usePathname() ?? "/";
  const [prefs] = usePreviewPrefs();
  // "Show what we still need": a root attribute that globals.css turns into
  // dashed red outlines + labels on every [data-needs] spot.
  useEffect(() => {
    if (prefs?.needs) document.documentElement.setAttribute("data-show-needs", "");
    else document.documentElement.removeAttribute("data-show-needs");
  }, [prefs?.needs]);
  if (!PREVIEW_CHROME || !prefs || pathname.startsWith("/admin")) return null;
  return (
    <>
      <ReviewMenu />
      {prefs.walkthrough && <Walkthrough />}
      {prefs.versions && <VariantToggle current={pathname} />}
      {prefs.notes && <NotesWidget />}
      {prefs.speed && <SpeedBadge />}
    </>
  );
}
