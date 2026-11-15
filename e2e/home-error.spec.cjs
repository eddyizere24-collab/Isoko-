const { test, expect } = require('@playwright/test');

test('homepage shows a clear Kinyarwanda message when catalogue service is unavailable', async ({ page }) => {
  await page.route(/\.aws\.neon\.tech\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname.includes('.apirest.') && url.pathname.endsWith('/v_public_bootstrap')) {
      return route.fulfill({
        status: 503,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
        body: JSON.stringify({ error: 'simulated outage' }),
      });
    }
    return route.abort();
  });

  await page.goto('/');
  await expect(page.getByText('Ntibyashobotse gufungura ibicuruzwa ubu. Ongera ugerageze nyuma.')).toBeVisible();
  await expect(page.getByText(/TypeError|Failed to fetch|simulated outage/i)).toHaveCount(0);
});
