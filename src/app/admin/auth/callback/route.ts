import { studio } from "@/lib/admin/studio";

/** The magic link lands here: ?code=…&next=/admin → session cookies → redirect. */
export const GET = studio.authHandlers.callback;
