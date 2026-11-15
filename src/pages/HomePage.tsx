import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  ChevronRight,
  Footprints,
  Package,
  ShieldCheck,
  Shirt,
  Sparkles,
  Store,
  Tag,
} from 'lucide-react';
import { ImigongoHeroCorner, IsokoMark, IsokoVerifiedSeal, RwandanGeometricPattern } from '../components/IsokoLogo';
import { ProductCard } from '../components/ProductCard';
import { PromoCarousel } from '../components/PromoCarousel';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { INITIAL_CATEGORIES } from '../data/categories';
import { buildHomeShelves, interleaveBySeller } from '../lib/algorithm';
import { loadInterest } from '../lib/storage';

interface HomePageProps {
  onOpenCategories?: () => void;
}

const DENSE_GRID_CLS =
  'grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-2.5';

function getCategoryIcon(slug: string) {
  if (slug.includes('inkweto') || slug.includes('sandali') || slug.includes('bote')) return Footprints;
  if (slug.includes('imyenda') || slug.includes('ankara') || slug.includes('ikoti')) return Shirt;
  if (slug.includes('amasogisi') || slug.includes('imbere')) return Sparkles;
  return Briefcase;
}

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
  // Categories are stable reference data. Keep discovery usable while the
  // public catalogue request is pending or the backend is temporarily asleep.
  const categories =
    bootstrap?.categories?.length
      ? bootstrap.categories
      : INITIAL_CATEGORIES.filter((category) => category.active);
  const shops = bootstrap?.shops ?? [];
  const campaigns = bootstrap?.campaigns ?? [];
  const topCategories = categories
    .filter((category) => category.parent_id === null && category.active)
    .sort((a, b) => a.sort - b.sort);

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

  const activeCampaigns = campaigns.filter((campaign) => campaign.active);
  const firstScreenProducts =
    shelves.newest.length >= 9 ? shelves.newest.slice(0, 14) : activeCatalog.slice(0, 14);
  const hasCatalog = activeCatalog.length > 0;

  return (
    <main className="mx-auto max-w-7xl space-y-4 bg-[#FAFAF7] pb-6">
      <section className="px-2 pt-2 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-[#DCE4DE] bg-white shadow-sm">
          <RwandanGeometricPattern size="header" />
          <div className="relative flex min-h-[176px] items-center justify-between gap-3 px-4 py-4 sm:min-h-[200px] sm:px-7 sm:py-6">
            <div className="relative z-10 min-w-0 max-w-[78%]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C0392B]">
                ISOKO · RWANDA
              </p>
              <h1 className="mt-2 max-w-[620px] text-[23px] font-extrabold leading-[1.12] tracking-tight text-[#1A1F1C] sm:text-[32px]">
                {t('hero_title')}
              </h1>
              <p className="mt-2 max-w-[520px] text-[13px] leading-[19px] text-[#4B544F] sm:text-[15px] sm:leading-6">
                {t('hero_subtitle')}
              </p>
              <a
                href="/abacuruzi"
                onClick={(event) => {
                  event.preventDefault();
                  navigate('/abacuruzi');
                }}
                className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#07543C]"
              >
                <Store className="h-4 w-4" aria-hidden="true" />
                <span>{t('register_seller')}</span>
              </a>
            </div>
            <div className="relative z-10 mr-1 flex shrink-0 flex-col items-center gap-1 sm:mr-3">
              <IsokoMark className="h-12 w-12 sm:h-16 sm:w-16" />
              <span className="text-[9px] font-bold tracking-[0.12em] text-[#4B544F]">ISOKO</span>
            </div>
            <ImigongoHeroCorner className="absolute -right-2 -bottom-8 h-36 w-36 opacity-75 sm:h-52 sm:w-52" />
          </div>
          <RwandanGeometricPattern size="footer" />
        </div>
      </section>

      {/* Compact visual category rail: real category definitions, never demo products. */}
      <section aria-labelledby="home-categories-heading" className="px-2 sm:px-6">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 id="home-categories-heading" className="text-[14px] font-semibold text-[#1A1F1C]">
            {t('categories')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/ibyiciro')}
            className="inline-flex min-h-[32px] items-center gap-0.5 text-[10.5px] font-semibold text-[#0B6E4F] hover:underline"
          >
            <span>{t('all_categories')}</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {topCategories.map((category) => {
            const Icon = getCategoryIcon(category.slug);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => navigate(`/c/${category.slug}`)}
                className="flex min-h-[92px] w-[96px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-[#DCE4DE] bg-white px-2 py-2.5 text-center transition-colors hover:border-[#0B6E4F] hover:bg-white"
                aria-label={category.name_rw}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F3ED] text-[#0B6E4F]">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="w-full whitespace-normal break-words text-[11px] font-semibold leading-[14px] text-[#1A1F1C]">
                  {category.name_rw}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Products never block the rest of the page. Only this area loads. */}
      <section aria-labelledby="new-arrivals-heading" className="px-2 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <h2 id="new-arrivals-heading" className="text-[14px] font-semibold leading-tight text-[#1A1F1C]">
            {t('new_arrivals')}
          </h2>
          {hasCatalog && (
            <button
              type="button"
              onClick={() => navigate('/shakisha?sort=newest')}
              className="inline-flex min-h-[32px] items-center gap-0.5 text-[10.5px] font-semibold text-[#0B6E4F] hover:underline"
            >
              <span>{t('see_all')}</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {loading ? (
          <div className={DENSE_GRID_CLS} aria-label="Tegereza ibicuruzwa birimo kuza">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-[#DCE4DE] bg-white"
              >
                <div className="aspect-square animate-pulse bg-[#F2F5F2]" />
                <div className="space-y-1.5 p-1.5">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[#F2F5F2]" />
                  <div className="h-2.5 w-full animate-pulse rounded bg-[#F2F5F2]" />
                  <div className="h-2 w-1/2 animate-pulse rounded bg-[#F2F5F2]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[#E8BDB7] bg-white px-4 py-5 text-center">
            <p className="text-[12px] font-medium text-[#982C22]">{error}</p>
            <button
              type="button"
              onClick={refreshBootstrap}
              className="mt-3 inline-flex min-h-[38px] items-center rounded-full border border-[#BD594A]/40 px-4 text-[11px] font-semibold text-[#8F493F] hover:bg-[#FAF0ED]"
            >
              {t('try_again')}
            </button>
          </div>
        ) : firstScreenProducts.length > 0 ? (
          <div className={DENSE_GRID_CLS}>
            {firstScreenProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#DCE4DE] bg-white px-4 py-5 text-center sm:py-6">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F5F2] text-[#4B544F]">
              <Package className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <h3 className="mt-2 text-[13px] font-semibold text-[#1A1F1C]">
              Nta bicuruzwa birashyirwaho ubu
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[10.5px] leading-[15px] text-[#4B544F]">
              Ibicuruzwa bigaragara hano iyo abacuruzi babyishyize kuri Isoko. Nta bicuruzwa by’icyitegererezo dushyiramo.
            </p>
            <button
              type="button"
              onClick={() => navigate('/abacuruzi')}
              className="mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#214E43] px-4 text-[10.5px] font-semibold text-white transition-colors hover:bg-[#183B33]"
            >
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              Fungura iduka
            </button>
          </div>
        )}
      </section>

      {/* Two compact discovery actions, with neither surface shouting for attention. */}
      <section className="px-2 sm:px-6" aria-label={t('discounted')}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/shakisha?discounted=1')}
            className="flex min-h-[54px] items-center justify-between gap-2 rounded-lg border border-[#E5DCD6] bg-white px-3 py-2 text-left transition-colors hover:border-[#BD594A]/50"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold leading-snug text-[#1A1F1C]">
                {t('discounted')}
              </p>
              <p className="mt-0.5 text-[9.5px] text-[#8F493F] tabular-nums">
                {shelves.discounted.length}
              </p>
            </div>
            <Tag className="h-4 w-4 shrink-0 text-[#BD594A]" strokeWidth={1.65} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/abacuruzi')}
            className="flex min-h-[54px] items-center justify-between gap-2 rounded-lg border border-[#D8DED7] bg-white px-3 py-2 text-left transition-colors hover:border-[#214E43]/50"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold leading-snug text-[#1A1F1C]">
                {t('register_seller')}
              </p>
              <p className="mt-0.5 text-[9.5px] text-[#4B544F] tabular-nums">
                {shops.length} {t('shops')}
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#0B6E4F]" strokeWidth={1.65} aria-hidden="true" />
          </button>
        </div>
      </section>

      {recentProducts.length > 0 && (
        <DenseShelfSection
          title={t('recent')}
          products={recentProducts}
          seeAllLabel={t('see_all')}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {shelves.popular.length > 0 && (
        <DenseShelfSection
          title={t('popular')}
          products={shelves.popular}
          seeAllLabel={t('see_all')}
          onSeeAll={() => navigate('/shakisha?sort=popular')}
        />
      )}

      {shelves.discounted.length > 0 && (
        <DenseShelfSection
          title={t('discounted')}
          products={shelves.discounted}
          seeAllLabel={t('see_all')}
          onSeeAll={() => navigate('/shakisha?discounted=1')}
        />
      )}

      {activeCampaigns.length > 0 && (
        <div className="px-2 sm:px-6">
          <PromoCarousel campaigns={activeCampaigns} />
        </div>
      )}

      {youMightLike.length > 0 && (
        <DenseShelfSection
          title={t('popular')}
          products={youMightLike}
          seeAllLabel={t('see_all')}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {shops.length > 0 && (
        <section
          aria-labelledby="shops-heading"
          className="border-y border-[#DCE4DE] bg-white px-2 py-3 sm:px-6"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="shops-heading" className="text-[14px] font-semibold text-[#1A1F1C]">
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
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(`/i/${shop.slug}`);
                  }}
                  className="flex w-[164px] shrink-0 flex-col rounded-lg border border-[#DCE4DE] bg-[#F7F5F0] p-2.5 transition-colors hover:border-[#214E43]/45 sm:w-auto"
                >
                  <div className="flex items-center gap-2">
                    {shop.logo_path ? (
                      <img
                        src={shop.logo_path}
                        alt={shop.name}
                        className="h-9 w-9 shrink-0 rounded-full border border-[#DCE4DE] bg-white object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F5F2] text-[#505A55]">
                        <Store className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="truncate text-[11.5px] font-semibold text-[#1A1F1C]">
                          {shop.name}
                        </h3>
                        {verified && <IsokoVerifiedSeal className="h-3.5 w-3.5 shrink-0" />}
                      </div>
                      <p className="truncate text-[10px] text-[#4B544F] tabular-nums">
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

      {hasCatalog && (
        <section aria-labelledby="all-products-heading" className="px-2 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <h2 id="all-products-heading" className="text-[14px] font-semibold text-[#1A1F1C]">
              {t('all_products_title')}
            </h2>
            <span className="text-[10.5px] text-[#4B544F] tabular-nums">
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
                onClick={() => setVisibleCount((count) => count + 21)}
                className="min-h-[40px] rounded-full border border-[#C9D2CB] bg-white px-5 text-[11px] font-semibold text-[#0B6E4F] transition-colors hover:bg-[#E9F0EB]"
              >
                {t('load_more')}
              </button>
            </div>
          )}
        </section>
      )}
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
    <div className="mb-2 flex items-center justify-between gap-2 px-1">
      <h2 className="truncate text-[14px] font-semibold leading-tight text-[#1A1F1C]">{title}</h2>
      <button
        type="button"
        onClick={onSeeAll}
        className="inline-flex min-h-[32px] shrink-0 items-center gap-0.5 text-[10.5px] font-semibold text-[#0B6E4F] hover:underline"
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
