import { studio } from "@/lib/admin/studio";

/** POST only — the sign-out button is a plain form, so this works without JS. */
export const POST = studio.authHandlers.signout;
