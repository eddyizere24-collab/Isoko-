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
import { ImigongoHeroCorner, IsokoMark, IsokoVerifiedSeal } from '../components/IsokoLogo';
import { ProductCard } from '../components/ProductCard';
import { PromoCarousel } from '../components/PromoCarousel';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { INITIAL_CATEGORIES } from '../data/categories';
import { buildHomeShelves, interleaveBySeller } from '../lib/algorithm';
import { loadInterest } from '../lib/storage';
import { isShopIdentityVerified } from '../lib/shopVerification';

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
    <main className="mx-auto max-w-7xl space-y-4 bg-[#F7F5F0] pb-6">
      {/* Compact editorial hero. The mark is the colour-rich brand focal point;
          the surrounding interface stays calm and deliberately restrained. */}
      <section className="px-2 pt-2 sm:px-6">
        <div className="relative flex min-h-[76px] items-center justify-between overflow-hidden rounded-xl border border-[#E3E0D8] bg-[#FFFEFB] px-3 py-2.5 sm:min-h-[84px] sm:px-5">
          <div className="relative z-10 min-w-0 flex-1 pr-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#BD594A]">
              ISOKO · RWANDA
            </p>
            <h1 className="mt-0.5 max-w-[270px] text-[18px] font-semibold leading-[23px] text-[#202724] sm:max-w-none sm:text-[20px] sm:leading-[26px]">
              {t('hero_title')}
            </h1>
            <p className="mt-0.5 max-w-[280px] text-[10.5px] leading-[15px] text-[#68716D]">
              {t('hero_subtitle')}
            </p>
          </div>
          <div className="relative z-10 ml-2 flex shrink-0 flex-col items-center gap-1">
            <IsokoMark className="h-9 w-9 sm:h-11 sm:w-11" />
            <span className="hidden text-[8px] font-medium tracking-[0.08em] text-[#68716D] sm:block">
              ISOKO
            </span>
          </div>
          <ImigongoHeroCorner className="pointer-events-none absolute -right-1 -top-1 opacity-80" />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <span className="text-[10.5px] text-[#68716D]">
            {t('shops')} · WhatsApp
          </span>
          <a
            href="/abacuruzi"
            onClick={(event) => {
              event.preventDefault();
              navigate('/abacuruzi');
            }}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#D8DED7] bg-white px-3 text-[10.5px] font-semibold text-[#214E43] transition-colors hover:bg-[#E9F0EB]"
          >
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('register_seller')}</span>
          </a>
        </div>
      </section>

      {/* Compact visual category rail: real category definitions, never demo products. */}
      <section aria-labelledby="home-categories-heading" className="px-2 sm:px-6">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 id="home-categories-heading" className="text-[14px] font-semibold text-[#202724]">
            {t('categories')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/ibyiciro')}
            className="inline-flex min-h-[32px] items-center gap-0.5 text-[10.5px] font-semibold text-[#214E43] hover:underline"
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
                className="flex min-h-[70px] w-[78px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-[#E3E0D8] bg-[#FFFEFB] px-1.5 py-2 text-center transition-colors hover:border-[#214E43]/45 hover:bg-white"
                aria-label={category.name_rw}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEECE6] text-[#505A55]">
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.65} aria-hidden="true" />
                </span>
                <span className="max-w-full text-[9.5px] font-medium leading-[12px] text-[#333D38] line-clamp-2">
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
          <h2 id="new-arrivals-heading" className="text-[14px] font-semibold leading-tight text-[#202724]">
            {t('new_arrivals')}
          </h2>
          {hasCatalog && (
            <button
              type="button"
              onClick={() => navigate('/shakisha?sort=newest')}
              className="inline-flex min-h-[32px] items-center gap-0.5 text-[10.5px] font-semibold text-[#214E43] hover:underline"
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
                className="overflow-hidden rounded-lg border border-[#E3E0D8] bg-[#FFFEFB]"
              >
                <div className="aspect-square animate-pulse bg-[#EEECE6]" />
                <div className="space-y-1.5 p-1.5">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[#EEECE6]" />
                  <div className="h-2.5 w-full animate-pulse rounded bg-[#EEECE6]" />
                  <div className="h-2 w-1/2 animate-pulse rounded bg-[#EEECE6]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[#E6D3CE] bg-[#FFFEFB] px-4 py-5 text-center">
            <p className="text-[12px] font-medium text-[#6E4038]">{error}</p>
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
          <div className="rounded-xl border border-[#E3E0D8] bg-[#FFFEFB] px-4 py-5 text-center sm:py-6">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EEECE6] text-[#68716D]">
              <Package className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <h3 className="mt-2 text-[13px] font-semibold text-[#202724]">
              Nta bicuruzwa birashyirwaho ubu
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[10.5px] leading-[15px] text-[#68716D]">
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
            className="flex min-h-[54px] items-center justify-between gap-2 rounded-lg border border-[#E5DCD6] bg-[#FFFEFB] px-3 py-2 text-left transition-colors hover:border-[#BD594A]/50"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold leading-snug text-[#333D38]">
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
            className="flex min-h-[54px] items-center justify-between gap-2 rounded-lg border border-[#D8DED7] bg-[#FFFEFB] px-3 py-2 text-left transition-colors hover:border-[#214E43]/50"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold leading-snug text-[#333D38]">
                {t('register_seller')}
              </p>
              <p className="mt-0.5 text-[9.5px] text-[#68716D] tabular-nums">
                {shops.length} {t('shops')}
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#214E43]" strokeWidth={1.65} aria-hidden="true" />
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
          className="border-y border-[#E3E0D8] bg-[#FFFEFB] px-2 py-3 sm:px-6"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="shops-heading" className="text-[14px] font-semibold text-[#202724]">
              {t('shops')}
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-4">
            {shops.map((shop) => {
              const verified = isShopIdentityVerified(shop);
              return (
                <a
                  key={shop.id}
                  href={`/i/${shop.slug}`}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(`/i/${shop.slug}`);
                  }}
                  className="flex w-[164px] shrink-0 flex-col rounded-lg border border-[#E3E0D8] bg-[#F7F5F0] p-2.5 transition-colors hover:border-[#214E43]/45 sm:w-auto"
                >
                  <div className="flex items-center gap-2">
                    {shop.logo_path ? (
                      <img
                        src={shop.logo_path}
                        alt={shop.name}
                        className="h-9 w-9 shrink-0 rounded-full border border-[#E3E0D8] bg-white object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEECE6] text-[#505A55]">
                        <Store className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="truncate text-[11.5px] font-semibold text-[#202724]">
                          {shop.name}
                        </h3>
                        {verified && <IsokoVerifiedSeal className="h-3.5 w-3.5 shrink-0" />}
                      </div>
                      <p className="truncate text-[10px] text-[#68716D] tabular-nums">
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
            <h2 id="all-products-heading" className="text-[14px] font-semibold text-[#202724]">
              {t('all_products_title')}
            </h2>
            <span className="text-[10.5px] text-[#68716D] tabular-nums">
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
                className="min-h-[40px] rounded-full border border-[#C9D2CB] bg-[#FFFEFB] px-5 text-[11px] font-semibold text-[#214E43] transition-colors hover:bg-[#E9F0EB]"
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
      <h2 className="truncate text-[14px] font-semibold leading-tight text-[#202724]">{title}</h2>
      <button
        type="button"
        onClick={onSeeAll}
        className="inline-flex min-h-[32px] shrink-0 items-center gap-0.5 text-[10.5px] font-semibold text-[#214E43] hover:underline"
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
