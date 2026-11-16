const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const OUTPUT_DIR = path.join(process.cwd(), 'docs/design/qa/2026-11-16-after');
const ROUTES = [
  ['home', '/'],
  ['category-shoes', '/c/inkweto'],
  ['category-other', '/c/ibindi'],
  ['product', '/p/prod-b60bf47d986d49348438dcf1891df209'],
  ['shop', '/i/muhire-rwanda'],
  ['seller-entry', '/abacuruzi'],
  ['login', '/injira'],
  ['account-signed-out', '/konti'],
  ['terms', '/amategeko'],
  ['privacy', '/ibanga'],
  ['help', '/ubufasha'],
  ['about', '/ibyerekeye'],
];
const LANGUAGES = [
  ['rw', 'Ikinyarwanda'],
  ['en', 'English'],
  ['fr', 'Français'],
  ['sw', 'Kiswahili'],
  ['rn', 'Ikirundi'],
  ['ln', 'Lingála'],
  ['lg', 'Luganda'],
];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const viewport of [
  { width: 360, height: 800, label: '360x800' },
  { width: 320, height: 800, label: '320x800' },
]) {
  test(`capture redesigned ISOKO production-data preview at ${viewport.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      locale: 'rw-RW',
      timezoneId: 'Africa/Kigali',
    });
    const page = await context.newPage();
    const pageErrors = [];
    const blockedMutations = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    // Public read-only visual QA: never allow an unsafe HTTP request to reach Production.
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        blockedMutations.push({ method: request.method(), url: request.url() });
        await route.abort('blockedbyclient');
        return;
      }
      await route.continue();
    });
    const routeResults = [];

    for (const [name, route] of ROUTES) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.locator('body').waitFor({ state: 'visible' });
      await page.waitForFunction(() => Boolean(document.querySelector('h1')?.textContent?.trim()), null, { timeout: 12_000 }).catch(() => undefined);
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await page.waitForTimeout(800);
      const data = await page.evaluate(() => {
        const root = document.documentElement;
        const images = Array.from(document.images);
        const rect = document.querySelector('main')?.getBoundingClientRect();
        return {
          documentLanguage: root.lang,
          documentWidth: root.scrollWidth,
          horizontalOverflow: root.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1,
          brokenVisibleImages: images.filter(img => {
            const r = img.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && img.complete && img.naturalWidth === 0;
          }).map(img => img.currentSrc || img.src),
          mainBackground: rect ? getComputedStyle(document.querySelector('main')).backgroundColor : null,
          bodyBackground: getComputedStyle(document.body).backgroundColor,
        };
      });
      routeResults.push({ route, status: response?.status() ?? null, ...data });
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${name}-${viewport.label}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      expect(response, `${route} should respond`).not.toBeNull();
      expect(response.status(), `${route} should load`).toBeLessThan(400);
    }

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'rw');
    const trigger = page.locator('button[aria-haspopup="menu"]').first();
    await expect(trigger).toBeVisible();
    const languageResults = [];
    for (const [code, label] of LANGUAGES) {
      await trigger.click();
      const option = page.locator('[role="menuitemradio"]').filter({ hasText: label }).first();
      await expect(option).toBeVisible();
      await option.click();
      await expect(page.locator('html')).toHaveAttribute('lang', code);
      await page.waitForTimeout(120);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `language-${code}-${viewport.label}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      languageResults.push({ code, lang: await page.locator('html').getAttribute('lang') });
    }

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `observations-${viewport.label}.json`),
      JSON.stringify({ viewport, routes: routeResults, languages: languageResults, pageErrors, blockedMutations }, null, 2) + '\n',
    );
    expect(pageErrors, 'browser page errors').toEqual([]);
    expect(routeResults.filter(r => r.horizontalOverflow).map(r => r.route), 'routes with horizontal overflow').toEqual([]);
    console.log(`BRAND_PREVIEW_QA ${viewport.label}: ${JSON.stringify({ routes: routeResults, languages: languageResults, pageErrors, blockedMutations })}`);
    await context.close();
  });
}
