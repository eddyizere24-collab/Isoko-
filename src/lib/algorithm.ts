import type { Category, Product, PromoCampaign, Synonym } from '../types/marketplace';

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
  { term: 'sac', canonical: 'amasakoshi' },
  { term: 'isakoshi', canonical: 'amasakoshi' },
  { term: 'lunettes', canonical: 'indorerwamo' },
  { term: 'ceinture', canonical: 'imikandara' },
];

const CATEGORY_INTENT_KEYWORDS: Array<{ topSlug: string; keywords: string[] }> = [
  {
    topSlug: 'inkweto',
    keywords: ['inkweto', 'urukweto', 'sneaker', 'sneakers', 'basket', 'sandali', 'bote', 'loafer', 'loafers'],
  },
  {
    topSlug: 'imyenda',
    keywords: [
      'imyenda', 'umwenda', 'ishati', 'shati', 'chemise', 'hoodie', 'ikoti', 'jacket',
      'ipantalo', 'jean', 'jeans', 'ijini', 'ankara', 'kitenge', 'tishati', 'tshirt', 'ikanzu',
    ],
  },
  {
    topSlug: 'amasogisi',
    keywords: ['amasogisi', 'isogisi', 'isogise', 'sogisi', 'imbere', 'underwear', 'boxer'],
  },
  {
    topSlug: 'ibindi',
    keywords: ['isakoshi', 'amasakoshi', 'sac', 'umukandara', 'imikandara', 'ceinture', 'indorerwamo', 'lunettes', 'isaha', 'amasaha', 'ingofero'],
  },
];

