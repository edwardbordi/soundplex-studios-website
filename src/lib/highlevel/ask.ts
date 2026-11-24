import "server-only";
import { SITE_TIMEZONE } from "../site-config";
import { SMS_CONSENT_TEXT } from "../sms-consent";

/**
 * The Ask widget's two HighLevel actions (Ed, 2026-11-24, like realiiz.com's "Text Ed"):
 *   textGeorge()   a visitor's message → their HighLevel contact (tagged text-george, note with the
 *                  message and the text-message consent proof). A HighLevel workflow on that tag
 *                  texts George; he replies from HighLevel and they get it as a normal text.
 *   freeSlots()    George's real open times on his calendar, straight from HighLevel.
 *   book()         a chosen time → contact upserted and an appointment on that calendar.
 *                  HighLevel's own automations send the confirmation and reminders.
 *
 * Env (server-side only): HIGHLEVEL_TOKEN + HIGHLEVEL_LOCATION_ID (the pair Studio's Leads page
 * uses; the token also needs calendars read, calendar events write and contacts write), and
 * optionally ASK_CALENDAR_ID (defaults to George's calendar below). Nothing is sent anywhere else.
 */

const BASE = "https://services.leadconnectorhq.com";
/** George's calendar in HighLevel (Ed, 2026-11-24). Not secret: calendar ids are public in booking links. */
const DEFAULT_CALENDAR_ID = "IC8oADVnyPVcQfY5OUVx";

type Json = Record<string, unknown>;

export function askHighLevel(): { token: string; locationId: string; calendarId: string } | null {
  const token = process.env.HIGHLEVEL_TOKEN;
  const locationId = process.env.HIGHLEVEL_LOCATION_ID;
  if (!token || !locationId) return null;
  return { token, locationId, calendarId: process.env.ASK_CALENDAR_ID || DEFAULT_CALENDAR_ID };
}

/**
 * The rooms' own HighLevel calendars, for members booking a room from the Ask widget (Ed,
 * 2026-11-24: "wire it up for when I build them"). Set ROOM_CALENDAR_IDS in Vercel to JSON, room
 * slug → calendar id, e.g. {"wood-room":"abc123","studio-a":"def456","sound-lounge":"ghi789"}.
 * Only rooms listed here can be booked; with none, members are offered a time with George instead.
 */
export function roomCalendars(): Record<string, string> {
  if (!askHighLevel()) return {};
  try {
    const raw = JSON.parse(process.env.ROOM_CALENDAR_IDS || "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string" && e[1].length > 0));
  } catch {
    console.error("[ask:highlevel] ROOM_CALENDAR_IDS isn't valid JSON");
    return {};
  }
}

async function hl(path: string, init: { method?: "GET" | "POST"; body?: Json; version?: string } = {}): Promise<{ ok: boolean; status: number; json: Json }> {
  const cfg = askHighLevel();
  if (!cfg) return { ok: false, status: 0, json: {} };
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Version: init.version ?? "2021-07-28",
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const json = ((await res.json().catch(() => ({}))) ?? {}) as Json;
  return { ok: res.ok, status: res.status, json };
}

/** Find or create the contact; a contact that already exists keeps its own source. Returns its id. */
async function upsertContact(c: { firstName: string; lastName?: string; email?: string; phone?: string; source: string }): Promise<string | null> {
  const cfg = askHighLevel();
  if (!cfg) return null;
  const q = c.email ? `email=${encodeURIComponent(c.email)}` : `number=${encodeURIComponent(c.phone ?? "")}`;
  const dup = await hl(`/contacts/search/duplicate?locationId=${encodeURIComponent(cfg.locationId)}&${q}`);
  const exists = Boolean((dup.json.contact as Json | null)?.id);
  const up = await hl("/contacts/upsert", {
    body: {
      locationId: cfg.locationId,
      firstName: c.firstName,
      ...(c.lastName ? { lastName: c.lastName } : {}),
      ...(c.email ? { email: c.email } : {}),
      ...(c.phone ? { phone: c.phone } : {}),
      ...(exists ? {} : { source: c.source }),
    },
  });
  const contact = (up.json.contact as Json | undefined) ?? up.json;
  const id = typeof contact?.id === "string" ? contact.id : null;
  if (!id) console.error("[ask:highlevel] upsert failed", up.status, up.json);
  return id;
}

const tag = (id: string, tags: string[]) => hl(`/contacts/${id}/tags`, { body: { tags } });
const note = (id: string, body: string) => hl(`/contacts/${id}/notes`, { body: { body } });

