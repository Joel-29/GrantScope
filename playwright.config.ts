import { defineConfig, devices } from '@playwright/test';
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid local Playwright port');
const remote = process.env.PLAYWRIGHT_BASE_URL;
const remoteUrl = remote ? new URL(remote) : null;
if (
  remoteUrl &&
  (remoteUrl.protocol !== 'https:' ||
    remoteUrl.username ||
    remoteUrl.password ||
    remoteUrl.search ||
    remoteUrl.hash ||
    remoteUrl.pathname !== '/')
)
  throw new Error(
    'PLAYWRIGHT_BASE_URL must be an HTTPS origin without credentials, paths or query parameters',
  );
const baseURL = remoteUrl?.origin ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Cold Vite transforms and browser workers compete with WASM transports.
  // Keep the default run reproducible; explicit --workers overrides this.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  ...(remoteUrl
    ? {}
    : {
        webServer: {
          command:
            process.env.PLAYWRIGHT_PRODUCTION === '1'
              ? `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort`
              : `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
        },
      }),
});