export function normalizeQueryText(input: string): string {
  return input
    .toLowerCase()
    .replace(/['"`’.,!?;:/\\()[\]{}_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function expandSynonyms(query: string, synonyms: Synonym[] = DEFAULT_SYNONYMS): string[] {
  const norm = normalizeQueryText(query);
  if (!norm) return [];
  const terms = norm.split(' ');
  const expanded = new Set<string>([norm]);

  for (const syn of synonyms) {
    if (norm === syn.term.toLowerCase()) {
      expanded.add(syn.canonical.toLowerCase());
    }
  }

  const replacedTokens = terms.map((tok) => {
    const match = synonyms.find((s) => s.term.toLowerCase() === tok);
    return match ? match.canonical.toLowerCase() : tok;
  });
  expanded.add(replacedTokens.join(' '));

  for (const tok of replacedTokens) {
    for (const sub of tok.split(' ')) {
      if (sub) expanded.add(sub);
    }
  }

  return Array.from(expanded);
}

/**
 * Detects whether a search query explicitly targets one top-level category
 * so unrelated categories never leak into main search results via incidental description mentions.
 */
export function detectCategoryIntent(
  query: string,
  categories: Category[],
  synonyms: Synonym[] = DEFAULT_SYNONYMS
): string | null {
  const expanded = expandSynonyms(query, synonyms);
  const allTokens = new Set<string>();
  for (const variant of expanded) {
    for (const tok of variant.split(' ')) {
      if (tok) allTokens.add(tok);
    }
  }

  const matchedTopSlugs = new Set<string>();
  for (const rule of CATEGORY_INTENT_KEYWORDS) {
    for (const kw of rule.keywords) {
      if (allTokens.has(kw)) {
        matchedTopSlugs.add(rule.topSlug);
      }
    }
  }

  for (const cat of categories) {
    if (cat.parent_id !== null) continue;
    const catWords = normalizeQueryText(cat.name_rw).split(' ');
    if (catWords.some((w) => w.length >= 4 && allTokens.has(w))) {
      matchedTopSlugs.add(cat.slug);
    }
  }

  // Only enforce strict category lock when query uniquely identifies a single top-level category
  return matchedTopSlugs.size === 1 ? Array.from(matchedTopSlugs)[0] : null;
}

/**
 * Character trigram similarity (0..1) mimicking pg_trgm similarity()
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
  return pct >= 5 ? pct : 0; // shown only when >= 5%
}

export function getLowStockCount(variants: Array<{ in_stock: boolean; qty: number | null }>): number | null {
  const totalQtyKnown = variants.filter((v) => v.in_stock && typeof v.qty === 'number' && v.qty > 0);
  if (totalQtyKnown.length === 0) return null;
  const sum = totalQtyKnown.reduce((acc, v) => acc + (v.qty ?? 0), 0);
  return sum >= 1 && sum <= 3 ? sum : null;
}

export function computePopularity7d(stats: {
  views: number;
  shares: number;
  cart_adds: number;
  wa_clicks: number;
  call_clicks: number;
}): number {
  return (
    stats.views +
    2 * stats.shares +
    3 * stats.cart_adds +
    5 * (stats.wa_clicks + stats.call_clicks)
  );
}

/**
 * Fair seller-diversity interleaver:
 * Prevents one merchant from occupying consecutive slots or dominating a product shelf/page.
 */
export function interleaveBySeller(
  items: Product[],
  options: { maxPerShop?: number; maxConsecutiveSameShop?: number; limit?: number } = {}
): Product[] {
  const maxPerShop = options.maxPerShop ?? Infinity;
  const maxConsecutive = options.maxConsecutiveSameShop ?? 1;
  const limit = options.limit ?? items.length;

  const pool = [...items];
  const result: Product[] = [];
  const shopCounts = new Map<string, number>();

  while (pool.length > 0 && result.length < limit) {
    // Determine how many consecutive tail items share the same shop_id
    const lastShop = result.length > 0 ? result[result.length - 1].shop_id : null;
    let tailStreak = 0;
    if (lastShop) {
      for (let i = result.length - 1; i >= 0 && result[i].shop_id === lastShop; i--) {
        tailStreak++;
      }
    }

    // Prefer highest-ranked eligible item that respects maxPerShop and avoids exceeding maxConsecutive
    let chosenIdx = pool.findIndex((p) => {
      const count = shopCounts.get(p.shop_id) ?? 0;
      if (count >= maxPerShop) return false;
      if (p.shop_id === lastShop && tailStreak >= maxConsecutive) return false;
      return true;
    });

    // Fallback: if all remaining items belong to the same shop and still under maxPerShop, relax consecutive check
    if (chosenIdx < 0) {
      chosenIdx = pool.findIndex((p) => (shopCounts.get(p.shop_id) ?? 0) < maxPerShop);
    }

    if (chosenIdx < 0) break;

    const [picked] = pool.splice(chosenIdx, 1);
    result.push(picked);
    shopCounts.set(picked.shop_id, (shopCounts.get(picked.shop_id) ?? 0) + 1);
  }

  return result;
}

/** Popularity uses client-reported signals and remains disabled until protected server-side analytics are available. */
export const ENABLE_POPULARITY_RANKING = false;

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
  const rawQuery = (filters.q ?? '').trim();
  const lockedCategorySlug = !filters.categorySlug && rawQuery
    ? detectCategoryIntent(rawQuery, categories, synonyms)
    : null;

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

    const activeCatFilter = filters.categorySlug || lockedCategorySlug;
    if (activeCatFilter) {
      const cat = catById.get(p.category_id);
      const parent = cat?.parent_id ? catById.get(cat.parent_id) : undefined;
      if (cat?.slug !== activeCatFilter && parent?.slug !== activeCatFilter) {
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
            else if (catNorm.includes(tok)) tokenHits += 0.65;
            else if (descNorm.includes(tok)) tokenHits += 0.3;
          }
          if (tokens.length > 0) {
            tsRank = Math.max(tsRank, tokenHits / tokens.length);
          }

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

        const score = 2 * tsRank + maxSim + inStockBonus + isNew14d + sameDistrict;
        return { product: p, score };
      })
      .filter((x): x is { product: Product; score: number } => x !== null);

    if (!filters.sort || filters.sort === 'popular') {
      scored.sort((a, b) => b.score - a.score);
      // Apply gentle seller rotation so top results don't cluster from 1 shop
      return interleaveBySeller(
        scored.map((s) => s.product),
        { maxConsecutiveSameShop: 1 }
      );
    }
    filtered = scored.map((s) => s.product);
  }

  const sortMode = filters.sort ?? 'newest';
  filtered.sort((a, b) => {
    if (sortMode === 'price_asc') return a.price - b.price;
    if (sortMode === 'price_desc') return b.price - a.price;
    if (sortMode === 'popular' && ENABLE_POPULARITY_RANKING) return (b.popularity_7d ?? 0) - (a.popularity_7d ?? 0);
    if (sortMode === 'nearby' && filters.buyerDistrictId) {
      const aMatch = a.shop?.district_id === filters.buyerDistrictId ? 1 : 0;
      const bMatch = b.shop?.district_id === filters.buyerDistrictId ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Unless strict price ordering is requested, interleave across sellers for fair visibility
  if (sortMode !== 'price_asc' && sortMode !== 'price_desc' && !filters.shopId) {
    return interleaveBySeller(filtered, { maxConsecutiveSameShop: 1 });
  }

  return filtered;
}

/**
 * 'Ibisa na cyo' (8 similar products, max 3 per shop, strict seller rotation)
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
    (p) =>
      p.id !== target.id &&
      p.status === 'active' &&
      p.images.length > 0 &&
      (!p.shop?.status || p.shop.status === 'approved')
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

    const mySizes = [options.myShoeSize, options.myClothingSize]
      .filter(Boolean)
      .map((s) => s!.toLowerCase());
    if (
      mySizes.length > 0 &&
      p.variants.some((v) => v.in_stock && mySizes.includes(v.size_label.toLowerCase()))
    ) {
      score += 5;
    }

    if (ENABLE_POPULARITY_RANKING) score += Math.min(10, (p.popularity_7d ?? 0) / 10);

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return interleaveBySeller(
    scored.map((s) => s.product),
    { maxPerShop: 3, maxConsecutiveSameShop: 1, limit: 8 }
  );
}

/**
 * Home shelves ('Bishya', 'Bikunzwe cyane', 'Byagabanyijwe', 'Amaduka hafi yawe')
 * Uses fair seller rotation (`interleaveBySeller`) + 72h fresh injection slot on Popular.
 */
export function buildHomeShelves(
  products: Product[],
  options: { buyerDistrictId?: number; rotationSeed?: number } = {}
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

  // Bishya: newest first, interleaved fairly across sellers (max 2 per shop, max 1 consecutive)
  const sortedNewest = [...active].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const newest = interleaveBySeller(sortedNewest, {
    maxPerShop: 2,
    maxConsecutiveSameShop: 1,
    limit: 8,
  });

  // Bikunzwe cyane: popularity_7d desc + 1 of every 4 slots goes to <=72h fresh item, interleaved fairly
  const sortedPop = ENABLE_POPULARITY_RANKING
    ? [...active].sort((a, b) => (b.popularity_7d ?? 0) - (a.popularity_7d ?? 0))
    : sortedNewest;
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
    const prevShopId = popular.length > 0 ? popular[popular.length - 1].shop_id : null;
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
      // First pass: find top unpicked product from a different shop than previous slot
      const altIdx = sortedPop.findIndex(
        (cand, idx) =>
          idx >= popIdx &&
          !usedPopIds.has(cand.id) &&
          (popShopCount.get(cand.shop_id) ?? 0) < 2 &&
          cand.shop_id !== prevShopId
      );
      if (altIdx >= 0) {
        picked = sortedPop[altIdx];
      } else {
        while (popIdx < sortedPop.length) {
          const cand = sortedPop[popIdx++];
          if (!usedPopIds.has(cand.id) && (popShopCount.get(cand.shop_id) ?? 0) < 2) {
            picked = cand;
            break;
          }
        }
      }
    }
    if (!picked) break;
    popular.push(picked);
    usedPopIds.add(picked.id);
    popShopCount.set(picked.shop_id, (popShopCount.get(picked.shop_id) ?? 0) + 1);
  }

  // Byagabanyijwe: discount >= 10%, sorted desc, fairly interleaved across sellers
  const withDiscount = active
    .map((p) => ({ p, pct: calculateDiscountPercent(p.price, p.old_price) }))
    .filter((x) => x.pct >= 10)
    .sort((a, b) => b.pct - a.pct)
    .map((x) => x.p);
  const discounted = interleaveBySeller(withDiscount, {
    maxPerShop: 3,
    maxConsecutiveSameShop: 1,
    limit: 8,
  });

  // Amaduka hafi yawe: district prioritized, rotated by optional daily seed across eligible sellers
  const seed = options.rotationSeed ?? 0;
  const nearbySorted = [...active].sort((a, b) => {
    const aNear = options.buyerDistrictId && a.shop?.district_id === options.buyerDistrictId ? 1 : 0;
    const bNear = options.buyerDistrictId && b.shop?.district_id === options.buyerDistrictId ? 1 : 0;
    if (aNear !== bNear) return bNear - aNear;
    const aScore = new Date(a.created_at).getTime() + ((a.shop_id.charCodeAt(a.shop_id.length - 1) + seed) % 3) * 1000;
    const bScore = new Date(b.created_at).getTime() + ((b.shop_id.charCodeAt(b.shop_id.length - 1) + seed) % 3) * 1000;
    return bScore - aScore;
  });
  const nearby = interleaveBySeller(nearbySorted, {
    maxPerShop: 2,
    maxConsecutiveSameShop: 1,
    limit: 8,
  });

  return { newest, popular, discounted, nearby };
}

/**
 * Rotates active promotional campaigns fairly so the starting slide shifts cleanly.
 */
export function rotateActiveCampaigns(
  campaigns: PromoCampaign[],
  rotationOffset = 0
): PromoCampaign[] {
  const active = campaigns
    .filter((c) => c.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (active.length <= 1) return active;
  const shift = ((rotationOffset % active.length) + active.length) % active.length;
  return [...active.slice(shift), ...active.slice(0, shift)];
}
