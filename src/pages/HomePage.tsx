import React, { useMemo, useState } from 'react';
import { ArrowRight, LayoutGrid, MapPin, ShieldCheck, Store, Tag } from 'lucide-react';
import { IsokoVerifiedSeal } from '../components/IsokoLogo';
import { ProductCard } from '../components/ProductCard';
import { PromoCarousel } from '../components/PromoCarousel';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { buildHomeShelves, interleaveBySeller } from '../lib/algorithm';
import { loadInterest } from '../lib/storage';

interface HomePageProps {
  onOpenCategories?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenCategories }) => {
  const {
    bootstrap,
    loading,
    error,
    refreshBootstrap,
    navigate,
    location,
    setLocationModalOpen,
    recents,
  } = useMarketplace();
  const [visibleCount, setVisibleCount] = useState(20);

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
      .slice(0, 8);
  }, [products, recents]);

  const youMightLike = useMemo(() => {
    const scores = loadInterest();
    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return [];
    const topCatId = Number(entries[0][0]);
    const matched = products.filter(
      (p) => p.status === 'active' && (p.category_id === topCatId || p.parent_category?.id === topCatId)
    );
    return interleaveBySeller(matched, { maxConsecutiveSameShop: 1, limit: 8 });
  }, [products]);

  const activeCatalog = useMemo(() => {
    const visible = products.filter((p) => p.status === 'active' || p.status === 'sold_out');
    return interleaveBySeller(visible, { maxConsecutiveSameShop: 1 });
  }, [products]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-3 py-3 sm:px-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[52px] animate-pulse rounded-lg bg-[#E8F3EE]/60" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-white" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-white" />
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
          className="mt-4 min-h-[44px] rounded-lg bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
        >
          Ongera ugerageze
        </button>
      </main>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.active);
  const locationLabel = location?.districtName || 'Kigali';

  return (
    <main className="mx-auto max-w-7xl space-y-4 pb-6">
      {/* Screen-reader / accessible page title while keeping above-the-fold compact like reference */}
      <h1 className="sr-only">
        Imyambaro, inkweto n&apos;ibyo kwambara byo mu Rwanda.
      </h1>

      {/* Strip 1: Compact 3-Card Quick Action Strip (matches screenshot horizontal quick cards) */}
      <section aria-label="Ibikorwa byihuse" className="px-3 pt-2.5 sm:px-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 sm:gap-3">
          <button
            type="button"
            onClick={() => (onOpenCategories ? onOpenCategories() : navigate('/shakisha'))}
            className="flex h-[54px] min-w-[138px] flex-1 shrink-0 items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-left transition-colors hover:border-[#0B6E4F]/50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F3EE] text-[#0B6E4F]">
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-[11.5px] font-medium leading-tight text-[#1B1F23]">
              Hitamo<br />icyiciro
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            className="flex h-[54px] min-w-[144px] flex-1 shrink-0 items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-left transition-colors hover:border-[#0B6E4F]/50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F3EE] text-[#0B6E4F]">
              <MapPin className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-[11.5px] font-medium leading-tight text-[#1B1F23]">
              Aho uri:<br />
              <span className="font-semibold text-[#0B6E4F]">{locationLabel}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/abacuruzi')}
            className="flex h-[54px] min-w-[138px] flex-1 shrink-0 items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-left transition-colors hover:border-[#C0392B]/50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBEAE8] text-[#C0392B]">
              <Store className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-[11.5px] font-medium leading-tight text-[#1B1F23]">
              Fungura<br />iduka ryawe
            </span>
          </button>
        </div>
      </section>

      {/* Strip 2: First Product Shelf immediately above the fold — 3-across compact cards like reference */}
      {shelves.newest.length > 0 && (
        <ShelfSection
          title={RW.new_arrivals}
          subtitle="Abacuruzi bagenzuwe · Kigali n'ahandi"
          products={shelves.newest}
          onSeeAll={() => navigate('/shakisha?sort=newest')}
        />
      )}

      {/* Strip 3: Compact 2-Up Side-by-Side Promo / Discovery Cards (just like screenshot bottom preview) */}
      <section className="px-3 sm:px-6" aria-label="Ibishya byatoranyijwe">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/shakisha?discounted=1')}
            className="flex items-center justify-between gap-2 rounded-xl border border-[#C0392B]/25 bg-[#FBEAE8] p-2.5 sm:p-3 text-left transition-colors hover:border-[#C0392B]"
          >
            <div className="min-w-0">
              <span className="inline-block rounded bg-[#C0392B] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Igabanywa
              </span>
              <p className="mt-1 text-[12px] font-semibold leading-snug text-[#1B1F23]">
                Byagabanyijwe
              </p>
              <p className="mt-0.5 text-[11px] text-[#8E2A20] tabular-nums">
                {shelves.discounted.length} bibonetse
              </p>
            </div>
            <Tag className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#C0392B]" strokeWidth={1.6} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/shakisha?sort=popular')}
            className="flex items-center justify-between gap-2 rounded-xl border border-[#0B6E4F]/25 bg-[#E8F3EE] p-2.5 sm:p-3 text-left transition-colors hover:border-[#0B6E4F]"
          >
            <div className="min-w-0">
              <span className="inline-block rounded bg-[#0B6E4F] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Byemejwe
              </span>
              <p className="mt-1 text-[12px] font-semibold leading-snug text-[#1B1F23]">
                Amaduka yemejwe
              </p>
              <p className="mt-0.5 text-[11px] text-[#064E3B] tabular-nums">
                {shops.length} i Kigali
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#0B6E4F]" strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Strip 4: Recently viewed (if any) */}
      {recentProducts.length > 0 && (
        <ShelfSection
          title={RW.recent}
          subtitle="Ibyo uherutse gusura"
          products={recentProducts}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {/* Strip 5: Popular shelf */}
      {shelves.popular.length > 0 && (
        <ShelfSection
          title={RW.popular}
          subtitle="Ibikunzwe n'abaguzi ubu"
          products={shelves.popular}
          onSeeAll={() => navigate('/shakisha?sort=popular')}
        />
      )}

      {/* Strip 6: Discounted shelf */}
      {shelves.discounted.length > 0 && (
        <ShelfSection
          title={RW.discounted}
          subtitle="Ibiciro byagabanyijwe >= 10%"
          products={shelves.discounted}
          onSeeAll={() => navigate('/shakisha?discounted=1')}
        />
      )}

      {/* Strip 7: Rotating Promotional Carousel */}
      {activeCampaigns.length > 0 && (
        <div className="px-3 sm:px-6">
          <PromoCarousel campaigns={activeCampaigns} />
        </div>
      )}

      {/* Strip 8: You might like */}
      {youMightLike.length > 0 && (
        <ShelfSection
          title="Ushobora gukunda"
          subtitle="Bihuye n'ibyo ukunze kureba"
          products={youMightLike}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {/* Strip 9: Nearby shelf */}
      {shelves.nearby.length > 0 && (
        <ShelfSection
          title={
            location?.districtName
              ? `${RW.nearby_shops} (${location.districtName})`
              : RW.nearby_shops
          }
          subtitle="Hafi y'aho wahisemo"
          products={shelves.nearby}
          onSeeAll={() =>
            navigate(
              location?.districtId
                ? `/shakisha?district=${location.districtId}&sort=nearby`
                : '/shakisha?sort=nearby'
            )
          }
        />
      )}

      {/* Strip 10: Compact Verified Storefronts Row */}
      {shops.length > 0 && (
        <section
          id="shops-heading-section"
          aria-labelledby="shops-heading"
          className="bg-white border-y border-[#E5E7EB] py-3.5 px-3 sm:px-6"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 id="shops-heading" className="text-[15px] font-bold text-[#1B1F23]">
                Amaduka yagenzuwe ku Isoko
              </h2>
              <p className="text-[11.5px] text-[#6B7280]">
                Sura iduka ry’umucuruzi uvugane na we kuri WhatsApp
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex gap-2.5 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-4">
            {shops.map((shop) => (
              <a
                key={shop.id}
                href={`/i/${shop.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/i/${shop.slug}`);
                }}
                className="flex w-[164px] shrink-0 flex-col rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-2.5 transition-colors hover:border-[#0B6E4F] sm:w-auto"
              >
                <div className="flex items-center gap-2.5">
                  {shop.logo_path ? (
                    <img
                      src={shop.logo_path}
                      alt={shop.name}
                      className="h-10 w-10 shrink-0 rounded-full border border-[#E5E7EB] bg-white object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B6E4F] text-white">
                      <Store className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="truncate text-[12.5px] font-semibold text-[#1B1F23]">
                        {shop.name}
                      </h3>
                      {shop.status === 'approved' && (
                        <IsokoVerifiedSeal className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </div>
                    <p className="truncate text-[11px] text-[#6B7280] tabular-nums">
                      {shop.district_name} · {shop.active_product_count ?? 0} ibicuruzwa
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Strip 11: Dense Catalog Grid */}
      <section aria-labelledby="all-products-heading" className="px-3 sm:px-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="all-products-heading" className="text-[15px] font-bold text-[#1B1F23]">
            Ibicuruzwa byose biriho
          </h2>
          <span className="text-[11.5px] text-[#6B7280] tabular-nums">
            {activeCatalog.length} bibonetse
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-3">
          {activeCatalog.slice(0, visibleCount).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {visibleCount < activeCatalog.length && (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 20)}
              className="min-h-[42px] rounded-lg border border-[#0B6E4F] bg-white px-5 text-[13px] font-semibold text-[#0B6E4F] hover:bg-[#E8F3EE] transition-colors"
            >
              {RW.load_more}
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

interface ShelfSectionProps {
  title: string;
  subtitle?: string;
  products: ReturnType<typeof buildHomeShelves>['newest'];
  onSeeAll: () => void;
}

const ShelfSection: React.FC<ShelfSectionProps> = ({ title, subtitle, products, onSeeAll }) => (
  <section className="bg-white border-y border-[#E5E7EB] py-3 px-3 sm:px-6">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold leading-tight text-[#1B1F23] truncate">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[11.5px] leading-tight text-[#6B7280] truncate">{subtitle}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onSeeAll}
        aria-label={`${RW.see_all} — ${title}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#1B1F23] hover:bg-[#F7F8FA] hover:text-[#0B6E4F] transition-colors"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
      </button>
    </div>

    {/* 3-across compact horizontal shelf on mobile just like screenshot, 6-across on desktop */}
    <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 sm:gap-3">
      {products.slice(0, 6).map((product) => (
        <div key={product.id} className="w-[31%] min-w-[104px] shrink-0 sm:w-auto sm:min-w-0">
          <ProductCard product={product} compact />
        </div>
      ))}
    </div>
  </section>
);
