const { test, expect } = require('@playwright/test');

const EMPTY_CATALOGUE = {
  categories: [],
  areas: [],
  synonyms: [],
  campaigns: [],
  settings: {},
  shops: [],
  products: [],
};

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,HEAD,OPTIONS',
};

test.beforeEach(async ({ page }) => {
  // Keep screenshots and copy deterministic: Kinyarwanda is ISOKO's primary UI language.
  await page.addInitScript(() => window.localStorage.setItem('isoko.lang', 'rw'));

  // Supply only an empty public catalogue fixture. All other Neon traffic is
  // blocked, so CI never reads/writes Setup or Production and needs no account.
  await page.route(/\.aws\.neon\.tech\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      url.hostname.includes('.apirest.') &&
      url.pathname.endsWith('/v_public_bootstrap')
    ) {
      if (request.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS_HEADERS });
      }
      return route.fulfill({
        status: 200,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
        body: JSON.stringify({ payload: EMPTY_CATALOGUE }),
      });
    }
    return route.abort();
  });

  page.on('pageerror', (error) => console.log('Browser page error:', error.message));
});

test('homepage opens and shows the current ISOKO introduction', async ({ page }) => {
  const response = await page.goto('/');
  expect(response, 'homepage should return a document response').not.toBeNull();
  expect(response.status()).toBe(200);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Gura mu maduka y’u Rwanda kuri WhatsApp' })
  ).toBeVisible();
  await expect(page.getByText('Ibyiciro byose', { exact: true }).first()).toBeVisible();
});

test('login route exposes the real seller sign-in form without public demo credentials', async ({ page }) => {
  const response = await page.goto('/injira');
  expect(response, 'login route should return a document response').not.toBeNull();
  expect(response.status()).toBe(200);

  await expect(page.getByRole('heading', { name: 'Injira', exact: true })).toBeVisible();
  await expect(page.locator('#login-identifier')).toBeVisible();
  await expect(page.locator('#login-pass')).toBeVisible();
  await expect(page.getByText(/Konti zo kugerageza \(Demo\)/i)).toHaveCount(0);
  await expect(page.getByText(/admin123|mugisha123|aline123|style123/)).toHaveCount(0);
});

test('a signed-out visitor cannot open seller product creation', async ({ page }) => {
  await page.goto('/umucuruzi/ongeraho');

  // The route guard redirects visitors without a seller session to sign-in.
  // The test never creates or uses a real account.
  await expect(page).toHaveURL(/\/injira$/);
  await expect(page.getByRole('heading', { name: 'Injira', exact: true })).toBeVisible();
  await expect(page.locator('#login-identifier')).toBeVisible();
  await expect(page.locator('#login-pass')).toBeVisible();
});
