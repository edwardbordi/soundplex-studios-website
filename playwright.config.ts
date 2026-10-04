import { defineConfig, devices } from '@playwright/test';

// A dedicated port so the suite can NEVER silently reuse a dev server that
// happens to be on 3000 (which would test the wrong site and "pass").
const port = process.env.PORT || "4310";

export default defineConfig({
  testDir: './tests',
  // Fail the build on CI if you accidentally left test.only in a file.
  forbidOnly: !!process.env.CI,
  // Retry once on CI to absorb rare cold-start flakiness; no retries locally.
  retries: process.env.CI ? 1 : 0,
  // One worker on CI for stable, readable output; parallel locally.
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Build the production site and serve it, then run tests against it.
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Placeholder /admin config so the auth flow is exercised (redirects, the
    // sign-in page) without real credentials. No request reaches these hosts:
    // with no session cookie the identity client answers locally, and the
    // admin tests never sign in. The CI `build` job still builds env-naked.
    env: {
      ...process.env,
      NEXT_PUBLIC_IDENTITY_SUPABASE_URL: process.env.NEXT_PUBLIC_IDENTITY_SUPABASE_URL ?? "https://placeholder.supabase.co",
      NEXT_PUBLIC_IDENTITY_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_IDENTITY_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
      ADMIN_SITE_ID: process.env.ADMIN_SITE_ID ?? "example",
      GITHUB_REPO: process.env.GITHUB_REPO ?? "example/placeholder",
      GITHUB_CONTENT_TOKEN: process.env.GITHUB_CONTENT_TOKEN ?? "placeholder-token",
    },
  },
});