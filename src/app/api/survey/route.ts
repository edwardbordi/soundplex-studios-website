import { handleForm, str, friendly, digits } from "../../../lib/forms/forward";
import { PATHS, pathById } from "../../../lib/survey/flow";

/**
 * POST /api/survey — the /start funnel → GHL_WEBHOOK_SURVEY.
 * Payload: path, every answer (flattened, strings or arrays), contact, and the
 * path's choice text so a GHL workflow can branch on either. See lib/forms/forward.ts.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleForm(request, {
    envVar: "GHL_WEBHOOK_SURVEY",
    source: "soundplex-start",
    honeypot: "company_site",
    shape(body) {
      const path = pathById(str(body.path, 20));
      if (!path) return { error: "Pick what brings you here first." };
      const firstName = friendly(str(body.firstName, 80));
      const lastName = friendly(str(body.lastName, 80));
      const email = str(body.email, 200).toLowerCase();
      const phone = digits(body.phone);
      if (!firstName) return { error: "First name, please.", field: "firstName" };
      if (!email) return { error: "We need an email to get back to you.", field: "email" };
      if (path.phoneRequired && phone.length < 10) return { error: "A phone number — George calls room enquiries back.", field: "phone" };

      const raw = (body.answers ?? {}) as Record<string, unknown>;
      const answers: Record<string, string | string[]> = {};
      for (const q of path.questions) {
        const v = raw[q.id];
        if (Array.isArray(v)) answers[q.id] = v.map((x) => str(x, 120)).filter(Boolean).slice(0, 12);
        else if (typeof v === "string") answers[q.id] = friendly(str(v, q.kind === "textarea" ? 2000 : 200));
      }
      return {
        email,
        payload: {
          path: path.id,
          pathLabel: path.choice,
          firstName,
          lastName,
          email,
          phone,
          business: friendly(str(body.business, 120)),
          answers,
          // Flattened copies for GHL custom fields (dot paths are awkward there).
          ...Object.fromEntries(Object.entries(answers).map(([k, v]) => [`q_${k}`, Array.isArray(v) ? v.join(", ") : v])),
          entry: str(body.entry, 300),
          tags: ["website", `start-${path.id}`, ...(path.id === "website" ? ["website-lead"] : [])],
          pathsKnown: PATHS.map((p) => p.id),
        },
      };
    },
  });
}
