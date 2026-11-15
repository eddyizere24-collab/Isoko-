import React, { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { FilterPanel, type ActiveFilters } from '../components/FilterSheet';
import { ProductCard } from '../components/ProductCard';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { searchAndRankProducts } from '../lib/algorithm';

interface SearchPageProps {
  initialCategorySlug?: string;
}

export const SearchPage: React.FC<SearchPageProps> = ({ initialCategorySlug }) => {
  const { bootstrap, searchParams, navigate, location, mySize, setMySize } = useMarketplace();
  const { t } = useT();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const q = searchParams.get('q') ?? '';
  const filters: ActiveFilters = {
    categorySlug: initialCategorySlug ?? searchParams.get('c') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    size: searchParams.get('size') ?? '',
    color: searchParams.get('color') ?? '',
    condition: (searchParams.get('condition') as ActiveFilters['condition']) ?? '',
    districtId: searchParams.get('district') ?? '',
    inStockOnly: searchParams.get('inStock') === '1',
    discountedOnly: searchParams.get('discounted') === '1',
    sort: (searchParams.get('sort') as ActiveFilters['sort']) || 'newest',
  };

  const updateUrlFromFilters = (next: ActiveFilters, nextQ = q) => {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (next.categorySlug) params.set('c', next.categorySlug);
    if (next.minPrice) params.set('minPrice', next.minPrice);
    if (next.maxPrice) params.set('maxPrice', next.maxPrice);
    if (next.size) params.set('size', next.size);
    if (next.color) params.set('color', next.color);
    if (next.condition) params.set('condition', next.condition);
    if (next.districtId) params.set('district', next.districtId);
    if (next.inStockOnly) params.set('inStock', '1');
    if (next.discountedOnly) params.set('discounted', '1');
    if (next.sort && next.sort !== 'newest') params.set('sort', next.sort);

    const qs = params.toString();
    navigate(qs ? `/shakisha?${qs}` : '/shakisha');
  };

  const clearFilters = () => {
    navigate(q ? `/shakisha?q=${encodeURIComponent(q)}` : '/shakisha');
  };

  const activeFilterCount = [
    filters.categorySlug,
    filters.minPrice,
    filters.maxPrice,
    filters.size,
    filters.color,
    filters.condition,
    filters.districtId,
    filters.inStockOnly ? '1' : '',
    filters.discountedOnly ? '1' : '',
  ].filter(Boolean).length;

  const categories = bootstrap?.categories ?? [];
  const synonyms = bootstrap?.synonyms ?? [];
  const products = bootstrap?.products ?? [];

  const effectiveSize = useMemo(() => {
    if (filters.size) return filters.size;
    if (!mySize.enabled) return undefined;
    if (filters.categorySlug === 'inkweto' && mySize.shoeSize) return mySize.shoeSize;
    if (filters.categorySlug === 'imyenda' && mySize.clothingSize) return mySize.clothingSize;
    return undefined;
  }, [filters.size, filters.categorySlug, mySize]);

  const results = useMemo(() => {
    return searchAndRankProducts(products, categories, synonyms, {
      q,
      categorySlug: filters.categorySlug || undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      size: effectiveSize,
      color: filters.color || undefined,
      condition: filters.condition,
      districtId: filters.districtId ? Number(filters.districtId) : undefined,
      inStockOnly: filters.inStockOnly,
      discountedOnly: filters.discountedOnly,
      sort: filters.sort,
      buyerDistrictId: location?.districtId,
    });
  }, [products, categories, synonyms, q, filters, effectiveSize, location?.districtId]);

  const activeCategoryName = categories.find((c) => c.slug === filters.categorySlug)?.name_rw;

  const sortLabels: Record<ActiveFilters['sort'], string> = {
    newest: t('sort_newest'),
    price_asc: t('sort_price_asc'),
    price_desc: t('sort_price_desc'),
    popular: t('sort_popular'),
    nearby: t('sort_nearby'),
  };

  return (
    <div className="mx-auto max-w-7xl px-2 py-4 sm:px-6">
      <div className="flex flex-col gap-2.5 border-b border-[#E3E0D8] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] font-semibold leading-tight text-[#202724] truncate">
            {q ? `"${q}"` : activeCategoryName ? activeCategoryName : t('browse_products')}
          </h1>
          <p className="mt-0.5 text-xs text-[#68716D] tabular-nums">
            {t('found_count', { n: results.length })}
            {effectiveSize && mySize.enabled && !filters.size ? ` · ${t('size_label')}: ${effectiveSize}` : ''}
          </p>
        </div>

        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-[#C9CEC7] bg-white px-3 text-xs font-semibold text-[#202724] lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#214E43]" aria-hidden="true" />
            <span>{t('filter')}</span>
            {activeFilterCount > 0 && (
              <span className="tabular-nums text-[#214E43]">({activeFilterCount})</span>
            )}
          </button>

          <label htmlFor="sort-select" className="sr-only">
            {t('sort')}
          </label>
          <select
            id="sort-select"
            value={filters.sort}
            onChange={(e) =>
              updateUrlFromFilters({
                ...filters,
                sort: e.target.value as ActiveFilters['sort'],
              })
            }
            className="h-9 min-w-0 flex-1 sm:flex-none rounded-md border border-[#C9CEC7] bg-white px-2.5 text-xs font-medium text-[#202724]"
          >
            {Object.entries(sortLabels).map(([val, label]) => (
              <option key={val} value={val}>
                {t('sort')}: {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-12">
        <aside className="hidden lg:block lg:col-span-3">
          <FilterPanel
            filters={filters}
            onChange={(next) => updateUrlFromFilters(next)}
            onClear={clearFilters}
            categories={categories}
            mySize={mySize}
            onSaveMySize={setMySize}
          />
        </aside>

        <div className="lg:col-span-9 min-w-0">
          {results.length === 0 ? (
            <div className="rounded-lg border border-[#E3E0D8] bg-[#E9F0EB] p-6 text-center">
              <p className="text-[15px] font-semibold text-[#202724]">{t('no_results')}</p>
              <p className="mt-1.5 text-xs text-[#68716D]">{t('no_results_hint')}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-10 rounded-md bg-[#214E43] px-4 text-xs font-semibold text-white"
                >
                  {t('clear_filters')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/shakisha')}
                  className="h-10 rounded-md border border-[#E3E0D8] bg-white px-4 text-xs font-semibold text-[#202724]"
                >
                  {t('see_all')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-2.5">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <FilterPanel
        isMobileSheet
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onChange={(next) => updateUrlFromFilters(next)}
        onClear={() => {
          clearFilters();
          setMobileFilterOpen(false);
        }}
        categories={categories}
        mySize={mySize}
        onSaveMySize={setMySize}
      />
    </div>
  );
};
