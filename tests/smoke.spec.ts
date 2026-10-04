import { test, expect } from '@playwright/test';

/**
 * Smoke suite — the "a broken page can't ship" gate (TEMPLATE-BACKLOG #1).
 *
 * Contract, not copy: assertions target invariants (a non-empty h1, a
 * booking link, a 404 status) rather than marketing text, so rewording a
 * hero never breaks CI. Runs against the production build (see
 * playwright.config.ts webServer).
 */
test.describe('site smoke tests', () => {
  test('homepage responds successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('homepage renders a non-empty h1', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
  });

  test('homepage has a working booking CTA', async ({ page }) => {
    await page.goto('/');
    const bookingLink = page.locator('a[href="/book"]').first();
    await expect(bookingLink).toBeVisible();
  });

  test('primary navigation is present', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('navigation', { name: 'Primary' }),
    ).toBeVisible();
  });

  test('booking page loads', async ({ page }) => {
    const response = await page.goto('/book');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  /* These tests check the machinery, not the sample content.
   *
   * A site with no posts yet — or one whose owner has just deleted the samples
   * — is a normal, correct state, and a check that fails on it is telling the
   * owner their site is broken when it isn't. Worse, they meet that failure
   * inside Studio as "Something needs fixing", about a thing they cannot fix.
   *
   * So: if there is content, assert it renders properly. If there isn't, assert
   * the empty state renders properly. Never assert a particular item exists. */
  test('blog index lists posts, or says there are none', async ({ page }) => {
    const response = await page.goto('/blog');
    expect(response?.status()).toBeLessThan(400);
    const postLinks = page.locator('main a[href^="/blog/"]');
    if ((await postLinks.count()) === 0) {
      await expect(page.locator('main')).not.toBeEmpty();
      return;
    }
    await expect(postLinks.first()).toBeVisible();
  });

  test('a blog post renders article content', async ({ page }) => {
    await page.goto('/blog');
    const firstPostLink = page.locator('main a[href^="/blog/"]').first();
    test.skip((await firstPostLink.count()) === 0, 'no posts published yet');
    await firstPostLink.click();
    const article = page.locator('article');
    await expect(article).toBeVisible();
    await expect(article).not.toBeEmpty();
  });

  test('unknown URL returns a proper 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
  });

  test('about page renders its main heading', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBeLessThan(400);
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
  });

  test('feed and sitemap respond', async ({ page }) => {
    for (const path of ['/feed.xml', '/sitemap.xml', '/robots.txt']) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBeLessThan(400);
    }
  });
});

test.describe('events', () => {
  test('/events lists what is upcoming, or says nothing is', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('h1')).toHaveText('Events');
    const upcoming = page.getByRole('region', { name: 'Upcoming' });
    await expect(upcoming).toBeVisible();

    const details = upcoming.getByRole('link', { name: 'Details' });
    if ((await details.count()) === 0) {
      // An empty calendar is a normal state — a site between seasons, or one
      // whose owner has just cleared out the sample. It must still say so.
      await expect(upcoming).not.toBeEmpty();
      return;
    }
    await expect(details.first()).toHaveAttribute('href', /^\/events\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  test('the events page has no horizontal scroll at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/events');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
