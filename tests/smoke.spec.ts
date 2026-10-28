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
    // SoundPlex: every CTA lands on /start (the survey). The hero's buttons are rendered
    // by the engine after mount; the room cards' links are server-rendered.
    const bookingLink = page.locator('a[href^="/start"]').first();
    await expect(bookingLink).toBeVisible();
  });

  test('primary navigation is present', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('navigation', { name: 'Primary' }),
    ).toBeVisible();
  });

  test('the survey (/start) loads and asks its first question', async ({ page }) => {
    const response = await page.goto('/start');
    expect(response?.status()).toBeLessThan(400);
    // The page has an sr-only h1 ("Start here — …") and the visible question h2; assert the visible one.
    await expect(page.getByRole('heading', { level: 2, name: /what brings you to soundplex/i })).toBeVisible();
    // /book was the template's contact route; it now redirects to /start.
    const r2 = await page.goto('/book');
    expect(r2?.status()).toBeLessThan(400);
    expect(page.url()).toContain('/start');
  });

  test('contact page loads with its form', async ({ page }) => {
    const response = await page.goto('/contact-us');
    expect(response?.status()).toBeLessThan(400);
    // The footer newsletter also has an Email field; scope to the contact form.
    await expect(page.locator('#cf-email')).toBeVisible();
  });

  test('membership, rooms, a room, websites and about render an h1', async ({ page }) => {
    for (const path of ['/membership', '/rooms', '/rooms/wood-room', '/websites', '/about']) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBeLessThan(400);
      await expect(page.locator('h1').first(), path).not.toBeEmpty();
    }
  });

  test('three rooms; podcast is a use, and the old podcast-room URLs land on it', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page.locator('#podcast')).toBeVisible();
    // A room page offers its uses as deep links into the survey.
    await page.goto('/rooms/wood-room');
    const chip = page.locator('a.rmp__chip').first();
    await expect(chip).toBeVisible();
    expect(await chip.getAttribute('href')).toMatch(/^\/start\?path=room&room=wood-room&use=/);
    // The retired room page and the WordPress podcast URL both redirect to the podcast section.
    for (const old of ['/rooms/podcast-studio', '/sp-room/podcast']) {
      const r = await page.goto(old);
      expect(r?.status(), old).toBeLessThan(400);
      expect(page.url(), old).toContain('/rooms');
    }
    // A deep link with room + use skips to the next open question, and says which room.
    await page.goto('/start?path=room&room=wood-room&use=podcast');
    await expect(page.getByRole('heading', { level: 2, name: /when\?/i })).toBeVisible();
    await expect(page.locator('.sv__room')).toContainText('WoodRoom');
    // Room only: the uses question is about that room, and "Something else" asks what.
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/start?path=room&room=wood-room');
    await expect(page.getByRole('heading', { level: 2, name: /using the woodroom for/i })).toBeVisible();
    await page.getByRole('radio', { name: /something else/i }).click();
    await expect(page.locator('.sv__input--other')).toBeVisible();
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

test.describe('studio productions (events)', () => {
  test('/studio-productions lists what is coming up, or says nothing is', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // list view is the phone default
    await page.goto('/studio-productions');
    await expect(page.locator('h1')).toContainText('Find your kind');
    const upcoming = page.getByRole('region', { name: 'Coming up' });
    await expect(upcoming).toBeVisible();
    const links = upcoming.locator('a[href^="/studio-productions/"]');
    if ((await links.count()) === 0) {
      // An empty calendar is a normal state. It must still say so.
      await expect(upcoming).not.toBeEmpty();
      return;
    }
    await expect(links.first()).toHaveAttribute('href', /^\/studio-productions\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
    // /events (the template's default) redirects here.
    await page.goto('/events');
    expect(page.url()).toContain('/studio-productions');
  });

  test('the productions page has no horizontal scroll at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/studio-productions');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
