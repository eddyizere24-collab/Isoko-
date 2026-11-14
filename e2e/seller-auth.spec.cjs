const { test, expect } = require('@playwright/test');

const APP_ORIGIN = 'https://isoko-marketplace-9i69.onrender.com';
const LOCAL_PREVIEW = 'http://127.0.0.1:4173';

async function routeAppToLocal(context) {
  await context.route(`${APP_ORIGIN}/**`, async (route) => {
    const incoming = new URL(route.request().url());
    const localUrl = `${LOCAL_PREVIEW}${incoming.pathname}${incoming.search}`;
    const response = await route.fetch({
      url: localUrl,
      headers: { host: '127.0.0.1:4173' },
    });
    await route.fulfill({ response });
  });
}

test.beforeEach(async ({ page }) => {
  // Serve the current QA build at ISOKO's real browser origin. Only the page
  // and static assets are rewritten to Vite; Neon calls keep their QA URLs.
  await routeAppToLocal(page.context());

  // Keep smoke tests read-only and independent from Neon services.
  await page.route(
    /.(?:neonauth|apirest|compute|storage).c-8.eu-central-1.aws.neon.tech//,
    (route) => route.abort()
  );
  page.on('pageerror', (error) => console.log('Browser page error:', error.message));
});

test('homepage opens and shows the real catalogue introduction', async ({ page }) => {
  const response = await page.goto('/');
  expect(response, 'homepage should return a document response').not.toBeNull();
  expect(response.status()).toBe(200);

  await expect(
    page.getByRole('heading', { level: 1, name: /Imyambaro, inkweto n'ibyo kwambara byo mu Rwanda/ })
  ).toBeVisible();
  await expect(page.getByText('Hitamo icyiciro', { exact: true })).toBeVisible();
});

test('login route opens and exposes email and password fields', async ({ page }) => {
  const response = await page.goto('/injira');
  expect(response, 'login route should return a document response').not.toBeNull();
  expect(response.status()).toBe(200);

  await expect(page.getByRole('heading', { name: 'Injira muri konti yawe' })).toBeVisible();
  await expect(page.locator('#login-identifier')).toBeVisible();
  await expect(page.locator('#login-pass')).toBeVisible();
});

test('a signed-out visitor is redirected away from seller product creation', async ({ page }) => {
  // Force Neon Auth to report an unavailable/signed-out session. This test
  // must never create or use a real seller identity or write data.
  await page.route(/\.neonauth\.c-8\.eu-central-1\.aws\.neon\.tech\//, (route) => route.abort());

  await page.goto('/umucuruzi/ongeraho');
  await expect(page).toHaveURL(/\/injira\?reason=session$/);
  await expect(page.getByRole('heading', { name: 'Injira muri konti yawe' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Igihe winjiraga cyarangiye cyangwa konti ntiyemejwe'
  );
});
