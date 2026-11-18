// Read-only audit of the live public site: for every non-Kinyarwanda language, list visible text
// lines that still look like Kinyarwanda. Output: docs/design/qa/language-audit/<lang>.json
const { test } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = 'https://isoko-marketplace-9i69.onrender.com';
const OUT = path.join(process.cwd(), 'docs/design/qa/language-audit');
const ROUTES = ['/', '/ibyiciro', '/shakisha', '/c/inkweto', '/c/imodoka', '/p/prod-b60bf47d986d49348438dcf1891df209',
  '/i/muhire-rwanda', '/abacuruzi', '/injira', '/konti', '/igare', '/amategeko', '/ibanga', '/ubufasha'];
const LANGS = ['en', 'fr', 'sw', 'rn', 'ln', 'lg'];
const RW = /\b(nta|ibicuruzwa|igicuruzwa|iduka|amaduka|fungura|umucuruzi|abacuruzi|ibyiciro|icyiciro|reba|injira|ijambo|ry[’']ibanga|hitamo|andika|cyangwa|byose|igare|konti|habaye|ikibazo|tegereza|subira|gura|vugana|bishya|ubuhinzi|imodoka|ibikoresho|kuri|ntabwo|uburyo|amakuru|ubufasha|amategeko|ibanga|ushaka|ufite|izina|nimero|telefoni|ubutumwa|kwiyandikisha|kwinjira|gushakisha|byagabanyijwe|abagabo|abagore|abana|inkweto|imyenda|amasogisi|ibindi|kwambara)\b/i;

test.setTimeout(900_000);
for (const lang of LANGS) {
  test(`audit ${lang}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 }, locale: 'rw-RW' });
    await context.addInitScript((l) => { try { localStorage.setItem('isoko.lang', l); } catch (e) {} }, lang);
    const page = await context.newPage();
    const found = {};
    for (const route of ROUTES) {
      try {
        await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.waitForTimeout(2500);
        const lines = await page.evaluate(() => document.body.innerText.split('\n').map((s) => s.trim()).filter(Boolean));
        const attrs = await page.evaluate(() => Array.from(document.querySelectorAll('[placeholder],[aria-label],[title]')).map((e) => e.getAttribute('placeholder') || e.getAttribute('aria-label') || e.getAttribute('title')).filter(Boolean));
        found[route] = Array.from(new Set([...lines, ...attrs])).filter((l) => RW.test(l)).slice(0, 60);
      } catch (e) { found[route] = ['ERROR ' + e.message.slice(0, 80)]; }
    }
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, `${lang}.json`), JSON.stringify(found, null, 2) + '\n');
    await context.close();
  });
}
