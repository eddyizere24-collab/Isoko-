const { test, expect } = require('@playwright/test');
const crypto = require('node:crypto');
const zlib = require('node:zlib');

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

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function makeTestPng() {
  const width = 32;
  const height = 32;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    rows[row] = 0; // PNG filter: None
    for (let x = 0; x < width; x += 1) {
      const offset = row + 1 + x * 4;
      rows[offset] = 10 + x * 6;
      rows[offset + 1] = 80 + y * 4;
      rows[offset + 2] = 60 + ((x + y) % 12) * 10;
      rows[offset + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(rows)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

test('seller can register, sign in, update store, publish a photo product and receive a buyer order', async ({ page, browser }) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(20_000);

  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  const email = `isoko-e2e-${suffix}@example.com`;
  const password = `IsokoTest#${suffix}a`;
  const phone = `078${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`;
  const shopName = `ISOKO QA ${suffix.toUpperCase()}`;
  const fullName = `ISOKO QA Seller ${suffix}`;
  const productName = `ISOKO QA Shoes ${suffix}`;
  const png = makeTestPng();
  const imageFile = { name: 'isoko-test-product.png', mimeType: 'image/png', buffer: png };
  const browserErrors = [];

  await routeAppToLocal(page.context());
  page.on('pageerror', (error) => browserErrors.push(error.message));

  // Registration validation must stop invalid data before it reaches the API.
  await page.goto('/abacuruzi', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(750);
  console.log('SELLER REGISTRATION DIAGNOSTIC', JSON.stringify({
    url: page.url(),
    body: (await page.locator('body').innerText().catch(() => '')).slice(0, 1800),
    pageErrors: browserErrors,
  }));
  await expect(page.locator('#seller-email')).toBeVisible({ timeout: 20_000 });
  await page.locator('#seller-email').fill(email);
  await page.locator('#seller-password').fill(password);
  await page.locator('#seller-whatsapp').fill('123');
  await page.locator('#seller-shop-name').fill(shopName);
  await page.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Fungura iduka ryanjye' }).click();
  await expect(page.getByRole('alert')).toContainText('Nimero ya WhatsApp');

  // A valid Rwandan number must create the seller account and shop.
  await page.locator('#seller-whatsapp').fill(phone);
  await page.getByRole('button', { name: 'Fungura iduka ryanjye' }).click();
  await page.waitForTimeout(1500);
  console.log('SELLER SIGNUP RESULT', JSON.stringify({
    url: page.url(),
    alerts: await page.locator('[role="alert"]').allTextContents(),
    body: (await page.locator('body').innerText().catch(() => '')).slice(0, 2400),
    pageErrors: browserErrors,
  }));
  await expect(page).toHaveURL(/\/umucuruzi$/, { timeout: 45_000 });
  await expect(page.getByText('Konti yawe irakora.')).toBeVisible();
  await expect(page.getByRole('heading', { name: shopName })).toBeVisible();

  // Sign in again in a clean browser context to verify login, not just signup.
  const loginContext = await browser.newContext({ baseURL: APP_ORIGIN, viewport: { width: 1280, height: 900 } });
  await routeAppToLocal(loginContext);
  const loginPage = await loginContext.newPage();
  loginPage.setDefaultTimeout(20_000);
  await loginPage.goto('/injira');
  await loginPage.locator('#login-identifier').fill(email);
  await loginPage.locator('#login-pass').fill(password);
  await loginPage.locator('form').filter({ has: loginPage.locator('#login-identifier') }).locator('button[type="submit"]').click();
  await expect(loginPage).toHaveURL(/\/umucuruzi$/);
  await expect(loginPage.getByRole('heading', { name: shopName })).toBeVisible();
  await loginContext.close();

  // Upload all three seller/store image types and save editable profile fields.
  await page.goto('/umucuruzi/iduka');
  await expect(page.getByRole('heading', { name: 'Amakuru y’iduka' })).toBeVisible();
  const settingsFiles = page.locator('input[type="file"]');
  await settingsFiles.nth(0).setInputFiles(imageFile);
  await expect(page.locator('img[alt="Ifoto yawe"]')).toBeVisible();
  await expect(page.locator('img[alt="Ifoto yawe"]')).toHaveAttribute('src', /profiles\//);
  await settingsFiles.nth(1).setInputFiles(imageFile);
  await expect(page.locator('img[alt="Logo y’iduka"]')).toBeVisible();
  await expect(page.locator('img[alt="Logo y’iduka"]')).toHaveAttribute('src', /shops\//);
  await settingsFiles.nth(2).setInputFiles(imageFile);
  await expect(page.locator('img[alt="Ifoto yo hejuru y’iduka"]')).toBeVisible();

  await page.locator('#seller-profile-name').fill(fullName);
  await page.locator('#seller-profile-bio').fill('Umucuruzi wa ISOKO. Iyi ni profile y’igerageza ryuzuye.');
  await page.locator('#shop-name').fill(shopName);
  await page.locator('#shop-hours').fill('08:00 - 19:00');
  await page.locator('#shop-wa').fill(phone);
  await page.locator('#shop-phone').fill(phone);
  await page.locator('#shop-district').selectOption('1');
  await page.locator('#shop-landmark').fill('Hafi y’isoko rikuru');
  await page.locator('#shop-delivery').fill('Dutanga mu Rwanda hose');
  await page.locator('#social-website').fill('https://example.com');
  await page.locator('#shop-about').fill('Iduka ry’igerageza rya ISOKO. Amakuru yose agomba kubikwa.');
  await page.locator('form').filter({ has: page.locator('#shop-about') }).locator('button[type="submit"]').click();
  await expect(page.getByRole('status')).toContainText('Amakuru y’iduka yabitswe neza.');

  // Reload to prove that the profile, shop details, and images persisted.
  await page.reload();
  await expect(page.locator('#seller-profile-name')).toHaveValue(fullName);
  await expect(page.locator('#seller-profile-bio')).toHaveValue('Umucuruzi wa ISOKO. Iyi ni profile y’igerageza ryuzuye.');
  await expect(page.locator('#shop-name')).toHaveValue(shopName);
  await expect(page.locator('#shop-phone')).toHaveValue(phone.replace(/^0/, '250'));
  await expect(page.locator('#shop-wa')).toHaveValue(phone.replace(/^0/, '250'));
  await expect(page.locator('img[alt="Ifoto yawe"]')).toBeVisible();
  await expect(page.locator('img[alt="Logo y’iduka"]')).toBeVisible();
  await expect(page.locator('img[alt="Ifoto yo hejuru y’iduka"]')).toBeVisible();

  // Upload a real image through the browser, then publish a product with stock.
  await page.goto('/umucuruzi/ongeraho');
  await expect(page.getByRole('heading', { name: /Ongeraho igicuruzwa/ })).toBeVisible();
  await page.locator('input[type="file"]').nth(1).setInputFiles(imageFile);
  await expect(page.getByText(/Amafoto washyizeho \(1\/5\)/)).toBeVisible();
  await page.getByRole('button', { name: 'Komeza', exact: true }).click();

  const categoryPicker = page.getByRole('heading', { name: 'Hitamo icyiciro cy’igicuruzwa *' }).locator('xpath=..');
  await categoryPicker.getByRole('button', { name: 'Inkweto', exact: true }).click();
  const subcategoryPicker = page.getByText('Icyiciro cyihariye *', { exact: true }).locator('xpath=..');
  await subcategoryPicker.getByRole('button', { name: 'Siporo (sneakers)', exact: true }).click();
  await page.locator('#wiz-name').fill(productName);
  await page.locator('#wiz-price').fill('25000');
  await page.getByRole('button', { name: 'Komeza', exact: true }).click();
  await page.getByRole('button', { name: '40', exact: true }).click();
  await page.getByRole('button', { name: 'Komeza', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Suzuma uko igicuruzwa kizagaragara' })).toBeVisible();
  await page.getByRole('button', { name: 'Bika kandi utangaze' }).click();
  await expect(page.getByRole('heading', { name: 'Igicuruzwa cyashyizwe ahagaragara!' })).toBeVisible();
  await expect(page.getByText(productName).first()).toBeVisible();

  // Open the exact public product page and verify buyer actions.
  await page.getByRole('button', { name: 'Reba uko abaguzi bakibona' }).click();
  await expect(page).toHaveURL(/\/p\/prod-/);
  await expect(page.getByText(productName).first()).toBeVisible();
  const publicProductUrl = page.url();
  const whatsappLink = page.getByRole('link', { name: 'Vugana kuri WhatsApp' }).first();
  await expect(whatsappLink).toBeVisible();
  const whatsappHref = await whatsappLink.getAttribute('href');
  expect(whatsappHref).toContain('wa.me');
  expect(whatsappHref).toContain(phone.replace(/^0/, '250'));

  await page.getByRole('button', { name: 'Shyira mu gare' }).first().click();
  await expect(page.getByRole('status')).toContainText('Byashyizwe mu gare!');

  // The public storefront must show the product that was just published.
  await page.getByRole('button', { name: 'Reba iduka' }).click();
  await expect(page).toHaveURL(/\/i\//);
  await expect(page.getByRole('heading', { name: shopName })).toBeVisible();
  await expect(page.getByText(productName).first()).toBeVisible();

  // The seller can return later and update the product price.
  await page.goto('/umucuruzi/ibicuruzwa');
  await expect(page.getByRole('heading', { name: 'Ibicuruzwa byanjye' })).toBeVisible();
  await expect(page.getByText(productName).first()).toBeVisible();
  await page.getByRole('button', { name: 'Hindura igiciro' }).click();
  await page.locator('#modal-new-price').fill('23000');
  await page.getByRole('dialog').getByRole('button', { name: 'Bika', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Igiciro cyavuguruwe neza.');

  // Buyer-side public access must work in a clean, signed-out browser context.
  const buyerContext = await browser.newContext({ baseURL: APP_ORIGIN, viewport: { width: 1280, height: 900 } });
  await routeAppToLocal(buyerContext);
  const buyerPage = await buyerContext.newPage();
  buyerPage.setDefaultTimeout(20_000);
  await buyerPage.goto(publicProductUrl);
  await expect(buyerPage.getByText(productName).first()).toBeVisible();
  await expect(buyerPage.getByRole('button', { name: 'Shyira mu gare' }).first()).toBeVisible();
  await expect(buyerPage.getByRole('link', { name: 'Vugana kuri WhatsApp' }).first()).toBeVisible();
  await expect.poll(async () => buyerPage.locator('#product-jsonld').evaluate((el) => JSON.parse(el.textContent).offers.price)).toBe(23000);

  // Complete the buyer's cart journey and verify the WhatsApp order message.
  await buyerPage.getByRole('button', { name: 'Shyira mu gare' }).first().click();
  await expect(buyerPage.getByRole('status')).toContainText('Byashyizwe mu gare!');
  await buyerPage.goto('/igare');
  await expect(buyerPage.getByRole('heading', { name: /Igare/ })).toBeVisible();
  await expect(buyerPage.getByText(productName).first()).toBeVisible();
  const orderLink = buyerPage.getByRole('link', { name: `Ohereza kuri WhatsApp ya ${shopName}` });
  await expect(orderLink).toBeVisible();
  const orderHref = await orderLink.getAttribute('href');
  expect(orderHref).toContain(`wa.me/${phone.replace(/^0/, '250')}`);
  const orderMessage = new URL(orderHref).searchParams.get('text') ?? '';
  expect(orderMessage).toContain(productName);
  expect(orderMessage).toContain('23 000 RWF');

  await buyerContext.close();

  expect(browserErrors, 'No uncaught browser errors should occur during the seller journey').toEqual([]);
});