export async function textGeorge(t: { firstName: string; phone: string; message: string; page: string; ip: string; at: string }): Promise<boolean> {
  try {
    const id = await upsertContact({ firstName: t.firstName, phone: t.phone, source: "soundplexstudios.com Text George" });
    if (!id) return false;
    await tag(id, ["text-george", "sms-consent-yes", "source-ask-widget"]);
    await note(
      id,
      `TEXT GEORGE from the website (${t.page}). Reply to them by text.\n\nTheir message:\n${t.message}\n\nName: ${t.firstName}\nMobile: ${t.phone}\n\n` +
        `Text-message consent (A2P proof):\nConsent checkbox: CHECKED (required to send)\nTimestamp: ${t.at}\nPage: ${t.page}\nIP address: ${t.ip}\nConsent wording shown: "${SMS_CONSENT_TEXT}"`,
    );
    return true;
  } catch (err) {
    console.error("[ask:highlevel] text-george threw", err);
    return false;
  }
}

/** Open times, grouped by day (in SoundPlex's time zone), for the next `days` days. George's
    calendar unless a room's calendar id is given. */
export async function freeSlots(days = 14, calendarId?: string): Promise<{ day: string; slots: string[] }[] | null> {
  const cfg = askHighLevel();
  if (!cfg) return null;
  const start = Date.now() + 2 * 60 * 60 * 1000; // never less than two hours away
  const end = start + days * 24 * 60 * 60 * 1000;
  const r = await hl(`/calendars/${calendarId ?? cfg.calendarId}/free-slots?startDate=${start}&endDate=${end}&timezone=${encodeURIComponent(SITE_TIMEZONE)}`, { version: "2021-04-15" });
  if (!r.ok) {
    console.error("[ask:highlevel] free-slots failed", r.status, r.json);
    return null;
  }
  return Object.entries(r.json)
    .filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && Array.isArray((v as Json)?.slots))
    .map(([day, v]) => ({ day, slots: ((v as Json).slots as unknown[]).map(String).filter((s) => Date.parse(s) > start) }))
    .filter((d) => d.slots.length > 0)
    .sort((a, b) => a.day.localeCompare(b.day));
}

export async function book(b: {
  slot: string;
  /** A room's calendar (members booking a room); otherwise George's. */
  calendarId?: string;
  /** For a room: its name, for the appointment title, and how many hours (2 minimum). */
  roomName?: string;
  hours?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  note: string;
  page: string;
  ip: string;
  at: string;
}): Promise<{ ok: true } | { ok: false; taken: boolean }> {
  const cfg = askHighLevel();
  if (!cfg) return { ok: false, taken: false };
  try {
    const calendarId = b.calendarId ?? cfg.calendarId;
    // Still free? (Someone may have taken it while they typed.)
    const open = await freeSlots(30, calendarId);
    const start = Date.parse(b.slot);
    if (!open?.some((d) => d.slots.some((s) => Date.parse(s) === start))) return { ok: false, taken: true };
    // A room for several hours: every hour of it must be free too (the calendar lists hourly starts).
    if (b.hours && b.hours > 1) {
      const all = new Set(open.flatMap((d) => d.slots.map((s) => Date.parse(s))));
      for (let h = 1; h < b.hours; h++) if (!all.has(start + h * 3_600_000)) return { ok: false, taken: true };
    }

    const id = await upsertContact({ firstName: b.firstName, lastName: b.lastName, email: b.email, phone: b.phone, source: b.roomName ? "Members area room booking" : "soundplexstudios.com Ask widget" });
    if (!id) return { ok: false, taken: false };
    const name = [b.firstName, b.lastName].filter(Boolean).join(" ");
    const appt = await hl("/calendars/events/appointments", {
      version: "2021-04-15",
      body: {
        calendarId,
        locationId: cfg.locationId,
        contactId: id,
        startTime: b.slot,
        ...(b.hours ? { endTime: new Date(start + b.hours * 3_600_000).toISOString() } : {}),
        title: b.roomName ? `${b.roomName} · ${name} (member, ${b.hours ?? 2}h)` : `${name} · booked from the website`,
        appointmentStatus: "confirmed",
        toNotify: true,
      },
    });
    if (!appt.ok) {
      console.error("[ask:highlevel] appointment failed", appt.status, appt.json);
      return { ok: false, taken: appt.status === 400 || appt.status === 409 };
    }
    await tag(id, b.roomName ? ["member-room-booking", "source-members-area"] : ["ask-booked", "source-ask-widget", ...(b.smsConsent ? ["sms-consent-yes"] : [])]);
    await note(
      id,
      `${b.roomName ? `ROOM BOOKED by a member, ${b.roomName} for ${b.hours ?? 2} hours` : "BOOKED from the website's Ask widget"} (${b.page}): ${new Date(start).toLocaleString("en-US", { timeZone: SITE_TIMEZONE, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}.` +
        (b.note ? `\n\nWhat they said they need:\n${b.note}` : "") +
        (b.smsConsent
          ? `\n\nText-message consent (A2P proof):\nConsent checkbox: CHECKED\nTimestamp: ${b.at}\nPage: ${b.page}\nIP address: ${b.ip}\nConsent wording shown: "${SMS_CONSENT_TEXT}"`
          : "\n\nText-message consent: not given (email confirmations only)."),
    );
    return { ok: true };
  } catch (err) {
    console.error("[ask:highlevel] book threw", err);
    return { ok: false, taken: false };
  }
}
