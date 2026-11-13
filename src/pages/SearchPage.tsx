import React, { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { FilterPanel, type ActiveFilters } from '../components/FilterSheet';
import { ProductCard } from '../components/ProductCard';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { searchAndRankProducts } from '../lib/algorithm';

interface SearchPageProps {
  initialCategorySlug?: string;
}

export const SearchPage: React.FC<SearchPageProps> = ({ initialCategorySlug }) => {
  const { bootstrap, searchParams, navigate, location, mySize, setMySize } = useMarketplace();
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

  // Apply My Size automatically if enabled and user didn't override size
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1B1F23]">
            {q
              ? `Ibisubizo bya "${q}"`
              : activeCategoryName
                ? activeCategoryName
                : 'Shakisha ibicuruzwa'}
          </h1>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            Habonetse ibicuruzwa {results.length}
            {effectiveSize && mySize.enabled && !filters.size ? ` · Size yawe: ${effectiveSize}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1B1F23] lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
            <span>{RW.filter}</span>
            {activeFilterCount > 0 && (
              <span className="tabular-nums text-[#0B6E4F]">({activeFilterCount})</span>
            )}
          </button>

          <label htmlFor="sort-select" className="sr-only">
            {RW.sort}
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
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-[#1B1F23]"
          >
            {Object.entries(RW.sort_options).map(([val, label]) => (
              <option key={val} value={val}>
                {RW.sort}: {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
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

        <div className="lg:col-span-9">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-[#F1F6F3] p-8 text-center">
              <p className="text-base font-semibold text-[#1B1F23]">{RW.no_results}</p>
              <p className="mt-2 text-sm text-slate-600">
                Gerageza guhindura ijambo cyangwa kuvanaho ibyungurura kugira ngo ubone ibindi bicuruzwa.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-[44px] rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
                >
                  {RW.clear_filters}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/shakisha')}
                  className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-[#1B1F23]"
                >
                  Reba byose
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-5">
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
