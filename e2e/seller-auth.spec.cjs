const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // These tests exercise the public UI only. Block every Neon endpoint so CI
  // cannot read or write Setup/Production data and no real account is needed.
  await page.route(
    /.(?:neonauth|apirest|compute|storage).c-8.eu-central-1.aws.neon.tech\//,
    (route) => route.abort()
  );
  page.on('pageerror', (error) => console.log('Browser page error:', error.message));
});

test('homepage opens and shows the current ISOKO introduction', async ({ page }) => {
  const response = await page.goto('/');
  expect(response, 'homepage should return a document response').not.toBeNull();
  expect(response.status()).toBe(200);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Gura mu maduka y’u Rwanda kuri WhatsApp' })
  ).toBeVisible();
  await expect(page.getByText('Ibyiciro byose', { exact: true })).toBeVisible();
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

  // The public route guard sends visitors without an existing seller session
  // to the ordinary sign-in page. The test never creates or uses an account.
  await expect(page).toHaveURL(/\/injira$/);
  await expect(page.getByRole('heading', { name: 'Injira', exact: true })).toBeVisible();
  await expect(page.locator('#login-identifier')).toBeVisible();
  await expect(page.locator('#login-pass')).toBeVisible();
});
