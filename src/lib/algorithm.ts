import type { Category, Product, Synonym } from '../types/marketplace';

export const DEFAULT_SYNONYMS: Synonym[] = [
  { term: 'nayiki', canonical: 'nike' },
  { term: 'naiki', canonical: 'nike' },
  { term: 'adida', canonical: 'adidas' },
  { term: 'adidasi', canonical: 'adidas' },
  { term: 'isogisi', canonical: 'amasogisi' },
  { term: 'isogise', canonical: 'amasogisi' },
  { term: 'basket', canonical: 'inkweto za siporo' },
  { term: 'sneakers', canonical: 'inkweto za siporo' },
  { term: 'bote za siporo', canonical: 'inkweto za siporo' },
  { term: 'shati', canonical: 'ishati' },
  { term: 'chemise', canonical: 'ishati' },
  { term: 'jean', canonical: 'ipantalo ya jean' },
  { term: 'jeans', canonical: 'ipantalo ya jean' },
  { term: 'ijini', canonical: 'ipantalo ya jean' },
  { term: 'tshirt', canonical: 'tishati' },
  { term: 't-shirt', canonical: 'tishati' },
];

export function normalizeQueryText(input: string): string {
  return input
    .toLowerCase()
    .replace(/['"`.,!?;:/\\()[\]{}_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function expandSynonyms(query: string, synonyms: Synonym[] = DEFAULT_SYNONYMS): string[] {
  const norm = normalizeQueryText(query);
  if (!norm) return [];
  const terms = norm.split(' ');
  const expanded = new Set<string>([norm]);

  // Check whole phrase first
  for (const syn of synonyms) {
    if (norm === syn.term.toLowerCase()) {
      expanded.add(syn.canonical.toLowerCase());
    }
  }

  // Check token by token
  const replacedTokens = terms.map((tok) => {
    const match = synonyms.find((s) => s.term.toLowerCase() === tok);
    return match ? match.canonical.toLowerCase() : tok;
  });
  expanded.add(replacedTokens.join(' '));

  // Also add individual canonical tokens
  for (const tok of replacedTokens) {
    for (const sub of tok.split(' ')) {
      if (sub) expanded.add(sub);
    }
  }

  return Array.from(expanded);
}

/**
 * Character trigram Jaccard/Dice similarity (0..1) mimicking pg_trgm similarity()
 */
export function trigramSimilarity(a: string, b: string): number {
  const na = normalizeQueryText(a);
  const nb = normalizeQueryText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const trigrams = (s: string): Set<string> => {
    const padded = `  ${s} `;
    const set = new Set<string>();
    for (let i = 0; i <= padded.length - 3; i++) {
      set.add(padded.slice(i, i + 3));
    }
    return set;
  };

  const ta = trigrams(na);
  const tb = trigrams(nb);
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function calculateDiscountPercent(price: number, oldPrice: number | null | undefined): number {
  if (!oldPrice || oldPrice <= price || oldPrice <= 0) return 0;
  const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
  return pct >= 5 ? pct : 0; // Section 9.5: shown only when >= 5%
}

export function getLowStockCount(variants: Array<{ in_stock: boolean; qty: number | null }>): number | null {
  const totalQtyKnown = variants.filter((v) => v.in_stock && typeof v.qty === 'number' && v.qty > 0);
  if (totalQtyKnown.length === 0) return null;
  const minOrSum = totalQtyKnown.reduce((sum, v) => sum + (v.qty ?? 0), 0);
  return minOrSum >= 1 && minOrSum <= 3 ? minOrSum : null;
}

export function computePopularity7d(stats: {
  views: number;
  shares: number;
  cart_adds: number;
  wa_clicks: number;
  call_clicks: number;
}): number {
  // Section 9.3: popularity_7d = views + 2*shares + 3*cart_adds + 5*(wa_clicks + call_clicks)
  return (
    stats.views +
    2 * stats.shares +
    3 * stats.cart_adds +
    5 * (stats.wa_clicks + stats.call_clicks)
  );
}

export interface SearchFilterOptions {
  q?: string;
  categorySlug?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  condition?: 'new' | 'used' | '';
  districtId?: number;
  inStockOnly?: boolean;
  discountedOnly?: boolean;
  shopId?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'nearby';
  buyerDistrictId?: number;
}

export function searchAndRankProducts(
  products: Product[],
  categories: Category[],
  synonyms: Synonym[],
  filters: SearchFilterOptions
): Product[] {
  const now = Date.now();
  const catById = new Map(categories.map((c) => [c.id, c]));

  // Pre-filter step (Section 9.1 #5: AND filters before ranking)
  let filtered = products.filter((p) => {
    if (p.status !== 'active' && p.status !== 'sold_out') return false;
    if (p.shop && p.shop.status && p.shop.status !== 'approved') return false;

    if (filters.inStockOnly && p.status !== 'active') return false;
    if (filters.shopId && p.shop_id !== filters.shopId) return false;
    if (filters.condition && p.condition !== filters.condition) return false;
    if (typeof filters.minPrice === 'number' && p.price < filters.minPrice) return false;
    if (typeof filters.maxPrice === 'number' && p.price > filters.maxPrice) return false;
    if (typeof filters.districtId === 'number' && p.shop?.district_id !== filters.districtId) return false;

    if (filters.discountedOnly) {
      if (calculateDiscountPercent(p.price, p.old_price) < 5) return false;
    }

    if (filters.categorySlug) {
      const cat = catById.get(p.category_id);
      const parent = cat?.parent_id ? catById.get(cat.parent_id) : undefined;
      if (cat?.slug !== filters.categorySlug && parent?.slug !== filters.categorySlug) {
        return false;
      }
    }

    if (filters.size) {
      const targetSize = filters.size.toLowerCase();
      const hasAvailableSize = p.variants.some(
        (v) => v.size_label.toLowerCase() === targetSize && v.in_stock && (v.qty === null || v.qty > 0)
      );
      if (!hasAvailableSize) return false;
    }

    if (filters.color) {
      const targetColor = filters.color.toLowerCase();
      const hasColor =
        p.colors.some((c) => c.toLowerCase() === targetColor) ||
        p.variants.some((v) => v.color?.toLowerCase() === targetColor);
      if (!hasColor) return false;
    }

    return true;
  });

  const rawQuery = (filters.q ?? '').trim();
  const expanded = expandSynonyms(rawQuery, synonyms);

  if (rawQuery) {
    const scored = filtered
      .map((p) => {
        const cat = catById.get(p.category_id);
        const parent = cat?.parent_id ? catById.get(cat.parent_id) : undefined;
        const nameNorm = normalizeQueryText(p.name);
        const brandNorm = normalizeQueryText(p.brand ?? '');
        const descNorm = normalizeQueryText(p.description);
        const catNorm = normalizeQueryText(`${cat?.name_rw ?? ''} ${parent?.name_rw ?? ''}`);

        let tsRank = 0;
        let maxSim = 0;

        for (const variantQuery of expanded) {
          const tokens = variantQuery.split(' ').filter(Boolean);
          let tokenHits = 0;
          for (const tok of tokens) {
            if (nameNorm.includes(tok)) tokenHits += 1.0;
            else if (brandNorm.includes(tok)) tokenHits += 0.85;
            else if (catNorm.includes(tok)) tokenHits += 0.6;
            else if (descNorm.includes(tok)) tokenHits += 0.4;
          }
          if (tokens.length > 0) {
            tsRank = Math.max(tsRank, tokenHits / tokens.length);
          }

          // Check trigram similarity against name, brand, and individual words in name
          const simName = trigramSimilarity(variantQuery, nameNorm);
          const simBrand = brandNorm ? trigramSimilarity(variantQuery, brandNorm) : 0;
          const wordSims = nameNorm.split(' ').map((w) => trigramSimilarity(variantQuery, w));
          maxSim = Math.max(maxSim, simName, simBrand, ...wordSims);
        }

        const matches = tsRank > 0 || maxSim > 0.3;
        if (!matches) return null;

        const inStockBonus = p.status === 'active' ? 0.3 : 0;
        const ageDays = (now - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const isNew14d = ageDays <= 14 ? 0.2 : 0;
        const sameDistrict =
          filters.buyerDistrictId && p.shop?.district_id === filters.buyerDistrictId ? 0.1 : 0;

        // Section 9.1 #4: score = 2*ts_rank + similarity + 0.3*(inStock) + 0.2*(new14d) + 0.1*(sameDistrict)
        const score = 2 * tsRank + maxSim + inStockBonus + isNew14d + sameDistrict;
        return { product: p, score };
      })
      .filter((x): x is { product: Product; score: number } => x !== null);

    if (!filters.sort || filters.sort === 'popular') {
      scored.sort((a, b) => b.score - a.score);
      return scored.map((s) => s.product);
    }
    filtered = scored.map((s) => s.product);
  }

  // Sort modes (B-05)
  const sortMode = filters.sort ?? 'newest';
  filtered.sort((a, b) => {
    if (sortMode === 'price_asc') return a.price - b.price;
    if (sortMode === 'price_desc') return b.price - a.price;
    if (sortMode === 'popular') return (b.popularity_7d ?? 0) - (a.popularity_7d ?? 0);
    if (sortMode === 'nearby' && filters.buyerDistrictId) {
      const aMatch = a.shop?.district_id === filters.buyerDistrictId ? 1 : 0;
      const bMatch = b.shop?.district_id === filters.buyerDistrictId ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return filtered;
}

/**
 * Section 9.2: 'Ibisa na cyo' (8 similar products, max 3 per shop)
 */
export function getSimilarProducts(
  target: Product,
  allProducts: Product[],
  categories: Category[],
  options: { buyerDistrictId?: number; myShoeSize?: string; myClothingSize?: string } = {}
): Product[] {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const targetCat = catById.get(target.category_id);
  const targetParentId = targetCat?.parent_id ?? target.category_id;

  const candidates = allProducts.filter(
    (p) => p.id !== target.id && p.status === 'active' && p.images.length > 0 && (!p.shop?.status || p.shop.status === 'approved')
  );

  const scored = candidates.map((p) => {
    let score = 0;
    const pCat = catById.get(p.category_id);
    const pParentId = pCat?.parent_id ?? p.category_id;

    if (p.category_id === target.category_id) score += 40;
    else if (pParentId === targetParentId) score += 15;

    if (target.brand && p.brand && target.brand.toLowerCase() === p.brand.toLowerCase()) {
      score += 20;
    }

    const priceDiffRatio = Math.abs(p.price - target.price) / (0.4 * Math.max(1, target.price));
    score += 20 * Math.max(0, 1 - priceDiffRatio);

    if (options.buyerDistrictId && p.shop?.district_id === options.buyerDistrictId) {
      score += 10;
    }
    if (p.shop_id !== target.shop_id) {
      score += 10;
    }

    const mySizes = [options.myShoeSize, options.myClothingSize].filter(Boolean).map((s) => s!.toLowerCase());
    if (
      mySizes.length > 0 &&
      p.variants.some((v) => v.in_stock && mySizes.includes(v.size_label.toLowerCase()))
    ) {
      score += 5;
    }

    score += Math.min(10, (p.popularity_7d ?? 0) / 10);

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const result: Product[] = [];
  const shopCounts = new Map<string, number>();

  for (const item of scored) {
    const cnt = shopCounts.get(item.product.shop_id) ?? 0;
    if (cnt >= 3) continue;
    result.push(item.product);
    shopCounts.set(item.product.shop_id, cnt + 1);
    if (result.length >= 8) break;
  }

  return result;
}

/**
 * Section 9.3: Home shelves ('Bishya', 'Bikunzwe cyane', 'Byagabanyijwe', 'Amaduka hafi yawe')
 */
export function buildHomeShelves(
  products: Product[],
  options: { buyerDistrictId?: number } = {}
): {
  newest: Product[];
  popular: Product[];
  discounted: Product[];
  nearby: Product[];
} {
  const now = Date.now();
  const active = products.filter(
    (p) => p.status === 'active' && p.images.length > 0 && (!p.shop?.status || p.shop.status === 'approved')
  );

  const capPerShop = (list: Product[], maxPerShop: number, limit: number): Product[] => {
    const out: Product[] = [];
    const counts = new Map<string, number>();
    for (const p of list) {
      const c = counts.get(p.shop_id) ?? 0;
      if (c >= maxPerShop) continue;
      out.push(p);
      counts.set(p.shop_id, c + 1);
      if (out.length >= limit) break;
    }
    return out;
  };

  // Bishya: created_at desc, max 2 per shop in 8
  const sortedNewest = [...active].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const newest = capPerShop(sortedNewest, 2, 8);

  // Bikunzwe cyane: popularity_7d desc, 1 of every 4 slots goes to <=72h item, max 2 per shop
  const sortedPop = [...active].sort((a, b) => (b.popularity_7d ?? 0) - (a.popularity_7d ?? 0));
  const fresh72h = sortedNewest.filter(
    (p) => now - new Date(p.created_at).getTime() <= 72 * 60 * 60 * 1000
  );
  const popular: Product[] = [];
  const popShopCount = new Map<string, number>();
  const usedPopIds = new Set<string>();

  let popIdx = 0;
  let freshIdx = 0;
  for (let slot = 0; slot < 8; slot++) {
    const preferFresh = slot % 4 === 3;
    let picked: Product | undefined;

    if (preferFresh) {
      while (freshIdx < fresh72h.length) {
        const cand = fresh72h[freshIdx++];
        if (!usedPopIds.has(cand.id) && (popShopCount.get(cand.shop_id) ?? 0) < 2) {
          picked = cand;
          break;
        }
      }
    }
    if (!picked) {
      while (popIdx < sortedPop.length) {
        const cand = sortedPop[popIdx++];
        if (!usedPopIds.has(cand.id) && (popShopCount.get(cand.shop_id) ?? 0) < 2) {
          picked = cand;
          break;
        }
      }
    }
    if (!picked) break;
    popular.push(picked);
    usedPopIds.add(picked.id);
    popShopCount.set(picked.shop_id, (popShopCount.get(picked.shop_id) ?? 0) + 1);
  }

  // Byagabanyijwe: discount >= 10%, sorted by discount desc
  const withDiscount = active
    .map((p) => ({ p, pct: calculateDiscountPercent(p.price, p.old_price) }))
    .filter((x) => x.pct >= 10)
    .sort((a, b) => b.pct - a.pct)
    .map((x) => x.p);
  const discounted = capPerShop(withDiscount, 3, 8);

  // Amaduka hafi yawe: same district prioritized, then newest
  const nearbySorted = [...active].sort((a, b) => {
    const aNear = options.buyerDistrictId && a.shop?.district_id === options.buyerDistrictId ? 1 : 0;
    const bNear = options.buyerDistrictId && b.shop?.district_id === options.buyerDistrictId ? 1 : 0;
    if (aNear !== bNear) return bNear - aNear;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const nearby = capPerShop(nearbySorted, 2, 8);

  return { newest, popular, discounted, nearby };
}
