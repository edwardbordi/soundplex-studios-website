/**
 * /admin configuration — read LAZILY, inside functions, never at module scope.
 *
 * BUILD-ENV law: `next build` must succeed with none of these set. CI and
 * preview builds run env-naked, so anything read at import time would take
 * the build down. Each getter throws a clear message at REQUEST time instead,
 * which is what a misconfigured deploy should do.
 *
 * Documented in .env.example. Server-only values never carry NEXT_PUBLIC_.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`/admin is not configured: ${name} is missing. See .env.example.`);
  }
  return value;
}

/** Public — safe in the browser. RLS is the boundary, not secrecy. */
export function identityPublicConfig() {
  return {
    url: required("NEXT_PUBLIC_IDENTITY_SUPABASE_URL"),
    anonKey: required("NEXT_PUBLIC_IDENTITY_SUPABASE_ANON_KEY"),
  };
}

/** The stable per-site slug — matches site_users.site_id. Never the repo slug. */
export function siteId(): string {
  return required("ADMIN_SITE_ID");
}

/**
 * SERVER-ONLY, PREFERRED. This site's own credential for the Realiiz broker.
 *
 * With it, this deployment holds no master key: it asks the broker for a token
 * scoped to this one repository, valid an hour, and for invites to be sent. A
 * leak of this environment is worth an hour of access to this repo — not the
 * GitHub App's private key, which is good for every repo the app is installed
 * on, nor the identity service-role key, which opens the whole sign-in database.
 */
export function brokerConfig(): { url: string; secret: string } | null {
  const url = process.env.REALIIZ_BROKER_URL, secret = process.env.REALIIZ_SITE_SECRET;
  return url && secret ? { url, secret } : null;
}

/**
 * SERVER-ONLY. How Studio reaches this site's repo, in order of preference:
 *  - The broker (above): no key here at all.
 *  - The Realiiz Studio GitHub App: GITHUB_APP_ID + GITHUB_APP_PRIVATE_KEY. Works,
 *    but puts a key good for every repo into this one deployment. Being retired.
 *  - A personal access token: GITHUB_CONTENT_TOKEN. The original mechanism.
 */
export function repoConfig() {
  const slug = required("GITHUB_REPO");
  const [owner, repo] = slug.split("/");
  if (!owner || !repo) throw new Error(`GITHUB_REPO must be "owner/repo", got "${slug}"`);
  const broker = brokerConfig();
  if (broker) return { owner, repo, broker: { url: broker.url, siteId: siteId(), secret: broker.secret } };
  const appId = process.env.GITHUB_APP_ID, privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (appId && privateKey) return { owner, repo, app: { appId, privateKey } };
  return { owner, repo, token: required("GITHUB_CONTENT_TOKEN") };
}

/**
 * SERVER-ONLY, OPTIONAL. The identity project's service-role key — needed only to
 * invite people, change roles and resend invites (Team tab). Everything else in
 * /admin works without it; the Team tab says so instead of crashing.
 */
export function serviceConfig(): { url: string; serviceRoleKey: string } | null {
  const key = process.env.IDENTITY_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return { url: required("NEXT_PUBLIC_IDENTITY_SUPABASE_URL"), serviceRoleKey: key };
}

/**
 * SERVER-ONLY, OPTIONAL. A Vercel Deploy Hook for the production branch. When a Studio
 * update's rebuild never starts, the tracker offers "Nudge the build", which POSTs here.
 * Without it the tracker tells the owner to contact the web team instead.
 */
export function deployHookUrl(): string | null {
  return process.env.VERCEL_DEPLOY_HOOK_URL || null;
}

/** True when every variable the dashboard needs is present. Used to render a setup page instead of a 500. */
export function adminConfigured(): boolean {
  return [
    "NEXT_PUBLIC_IDENTITY_SUPABASE_URL",
    "NEXT_PUBLIC_IDENTITY_SUPABASE_ANON_KEY",
    "ADMIN_SITE_ID",
    "GITHUB_REPO",
  ].every((n) => Boolean(process.env[n]))
    && Boolean(
      (process.env.REALIIZ_BROKER_URL && process.env.REALIIZ_SITE_SECRET)
      || (process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY)
      || process.env.GITHUB_CONTENT_TOKEN,
    );
}

/**
 * The setup page's checklist — names and presence only, never values. Shown at
 * /admin until adminConfigured() is true, so whoever is deploying can see what's left.
 */
export function adminSetup() {
  const has = (...names: string[]) => names.every((n) => Boolean(process.env[n]));
  return [
    { label: "Identity service", vars: ["NEXT_PUBLIC_IDENTITY_SUPABASE_URL", "NEXT_PUBLIC_IDENTITY_SUPABASE_ANON_KEY"], ok: has("NEXT_PUBLIC_IDENTITY_SUPABASE_URL", "NEXT_PUBLIC_IDENTITY_SUPABASE_ANON_KEY"), note: "The shared sign-in service. Same two values on every site." },
    { label: "Site ID", vars: ["ADMIN_SITE_ID"], ok: has("ADMIN_SITE_ID"), note: "A short stable name for this site, e.g. the business name in lowercase. Never the repository name." },
    { label: "Repository", vars: ["GITHUB_REPO"], ok: has("GITHUB_REPO"), note: "owner/name of the repository this site is built from." },
    { label: "Realiiz service", vars: ["REALIIZ_BROKER_URL", "REALIIZ_SITE_SECRET"], ok: has("REALIIZ_BROKER_URL", "REALIIZ_SITE_SECRET") || has("GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY") || has("GITHUB_CONTENT_TOKEN"), note: "This site's own credential. It asks Realiiz for permission to save changes, so no master key lives here." },
    { label: "Team invites", vars: ["REALIIZ_SITE_SECRET"], ok: has("REALIIZ_BROKER_URL", "REALIIZ_SITE_SECRET") || has("IDENTITY_SUPABASE_SERVICE_ROLE_KEY"), optional: true, note: "Lets owners invite people from Settings → Team. Included with the Realiiz service credential." },
    { label: "Build nudge", vars: ["VERCEL_DEPLOY_HOOK_URL"], ok: has("VERCEL_DEPLOY_HOOK_URL"), optional: true, note: "A Deploy Hook for the production branch, so a stalled update can be kicked from Studio." },
  ];
}
