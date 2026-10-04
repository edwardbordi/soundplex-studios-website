import { test, expect } from '@playwright/test';
import { SITE_NAME } from '../src/lib/site-config';

// /admin runs against placeholder identity config (see playwright.config.ts),
// so these cover everything that happens BEFORE a session exists. The signed-in
// flow is the manual acceptance run recorded in the ADMIN-04b brief.
test.describe('/admin (unauthenticated)', () => {
  test('visiting /admin unauthenticated redirects to the sign-in page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/sign-in$/);
  });

  test('the sign-in page has a labelled email field and no password field', async ({ page }) => {
    await page.goto('/admin/sign-in');
    const email = page.getByLabel('Email address');
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute('type', 'email');
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Send me a sign-in link' })).toBeVisible();
  });

  test('the auth callback without a code redirects to sign-in with an error', async ({ page }) => {
    await page.goto('/admin/auth/callback');
    await expect(page).toHaveURL(/\/admin\/sign-in\?error=link$/);
    // Next adds its own empty role=alert route announcer; target ours by class.
    await expect(page.locator('.admin__alert')).toContainText("didn't work");
  });

  test('admin pages are noindex', async ({ request }) => {
    const res = await request.get('/admin/sign-in');
    expect(res.headers()['x-robots-tag']).toContain('noindex');
    const html = await res.text();
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });

  test('the sign-in page uses the shell tokens', async ({ page }) => {
    await page.goto('/admin/sign-in');
    const root = page.locator('.rz-admin');
    await expect(root).toHaveAttribute('data-theme', 'light');
    // Brand: the site's favicon + "{SITE_NAME} Studio" in the top bar; the sign-in card names the product too.
    await expect(page.locator('.rz-topbar__brand')).toContainText(SITE_NAME);
    await expect(page.locator('.rz-topbar__brand')).toContainText('Studio');
    await expect(page.locator('.rz-topbar__logo')).toHaveAttribute('src', '/logos/favicon.svg');
    await expect(page.getByRole('heading', { name: `Sign in to ${SITE_NAME} Studio` })).toBeVisible();
    await expect(page).toHaveTitle(`${SITE_NAME} Studio`);
  });

  test('sign-out is POST-only', async ({ request }) => {
    const res = await request.get('/admin/auth/signout', { maxRedirects: 0 });
    expect(res.status()).toBe(405);
  });

  test('the sign-in page has no horizontal scroll at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/admin/sign-in');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});

// Pure server-side checks on the pictures a save carries (ADMIN-06b). No browser needed;
// Playwright is simply the site's test runner.
import { decodedSize, IMAGE_ERRORS, validateImages } from '@realiizlabs/admin/media';

const b64 = (bytes: number) => Buffer.alloc(bytes, 1).toString('base64');

test.describe('images with a save', () => {
  test('the publish action refuses an image outside public/blog', () => {
    expect(validateImages([{ path: '/uploads/x.webp', base64: b64(10) }])).toEqual({ ok: false, error: IMAGE_ERRORS.path });
    expect(validateImages([{ path: '/blog/../.env', base64: b64(10) }])).toEqual({ ok: false, error: IMAGE_ERRORS.path });
    expect(validateImages([{ path: '/blog/x.png', base64: b64(10) }])).toEqual({ ok: false, error: IMAGE_ERRORS.path });
    expect(validateImages([{ path: '/blog/My Post.webp', base64: b64(10) }])).toEqual({ ok: false, error: IMAGE_ERRORS.path });
  });

  test('accepted pictures map to public/ files and the size caps hold', () => {
    expect(validateImages([{ path: '/blog/my-post.webp', base64: b64(10) }, { path: '/blog/my-post/team-photo.webp', base64: b64(20) }])).toEqual({
      ok: true,
      files: [
        { path: 'public/blog/my-post.webp', content: b64(10), encoding: 'base64' },
        { path: 'public/blog/my-post/team-photo.webp', content: b64(20), encoding: 'base64' },
      ],
    });
    expect(decodedSize(b64(1000))).toBe(1000);
    expect(decodedSize(b64(1001))).toBe(1001);
    const limits = { maxEach: 100, maxTotal: 150, prefix: '/blog/' };
    expect(validateImages([{ path: '/blog/a.webp', base64: b64(101) }], limits)).toEqual({ ok: false, error: IMAGE_ERRORS.size });
    expect(validateImages([{ path: '/blog/a.webp', base64: b64(90) }, { path: '/blog/b.webp', base64: b64(90) }], limits)).toEqual({ ok: false, error: IMAGE_ERRORS.size });
    expect(validateImages([{ path: '/blog/a.webp', base64: '' }], limits).ok).toBe(false);
    expect(validateImages([]).ok).toBe(true);
  });
});

test.describe('account and help (05b)', () => {
  test('account and help pages redirect to sign-in when signed out', async ({ page }) => {
    await page.goto('/admin/account');
    await expect(page).toHaveURL(/\/admin\/sign-in$/);
    await page.goto('/admin/help');
    await expect(page).toHaveURL(/\/admin\/sign-in$/);
  });

  test('the sign-in page offers a password as a second way in', async ({ page }) => {
    await page.goto('/admin/sign-in');
    await page.getByRole('button', { name: 'Have a password? Sign in with it instead' }).click();
    await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });
});
