import { handleForm, str, friendly } from "../../../lib/forms/forward";

/** POST /api/newsletter — the footer "Stay inspired" form → GHL_WEBHOOK_NEWSLETTER. */
export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleForm(request, {
    envVar: "GHL_WEBHOOK_NEWSLETTER",
    source: "soundplex-newsletter",
    honeypot: "company_site",
    shape(body) {
      const firstName = friendly(str(body.firstName, 80));
      const email = str(body.email, 200).toLowerCase();
      if (!email) return { error: "An email, please.", field: "email" };
      const mood = Array.isArray(body.mood) ? (body.mood as unknown[]).map((m) => str(m, 20)).filter(Boolean) : [];
      return { email, payload: { firstName, email, mood, tags: ["website", "newsletter"] } };
    },
  });
}
