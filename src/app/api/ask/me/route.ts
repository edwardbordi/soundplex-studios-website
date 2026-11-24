import { isAllowedOrigin } from "../../../../lib/api-guard";
import { roomCalendars } from "../../../../lib/highlevel/ask";
import { getAllRooms } from "../../../../lib/rooms/rooms";
import { currentMember } from "../../../../lib/members/server";

/**
 * GET /api/ask/me → { member: { firstName, lastName, phone } | null, rooms: [{ slug, name }] }
 * For the Ask widget in the members area: who's signed in (so forms come pre-filled), and which
 * rooms can be booked right in the chat (the ones with a calendar in ROOM_CALENDAR_IDS). Rooms are
 * only listed for a signed-in member. Nothing else about the member leaves the server.
 */
export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) return Response.json({ member: null, rooms: [] }, { status: 401 });
  const m = await currentMember().catch(() => null);
  if (!m || m.status !== "active") return Response.json({ member: null, rooms: [] });
  const cals = roomCalendars();
  const rooms = getAllRooms()
    .map(({ frontmatter: r }) => ({ slug: r.slug, name: r.name }))
    .filter((r) => cals[r.slug]);
  return Response.json({ member: { firstName: m.first_name, lastName: m.last_name, phone: m.phone ?? "" }, rooms });
}
