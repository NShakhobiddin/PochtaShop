import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3210);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Environments that ship a pre-installed Chromium (rather than the exact
 * revision this Playwright version downloads) can point at it here.
 */
const PREINSTALLED_CHROMIUM =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const executablePath = existsSync(PREINSTALLED_CHROMIUM) ? PREINSTALLED_CHROMIUM : undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // The Mini App is designed mobile-first.
    ...devices['iPhone 13'],
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], launchOptions: { executablePath } },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      APP_ENV: 'test',
      ALLOW_INSECURE_TELEGRAM_AUTH: 'true',
      AI_PROVIDER: 'mock',
    },
  },
});
