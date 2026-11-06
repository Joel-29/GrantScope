import { expect, test } from '@playwright/test';

test('themes, keyboard dialog focus, and honest activity work on desktop and mobile', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') externalRequests.push(url.origin);
  });
  await page.goto('/settings');
  await page.getByRole('radio', { name: /Light/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({
    path: testInfo.outputPath('settings-light.png'),
    fullPage: true,
  });
  await page.getByRole('radio', { name: /System/ }).check();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('radio', { name: /Dark/ }).check();
  const inspectionTrigger = page.getByRole('button', {
    name: 'Inspect an address',
  });
  await inspectionTrigger.click();
  const dialog = page.getByRole('dialog', {
    name: 'Inspect a public address',
  });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(inspectionTrigger).toBeFocused();
  await page.getByRole('button', { name: 'Open transaction activity' }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'No transaction activity' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('every live page fits both themes and exposes no fixture records', async ({
  page,
}, testInfo) => {
  for (const theme of ['dark', 'light']) {
    for (const route of [
      '/',
      '/dashboard',
      '/permissions',
      '/privacy',
      '/settings',
      '/about',
      '/permissions/unverified',
      '/missing',
    ]) {
      await page.goto(route);
      if (theme === 'light')
        await page
          .getByRole('button', { name: 'Switch to light theme' })
          .click();
      await expect(
        page.getByRole('main').getByRole('heading', { level: 1 }),
      ).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${route} fits in ${theme}`,
      ).toBe(true);
      await expect(
        page.getByText('Preview emerald', { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText('Example exchange', { exact: true }),
      ).toHaveCount(0);
      const duplicateIds = await page.evaluate(() => {
        const ids = Array.from(document.querySelectorAll('[id]')).map(
          (node) => node.id,
        );
        return ids.filter((id, index) => ids.indexOf(id) !== index);
      });
      expect(duplicateIds).toEqual([]);
      if (['/dashboard', '/privacy', '/permissions', '/'].includes(route)) {
        await page.screenshot({
          path: testInfo.outputPath(
            `${route.slice(1) || 'overview'}-${theme}.png`,
          ),
          fullPage: true,
        });
      }
    }
  }
});

test('320px layout and reduced motion remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/settings', '/dashboard', '/privacy', '/permissions']) {
    await page.goto(route);
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1 }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test('design workshop is isolated from production routes', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto('/design-system');
  if (process.env.PLAYWRIGHT_PRODUCTION === '1') {
    await expect(
      page.getByRole('heading', { name: 'This page isn’t here' }),
    ).toBeVisible();
    await expect(
      page.getByText('Preview emerald', { exact: true }),
    ).toHaveCount(0);
  } else {
    await expect(
      page.getByRole('heading', { name: 'Component workshop' }),
    ).toBeVisible();
    await expect(
      page.getByText('Fictional design fixtures · Not live blockchain data'),
    ).toBeVisible();
    if (isMobile) {
      await expect(
        page
          .getByRole('list', { name: 'Fictional permission design fixtures' })
          .getByRole('listitem'),
      ).toHaveCount(3);
      await expect(page.locator('.desktop-inventory')).toBeHidden();
    } else {
      await expect(
        page.getByRole('table', {
          name: 'Fictional permission design fixtures',
        }),
      ).toBeVisible();
      await expect(page.locator('.mobile-inventory')).toBeHidden();
    }
    await page.screenshot({
      path: testInfo.outputPath('isolated-workshop.png'),
      fullPage: true,
    });
    await page.getByRole('radio', { name: 'loading', exact: true }).check();
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Loading design fixture permissions' }),
    ).toHaveAttribute('aria-busy', 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      await page
        .locator('.inventory-loading .skeleton')
        .first()
        .evaluate((element) => getComputedStyle(element).animationName),
    ).toBe('none');
  }
});
