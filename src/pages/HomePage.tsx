import React, { useMemo, useState } from 'react';
import { ArrowRight, Footprints, Shirt, Sparkles, Tag, Smartphone } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { buildHomeShelves } from '../lib/algorithm';
import { loadInterest } from '../lib/storage';

const HERO_IMG = '/src/assets/images/hero_kigali_fashion_1794551814589.jpg';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  inkweto: <Footprints className="h-6 w-6 text-[#0B6E4F]" aria-hidden="true" />,
  imyenda: <Shirt className="h-6 w-6 text-[#0B6E4F]" aria-hidden="true" />,
  amasogisi: <Tag className="h-6 w-6 text-[#0B6E4F]" aria-hidden="true" />,
  ibindi: <Sparkles className="h-6 w-6 text-[#0B6E4F]" aria-hidden="true" />,
  amatelefoni: <Smartphone className="h-6 w-6 text-[#0B6E4F]" aria-hidden="true" />,
};

export const HomePage: React.FC = () => {
  const { bootstrap, loading, error, refreshBootstrap, navigate, location, recents } = useMarketplace();
  const [visibleCount, setVisibleCount] = useState(20);

  const products = bootstrap?.products ?? [];
  const categories = bootstrap?.categories ?? [];
  const topCategories = categories.filter((c) => c.parent_id === null);

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
    return products
      .filter((p) => p.status === 'active' && (p.category_id === topCatId || p.parent_category?.id === topCatId))
      .slice(0, 8);
  }, [products]);

  const activeCatalog = useMemo(
    () => products.filter((p) => p.status === 'active' || p.status === 'sold_out'),
    [products]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        <div className="h-56 w-full animate-pulse rounded-2xl bg-[#F1F6F3]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[#F1F6F3]" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-[#F1F6F3]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-base font-semibold text-[#C0392B]">{error}</p>
        <button
          type="button"
          onClick={refreshBootstrap}
          className="mt-4 min-h-[44px] rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
        >
          Ongera ugerageze
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-12">
      {/* Storefront Hero */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[#F1F6F3]">
        <div className="grid items-stretch lg:grid-cols-12">
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-6">
            <p className="text-xs font-semibold text-[#0B6E4F]">
              Kigali · Abacuruzi bagenzuwe · Nta komisiyo
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1B1F23] sm:text-4xl text-balance">
              Imyambaro, inkweto n'ibyo kwambara byizewe i Kigali.
            </h1>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 max-w-lg">
              Reba ibiri mu bubiko ubu, ibiciro by'ukuri n'imibare (sizes), ushyire mu gare hanyuma
              uvugane n'umucuruzi kuri WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/shakisha')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#08553D] transition-colors"
              >
                <span>Reba ibicuruzwa byose</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <a
                href="/abacuruzi"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/abacuruzi');
                }}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#1B1F23] hover:border-[#0B6E4F] transition-colors"
              >
                {RW.sell_on_platform}
              </a>
            </div>
          </div>
          <div className="relative min-h-[220px] lg:col-span-6">
            <img
              src={HERO_IMG}
              alt="Idaraza ry'iduka ry'imyambaro n'inkweto i Kigali"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* A-02: Big Category Buttons */}
      <section aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="text-lg font-bold text-[#1B1F23]">
          Hitamo icyiciro
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {topCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate(`/c/${cat.slug}`)}
              className="flex min-h-[84px] items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-[#0B6E4F] hover:bg-[#F1F6F3]/60 transition-colors"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F1F6F3]">
                {CATEGORY_ICONS[cat.slug] ?? <Tag className="h-6 w-6 text-[#0B6E4F]" />}
              </span>
              <span className="text-sm font-bold text-[#1B1F23] leading-snug">{cat.name_rw}</span>
            </button>
          ))}
        </div>
      </section>

      {/* A-03: Wari warabirebye (if non-empty) */}
      {recentProducts.length > 0 && (
        <ShelfSection
          title={RW.recent}
          products={recentProducts}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {/* A-03: Bishya */}
      {shelves.newest.length > 0 && (
        <ShelfSection
          title={RW.new_arrivals}
          products={shelves.newest}
          onSeeAll={() => navigate('/shakisha?sort=newest')}
        />
      )}

      {/* N-01: Reserved Ad Slot (visible only when ADS_ENABLED=true) */}
      {bootstrap?.settings.ADS_ENABLED && (
        <aside
          aria-label="Itangazo"
          className="rounded-xl border border-dashed border-slate-300 bg-[#F1F6F3] p-4 text-center text-xs text-slate-600"
        >
          Umwanya w'itangazo (N-01 · ADS_ENABLED=true)
        </aside>
      )}

      {/* A-03: Bikunzwe cyane */}
      {shelves.popular.length > 0 && (
        <ShelfSection
          title={RW.popular}
          products={shelves.popular}
          onSeeAll={() => navigate('/shakisha?sort=popular')}
        />
      )}

      {/* A-03: Byagabanyijwe */}
      {shelves.discounted.length > 0 && (
        <ShelfSection
          title={RW.discounted}
          products={shelves.discounted}
          onSeeAll={() => navigate('/shakisha?discounted=1')}
        />
      )}

      {/* G-04: Ushobora gukunda (based on phone interest) */}
      {youMightLike.length > 0 && (
        <ShelfSection
          title="Ushobora gukunda"
          products={youMightLike}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {/* A-03: Amaduka hafi yawe */}
      {shelves.nearby.length > 0 && (
        <ShelfSection
          title={
            location?.districtName
              ? `${RW.nearby_shops} (${location.districtName})`
              : RW.nearby_shops
          }
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

      {/* A-04: Progressive 20-item catalog grid with 'Reba byinshi' */}
      <section aria-labelledby="all-products-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="all-products-heading" className="text-lg font-bold text-[#1B1F23]">
            Ibicuruzwa byose biriho
          </h2>
          <span className="text-xs text-slate-600 tabular-nums">
            {activeCatalog.length} bibonetse
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-5">
          {activeCatalog.slice(0, visibleCount).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {visibleCount < activeCatalog.length && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 20)}
              className="min-h-[44px] rounded-xl border border-[#0B6E4F] bg-white px-6 text-sm font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3] transition-colors"
            >
              {RW.load_more}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

interface ShelfSectionProps {
  title: string;
  products: ReturnType<typeof buildHomeShelves>['newest'];
  onSeeAll: () => void;
}

const ShelfSection: React.FC<ShelfSectionProps> = ({ title, products, onSeeAll }) => (
  <section>
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold text-[#1B1F23]">{title}</h2>
      <button
        type="button"
        onClick={onSeeAll}
        className="inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-[#0B6E4F] hover:underline whitespace-nowrap shrink-0"
      >
        <span>{RW.see_all}</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
    <div className="mt-3 flex gap-3 overflow-x-auto pb-2 no-scrollbar lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible">
      {products.slice(0, 8).map((product) => (
        <div key={product.id} className="shrink-0 lg:shrink">
          <ProductCard product={product} compact />
        </div>
      ))}
    </div>
  </section>
);
