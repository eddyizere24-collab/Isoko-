import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { RWANDA_AREAS } from './src/data/rwandaAreas';
import { calculateDiscountPercent, getSimilarProducts } from './src/lib/algorithm';
import { validateProductForm, validateReportForm, validateShopProfile } from './src/lib/validation';
import { formatRwfCurrency, isValidRwandaPhone, normalizeRwandaPhone } from './src/lib/whatsapp';
import { hashPassword } from './src/server/seedData';
import { enrichPublicProducts, getDb, getPublicShops, persistDb } from './src/server/store';
import type { Product, Profile, ReportStatus, SellerStatus } from './src/types/marketplace';

const PORT = 3000;
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface SessionRecord {
  userId: string;
  role: 'seller' | 'admin' | 'moderator';
  expiresAt: number;
}

const activeSessions = new Map<string, SessionRecord>();
const loginAttempts = new Map<string, { count: number; windowStart: number; lockedUntil: number }>();

function getAuthSession(req: express.Request): { profile: Profile; role: SessionRecord['role'] } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const sess = activeSessions.get(token);

  const db = getDb();
  if (!sess) {
    // Allow deterministic token recovery for demo tokens stored across server restarts: token format "uid:<id>:<sig>"
    if (token.startsWith('uid:')) {
      const parts = token.split(':');
      const uid = parts[1];
      const profile = db.profiles.find((p) => p.id === uid);
      if (profile && parts[2] === hashPassword(uid + profile.passwordHash)) {
        return { profile, role: profile.role };
      }
    }
    return null;
  }

  if (Date.now() > sess.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  const profile = db.profiles.find((p) => p.id === sess.userId);
  if (!profile) return null;
  return { profile, role: profile.role };
}

