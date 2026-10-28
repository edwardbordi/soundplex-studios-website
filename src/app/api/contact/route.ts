import { handleForm, str, friendly, digits } from "../../../lib/forms/forward";

/** POST /api/contact — the /contact-us form → GHL_WEBHOOK_CONTACT. */
export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleForm(request, {
    envVar: "GHL_WEBHOOK_CONTACT",
    source: "soundplex-contact",
    honeypot: "company_site",
    shape(body) {
      const name = friendly(str(body.name, 120));
      const email = str(body.email, 200).toLowerCase();
      const message = friendly(str(body.message, 3000));
      if (!name) return { error: "Your name, please.", field: "name" };
      if (!email) return { error: "We need an email to reply to.", field: "email" };
      if (!message) return { error: "Tell us what’s on your mind.", field: "message" };
      return { email, payload: { name, email, phone: digits(body.phone), message, tags: ["website", "contact"] } };
    },
  });
}
