const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = 'http://127.0.0.1:4173';
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
const ROUTES = [
  ['home', '/'],
  ['ibyiciro', '/ibyiciro'],
  ['shakisha', '/shakisha'],
  ['igicuruzwa', '/p/qa-empty-product'],
  ['iduka', '/i/qa-empty-shop'],
  ['igare', '/igare'],
  ['injira', '/injira'],
  ['abacuruzi', '/abacuruzi'],
];
const VIEWPORTS = [
  { label: '360', width: 360, height: 800 },
  { label: '412', width: 412, height: 915 },
];

async function configureEmptyPublicCatalogue(context) {
  await context.route(/\.aws\.neon\.tech\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname.includes('.apirest.') && url.pathname.endsWith('/v_public_bootstrap')) {
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
}

test('capture Android mobile pages at 360/412 CSS pixels with DPR 2', async ({ browser }) => {
  test.setTimeout(120_000);
  const outputDir = path.resolve(process.cwd(), 'docs/design/qa/2026-11-16');
  fs.mkdirSync(outputDir, { recursive: true });

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2,
      locale: 'rw-RW',
      isMobile: true,
      hasTouch: true,
      serviceWorkers: 'block',
    });
    await configureEmptyPublicCatalogue(context);

    for (const [name, routePath] of ROUTES) {
      const page = await context.newPage();
      await page.goto(BASE_URL + routePath, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => undefined);
      await page.evaluate(async () => { await document.fonts.ready; });
      await page.waitForTimeout(250);
      const target = path.join(outputDir, `${name}-${viewport.label}.png`);
      await page.screenshot({ path: target, animations: 'disabled' });
      const size = fs.statSync(target).size;
      expect(size, `${target} must be <= 400KB`).toBeLessThanOrEqual(400 * 1024);
      await page.close();
    }

    if (viewport.width === 360) {
      const brandPage = await context.newPage();
      await brandPage.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
      const brandScreens = [
        ['sun-16.png', 16],
        ['sun-24.png', 24],
        ['sun-32.png', 32],
      ];
      for (const [filename, size] of brandScreens) {
        await brandPage.setContent(
          `<!doctype html><html lang="rw"><body style="margin:0;width:360px;height:180px;background:#fff;display:flex;align-items:center;justify-content:center"><img src="${BASE_URL}/icon.svg" width="${size}" height="${size}" alt="ISOKO sun at ${size}px"></body></html>`,
          { waitUntil: 'load' }
        );
        await brandPage.locator('img').evaluate((img) => img.decode());
        const target = path.join(outputDir, filename);
        await brandPage.locator('img').screenshot({ path: target, animations: 'disabled' });
        expect(fs.statSync(target).size, filename).toBeLessThanOrEqual(400 * 1024);
      }
      await brandPage.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
      const patternPath = path.join(outputDir, 'imigongo-360.png');
      await brandPage.locator('.imigongo-header-strip').screenshot({
        path: patternPath,
        animations: 'disabled',
      });
      expect(fs.statSync(patternPath).size, 'imigongo-360.png').toBeLessThanOrEqual(400 * 1024);
      const logoPath = path.join(outputDir, 'logo-360.png');
      await brandPage.locator('header a').first().screenshot({
        path: logoPath,
        animations: 'disabled',
      });
      expect(fs.statSync(logoPath).size, 'logo-360.png').toBeLessThanOrEqual(400 * 1024);
      await brandPage.close();
    }

    await context.close();
  }
});


test('rasterise the compact vector mark into Android and Apple PWA PNG assets', async ({ browser }) => {
  test.setTimeout(60_000);
  const context = await browser.newContext({
    viewport: { width: 520, height: 520 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const icons = [
    { src: '/pwa-icon.svg', file: 'pwa-192x192.png', width: 192, height: 192 },
    { src: '/pwa-icon.svg', file: 'pwa-512x512.png', width: 512, height: 512 },
    { src: '/pwa-maskable.svg', file: 'pwa-maskable-512x512.png', width: 512, height: 512 },
    { src: '/apple-touch-icon.svg', file: 'apple-touch-icon.png', width: 180, height: 180 },
  ];

  for (const icon of icons) {
    await page.setContent(
      `<!doctype html><html lang="rw"><body style="margin:0;background:#fff;width:${icon.width}px;height:${icon.height}px"><img src="${BASE_URL}${icon.src}" width="${icon.width}" height="${icon.height}" style="display:block" alt="ISOKO app icon"></body></html>`,
      { waitUntil: 'load' }
    );
    const image = page.locator('img');
    await image.evaluate((img) => img.decode());
    const target = path.resolve(process.cwd(), 'public', icon.file);
    await image.screenshot({ path: target, animations: 'disabled' });
    const bytes = fs.readFileSync(target);
    expect(bytes.readUInt32BE(16), icon.file + ' width').toBe(icon.width);
    expect(bytes.readUInt32BE(20), icon.file + ' height').toBe(icon.height);
    expect(bytes.length, icon.file + ' size').toBeLessThanOrEqual(400 * 1024);
  }

  await context.close();
});