function makeSessionToken(profile: Profile & { passwordHash: string }): string {
  const token = `uid:${profile.id}:${hashPassword(profile.id + profile.passwordHash)}`;
  activeSessions.set(token, {
    userId: profile.id,
    role: profile.role,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isSocialCrawler(userAgent: string): boolean {
  return /WhatsApp|facebookexternalhit|Facebot|Twitterbot|Googlebot|LinkedInBot|TelegramBot/i.test(
    userAgent
  );
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Serve uploaded files and generated images cleanly in both dev and prod
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));

  // Security headers (Section 8.11)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // --- SEO & Social Crawler OpenGraph Previews (Section 8.8 & O-02) ---
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /shakisha',
        'Disallow: /igare',
        'Disallow: /admin',
        'Disallow: /umucuruzi',
        'Disallow: /injira',
        'Sitemap: /sitemap.xml',
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const db = getDb();
    const base = `${req.protocol}://${req.get('host')}`;
    const shops = getPublicShops(db);
    const products = enrichPublicProducts(db);
    const urls = [
      `${base}/`,
      `${base}/ibyerekeye`,
      `${base}/ubufasha`,
      `${base}/amategeko`,
      `${base}/ibanga`,
      ...shops.map((s) => `${base}/i/${s.slug}`),
      ...products.map((p) => `${base}/p/${p.id}`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`)
      .join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  });

  app.get('/p/:id', (req, res, next) => {
    const ua = req.headers['user-agent'] ?? '';
    if (!isSocialCrawler(ua)) return next();

    const db = getDb();
    const product = enrichPublicProducts(db).find((p) => p.id === req.params.id);
    if (!product) return next();

    const base = `${req.protocol}://${req.get('host')}`;
    const img = product.images[0]?.path_full ?? '';
    const imgUrl = img.startsWith('http') ? img : `${base}${img}`;
    const title = `${product.name} — ${formatRwfCurrency(product.price)}`;
    const desc = `${product.shop?.name ?? 'Isoko'} · ${product.shop?.district_name ?? 'Kigali'} · ${product.description}`.slice(0, 160);

    res.type('html').send(`<!doctype html>
<html lang="rw">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(desc)}" />
<meta property="og:image" content="${escapeHtml(imgUrl)}" />
<meta property="og:type" content="product" />
<meta name="twitter:card" content="summary_large_image" />
</head>
<body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(desc)}</p></body>
</html>`);
  });

  app.get('/i/:slug', (req, res, next) => {
    const ua = req.headers['user-agent'] ?? '';
    if (!isSocialCrawler(ua)) return next();

    const db = getDb();
    const shop = getPublicShops(db).find((s) => s.slug === req.params.slug);
    if (!shop) return next();

    const base = `${req.protocol}://${req.get('host')}`;
    const img = shop.logo_path ?? shop.cover_path ?? '';
    const imgUrl = img.startsWith('http') ? img : `${base}${img}`;
    const title = `${shop.name} — Iduka Ryagenzuwe ku Isoko`;
    const desc = `${shop.district_name}${shop.sector_name ? `, ${shop.sector_name}` : ''} · ${shop.about}`.slice(0, 160);

    res.type('html').send(`<!doctype html>
<html lang="rw">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(desc)}" />
<meta property="og:image" content="${escapeHtml(imgUrl)}" />
<meta property="og:type" content="website" />
</head>
<body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(desc)}</p></body>
</html>`);
  });

  // --- Public API Routes ---
  app.get('/api/bootstrap', (_req, res) => {
    const db = getDb();
    const activeCategories = db.categories.filter(
      (c) => c.active || (c.phase === 'P3' && db.settings.PHONE_ACCESSORIES_ENABLED)
    );
    res.json({
      categories: activeCategories,
      areas: RWANDA_AREAS,
      synonyms: db.synonyms,
      settings: db.settings,
      shops: getPublicShops(db),
      products: enrichPublicProducts(db),
    });
  });

  app.get('/api/products/:id', (req, res) => {
    const db = getDb();
    const allPublic = enrichPublicProducts(db);
    const product = allPublic.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({
        error: 'Iki gicuruzwa ntikiriho',
        alternatives: allPublic.slice(0, 8),
      });
    }
    const priceHistory = db.price_history.filter((ph) => ph.product_id === product.id);
    const similar = getSimilarProducts(product, allPublic, db.categories);
    const buyTogether = allPublic
      .filter((p) => p.shop_id === product.shop_id && p.id !== product.id && p.status === 'active')
      .slice(0, 4);

    res.json({ product, priceHistory, similar, buyTogether });
  });

  app.get('/api/shops/:slug', (req, res) => {
    const db = getDb();
    const shop = getPublicShops(db).find((s) => s.slug === req.params.slug);
    if (!shop) {
      return res.status(404).json({ error: 'Iduka ntirikiriho' });
    }
    const products = enrichPublicProducts(db).filter((p) => p.shop_id === shop.id);
    res.json({ shop, products });
  });

  app.post('/api/cart/validate', (req, res) => {
    const db = getDb();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const publicProducts = new Map(enrichPublicProducts(db).map((p) => [p.id, p]));

    const validated = items.map((it: { productId: string; size: string; priceSeen: number }) => {
      const prod = publicProducts.get(it.productId);
      if (!prod) {
        return {
          productId: it.productId,
          exists: false,
          status: 'hidden',
          currentPrice: it.priceSeen,
          sizeInStock: false,
        };
      }
      const variant = prod.variants.find(
        (v) => v.size_label.toLowerCase() === String(it.size).toLowerCase()
      );
      const sizeInStock =
        prod.status === 'active' &&
        Boolean(variant && variant.in_stock && (variant.qty === null || variant.qty > 0));

      return {
        productId: prod.id,
        exists: true,
        status: prod.status,
        currentPrice: prod.price,
        priceChanged: prod.price !== it.priceSeen,
        sizeInStock,
      };
    });

    res.json({ validated });
  });

  app.post('/api/events', (req, res) => {
    const { type, productId, shopId, sessionId } = req.body ?? {};
    const validTypes = new Set(['view', 'wa_click', 'call_click', 'cart_add', 'share']);
    if (!validTypes.has(type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const db = getDb();
    const day = new Date().toISOString().slice(0, 10);
    const sid = String(sessionId || req.ip || 'anon').slice(0, 64);

    // Rate limit per session per minute (simple protection against S7 1000 req/min spam)
    const minuteKey = `rate:${sid}:${new Date().toISOString().slice(0, 16)}`;
    const rateCount = db.report_rate[minuteKey] ?? 0;
    if (rateCount >= 60) {
      return res.status(429).json({ error: 'Ibikorwa byinshi mu munota umwe.' });
    }
    db.report_rate[minuteKey] = rateCount + 1;

    // Deduplicate: 1 event of same type per target per session per day (M-02)
    const dedupKey = `${day}:${sid}:${type}:${productId || shopId}`;
    if (db.event_dedup[dedupKey]) {
      return res.json({ ok: true, deduplicated: true });
    }
    db.event_dedup[dedupKey] = true;

    if (productId) {
      let row = db.product_daily_stats.find((r) => r.target_id === productId && r.day === day);
      if (!row) {
        row = { target_id: productId, day, views: 0, wa_clicks: 0, call_clicks: 0, cart_adds: 0, shares: 0 };
        db.product_daily_stats.push(row);
      }
      if (type === 'view') row.views++;
      if (type === 'wa_click') row.wa_clicks++;
      if (type === 'call_click') row.call_clicks++;
      if (type === 'cart_add') row.cart_adds++;
      if (type === 'share') row.shares++;
    }

    if (shopId) {
      let srow = db.shop_daily_stats.find((r) => r.target_id === shopId && r.day === day);
      if (!srow) {
        srow = { target_id: shopId, day, views: 0, wa_clicks: 0, call_clicks: 0, cart_adds: 0, shares: 0 };
        db.shop_daily_stats.push(srow);
      }
      if (type === 'view') srow.views++;
      if (type === 'wa_click') srow.wa_clicks++;
      if (type === 'call_click') srow.call_clicks++;
      if (type === 'share') srow.shares++;
    }

    persistDb();
    res.json({ ok: true });
  });

  app.post('/api/reports', (req, res) => {
    const { targetType, targetId, type, details, reporterPhone, sessionId, turnstileOk } = req.body ?? {};
    if (!turnstileOk) {
      return res.status(400).json({ error: 'Emeza ko utari robot mbere yo kohereza ikirego.' });
    }
    const normalizedReporterPhone = reporterPhone ? normalizeRwandaPhone(reporterPhone) : '';
    const errors = validateReportForm({ type, details, reporterPhone: normalizedReporterPhone });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: Object.values(errors)[0], errors });
    }

    const db = getDb();
    const day = new Date().toISOString().slice(0, 10);
    const sid = String(sessionId || req.ip || 'anon').slice(0, 64);
    const rateKey = `rep:${day}:${sid}`;
    const countToday = db.report_rate[rateKey] ?? 0;

    // L-03: Max 5 reports per day per session/phone
    if (countToday >= 5) {
      return res.status(429).json({
        error: 'Ugeze ku mupaka w’ibirego 5 ku munsi. Ongera ugerageze ejo.',
      });
    }
    db.report_rate[rateKey] = countToday + 1;

    const prod = targetType === 'product' ? db.products.find((p) => p.id === targetId) : undefined;
    const shop = targetType === 'shop' ? db.shops.find((s) => s.id === targetId) : undefined;

    const newReport = {
      id: `rep-${crypto.randomUUID().slice(0, 8)}`,
      target_type: targetType === 'shop' ? 'shop' : 'product',
      target_id: String(targetId),
      target_name: prod?.name ?? shop?.name ?? String(targetId),
      type,
      details: String(details).trim(),
      reporter_phone: normalizedReporterPhone || null,
      session_hash: sid,
      status: 'new' as ReportStatus,
      resolution: null,
      created_at: new Date().toISOString(),
      resolved_by: null,
      resolved_at: null,
    };

    db.reports.unshift(newReport as typeof db.reports[number]);

    // L-04: >=3 reports in 24h auto-hides product temporarily for admin review
    if (targetType === 'product' && prod) {
      const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
      const recentCount = db.reports.filter(
        (r) =>
          r.target_type === 'product' &&
          r.target_id === targetId &&
          new Date(r.created_at).getTime() >= cutoff24h
      ).length;
      if (recentCount >= 3 && prod.status === 'active') {
        prod.status = 'hidden';
        prod.hidden_reason = 'Byahishwe by’agateganyo kubera ibirego >= 3 mu masaha 24.';
      }
    }

    persistDb();
    res.status(201).json({ report: newReport });
  });

  app.post('/api/subscribers', (req, res) => {
    const { kind, externalId, districtId, topCategoryId, shopId, unsubscribe } = req.body ?? {};
    const db = getDb();

    if (unsubscribe) {
      const existing = db.subscribers.find(
        (s) => s.external_id === externalId && s.kind === kind && !s.unsubscribed_at
      );
      if (existing) {
        existing.unsubscribed_at = new Date().toISOString();
        persistDb();
      }
      return res.json({ ok: true, unsubscribed: true });
    }

    if (!externalId) {
      return res.status(400).json({ error: 'Shyiramo imeri cyangwa igikoresho.' });
    }

    const sub = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      kind: kind || 'email',
      external_id: String(externalId).trim(),
      district_id: districtId ?? null,
      top_category_id: topCategoryId ?? null,
      shop_id: shopId ?? null,
      consent_at: new Date().toISOString(),
      consent_version: db.settings.TERMS_VERSION,
      unsubscribed_at: null,
    };
    db.subscribers.push(sub);
    persistDb();
    res.status(201).json({ subscriber: sub });
  });

  // --- Auth Routes ---
  app.post('/api/auth/login', (req, res) => {
    const phone = normalizeRwandaPhone(String(req.body?.phone ?? ''));
    const password = String(req.body?.password ?? '');

    if (!isValidRwandaPhone(phone) || password.length < 6) {
      return res.status(400).json({ error: 'Nimero ya telefoni cyangwa ijambo ry’ibanga ntibihuje.' });
    }

    const now = Date.now();
    const attemptKey = `${req.ip}:${phone}`;
    const tracker = loginAttempts.get(attemptKey) ?? { count: 0, windowStart: now, lockedUntil: 0 };

    // Section 8.11: lock account 15 min after 10 failures; 5 attempts/min
    if (tracker.lockedUntil > now) {
      return res.status(429).json({
        error: 'Wagerageje kenshi nabi. Tegereza iminota 15 mbere yo kongera.',
      });
    }
    if (now - tracker.windowStart > 60_000) {
      tracker.count = 0;
      tracker.windowStart = now;
    }

    const db = getDb();
    const user = db.profiles.find((p) => p.phone === phone);
    if (!user || user.passwordHash !== hashPassword(password)) {
      tracker.count += 1;
      if (tracker.count >= 10) {
        tracker.lockedUntil = now + 15 * 60_000;
      }
      loginAttempts.set(attemptKey, tracker);
      return res.status(401).json({ error: 'Nimero cyangwa ijambo ry’ibanga sibyo.' });
    }

    loginAttempts.delete(attemptKey);
    const token = makeSessionToken(user);
    const shop = db.shops.find((s) => s.owner_id === user.id) ?? null;

    const { passwordHash: _pw, ...safeProfile } = user;
    res.json({
      token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      profile: safeProfile,
      shop,
    });
  });

  app.post('/api/auth/register-seller', (req, res) => {
    const {
      fullName,
      phone,
      whatsapp,
      password,
      shopName,
      districtId,
      sectorId,
      landmark,
      deliveryText,
      about,
      nationalIdNumber,
      businessType,
      tin,
      idFrontDataUrl,
      idBackDataUrl,
      selfieDataUrl,
      shopPhotoDataUrl,
      termsAccepted,
    } = req.body ?? {};

    if (!termsAccepted) {
      return res.status(400).json({ error: 'Ugomba kwemera amategeko n’amasezerano y’umucuruzi.' });
    }

    const normPhone = normalizeRwandaPhone(String(phone ?? ''));
    const normWa = normalizeRwandaPhone(String(whatsapp ?? phone ?? ''));
    if (!isValidRwandaPhone(normPhone) || !isValidRwandaPhone(normWa)) {
      return res.status(400).json({ error: 'Nimero ya telefoni na WhatsApp bigomba kuba ibyo mu Rwanda (2507XXXXXXXX).' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Ijambo ry’ibanga rigomba kugira nibura inyuguti/imibare 6.' });
    }
    if (!shopName || String(shopName).trim().length < 2) {
      return res.status(400).json({ error: 'Shyiramo izina ry’iduka ryawe.' });
    }

    const db = getDb();
    if (db.profiles.some((p) => p.phone === normPhone)) {
      return res.status(409).json({ error: 'Iyi nimero isanzwe ifite konti. Injira ukoresheje iyo konti.' });
    }

    const sellerId = `prof-seller-${crypto.randomUUID().slice(0, 8)}`;
    const slugBase = String(shopName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 26);
    const slug = db.shops.some((s) => s.slug === slugBase)
      ? `${slugBase}-${Math.floor(100 + Math.random() * 900)}`
      : slugBase || `iduka-${Date.now()}`;

    const areaDist = RWANDA_AREAS.find((a) => a.id === Number(districtId));
    const areaSec = sectorId ? RWANDA_AREAS.find((a) => a.id === Number(sectorId)) : undefined;

    const newProfile: Profile & { passwordHash: string } = {
      id: sellerId,
      role: 'seller',
      full_name: String(fullName || shopName).trim(),
      phone: normPhone,
      whatsapp: normWa,
      status: 'pending',
      status_reason: null,
      approved_by: null,
      approved_at: null,
      terms_version: db.settings.TERMS_VERSION,
      terms_accepted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      passwordHash: hashPassword(String(password)),
    };

    const newShop = {
      id: `shop-${crypto.randomUUID().slice(0, 8)}`,
      owner_id: sellerId,
      slug,
      name: String(shopName).trim().slice(0, 40),
      logo_path: null,
      cover_path: null,
      about: String(about ?? '').trim().slice(0, 200),
      whatsapp: normWa,
      phone: normPhone,
      district_id: areaDist?.id ?? 1,
      sector_id: areaSec?.id ?? null,
      district_name: areaDist?.district ?? 'Gasabo',
      sector_name: areaSec?.sector ?? null,
      landmark: String(landmark ?? '').trim().slice(0, 80),
      hours_text: '08:30 – 19:30',
      delivery_text: String(deliveryText ?? 'Gutanga i Kigali').trim().slice(0, 120),
      product_limit: db.settings.DEFAULT_PRODUCT_LIMIT,
      plan: 'free' as const,
      plan_expires_at: null,
      created_at: new Date().toISOString(),
      status: 'pending' as SellerStatus,
    };

    const kyc = {
      seller_id: sellerId,
      full_name_on_id: String(fullName || '').trim(),
      national_id_number: String(nationalIdNumber || '').trim(),
      id_front_path: String(idFrontDataUrl || '/src/assets/images/hero_kigali_fashion_1794551814589.jpg'),
      id_back_path: String(idBackDataUrl || '/src/assets/images/hero_kigali_fashion_1794551814589.jpg'),
      selfie_path: String(selfieDataUrl || '/src/assets/images/hero_kigali_fashion_1794551814589.jpg'),
      shop_photo_path: String(shopPhotoDataUrl || '/src/assets/images/hero_kigali_fashion_1794551814589.jpg'),
      tin: tin ? String(tin).trim() : null,
      business_type: String(businessType || 'Iduka').trim(),
      phone_verified_at: null,
      whatsapp_verified_at: null,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      review_notes: null,
    };

    db.profiles.push(newProfile);
    db.shops.push(newShop);
    db.seller_kyc.push(kyc);
    persistDb();

    const token = makeSessionToken(newProfile);
    const { passwordHash: _pw, ...safeProfile } = newProfile;
    res.status(201).json({
      token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      profile: safeProfile,
      shop: newShop,
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth) return res.status(401).json({ error: 'Injira mbere yo gukomeza.' });
    const db = getDb();
    const shop = db.shops.find((s) => s.owner_id === auth.profile.id) ?? null;
    const { passwordHash: _pw, ...safeProfile } = auth.profile as Profile & { passwordHash?: string };
    res.json({ profile: safeProfile, shop });
  });

  // --- Image Upload Endpoint (Section 7.5, 8.6, 8.11, S5, S6) ---
  app.post('/api/upload', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth) {
      return res.status(401).json({ error: 'Ugomba kwinjira nk’umucuruzi mbere yo kohereza ifoto.' });
    }
    const { dataUrl, kind } = req.body ?? {};
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Ubwoko bw’ifoto ntibwemewe.' });
    }

    const match = dataUrl.match(/^data:(image\/(?:webp|jpeg|png));base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Emera gusa image/webp, image/jpeg cyangwa image/png.' });
    }

    const mime = match[1];
    const buf = Buffer.from(match[2], 'base64');
    if (buf.length > 500 * 1024) {
      return res.status(400).json({ error: 'Ifoto ntigomba kurenza 500 KB.' });
    }

    const ext = mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : 'jpg';
    const safeKind = kind === 'thumb' ? 'thumb' : 'full';
    const filename = `${auth.profile.id}_${Date.now()}_${crypto.randomUUID().slice(0, 6)}_${safeKind}.${ext}`;
    const safePath = path.join(UPLOADS_DIR, path.basename(filename));
    fs.writeFileSync(safePath, buf);

    res.json({
      url: `/uploads/${path.basename(filename)}`,
      bytes: buf.length,
    });
  });

  // --- Seller Routes (Authenticated Seller) ---
  app.get('/api/seller/overview', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth) return res.status(401).json({ error: 'Injira mbere yo gukomeza.' });

    const db = getDb();
    const shop = db.shops.find((s) => s.owner_id === auth.profile.id);
    if (!shop) return res.status(404).json({ error: 'Iduka ntiryabonetse.' });

    const products = enrichPublicProducts(db, true).filter((p) => p.shop_id === shop.id);
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const prodIds = new Set(products.map((p) => p.id));

    const stats30d = db.product_daily_stats.filter((s) => prodIds.has(s.target_id) && s.day >= cutoff30d);
    const stats7d = stats30d.filter((s) => s.day >= cutoff7d);

    const sumStats = (rows: typeof stats30d) =>
      rows.reduce(
        (acc, r) => ({
          views: acc.views + r.views,
          wa_clicks: acc.wa_clicks + r.wa_clicks,
          call_clicks: acc.call_clicks + r.call_clicks,
          cart_adds: acc.cart_adds + r.cart_adds,
          shares: acc.shares + r.shares,
        }),
        { views: 0, wa_clicks: 0, call_clicks: 0, cart_adds: 0, shares: 0 }
      );

    // Section 9.6: Stale products (> 30 days since last_confirmed_at)
    const staleThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const staleProducts = products.filter(
      (p) => p.status === 'active' && new Date(p.last_confirmed_at).getTime() <= staleThreshold
    );

    const topViewed = [...products]
      .sort((a, b) => (b.views_7d ?? 0) - (a.views_7d ?? 0))
      .slice(0, 5);
    const topWa = [...products]
      .sort((a, b) => (b.wa_clicks_7d ?? 0) - (a.wa_clicks_7d ?? 0))[0] ?? null;

    res.json({
      profile: {
        id: auth.profile.id,
        full_name: auth.profile.full_name,
        status: auth.profile.status,
        status_reason: auth.profile.status_reason,
      },
      shop,
      products,
      staleProducts,
      stats7d: sumStats(stats7d),
      stats30d: sumStats(stats30d),
      topViewed,
      topWa,
    });
  });

  app.post('/api/seller/products', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth) return res.status(401).json({ error: 'Injira mbere yo gukomeza.' });

    const db = getDb();
    const shop = db.shops.find((s) => s.owner_id === auth.profile.id);
    if (!shop) return res.status(404).json({ error: 'Iduka ntiryabonetse.' });

    const activeCount = db.products.filter((p) => p.shop_id === shop.id && p.status === 'active').length;
    if (activeCount >= shop.product_limit) {
      return res.status(400).json({ error: `Wageze ku mupaka w’ibicuruzwa ${shop.product_limit}.` });
    }

    const body = req.body ?? {};
    const imagesInput: Array<{ path_full: string; path_thumb: string; width: number; height: number; bytes: number }> =
      Array.isArray(body.images) ? body.images : [];
    const variantsInput: Array<{ size_label: string; in_stock: boolean; qty: number | null }> =
      Array.isArray(body.variants) ? body.variants : [];

    const errors = validateProductForm({
      photosCount: imagesInput.length,
      categoryId: body.category_id ? Number(body.category_id) : null,
      name: String(body.name ?? ''),
      price: Number(body.price),
      oldPrice: body.old_price ? Number(body.old_price) : null,
      condition: body.condition === 'used' ? 'used' : 'new',
      brand: body.brand ? String(body.brand) : '',
      authentic: Boolean(body.authentic),
      variants: variantsInput,
      colors: Array.isArray(body.colors) ? body.colors : [],
      description: String(body.description ?? ''),
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: Object.values(errors)[0], errors });
    }

    const productId = `prod-${crypto.randomUUID().slice(0, 8)}`;
    const nowIso = new Date().toISOString();
    const newProduct: Product = {
      id: productId,
      shop_id: shop.id,
      category_id: Number(body.category_id),
      name: String(body.name).trim(),
      description: String(body.description ?? '').trim(),
      price: Number(body.price),
      old_price: body.old_price ? Number(body.old_price) : null,
      condition: body.condition === 'used' ? 'used' : 'new',
      brand: body.brand ? String(body.brand).trim() : null,
      authentic: Boolean(body.authentic),
      colors: Array.isArray(body.colors) ? body.colors.slice(0, 5) : [],
      status: body.isDraft ? 'draft' : 'active',
      hidden_reason: null,
      created_at: nowIso,
      updated_at: nowIso,
      last_confirmed_at: nowIso,
      sold_out_at: null,
      images: imagesInput.slice(0, 5).map((img, idx) => ({
        id: `${productId}-img-${idx}`,
        product_id: productId,
        position: idx,
        path_full: img.path_full,
        path_thumb: img.path_thumb || img.path_full,
        width: img.width || 1000,
        height: img.height || 1000,
        bytes: img.bytes || 80000,
      })),
      variants: variantsInput.map((v, idx) => ({
        id: `${productId}-var-${idx}`,
        product_id: productId,
        size_label: String(v.size_label),
        color: null,
        in_stock: v.qty === 0 ? false : Boolean(v.in_stock),
        qty: v.qty === null || v.qty === undefined ? null : Number(v.qty),
      })),
    };

    db.products.unshift(newProduct);
    db.price_history.push({
      id: `ph-${crypto.randomUUID().slice(0, 8)}`,
      product_id: productId,
      price: newProduct.price,
      changed_at: nowIso,
    });

    persistDb();
    res.status(201).json({ product: newProduct });
  });

  app.patch('/api/seller/products/:id', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth) return res.status(401).json({ error: 'Injira mbere yo gukomeza.' });

    const db = getDb();
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Igicuruzwa nticyabonetse.' });

    const shop = db.shops.find((s) => s.id === product.shop_id);
    // Strict ownership enforcement (S3)
    if (!shop || (shop.owner_id !== auth.profile.id && auth.role !== 'admin')) {
      return res.status(403).json({ error: 'Ntufite uburenganzira kuri iki gicuruzwa.' });
    }

    const body = req.body ?? {};
    const nowIso = new Date().toISOString();

    if (body.action === 'mark_sold') {
      product.status = 'sold_out';
      product.sold_out_at = nowIso;
    } else if (body.action === 'restore') {
      product.status = 'active';
      product.sold_out_at = null;
      product.last_confirmed_at = nowIso;
    } else if (body.action === 'confirm_available') {
      product.last_confirmed_at = nowIso;
    } else if (body.action === 'update_price') {
      const nextPrice = Number(body.price);
      if (!Number.isInteger(nextPrice) || nextPrice < 500 || nextPrice > 5_000_000) {
        return res.status(400).json({ error: 'Igiciro kigomba kuba hagati ya 500 na 5 000 000 RWF.' });
      }
      if (body.useOldPrice && nextPrice < product.price) {
        product.old_price = product.price;
      } else if (body.clearOldPrice) {
        product.old_price = null;
      }
      product.price = nextPrice;
      db.price_history.push({
        id: `ph-${crypto.randomUUID().slice(0, 8)}`,
        product_id: product.id,
        price: nextPrice,
        changed_at: nowIso,
      });
    } else {
      if (typeof body.name === 'string') product.name = body.name.trim();
      if (typeof body.description === 'string') product.description = body.description.trim();
      if (typeof body.price === 'number') product.price = body.price;
      if (body.old_price !== undefined) product.old_price = body.old_price;
      if (body.status && ['draft', 'active', 'sold_out'].includes(body.status)) {
        product.status = body.status;
      }
      if (Array.isArray(body.variants)) {
        product.variants = body.variants.map((v: { size_label: string; in_stock: boolean; qty: number | null }, idx: number) => ({
          id: `${product.id}-var-${idx}-${Date.now()}`,
          product_id: product.id,
          size_label: v.size_label,
          color: null,
          in_stock: v.qty === 0 ? false : Boolean(v.in_stock),
          qty: v.qty ?? null,
        }));
      }
    }

    product.updated_at = nowIso;
    persistDb();
    res.json({ product });
  });

  app.post('/api/seller/products/:id/copy', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth) return res.status(401).json({ error: 'Injira mbere yo gukomeza.' });

    const db = getDb();
    const original = db.products.find((p) => p.id === req.params.id);
    if (!original) return res.status(404).json({ error: 'Igicuruzwa nticyabonetse.' });

    const shop = db.shops.find((s) => s.id === original.shop_id);
    if (!shop || (shop.owner_id !== auth.profile.id && auth.role !== 'admin')) {
      return res.status(403).json({ error: 'Ntufite uburenganzira.' });
    }

    const newId = `prod-${crypto.randomUUID().slice(0, 8)}`;
    const nowIso = new Date().toISOString();
    const copy: Product = {
      ...original,
      id: newId,
      name: `${original.name} (Kopi)`.slice(0, 60),
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
      last_confirmed_at: nowIso,
      sold_out_at: null,
      images: original.images.map((im, i) => ({ ...im, id: `${newId}-img-${i}`, product_id: newId })),
      variants: original.variants.map((v, i) => ({ ...v, id: `${newId}-var-${i}`, product_id: newId })),
    };

    db.products.unshift(copy);
    persistDb();
    res.status(201).json({ product: copy });
  });

  app.delete('/api/seller/products/:id', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth) return res.status(401).json({ error: 'Injira mbere yo gukomeza.' });

    const db = getDb();
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Igicuruzwa nticyabonetse.' });

    const shop = db.shops.find((s) => s.id === db.products[idx].shop_id);
    if (!shop || (shop.owner_id !== auth.profile.id && auth.role !== 'admin')) {
      return res.status(403).json({ error: 'Ntufite uburenganzira bwo gusiba iki gicuruzwa.' });
    }

    db.products.splice(idx, 1);
    persistDb();
    res.json({ ok: true });
  });

  app.patch('/api/seller/shop', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth) return res.status(401).json({ error: 'Injira mbere yo gukomeza.' });

    const db = getDb();
    const shop = db.shops.find((s) => s.owner_id === auth.profile.id);
    if (!shop) return res.status(404).json({ error: 'Iduka ntiryabonetse.' });

    const body = req.body ?? {};
    const errors = validateShopProfile({
      name: String(body.name ?? shop.name),
      about: String(body.about ?? shop.about),
      whatsapp: String(body.whatsapp ?? shop.whatsapp),
      phone: String(body.phone ?? shop.phone),
      delivery_text: String(body.delivery_text ?? shop.delivery_text),
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: Object.values(errors)[0], errors });
    }

    shop.name = String(body.name ?? shop.name).trim();
    shop.about = String(body.about ?? shop.about).trim();
    shop.whatsapp = normalizeRwandaPhone(String(body.whatsapp ?? shop.whatsapp));
    shop.phone = normalizeRwandaPhone(String(body.phone ?? shop.phone));
    shop.landmark = String(body.landmark ?? shop.landmark).trim();
    shop.hours_text = String(body.hours_text ?? shop.hours_text).trim();
    shop.delivery_text = String(body.delivery_text ?? shop.delivery_text).trim();

    if (body.district_id) {
      const dist = RWANDA_AREAS.find((a) => a.id === Number(body.district_id));
      if (dist) {
        shop.district_id = dist.id;
        shop.district_name = dist.district;
      }
    }
    if (body.sector_id !== undefined) {
      const sec = body.sector_id ? RWANDA_AREAS.find((a) => a.id === Number(body.sector_id)) : null;
      shop.sector_id = sec?.id ?? null;
      shop.sector_name = sec?.sector ?? null;
    }

    persistDb();
    res.json({ shop });
  });

  // --- Admin Routes (Strictly Protected: Section 3, 7.3, K, S9) ---
  app.get('/api/admin/overview', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'moderator')) {
      return res.status(403).json({ error: 'Uburenganzira bwa Admin burakenewe.' });
    }

    const db = getDb();
    const sellers = db.profiles
      .filter((p) => p.role === 'seller')
      .map((p) => {
        const { passwordHash: _pw, ...safe } = p;
        const shop = db.shops.find((s) => s.owner_id === p.id) ?? null;
        const kyc = db.seller_kyc.find((k) => k.seller_id === p.id);
        return {
          ...safe,
          shop,
          hasKyc: Boolean(kyc),
          kycSubmittedAt: kyc?.submitted_at ?? null,
        };
      });

    const allProducts = enrichPublicProducts(db, true);
    const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
    const newProducts24h = allProducts.filter(
      (p) => new Date(p.created_at).getTime() >= cutoff24h
    ).length;

    const totals = db.product_daily_stats.reduce(
      (acc, r) => ({
        views: acc.views + r.views,
        wa_clicks: acc.wa_clicks + r.wa_clicks,
        call_clicks: acc.call_clicks + r.call_clicks,
        cart_adds: acc.cart_adds + r.cart_adds,
      }),
      { views: 0, wa_clicks: 0, call_clicks: 0, cart_adds: 0 }
    );

    res.json({
      kpis: {
        pendingSellers: sellers.filter((s) => s.status === 'pending').length,
        newReports: db.reports.filter((r) => r.status === 'new').length,
        newProducts24h,
        totalActiveProducts: allProducts.filter((p) => p.status === 'active').length,
        totalShops: sellers.filter((s) => s.status === 'approved').length,
        ...totals,
      },
      sellers,
      products: allProducts,
      reports: db.reports,
      synonyms: db.synonyms,
      settings: db.settings,
      categories: db.categories,
      auditLog: db.audit_log.slice(0, 100),
    });
  });

  app.get('/api/admin/kyc/:sellerId', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth || auth.role !== 'admin') {
      return res.status(403).json({ error: 'Admin gusa ni we wemerewe kureba ibyangombwa (K-10).' });
    }

    const db = getDb();
    const kyc = db.seller_kyc.find((k) => k.seller_id === req.params.sellerId);
    if (!kyc) return res.status(404).json({ error: 'Ibyangombwa ntibyabonetse.' });

    // J-02 & S9: Every KYC view MUST be recorded in audit_log!
    db.audit_log.unshift({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      actor_id: auth.profile.id,
      actor_name: auth.profile.full_name,
      action: 'view_kyc',
      target_type: 'seller_kyc',
      target_id: req.params.sellerId,
      details: { signedUrlTtlSeconds: 60 },
      created_at: new Date().toISOString(),
    });
    persistDb();

    res.json({ kyc, signedUrlExpiresIn: 60 });
  });

  app.post('/api/admin/sellers/:sellerId/review', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth || auth.role !== 'admin') {
      return res.status(403).json({ error: 'Uburenganzira bwa Admin burakenewe.' });
    }

    const { status, reason, phoneVerified, whatsappVerified } = req.body ?? {};
    const allowed: SellerStatus[] = ['approved', 'needs_changes', 'rejected', 'suspended'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Imiterere ntiyemewe.' });
    }

    const db = getDb();
    const seller = db.profiles.find((p) => p.id === req.params.sellerId);
    if (!seller) return res.status(404).json({ error: 'Umucuruzi ntiyabonetse.' });

    const nowIso = new Date().toISOString();
    seller.status = status;
    seller.status_reason = reason ? String(reason).trim() : null;
    if (status === 'approved') {
      seller.approved_by = auth.profile.id;
      seller.approved_at = nowIso;
    }

    const shop = db.shops.find((s) => s.owner_id === seller.id);
    if (shop) {
      shop.status = status;
      if (status === 'approved') shop.approved_at = nowIso;
    }

    const kyc = db.seller_kyc.find((k) => k.seller_id === seller.id);
    if (kyc) {
      kyc.reviewed_at = nowIso;
      kyc.reviewed_by = auth.profile.id;
      kyc.review_notes = reason ? String(reason).trim() : null;
      if (phoneVerified) kyc.phone_verified_at = nowIso;
      if (whatsappVerified) kyc.whatsapp_verified_at = nowIso;
    }

    db.audit_log.unshift({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      actor_id: auth.profile.id,
      actor_name: auth.profile.full_name,
      action: `seller_${status}`,
      target_type: 'seller',
      target_id: seller.id,
      details: { reason: seller.status_reason, shopName: shop?.name },
      created_at: nowIso,
    });

    persistDb();
    res.json({ ok: true, status: seller.status });
  });

  app.post('/api/admin/products/:id/moderate', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'moderator')) {
      return res.status(403).json({ error: 'Uburenganzira burakenewe.' });
    }

    const { action, reason } = req.body ?? {};
    const db = getDb();
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Igicuruzwa nticyabonetse.' });

    if (action === 'hide') {
      product.status = 'hidden';
      product.hidden_reason = String(reason || 'Yahishwe na Admin').trim();
    } else if (action === 'restore') {
      product.status = 'active';
      product.hidden_reason = null;
    }

    db.audit_log.unshift({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      actor_id: auth.profile.id,
      actor_name: auth.profile.full_name,
      action: `product_${action}`,
      target_type: 'product',
      target_id: product.id,
      details: { reason: product.hidden_reason, name: product.name },
      created_at: new Date().toISOString(),
    });

    persistDb();
    res.json({ product });
  });

  app.post('/api/admin/reports/:id/resolve', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'moderator')) {
      return res.status(403).json({ error: 'Uburenganzira burakenewe.' });
    }

    const { status, resolution, hideTarget } = req.body ?? {};
    const db = getDb();
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) return res.status(404).json({ error: 'Ikirego nticyabonetse.' });

    const nowIso = new Date().toISOString();
    report.status = status || 'resolved';
    report.resolution = String(resolution || '').trim();
    report.resolved_by = auth.profile.id;
    report.resolved_at = nowIso;

    if (hideTarget && report.target_type === 'product') {
      const prod = db.products.find((p) => p.id === report.target_id);
      if (prod) {
        prod.status = 'hidden';
        prod.hidden_reason = report.resolution || 'Yahishwe kubera ikirego cyemejwe';
      }
    }

    db.audit_log.unshift({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      actor_id: auth.profile.id,
      actor_name: auth.profile.full_name,
      action: 'resolve_report',
      target_type: 'report',
      target_id: report.id,
      details: { resolution: report.resolution, hideTarget: Boolean(hideTarget) },
      created_at: nowIso,
    });

    persistDb();
    res.json({ report });
  });

  app.post('/api/admin/synonyms', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin gusa.' });
    const term = String(req.body?.term ?? '').trim().toLowerCase();
    const canonical = String(req.body?.canonical ?? '').trim().toLowerCase();
    if (!term || !canonical) return res.status(400).json({ error: 'Shyiramo amagambo yombi.' });
    const db = getDb();
    if (!db.synonyms.some((s) => s.term === term)) {
      db.synonyms.push({ term, canonical });
      persistDb();
    }
    res.json({ synonyms: db.synonyms });
  });

  app.delete('/api/admin/synonyms/:term', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin gusa.' });
    const db = getDb();
    db.synonyms = db.synonyms.filter((s) => s.term !== req.params.term);
    persistDb();
    res.json({ synonyms: db.synonyms });
  });

  app.patch('/api/admin/settings', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin gusa.' });
    const db = getDb();
    const body = req.body ?? {};
    if (typeof body.ADS_ENABLED === 'boolean') db.settings.ADS_ENABLED = body.ADS_ENABLED;
    if (typeof body.PHONE_ACCESSORIES_ENABLED === 'boolean') {
      db.settings.PHONE_ACCESSORIES_ENABLED = body.PHONE_ACCESSORIES_ENABLED;
      const phoneCat = db.categories.find((c) => c.id === 5);
      if (phoneCat) phoneCat.active = body.PHONE_ACCESSORIES_ENABLED;
    }
    if (typeof body.DEFAULT_PRODUCT_LIMIT === 'number' && body.DEFAULT_PRODUCT_LIMIT >= 10) {
      db.settings.DEFAULT_PRODUCT_LIMIT = body.DEFAULT_PRODUCT_LIMIT;
    }
    persistDb();
    res.json({ settings: db.settings });
  });

  app.get('/api/admin/export.csv', (req, res) => {
    const auth = getAuthSession(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin gusa.' });
    const db = getDb();
    const lines = ['ID,Izina,Igiciro,Imiterere,Iduka,Status'];
    for (const p of enrichPublicProducts(db, true)) {
      const row = [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.price,
        p.condition,
        `"${(p.shop?.name ?? '').replace(/"/g, '""')}"`,
        p.status,
      ].join(',');
      lines.push(row);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="isoko-ibicuruzwa.csv"');
    res.send(lines.join('\n'));
  });

  // --- Vite Dev Middleware or Static Production Build ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Isoko server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
