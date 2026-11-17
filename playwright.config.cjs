const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.cjs',
  // Live-site, isolated-QA and screenshot specs have their own configs and workflows.
  testIgnore: [
    '**/live-public-visual-qa.spec.cjs',
    '**/qa-seller-end-to-end.spec.cjs',
    '**/brand-clarity-preview.spec.cjs',
  ],
  fullyParallel: true,
  timeout: 30_000,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'bunx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
