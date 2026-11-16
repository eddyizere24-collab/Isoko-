const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e',
  testMatch: 'qa-seller-end-to-end.spec.cjs',
  fullyParallel: false,
  workers: 1,
  timeout: 35 * 60 * 1000,
  reporter: 'line',
  outputDir: 'test-results/qa-seller-e2e',
  use: { browserName: 'chromium', baseURL: 'http://localhost:5173',
    viewport: { width: 360, height: 800 }, deviceScaleFactor: 1,
    locale: 'rw-RW', timezoneId: 'Africa/Kigali',
    trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'bun run preview -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
