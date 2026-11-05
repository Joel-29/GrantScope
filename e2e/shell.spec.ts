import { expect, test } from '@playwright/test';

test('workspace navigation and truthful transport state', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /See every grant/ }),
  ).toBeVisible();
  await expect(page.getByText('Transport not initialized')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('overview.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Explore the workspace' }).click();
  await expect(
    page.getByRole('heading', { name: 'Wallet overview' }),
  ).toBeVisible();
  await expect(page.getByText('No wallet has been inspected')).toBeVisible();
  if (isMobile) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page
      .getByRole('dialog')
      .getByRole('link', { name: 'Privacy Lab' })
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  } else {
    await page.getByRole('link', { name: 'Privacy Lab', exact: true }).click();
    await page.getByRole('button', { name: 'Collapse navigation' }).click();
    await expect(
      page.getByRole('button', { name: 'Expand navigation' }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole('heading', { name: 'No active anonymizing transport' }),
  ).toBeVisible();
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fits).toBe(true);
});

test('all routes support direct entry', async ({ page }) => {
  for (const [route, title] of [
    ['/permissions', 'Permissions'],
    ['/permissions/unverified', 'Permission unavailable'],
    ['/settings', 'Settings'],
    ['/about', 'Authority, made understandable.'],
    ['/missing', 'This page isn’t here'],
  ]) {
    await page.goto(route!);
    await expect(
      page.getByRole('heading', { name: title!, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
