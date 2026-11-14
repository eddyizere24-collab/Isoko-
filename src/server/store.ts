import fs from 'node:fs';
import path from 'node:path';
import { computePopularity7d } from '../lib/algorithm';
import type { Product, Shop } from '../types/marketplace';
import { createInitialSeedData, type DatabaseState } from './seedData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let dbCache: DatabaseState | null = null;

export function getDb(): DatabaseState {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbCache = JSON.parse(raw) as DatabaseState;
      if (!Array.isArray(dbCache.campaigns)) dbCache.campaigns = [];
      return dbCache;
    } catch {
      // Fall back to fresh seed if corrupted
    }
  }

  dbCache = createInitialSeedData();
  persistDb();
  return dbCache;
}

export function persistDb(): void {
  if (!dbCache) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(dbCache, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function enrichPublicProducts(db: DatabaseState, includeAll = false): Product[] {
  const shopById = new Map(db.shops.map((s) => [s.id, s]));
  const profileById = new Map(db.profiles.map((p) => [p.id, p]));
  const catById = new Map(db.categories.map((c) => [c.id, c]));

  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return db.products
    .filter((p) => {
      if (includeAll) return true;
      if (p.status !== 'active' && p.status !== 'sold_out') return false;
      const shop = shopById.get(p.shop_id);
      if (!shop) return false;
      const owner = profileById.get(shop.owner_id);
      return owner?.status === 'approved';
    })
    .map((p) => {
      const shop = shopById.get(p.shop_id);
      const owner = shop ? profileById.get(shop.owner_id) : undefined;
      const category = catById.get(p.category_id);
      const parent_category = category?.parent_id ? catById.get(category.parent_id) : undefined;

      const stats7d = db.product_daily_stats.filter(
        (st) => st.target_id === p.id && st.day >= cutoff7d
      );
      const sums = stats7d.reduce(
        (acc, s) => ({
          views: acc.views + s.views,
          wa_clicks: acc.wa_clicks + s.wa_clicks,
          call_clicks: acc.call_clicks + s.call_clicks,
          cart_adds: acc.cart_adds + s.cart_adds,
          shares: acc.shares + s.shares,
        }),
        { views: 0, wa_clicks: 0, call_clicks: 0, cart_adds: 0, shares: 0 }
      );

      return {
        ...p,
        shop: shop
          ? {
              ...shop,
              status: owner?.status ?? shop.status,
              approved_at: owner?.approved_at ?? shop.approved_at,
            }
          : undefined,
        category,
        parent_category,
        popularity_7d: computePopularity7d(sums),
        views_7d: sums.views,
        wa_clicks_7d: sums.wa_clicks,
      };
    });
}

export function getPublicShops(db: DatabaseState): Shop[] {
  const profileById = new Map(db.profiles.map((p) => [p.id, p]));
  return db.shops
    .filter((s) => profileById.get(s.owner_id)?.status === 'approved')
    .map((s) => {
      const owner = profileById.get(s.owner_id);
      const activeCount = db.products.filter(
        (p) => p.shop_id === s.id && p.status === 'active'
      ).length;
      return {
        ...s,
        status: owner?.status ?? 'approved',
        approved_at: owner?.approved_at ?? s.created_at,
        active_product_count: activeCount,
      };
    });
}
