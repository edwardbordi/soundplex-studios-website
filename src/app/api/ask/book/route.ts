import { z } from "zod";
import { isAllowedOrigin } from "../../../../lib/api-guard";
import { checkEmail } from "../../../../lib/email";
import { book, roomCalendars } from "../../../../lib/highlevel/ask";
import { currentMember } from "../../../../lib/members/server";
import { getAllRooms } from "../../../../lib/rooms/rooms";

/**
 * POST /api/ask/book: the Ask widget books a time on George's calendar (HighLevel).
 * Re-checks the time is still open, upserts the contact, creates the appointment. HighLevel's
 * workflows send the confirmation and reminders. Same-origin gated, with a honeypot.
 */

/**
 * A member booking a room (room set): only for a signed-in, active member, on that room's calendar
 * (ROOM_CALENDAR_IDS), for 2 to 8 hours, booked under the member's own name, email and phone from
 * their profile (whatever the form sent for those is ignored).
 */
const RoomPart = z.object({
  room: z.string().max(60).optional(),
  hours: z.number().int().min(2).max(8).optional(),
});

const Body = RoomPart.extend({
  slot: z.string().min(10).max(40),
  // Contact details: required for a public booking (checked below); a room booking uses the member's own.
  firstName: z.string().trim().max(60).default(""),
  lastName: z.string().trim().max(60).default(""),
  email: z.string().trim().max(254).default(""),
  phone: z.string().trim().max(30).default(""),
  smsConsent: z.boolean().default(false),
  note: z.string().trim().max(600).default(""),
  page: z.string().max(300).default("/"),
  typoConfirmed: z.boolean().default(false),
  fax: z.string().max(0).optional(), // honeypot
});

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let parsed;
  try {
    parsed = Body.safeParse(await request.json());
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const error = field === "phone" ? "Add a 10-digit mobile number." : field === "firstName" ? "Add your first name." : "Check the details and try again.";
    return Response.json({ ok: false, field, error }, { status: 400 });
  }
  const b = parsed.data;
  const fwd0 = request.headers.get("x-forwarded-for");
  const ip0 = fwd0 ? fwd0.split(",")[0].trim() : (request.headers.get("x-real-ip") ?? "unknown");

  // ── A member booking a room ──
  if (b.room) {
    const m = await currentMember().catch(() => null);
    const calendarId = roomCalendars()[b.room];
    const roomName = getAllRooms().find(({ frontmatter: r }) => r.slug === b.room)?.frontmatter.name;
    if (!m || m.status !== "active") return Response.json({ ok: false, error: "Sign in to the members area to book a room." }, { status: 401 });
    if (!calendarId || !roomName) return Response.json({ ok: false, error: "That room can’t be booked here yet. Text George and he’ll set it up." });
    const r = await book({
      slot: b.slot,
      calendarId,
      roomName,
      hours: b.hours ?? 2,
      firstName: m.first_name || "Member",
      lastName: m.last_name ?? "",
      email: m.email,
      phone: m.phone ?? "",
      smsConsent: false,
      note: b.note,
      page: b.page,
      ip: ip0,
      at: new Date().toISOString(),
    });
    if (r.ok) return Response.json({ ok: true });
    return Response.json({
      ok: false,
      taken: r.taken,
      error: r.taken ? "Part of that time was just taken, or the room isn’t free for all those hours. Pick another." : "Couldn’t book it just now. Try again, or text George.",
    });
  }

  // ── A public booking with George ──
  if (!b.firstName) return Response.json({ ok: false, field: "firstName", error: "Add your first name." }, { status: 400 });
  if (b.phone.replace(/\D/g, "").length < 10) return Response.json({ ok: false, field: "phone", error: "Add a 10-digit mobile number." }, { status: 400 });
  const check = await checkEmail(b.email, { typoConfirmed: b.typoConfirmed });
  if (!check.ok) {
    return Response.json({
      ok: false,
      field: "email",
      ...(check.reason === "likely-typo" ? { suggestion: check.suggestion, error: `Did you mean @${check.suggestion}?` } : { error: check.reason === "malformed" ? "That email doesn’t look right." : "That email domain can’t receive mail." }),
    });
  }

  const fwd = request.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : (request.headers.get("x-real-ip") ?? "unknown");
  const r = await book({ ...b, ip, at: new Date().toISOString() });
  if (r.ok) return Response.json({ ok: true });
  return Response.json({
    ok: false,
    taken: r.taken,
    error: r.taken ? "That time was just taken. Pick another." : "Couldn’t book it just now. Try again, or call (609) 697-2077.",
  });
}
