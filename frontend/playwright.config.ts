import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    // Skip the first-visit /welcome redirect so tests land on the dashboard
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:3000',
        localStorage: [{ name: 'rh_visited', value: '1' }],
      }],
    },
  },
  webServer: {
    command: 'npm run dev:demo -- --hostname 127.0.0.1 --port 3000',
    cwd: __dirname,
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
});
