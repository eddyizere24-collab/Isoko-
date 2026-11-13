import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHomeShelves,
  calculateDiscountPercent,
  computePopularity7d,
  DEFAULT_SYNONYMS,
  detectCategoryIntent,
  expandSynonyms,
  getLowStockCount,
  getSimilarProducts,
  interleaveBySeller,
  rotateActiveCampaigns,
  searchAndRankProducts,
} from './algorithm';
import { INITIAL_CATEGORIES } from '../data/categories';
import type { Product, PromoCampaign, Shop } from '../types/marketplace';

const shop1: Shop = {
  id: 's1',
  owner_id: 'u1',
  slug: 'mugisha',
  name: 'Iduka rya Mugisha',
  logo_path: null,
  cover_path: null,
  about: 'Inkweto nziza',
  whatsapp: '250788111111',
  phone: '250788111111',
  district_id: 1,
  sector_id: 9,
  district_name: 'Gasabo',
  sector_name: 'Kimironko',
  landmark: '',
  hours_text: '08:00-20:00',
  delivery_text: 'Gutanga i Kigali',
  product_limit: 150,
  plan: 'free',
  plan_expires_at: null,
  created_at: '2026-01-01T00:00:00Z',
  status: 'approved',
};

const shop2: Shop = { ...shop1, id: 's2', slug: 'aline', name: 'Iduka rya Aline', district_id: 2, district_name: 'Kicukiro' };
const shop3: Shop = { ...shop1, id: 's3', slug: 'kicukiro', name: 'Kicukiro Threads', district_id: 2, district_name: 'Kicukiro' };

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: 'p1',
    shop_id: 's1',
    category_id: 104,
    name: 'Nike Air Force 1',
    description: 'Inkweto za siporo nziza',
    price: 45000,
    old_price: null,
    condition: 'new',
    brand: 'Nike',
    authentic: true,
    colors: ['Umweru'],
    status: 'active',
    hidden_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_confirmed_at: new Date().toISOString(),
    sold_out_at: null,
    images: [{ id: 'img1', product_id: 'p1', position: 0, path_full: '/a.jpg', path_thumb: '/a.jpg', width: 800, height: 800, bytes: 50000 }],
    variants: [{ id: 'v1', product_id: 'p1', size_label: '42', color: 'Umweru', in_stock: true, qty: 2 }],
    shop: shop1,
    popularity_7d: 50,
    ...overrides,
  };
}

test('synonym expansion maps nayiki -> nike and isogisi -> amasogisi', () => {
  assert.ok(expandSynonyms('nayiki', DEFAULT_SYNONYMS).includes('nike'));
  assert.ok(expandSynonyms('isogisi', DEFAULT_SYNONYMS).includes('amasogisi'));
});

test('category isolation prevents unrelated categories from leaking into search results', () => {
  assert.equal(detectCategoryIntent('inkweto', INITIAL_CATEGORIES, DEFAULT_SYNONYMS), 'inkweto');
  assert.equal(detectCategoryIntent('isogisi', INITIAL_CATEGORIES, DEFAULT_SYNONYMS), 'amasogisi');

  const products = [
    makeProduct({ id: 'shoe-1', category_id: 104, name: 'Nike Air Force 1', description: 'Inkweto za siporo' }),
    // Sock description explicitly mentions "inkweto za siporo" — must NOT appear when searching "inkweto"
    makeProduct({
      id: 'sock-1',
      shop_id: 's2',
      shop: shop2,
      category_id: 301,
      brand: null,
      authentic: false,
      name: 'Amasogisi 3 ya Cotton',
      description: 'Amasogisi meza aberana n’inkweto za siporo',
      variants: [{ id: 'vs1', product_id: 'sock-1', size_label: '41-45', color: null, in_stock: true, qty: 5 }],
    }),
  ];

  const shoeResults = searchAndRankProducts(products, INITIAL_CATEGORIES, DEFAULT_SYNONYMS, { q: 'inkweto' });
  assert.deepEqual(shoeResults.map((p) => p.id), ['shoe-1']);
});

test('search finds Nike when user types nayiki and respects size/price filters', () => {
  const products = [
    makeProduct({ id: 'p1', name: 'Nike Air Force 1', brand: 'Nike', price: 45000 }),
    makeProduct({ id: 'p2', name: 'Ankara Bomber Jacket', brand: null, category_id: 205, price: 28000, variants: [{ id: 'v2', product_id: 'p2', size_label: 'M', color: 'Ubururu', in_stock: true, qty: null }] }),
  ];

  const nayikiResults = searchAndRankProducts(products, INITIAL_CATEGORIES, DEFAULT_SYNONYMS, { q: 'nayiki' });
  assert.equal(nayikiResults.length, 1);
  assert.equal(nayikiResults[0].id, 'p1');

  const sizeFiltered = searchAndRankProducts(products, INITIAL_CATEGORIES, DEFAULT_SYNONYMS, { size: '42', minPrice: 20000, maxPrice: 50000 });
  assert.equal(sizeFiltered.length, 1);
  assert.equal(sizeFiltered[0].id, 'p1');
});

