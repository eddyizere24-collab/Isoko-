const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = 'https://isoko-marketplace-9i69.onrender.com';
const OUTPUT_DIR = path.join(process.cwd(), 'docs/design/qa/2026-11-16-live');
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
  test(`capture live ISOKO public pages at ${viewport.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      locale: 'rw-RW',
      timezoneId: 'Africa/Kigali',
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const results = [];

    for (const [name, route] of ROUTES) {
      const response = await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.locator('body').waitFor({ state: 'visible' });
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await page.waitForTimeout(450);

      const observations = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        const images = Array.from(document.images);
        return {
          lang: html.lang,
          viewportWidth: window.innerWidth,
          documentWidth: html.scrollWidth,
          bodyWidth: body.scrollWidth,
          horizontalOverflow:
            html.scrollWidth > window.innerWidth + 1 ||
            body.scrollWidth > window.innerWidth + 1,
          brokenVisibleImages: images
            .filter((img) => {
              const rect = img.getBoundingClientRect();
              const visible = rect.width > 0 && rect.height > 0;
              return visible && img.complete && img.naturalWidth === 0;
            })
            .map((img) => img.currentSrc || img.src),
          placeholderWhatsAppLinks: Array.from(document.querySelectorAll('a[href]'))
            .map((a) => a.href)
            .filter((href) => href.includes('wa.me/250788000000')),
          visibleVerifiedText: Array.from(document.querySelectorAll('body *'))
            .filter((node) => node.children.length === 0 && /Yagenzuwe|Verified/i.test(node.textContent || ''))
            .map((node) => (node.textContent || '').trim())
            .slice(0, 10),
        };
      });

      results.push({ route, status: response?.status() ?? null, ...observations });
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${name}-${viewport.label}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      expect(response, `${route} should return a document response`).not.toBeNull();
      expect(response.status(), `${route} should load successfully`).toBeLessThan(400);
    }

    // First-time visitors must see Kinyarwanda when storage is empty.
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    expect(await page.locator('html').getAttribute('lang')).toBe('rw');

    const languageTrigger = page.locator('button[aria-haspopup="menu"]').first();
    await expect(languageTrigger).toBeVisible();
    const languageResults = [];
    for (const [code, label] of LANGUAGES) {
      await languageTrigger.click();
      const option = page.locator('[role="menuitemradio"]').filter({ hasText: label }).first();
      await expect(option, `language ${label} should be available`).toBeVisible();
      await option.click();
      await expect(page.locator('html')).toHaveAttribute('lang', code);
      await page.waitForTimeout(150);
      const menuText = await page.locator('body').innerText();
      expect(menuText.toLowerCase()).not.toContain('beta');
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `language-${code}-${viewport.label}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      languageResults.push({ code, label, documentLanguage: await page.locator('html').getAttribute('lang') });
    }

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `observations-${viewport.label}.json`),
      JSON.stringify({ viewport, routes: results, languages: languageResults, pageErrors }, null, 2) + '\n',
    );
    console.log(`LIVE_QA ${viewport.label}: ${JSON.stringify({ routes: results, languages: languageResults, pageErrors })}`);
    await context.close();
  });
}
