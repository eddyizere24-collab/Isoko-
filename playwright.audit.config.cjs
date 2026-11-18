const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e', testMatch: 'live-language-audit.spec.cjs', workers: 1, reporter: 'line',
  use: { browserName: 'chromium', headless: true, serviceWorkers: 'block' },
});
