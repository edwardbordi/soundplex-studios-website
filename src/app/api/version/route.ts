import { NextResponse } from "next/server";

/**
 * Which commit the running deployment was built from. Studio polls this after
 * a publish to turn "Live" green only once production actually serves the
 * change — instead of promising "about two minutes" and hoping.
 *
 * Vercel sets VERCEL_GIT_COMMIT_SHA at build time; locally it's null and the
 * caller falls back to a timer. Read inside the handler (BUILD-ENV law).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null, builtAt: process.env.VERCEL_GIT_COMMIT_SHA ? undefined : "local" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
