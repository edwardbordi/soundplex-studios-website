import { z } from "zod";
import { isAllowedOrigin } from "../../../../lib/api-guard";
import { askHighLevel, textGeorge } from "../../../../lib/highlevel/ask";

/**
 * POST /api/ask/text: "Text George" from the Ask widget (as realiiz.com's "Text Ed").
 * The message goes onto the visitor's HighLevel contact, tagged text-george; a HighLevel workflow
 * on that tag texts George, and his reply reaches them as a normal text.
 * GET → { enabled }: whether HighLevel is set up, so the widget only offers it when it works.
 */

const Body = z.object({
  firstName: z.string().trim().min(1).max(60),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "phone"),
  message: z.string().trim().min(1).max(600),
  smsConsent: z.literal(true),
  page: z.string().max(300).default("/"),
  fax: z.string().max(0).optional(), // honeypot
});

export async function GET() {
  return Response.json({ enabled: Boolean(askHighLevel()) });
}

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
    const error =
      field === "phone" ? "Add a 10-digit mobile number." : field === "smsConsent" ? "Tick the box so George can text you back." : field === "message" ? "Add a message for George." : "Add your first name.";
    return Response.json({ ok: false, field, error }, { status: 400 });
  }
  const b = parsed.data;
  const fwd = request.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : (request.headers.get("x-real-ip") ?? "unknown");
  const ok = await textGeorge({ firstName: b.firstName, phone: b.phone, message: b.message, page: b.page, ip, at: new Date().toISOString() });
  if (!ok) console.error("[ask:text] not in HighLevel:", JSON.stringify({ firstName: b.firstName, phone: b.phone, page: b.page }));
  // Like realiiz.com: the visitor always sees "sent"; a failure is logged for us, not shown to them.
  return Response.json({ ok: true });
}
