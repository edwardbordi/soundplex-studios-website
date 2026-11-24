"use client";

import { useEffect, useState } from "react";

const EMBED_SCRIPT_SRC = "https://link.msgsndr.com/js/form_embed.js";

/** The widget's card ends this many pixels above the bottom of its frame (measured Nov 18, 2026). */
const CARD_GAP = 25;

/**
 * `fit` calendars only. The iframe's id ends in a number, the way HighLevel's own embed code
 * writes it ("<id>_1795119069040"). That is what makes the embed script resize the frame to fit
 * each step (month, time slots, details form). With any other ending the frame keeps its first
 * height, and on Ed's calendar the details form was cut off (found Nov 19, 2026).
 */
const STAMP = "1795119069040";

/**
 * `fit` calendars only. On browsers with always-visible scrollbars the widget's details form
 * draws a white horizontal scrollbar along its bottom edge: 15px tall, starting 5px above the
 * bottom of the frame. Nothing reaches inside the widget to stop it. So the last CLIP pixels of
 * the frame are cut off (the widget's own bottom border sits there on the other steps), and a
 * black strip COVER pixels tall hides the scrollbar above the cut, with the card's bottom border
 * and corners redrawn on it. The Schedule button ends about 9px above the scrollbar, so it keeps
 * a clear gap above the strip.
 */
const CLIP = 6;
const COVER = 18;

/**
 * George's booking calendar on /websites (Ed, 2026-11-24), ported from realiiz-website's
 * black-friday/DealCalendar, where it was tuned on this same black-and-gold calendar. Keep the
 * measured numbers (CARD_GAP, CLIP, COVER) as they are unless the calendar itself changes.
 *
 * LeadConnector booking calendar, framed to match the page.
 * `tone="dark"` sits a black-and-gold calendar straight on the black page; `tone="light"` puts a
 * light-styled calendar on a bone panel so it doesn't glare.
 *
 * The embed script is injected on mount (not via next/script) for the same reason as
 * the Realiiz site's booking embed: it only sizes iframes that exist when it runs.
 */
export default function WebsitesCalendar({
  calendarId,
  title,
  tone,
  fit = false,
}: {
  calendarId: string;
  title: string;
  tone: "dark" | "light";
  /**
   * How the frame is sized. Off (George's calendar): the frame keeps the height it was tuned at,
   * with a strip covering the scrollbar at a measured offset. Left exactly as it was while his
   * campaign is running. On (Ed's calendar): the frame follows each step's height and its bottom
   * edge is clipped, see STAMP and CLIP.
   */
  fit?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  // Height of this browser's always-visible scrollbar: 0 where scrollbars only show while
  // scrolling (most Macs, every phone).
  const [barHeight, setBarHeight] = useState(0);

  // The widget's details form is a few pixels wider than its own wrapper, so browsers with
  // always-visible scrollbars draw a white horizontal scrollbar along the bottom of the black
  // calendar. Nothing reaches inside the widget (its custom CSS box and scrolling="no" were both
  // tried), so a black strip of that height covers the scrollbar, which sits at the
  // bottom of the widget's card (CARD_GAP above the frame's bottom). The strip redraws the card's
  // bottom border, because on the calendar's first view that same spot holds the real one.
  useEffect(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll";
    document.body.appendChild(probe);
    // One measurement on mount, not a render cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBarHeight(probe.offsetHeight - probe.clientHeight);
    probe.remove();
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
    const fallback = window.setTimeout(() => setLoaded(true), 8000);
    return () => {
      script.remove();
      window.clearTimeout(fallback);
    };
  }, [calendarId]);

  const panel = tone === "dark" ? "bg-black" : "bg-[#f7f5f0] p-4 sm:p-8";

  return (
    <div className={`relative rounded-[10px] ${panel}`}>
      <div className="relative min-h-[760px] sm:min-h-[700px]">
        <div className={`relative ${fit ? "overflow-hidden" : ""}`}>
          <iframe
            src={`https://api.leadconnectorhq.com/widget/booking/${calendarId}`}
            title={title}
            scrolling="no"
            id={fit ? `${calendarId}_${STAMP}` : `${calendarId}_websites`}
            allow="payment"
            className="block w-full rounded-[8px]"
            onLoad={() => setLoaded(true)}
            style={{
              width: "100%",
              marginBottom: fit ? -CLIP : 0,
              minHeight: 400,
              border: "none",
              overflow: "hidden",
              background: "transparent",
              // Always "light", as in the Realiiz site's booking embed: when the iframe's declared
              // scheme differs from its document's, Chrome paints an opaque white backdrop behind
              // it, which showed as a white strip under the black calendar card.
              colorScheme: "light",
            }}
          />
          {/* `fit`: the strip over the widget's scrollbar. A square black block, so the widget's
              own side borders and corners are covered, with the rounded border drawn on it. */}
          {fit && (
            <span
              aria-hidden="true"
              style={{ height: COVER }}
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-black"
            >
              <span className="absolute inset-0 rounded-b-[8px] border-x border-b border-white/20" />
            </span>
          )}
          {!fit && tone === "dark" && barHeight > 0 && (
            <span
              aria-hidden="true"
              style={{ bottom: CARD_GAP - 1, height: barHeight + 2 }}
              className="pointer-events-none absolute inset-x-0 bg-black"
            >
              {/* The square black block hides the whole scrollbar, corners included; the rounded
                  border is drawn on top of it. */}
              <span className="absolute inset-0 rounded-b-[8px] border-x border-b border-white/20" />
            </span>
          )}
        </div>
        <div
          aria-hidden={loaded}
          className={`absolute inset-0 flex flex-col items-center justify-start gap-4 rounded-[8px] pt-20 transition-opacity duration-500 ${
            tone === "dark" ? "bg-black" : "bg-[#f7f5f0]"
          } ${loaded ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
          <span className="block h-10 w-10 animate-spin rounded-full border-2 border-[#d4a030]/25 border-t-[#d4a030] motion-reduce:animate-none" />
          <span
            role="status"
            className={`font-[family-name:var(--font-poppins)] text-[11px] uppercase tracking-[0.18em] ${
              tone === "dark" ? "text-white/60" : "text-[#5b6678]"
            }`}
          >
            Loading calendar…
          </span>
        </div>
      </div>
    </div>
  );
}
