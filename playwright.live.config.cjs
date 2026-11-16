const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: 'live-public-visual-qa.spec.cjs',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: 'line',
  use: {
    browserName: 'chromium',
    headless: true,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
});
