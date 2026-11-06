import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : {}),
});
await mkdir('docs/screenshots', { recursive: true });
try {
  for (const [name, width, height, theme] of [
    ['dashboard-final-dark', 1440, 1080, 'dark'],
    ['dashboard-final-light', 1440, 1080, 'light'],
    ['dashboard-final-mobile', 390, 844, 'dark'],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: theme,
    });
    const page = await context.newPage();
    const remote = [];
    page.on('request', (request) => {
      if (!request.url().startsWith('http://127.0.0.1:4173'))
        remote.push('external');
    });
    await page.goto('http://127.0.0.1:4173/dashboard');
    await page.getByRole('heading', { name: 'No account selected' }).waitFor();
    if (
      await page
        .getByRole('button', { name: 'Load configured Sepolia demo' })
        .count()
    )
      throw new Error('Use production output; refuse local-demo captures');
    if (theme === 'light')
      await page.getByRole('button', { name: 'Switch to light theme' }).click();
    if (remote.length)
      throw new Error(
        'Unexpected external request during public empty-state capture',
      );
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
    });
    await context.close();
  }
  console.log(
    'Captured production empty-state UI without target addresses or network reads.',
  );
} finally {
  await browser.close();
}
