import { isAllowedOrigin } from "../../../../lib/api-guard";
import { askHighLevel, freeSlots, roomCalendars } from "../../../../lib/highlevel/ask";
import { currentMember } from "../../../../lib/members/server";

/**
 * GET /api/ask/slots → { enabled, days: [{ day: "2026-11-26", slots: [ISO…] }] }
 * Real open times from HighLevel for the Ask widget: George's calendar by default, or a room's
 * (?room=wood-room) for a signed-in member when that room has a calendar (ROOM_CALENDAR_IDS).
 * enabled:false when it can't be booked here, so the widget doesn't offer it.
 */
export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) return Response.json({ enabled: false, days: [] }, { status: 401 });
  if (!askHighLevel()) return Response.json({ enabled: false, days: [] });

  const room = new URL(request.url).searchParams.get("room");
  let calendarId: string | undefined;
  if (room) {
    const m = await currentMember().catch(() => null);
    calendarId = roomCalendars()[room];
    if (!m || m.status !== "active" || !calendarId) return Response.json({ enabled: false, days: [] });
  }

  const days = await freeSlots(14, calendarId);
  if (!days) return Response.json({ enabled: true, error: "Couldn’t read the calendar just now.", days: [] });
  return Response.json({ enabled: true, days: days.slice(0, 8) });
}
