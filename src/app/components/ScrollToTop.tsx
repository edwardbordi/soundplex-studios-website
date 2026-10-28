"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Every new page starts at the top (Ed, 2026-10-28). Next usually does this itself, but with a
 * sticky nav and smooth scrolling it can land partway down; this makes it certain. A link to
 * an anchor (/rooms#podcast) is left alone so it can scroll to its section.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