test('interleaveBySeller prevents one seller from occupying consecutive slots or dominating', () => {
  const list = [
    makeProduct({ id: 'a1', shop_id: 's1', shop: shop1 }),
    makeProduct({ id: 'a2', shop_id: 's1', shop: shop1 }),
    makeProduct({ id: 'a3', shop_id: 's1', shop: shop1 }),
    makeProduct({ id: 'b1', shop_id: 's2', shop: shop2 }),
    makeProduct({ id: 'c1', shop_id: 's3', shop: shop3 }),
  ];

  const rotated = interleaveBySeller(list, { maxPerShop: 2, maxConsecutiveSameShop: 1 });
  assert.deepEqual(rotated.map((p) => p.shop_id), ['s1', 's2', 's1', 's3']);
  for (let i = 1; i < rotated.length; i++) {
    assert.notEqual(rotated[i].shop_id, rotated[i - 1].shop_id);
  }
});

test('discount percentage only displays at >= 5% and popularity follows formula', () => {
  assert.equal(calculateDiscountPercent(45000, 60000), 25);
  assert.equal(calculateDiscountPercent(49000, 50000), 0); // 2% < 5%
  assert.equal(computePopularity7d({ views: 10, shares: 2, cart_adds: 3, wa_clicks: 4, call_clicks: 1 }), 10 + 4 + 9 + 25);
});

test('low stock badge triggers only when known qty is 1..3', () => {
  assert.equal(getLowStockCount([{ in_stock: true, qty: 2 }]), 2);
  assert.equal(getLowStockCount([{ in_stock: true, qty: 5 }]), null);
  assert.equal(getLowStockCount([{ in_stock: true, qty: null }]), null);
});

test('similar products caps at 3 per shop and excludes target and sold_out', () => {
  const target = makeProduct({ id: 'target', shop_id: 's1' });
  const pool: Product[] = [
    target,
    ...Array.from({ length: 5 }, (_, i) => makeProduct({ id: `s1-${i}`, shop_id: 's1', shop: shop1 })),
    ...Array.from({ length: 5 }, (_, i) => makeProduct({ id: `s2-${i}`, shop_id: 's2', shop: shop2 })),
    makeProduct({ id: 'sold', shop_id: 's2', shop: shop2, status: 'sold_out' }),
  ];

  const sim = getSimilarProducts(target, pool, INITIAL_CATEGORIES);
  assert.equal(sim.some((p) => p.id === 'target' || p.id === 'sold'), false);
  const s1Count = sim.filter((p) => p.shop_id === 's1').length;
  assert.ok(s1Count <= 3);
  assert.ok(sim.length <= 8);
});

test('buildHomeShelves limits shops to 2 per shelf and enforces >= 10% discount', () => {
  const products = [
    makeProduct({ id: 'a1', shop_id: 's1', price: 40000, old_price: 50000 }), // 20%
    makeProduct({ id: 'a2', shop_id: 's1', price: 46000, old_price: 50000 }), // 8% (< 10%)
    makeProduct({ id: 'a3', shop_id: 's1', price: 30000, old_price: null }),
    makeProduct({ id: 'b1', shop_id: 's2', shop: shop2, price: 35000, old_price: 50000 }), // 30%
  ];
  const shelves = buildHomeShelves(products, { buyerDistrictId: 2 });
  assert.equal(shelves.newest.filter((p) => p.shop_id === 's1').length, 2);
  assert.deepEqual(shelves.discounted.map((p) => p.id), ['b1', 'a1']);
  assert.equal(shelves.nearby[0].id, 'b1');
});

test('rotateActiveCampaigns filters inactive campaigns and cycles order cleanly', () => {
  const base: PromoCampaign[] = [
    {
      id: 'c1',
      title: 'Camp 1',
      subtitle: 'Sub 1',
      kicker: 'K1',
      ctaLabel: 'Reba',
      targetPath: '/c/inkweto',
      imageUrl: '/1.jpg',
      shopId: null,
      shopName: null,
      active: true,
      sortOrder: 1,
      impressions: 0,
      clicks: 0,
      created_at: '2026-01-01',
    },
    {
      id: 'c2',
      title: 'Camp 2 (Paused)',
      subtitle: 'Sub 2',
      kicker: 'K2',
      ctaLabel: 'Reba',
      targetPath: '/c/imyenda',
      imageUrl: '/2.jpg',
      shopId: null,
      shopName: null,
      active: false,
      sortOrder: 2,
      impressions: 0,
      clicks: 0,
      created_at: '2026-01-01',
    },
    {
      id: 'c3',
      title: 'Camp 3',
      subtitle: 'Sub 3',
      kicker: 'K3',
      ctaLabel: 'Reba',
      targetPath: '/i/aline',
      imageUrl: '/3.jpg',
      shopId: 's2',
      shopName: 'Aline',
      active: true,
      sortOrder: 3,
      impressions: 0,
      clicks: 0,
      created_at: '2026-01-01',
    },
  ];

  const rotated0 = rotateActiveCampaigns(base, 0);
  assert.deepEqual(rotated0.map((c) => c.id), ['c1', 'c3']);
  const rotated1 = rotateActiveCampaigns(base, 1);
  assert.deepEqual(rotated1.map((c) => c.id), ['c3', 'c1']);
});
