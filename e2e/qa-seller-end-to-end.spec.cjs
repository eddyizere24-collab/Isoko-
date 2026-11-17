const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const RUN_ID = process.env.GITHUB_RUN_ID || `local-${Date.now()}`;
const EMAIL = `isoko-qa-e2e-${RUN_ID}@example.com`;
const RUN_PHONE_SUFFIX = String(RUN_ID.replace(/\D/g, '').slice(-6) || Date.now()).slice(-6).padStart(6, '0');
const PHONE = `0788${RUN_PHONE_SUFFIX}`;
const PASSWORD = `Qa!${crypto.randomBytes(24).toString('base64url')}`;
const RESULTS_DIR = path.join(process.cwd(), 'test-results', 'qa-seller-e2e');
fs.mkdirSync(RESULTS_DIR, { recursive: true });

async function makeImageFiles(page, label) {
  const images = await page.evaluate((seed) => {
    const palettes = [['#0B6E4F', '#FAFAF7'], ['#C0392B', '#FFFFFF'], ['#2F80ED', '#F2C14E']];
    return palettes.map((palette, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = palette[0];
      ctx.fillRect(0, 0, 320, 320);
      ctx.fillStyle = palette[1];
      ctx.beginPath();
      ctx.arc(160, 160, 88 + index * 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette[0];
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${seed}-${index + 1}`, 160, 168);
      return canvas.toDataURL('image/png').split(',')[1];
    });
  }, label);
  return images.map((base64, index) => ({
    name: `${label}-${index + 1}.png`,
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64'),
  }));
}

async function uploadBrandPhoto(page, input, file, alt, prefix) {
  await input.setInputFiles(file);
  await expect(page.getByText('Ifoto yabitswe neza ✓').last()).toBeVisible({ timeout: 90_000 });
  const image = page.locator('img').filter({ has: page.locator('source') }).first();
  const target = page.locator(`img[alt="${alt}"]`);
  await expect(target).toHaveAttribute('src', new RegExp(prefix), { timeout: 30_000 });
  const source = await target.getAttribute('src');
  if (!source || !source.includes(prefix)) throw new Error(`Expected ${prefix}; got ${source}`);
  return source;
}

async function createPublishedProduct(page, imageFiles, index) {
  await page.goto('/umucuruzi/ongeraho');
  await page.locator('input[type="file"]').nth(1).setInputFiles(imageFiles);
  await expect(page.getByText(/Amafoto washyizeho \(3\/5\)/)).toBeVisible({ timeout: 120_000 });

  await page.getByRole('button', { name: 'Komeza', exact: true }).click();
  await page.locator('main').getByRole('button', { name: 'Inkweto', exact: true }).first().click();
  await page.locator('main').getByRole('button', { name: "Z'abagabo", exact: true }).click();
  const name = `ISOKO QA Inkweto ${String(index).padStart(2, '0')} ${RUN_ID}`;
  await page.locator('#wiz-name').fill(name);
  await page.locator('#wiz-price').fill(String(25000 + index * 1000));

  await page.getByRole('button', { name: 'Komeza', exact: true }).click();
  await page.locator('main').getByRole('button', { name: '40', exact: true }).click();
  await page.getByRole('button', { name: 'Komeza', exact: true }).click();
  await page.getByRole('button', { name: 'Bika kandi utangaze', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Igicuruzwa cyashyizwe ahagaragara!' })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  return name;
}

async function createGeneralListing(page, imageFile) {
  await page.goto('/umucuruzi/ongeraho');
  await page.locator('input[type="file"]').nth(1).setInputFiles([imageFile]);
  await expect(page.getByText('Amafoto washyizeho (1/5)')).toBeVisible({ timeout: 120_000 });

  await page.getByRole('button', { name: 'Komeza', exact: true }).click();
  await page.locator('main').getByRole('button', { name: 'Ibindi byose', exact: true }).first().click();
  const name = `ISOKO QA Imodoka Toyota ${RUN_ID}`;
  await page.locator('#wiz-name').fill(name);
  await page.locator('#wiz-price').fill('4500000');

  await page.getByRole('button', { name: 'Komeza', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ibicuruzwa rusange' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Hitamo size ziboneka/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Komeza', exact: true }).click();
  await page.getByRole('button', { name: 'Bika kandi utangaze', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Igicuruzwa cyashyizwe ahagaragara!' })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reba uko abaguzi bakibona', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/p/'));
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(page.getByText('Ntibireba', { exact: true })).toHaveCount(0);

  const whatsappLink = page.locator('a[href*="wa.me"]').first();
  await expect(whatsappLink).toHaveCount(1);
  const href = await whatsappLink.getAttribute('href');
  expect(decodeURIComponent(href || '')).not.toContain('Size:');
  return name;
}

test('QA seller registration, separate brand photos, 3-photo publish and 10×3 batch', async ({ page }) => {
  test.setTimeout(35 * 60 * 1000);
  const browserErrors = [];
  const failedApiResponses = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && /\/api\/upload|apirest|neonauth/i.test(response.url())) {
      failedApiResponses.push({ status: response.status(), url: response.url() });
    }
  });

  const brandFiles = await makeImageFiles(page, `brand-${RUN_ID}`);
  const productFiles = await makeImageFiles(page, `product-${RUN_ID}`);

  await page.goto('/abacuruzi');
  await page.locator('#reg-fullname').fill(`ISOKO QA ${RUN_ID}`);
  await page.locator('#reg-email').fill(EMAIL);
  await page.locator('#reg-pass').fill(PASSWORD);
  await page.getByRole('button', { name: 'Komeza', exact: true }).click();

  await page.locator('#reg-shopname').fill(`ISOKO QA ${RUN_ID}`);
  await page.locator('#reg-wa').fill(PHONE);
  await page.getByRole('checkbox', { name: /Nemeye Amategeko/i }).check();
  await page.getByRole('button', { name: 'Fungura iduka ubu', exact: true }).click();
  await expect(page).toHaveURL(/\/abacuruzi(?:\/|$)/, { timeout: 120_000 });

  await page.goto('/umucuruzi/iduka');
  await expect(page.getByText('Hindura cover')).toBeVisible({ timeout: 90_000 });
  const settingsFiles = page.locator('input[type="file"]');
  await expect(settingsFiles).toHaveCount(3);

  const coverSource = await uploadBrandPhoto(page, settingsFiles.nth(0), brandFiles[0], 'Ifoto yo hejuru y’iduka', '/shops/');
  const avatarSource = await uploadBrandPhoto(page, settingsFiles.nth(1), brandFiles[1], 'Ifoto ya profile yawe', '/profiles/');
  const logoSource = await uploadBrandPhoto(page, settingsFiles.nth(2), brandFiles[2], 'Logo y’iduka', '/logos/');

  await page.reload();
  await expect(page.getByAltText('Ifoto yo hejuru y’iduka')).toHaveAttribute('src', new RegExp('/shops/'));
  await expect(page.getByAltText('Ifoto ya profile yawe')).toHaveAttribute('src', new RegExp('/profiles/'));
  await expect(page.getByAltText('Logo y’iduka')).toHaveAttribute('src', new RegExp('/logos/'));

  const generalListingName = await createGeneralListing(page, productFiles[0]);
  const firstName = await createPublishedProduct(page, productFiles, 1);
  await page.getByRole('button', { name: 'Reba uko abaguzi bakibona', exact: true }).click();
  await expect(page).toHaveURL(/\/p\//);
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
  const productImageSources = await page.locator('img').evaluateAll(images =>
    images.map(img => img.getAttribute('src') || '').filter(src => src.includes('/products/'))
  );
  expect(new Set(productImageSources).size).toBeGreaterThanOrEqual(3);

  const shopLink = page.locator('a[href^="/i/"]').first();
  await expect(shopLink).toBeVisible();
  const shopPath = await shopLink.getAttribute('href');
  await shopLink.click();
  await expect(page).toHaveURL(/\/i\//);
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();

  // Allow the first 6 original uploads to leave the rolling 60-second window.
  await page.waitForTimeout(65_000);

  const published = [firstName];
  for (let index = 2; index <= 10; index += 1) {
    const name = await createPublishedProduct(page, productFiles, index);
    published.push(name);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/UPLOAD_(?:DAILY_QUOTA_EXCEEDED|RATE_LIMIT_EXCEEDED)|Wageze ku mubare ntarengwa|Wohereje amafoto menshi/i);
    if (index < 10) {
      // Keep the regression batch within the server-enforced rolling 60-second quota.
      // The upload quota is intentionally not weakened to make this test pass.
      if (index === 6) await page.waitForTimeout(65_000);
      else await page.waitForTimeout(8_000);
      await page.getByRole('button', { name: /Shyiraho ikindi/ }).click();
    }
  }

  expect(browserErrors).toEqual([]);
  expect(failedApiResponses).toEqual([]);
  const evidence = {
    runId: RUN_ID,
    email: EMAIL,
    shopName: `ISOKO QA ${RUN_ID}`,
    avatarPrefix: avatarSource.split('/profiles/')[1]?.split('/')[0] || null,
    coverPrefix: coverSource.split('/shops/')[1]?.split('/')[0] || null,
    logoPrefix: logoSource.split('/logos/')[1]?.split('/')[0] || null,
    productsPublished: published.length,
    generalListingName,
    productNames: published,
    photosPerProduct: 3,
    bulkOriginalPhotoUploads: 30,
    brandPhotoUploads: 3,
    browserErrors,
    failedApiResponses,
    publicShopPath: shopPath,
  };
  fs.writeFileSync(path.join(RESULTS_DIR, 'seller-flow-summary.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log('QA_SELLER_FLOW_EVIDENCE ' + JSON.stringify(evidence));
});
