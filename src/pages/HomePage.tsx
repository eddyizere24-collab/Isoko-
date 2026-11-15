import React, { useMemo, useState } from 'react';
import { ChevronRight, ShieldCheck, Store, Tag } from 'lucide-react';
import { ImigongoHeroCorner, IsokoVerifiedSeal } from '../components/IsokoLogo';
import { ProductCard } from '../components/ProductCard';
import { PromoCarousel } from '../components/PromoCarousel';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { buildHomeShelves, interleaveBySeller } from '../lib/algorithm';
import { loadInterest } from '../lib/storage';

interface HomePageProps {
  onOpenCategories?: () => void;
}

const DENSE_GRID_CLS =
  'grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-2.5';

export const HomePage: React.FC<HomePageProps> = () => {
  const {
    bootstrap,
    loading,
    error,
    refreshBootstrap,
    navigate,
    location,
    recents,
  } = useMarketplace();
  const { t } = useT();
  const [visibleCount, setVisibleCount] = useState(21);

  const products = bootstrap?.products ?? [];
  const categories = bootstrap?.categories ?? [];
  const shops = bootstrap?.shops ?? [];
  const campaigns = bootstrap?.campaigns ?? [];

  const shelves = useMemo(
    () => buildHomeShelves(products, { buyerDistrictId: location?.districtId }),
    [products, location?.districtId]
  );

  const recentProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return recents
      .map((r) => byId.get(r.productId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, 7);
  }, [products, recents]);

  const youMightLike = useMemo(() => {
    const scores = loadInterest();
    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return [];
    const topCatId = Number(entries[0][0]);
    const matched = products.filter(
      (p) => p.status === 'active' && (p.category_id === topCatId || p.parent_category?.id === topCatId)
    );
    return interleaveBySeller(matched, { maxConsecutiveSameShop: 1, limit: 7 });
  }, [products]);

  const activeCatalog = useMemo(() => {
    const visible = products.filter((p) => p.status === 'active' || p.status === 'sold_out');
    return interleaveBySeller(visible, { maxConsecutiveSameShop: 1 });
  }, [products]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-2 py-2 sm:px-6 space-y-3">
        <div className="h-[72px] animate-pulse rounded-md bg-white border border-[#E5E7EB]" />
        <div className="h-8 animate-pulse rounded-md bg-white border border-[#E5E7EB]" />
        <div className={DENSE_GRID_CLS}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-[175px] animate-pulse rounded-md bg-white border border-[#E5E7EB]" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-4 py-14 text-center">
        <p className="text-sm font-semibold text-[#C0392B]">{error}</p>
        <button
          type="button"
          onClick={refreshBootstrap}
          className="mt-4 min-h-[40px] rounded-lg bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
        >
          {t('try_again')}
        </button>
      </main>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.active);
  const topCategories = categories.filter((c) => c.parent_id === null);
  const firstScreenProducts =
    shelves.newest.length >= 9 ? shelves.newest.slice(0, 14) : activeCatalog.slice(0, 14);

  return (
    <main className="mx-auto max-w-7xl space-y-4 pb-6">
      {/* Section 1: Compact Hero Banner (<= 120px height, 20/26 heading, 120px Imigongo corner at 15% opacity) */}
      <section className="px-2 pt-1.5 sm:px-6">
        <div className="relative flex min-h-[68px] max-h-[120px] items-center justify-between overflow-hidden rounded-md border border-[#E5E7EB] bg-white px-3 py-2 sm:px-5 sm:py-3">
          <div className="relative z-10 min-w-0 pr-8">
            <h1 className="text-[20px] font-semibold leading-[26px] text-[#1B1F23] truncate sm:text-clip">
              {t('hero_title')}
            </h1>
            <p className="mt-0.5 text-[11.5px] leading-[15px] text-[#4B5563] truncate">
              {t('hero_subtitle')}
            </p>
          </div>
          <a
            href="/abacuruzi"
            onClick={(e) => {
              e.preventDefault();
              navigate('/abacuruzi');
            }}
            className="relative z-10 hidden sm:inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-[#0B6E4F] px-3.5 text-xs font-semibold text-white hover:bg-[#08553D] transition-colors"
          >
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('register_seller')}</span>
          </a>
          <ImigongoHeroCorner className="absolute right-0 top-0" />
        </div>
      </section>

      {/* Section 2: Compact Categories Strip */}
      <section aria-label={t('categories')} className="px-2 sm:px-6">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <a
            href="/ibyiciro"
            onClick={(e) => {
              e.preventDefault();
              navigate('/ibyiciro');
            }}
            className="inline-flex h-[34px] shrink-0 items-center rounded-md border border-[#0B6E4F] bg-[#E8F3EE] px-2.5 text-[11.5px] font-semibold text-[#0B6E4F] whitespace-nowrap"
          >
            {t('all_categories')}
          </a>
          {topCategories.map((cat) => (
            <a
              key={cat.id}
              href={`/c/${cat.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/c/${cat.slug}`);
              }}
              className="inline-flex h-[34px] shrink-0 items-center rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[11.5px] font-medium text-[#1B1F23] hover:border-[#0B6E4F] whitespace-nowrap transition-colors"
            >
              {cat.name_rw}
            </a>
          ))}
        </div>
      </section>

      {/* Section 3: First 3-Col Dense Products Grid immediately above the fold (>= 9 visible on 360x640) */}
      {firstScreenProducts.length > 0 && (
        <section aria-labelledby="new-arrivals-heading" className="px-2 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="new-arrivals-heading" className="text-[15px] font-semibold leading-tight text-[#1B1F23]">
              {t('new_arrivals')}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/shakisha?sort=newest')}
              className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#0B6E4F] hover:underline"
            >
              <span>{t('see_all')}</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className={DENSE_GRID_CLS}>
            {firstScreenProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Curated 2-item Highlight Strip (only 2-column section allowed by §5 for <= 4 curated highlights) */}
      <section className="px-2 sm:px-6" aria-label={t('discounted')}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/shakisha?discounted=1')}
            className="flex items-center justify-between gap-2 rounded-md border border-[#C0392B]/25 bg-[#FBEAE8] p-2.5 text-left transition-colors hover:border-[#C0392B]"
          >
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold leading-snug text-[#1B1F23] truncate">
                {t('discounted')}
              </p>
              <p className="text-[11px] text-[#8E2A20] tabular-nums">
                {shelves.discounted.length}
              </p>
            </div>
            <Tag className="h-4 w-4 shrink-0 text-[#C0392B]" strokeWidth={1.75} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/abacuruzi')}
            className="flex items-center justify-between gap-2 rounded-md border border-[#0B6E4F]/25 bg-[#E8F3EE] p-2.5 text-left transition-colors hover:border-[#0B6E4F]"
          >
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold leading-snug text-[#1B1F23] truncate">
                {t('register_seller')}
              </p>
              <p className="text-[11px] text-[#064E3B] tabular-nums">
                {shops.length} {t('shops')}
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#0B6E4F]" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Recently Viewed (if any) */}
      {recentProducts.length > 0 && (
        <DenseShelfSection
          title={t('recent')}
          products={recentProducts}
          seeAllLabel={t('see_all')}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {/* Popular Shelf */}
      {shelves.popular.length > 0 && (
        <DenseShelfSection
          title={t('popular')}
          products={shelves.popular}
          seeAllLabel={t('see_all')}
          onSeeAll={() => navigate('/shakisha?sort=popular')}
        />
      )}

      {/* Discounted Shelf */}
      {shelves.discounted.length > 0 && (
        <DenseShelfSection
          title={t('discounted')}
          products={shelves.discounted}
          seeAllLabel={t('see_all')}
          onSeeAll={() => navigate('/shakisha?discounted=1')}
        />
      )}

      {/* Promotional Carousel */}
      {activeCampaigns.length > 0 && (
        <div className="px-2 sm:px-6">
          <PromoCarousel campaigns={activeCampaigns} />
        </div>
      )}

      {/* You Might Like */}
      {youMightLike.length > 0 && (
        <DenseShelfSection
          title={t('popular')}
          products={youMightLike}
          seeAllLabel={t('see_all')}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {/* Verified Storefronts Row */}
      {shops.length > 0 && (
        <section
          aria-labelledby="shops-heading"
          className="bg-white border-y border-[#E5E7EB] py-3 px-2 sm:px-6"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="shops-heading" className="text-[15px] font-semibold text-[#1B1F23]">
              {t('verified_shops_title')}
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-4">
            {shops.map((shop) => {
              const verified = shop.status === 'approved' || shop.identity_status === 'verified';
              return (
                <a
                  key={shop.id}
                  href={`/i/${shop.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/i/${shop.slug}`);
                  }}
                  className="flex w-[164px] shrink-0 flex-col rounded-md border border-[#E5E7EB] bg-[#F7F8FA] p-2.5 transition-colors hover:border-[#0B6E4F] sm:w-auto"
                >
                  <div className="flex items-center gap-2">
                    {shop.logo_path ? (
                      <img
                        src={shop.logo_path}
                        alt={shop.name}
                        className="h-9 w-9 shrink-0 rounded-full border border-[#E5E7EB] bg-white object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B6E4F] text-white">
                        <Store className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="truncate text-[12px] font-semibold text-[#1B1F23]">
                          {shop.name}
                        </h3>
                        {verified && <IsokoVerifiedSeal className="h-3.5 w-3.5 shrink-0" />}
                      </div>
                      <p className="truncate text-[10.5px] text-[#6B7280] tabular-nums">
                        {shop.district_name} · {shop.active_product_count ?? 0}
                      </p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Full Dense Catalog Grid (3/4/5/6/7 columns) */}
      <section aria-labelledby="all-products-heading" className="px-2 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="all-products-heading" className="text-[15px] font-semibold text-[#1B1F23]">
            {t('all_products_title')}
          </h2>
          <span className="text-[11.5px] text-[#6B7280] tabular-nums">
            {activeCatalog.length}
          </span>
        </div>

        <div className={DENSE_GRID_CLS}>
          {activeCatalog.slice(0, visibleCount).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {visibleCount < activeCatalog.length && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 21)}
              className="min-h-[40px] rounded-md border border-[#0B6E4F] bg-white px-5 text-[12.5px] font-semibold text-[#0B6E4F] hover:bg-[#E8F3EE] transition-colors"
            >
              {t('load_more')}
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

interface DenseShelfSectionProps {
  title: string;
  products: ReturnType<typeof buildHomeShelves>['newest'];
  seeAllLabel: string;
  onSeeAll: () => void;
}

const DenseShelfSection: React.FC<DenseShelfSectionProps> = ({
  title,
  products,
  seeAllLabel,
  onSeeAll,
}) => (
  <section className="px-2 sm:px-6">
    <div className="mb-2 flex items-center justify-between gap-2">
      <h2 className="text-[15px] font-semibold leading-tight text-[#1B1F23] truncate">{title}</h2>
      <button
        type="button"
        onClick={onSeeAll}
        className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#0B6E4F] hover:underline"
      >
        <span>{seeAllLabel}</span>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>

    <div className={DENSE_GRID_CLS}>
      {products.slice(0, 7).map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>
);
