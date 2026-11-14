const { defineConfig } = require('@playwright/test');

const APP_ORIGIN = 'https://isoko-marketplace-9i69.onrender.com';
const LOCAL_PREVIEW = 'http://127.0.0.1:4173';

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.cjs',
  fullyParallel: true,
  timeout: 30_000,
  reporter: 'line',
  use: {
    // The app is served locally by Vite, but the browser sees ISOKO's real
    // Production origin. This exercises the same CORS policy without using
    // the Production database: the build points to an isolated Neon QA clone.
    baseURL: APP_ORIGIN,
    browserName: 'chromium',
    headless: true,
    serviceWorkers: 'block',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'bunx vite preview --host 0.0.0.0 --port 4173 --strictPort',
    url: LOCAL_PREVIEW,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
