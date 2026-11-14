import React, { useMemo, useState } from 'react';
import { ArrowRight, Footprints, MapPin, Package, Shirt, ShoppingBag, Smartphone, Store } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IsokoMark, IsokoVerifiedSeal, RwandanGeometricPattern } from '../components/IsokoLogo';
import { ProductCard } from '../components/ProductCard';
import { PromoCarousel } from '../components/PromoCarousel';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { buildHomeShelves, interleaveBySeller } from '../lib/algorithm';
import { loadInterest } from '../lib/storage';

const CATEGORY_ARTWORK: Record<string, { icon: LucideIcon; caption: string }> = {
  inkweto: { icon: Footprints, caption: 'Siporo, gusohokana & inkweto za buri munsi' },
  imyenda: { icon: Shirt, caption: 'Imyenda y’abagabo, abagore n’abana' },
  amasogisi: { icon: Package, caption: 'Amasogisi n’ibyo kwambarwa imbere' },
  ibindi: { icon: ShoppingBag, caption: 'Amasakoshi n’ibindi bikoresho' },
  amatelefoni: { icon: Smartphone, caption: 'Ibikoresho by’amatelefoni' },
};

export const HomePage: React.FC = () => {
  const { bootstrap, loading, error, refreshBootstrap, navigate, location, recents } = useMarketplace();
  const [visibleCount, setVisibleCount] = useState(20);

  const products = bootstrap?.products ?? [];
  const categories = bootstrap?.categories ?? [];
  const shops = bootstrap?.shops ?? [];
  const campaigns = bootstrap?.campaigns ?? [];
  const topCategories = categories.filter((c) => c.parent_id === null);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      if (p.status !== 'active') continue;
      const slug = p.parent_category?.slug ?? p.category?.slug;
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    return counts;
  }, [products]);

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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        <div className="h-56 w-full animate-pulse rounded-2xl bg-[#F1F6F3]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-[#F1F6F3]" />
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

  const activeCampaigns = campaigns.filter((c) => c.active);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-12">
      {/* Truthful marketplace hero: no sample shop or product photography */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid items-stretch lg:grid-cols-12">
          <div className="imigongo-surface flex flex-col justify-center p-6 sm:p-10 lg:col-span-6">
            <p className="text-xs font-semibold text-[#0B6E4F]">
              Abacuruzi bo mu Rwanda · Nta komisiyo
            </p>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[#1B1F23] sm:text-4xl text-balance">
              Imyambaro, inkweto n'ibyo kwambara byo mu Rwanda.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
              Shakisha ibicuruzwa byashyizweho n’abacuruzi nyirizina, urebe ibiciro n’amafoto
              yabo, hanyuma muvugane kuri WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/shakisha')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#08553D]"
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
                className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#1B1F23] transition-colors hover:border-[#0B6E4F]"
              >
                {RW.sell_on_platform}
              </a>
            </div>
          </div>
          <div className="imigongo-surface relative flex min-h-[240px] items-center justify-center p-8 lg:col-span-6">
            <div className="flex max-w-sm flex-col items-center text-center">
              <IsokoMark className="h-24 w-24" />
              <h2 className="mt-4 font-display text-lg font-bold text-[#0B6E4F]">
                Ibicuruzwa by’ukuri. Amaduka nyakuri.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Nta bicuruzwa bya demo. Amafoto y’ibicuruzwa ni ayashyizweho n’abacuruzi.
              </p>
              <RwandanGeometricPattern className="mt-5 h-3 w-full opacity-75" />
            </div>
          </div>
        </div>
        <RwandanGeometricPattern className="h-2.5 w-full bg-white opacity-70" />
      </section>

      {/* Category cards use icons and Imigongo, not illustrative product photos */}
      <section aria-labelledby="cat-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="cat-heading" className="font-display text-lg font-bold text-[#1B1F23]">
            Hitamo icyiciro
          </h2>
          <button
            type="button"
            onClick={() => navigate('/shakisha')}
            className="text-xs font-semibold text-[#0B6E4F] hover:underline"
          >
            Byose hamwe
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {topCategories.map((cat) => {
            const art = CATEGORY_ARTWORK[cat.slug] ?? {
              icon: Package,
              caption: 'Ibicuruzwa byo muri iki cyiciro',
            };
            const CategoryIcon = art.icon;
            const itemCount = categoryCounts.get(cat.slug) ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/c/${cat.slug}`)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all hover:-translate-y-0.5 hover:border-[#0B6E4F] hover:shadow-md"
              >
                <div className="imigongo-surface relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden">
                  <CategoryIcon
                    className="h-12 w-12 text-[#0B6E4F] transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <RwandanGeometricPattern className="absolute bottom-0 left-0 h-2 w-full opacity-60" />
                </div>
                <div className="p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold leading-snug text-[#1B1F23]">
                      {cat.name_rw}
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-[#0B6E4F] opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-600 tabular-nums">
                    {itemCount} bibonetse · {art.caption}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Rotating Promotional Carousel */}
      {activeCampaigns.length > 0 && <PromoCarousel campaigns={activeCampaigns} />}

      {/* A-03: Wari warabirebye (if non-empty) */}
      {recentProducts.length > 0 && (
        <ShelfSection
          title={RW.recent}
          products={recentProducts}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {/* A-03: Bishya (fairly rotated across sellers) */}
      {shelves.newest.length > 0 && (
        <ShelfSection
          title={RW.new_arrivals}
          products={shelves.newest}
          onSeeAll={() => navigate('/shakisha?sort=newest')}
        />
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

      {/* G-04: Ushobora gukunda */}
      {youMightLike.length > 0 && (
        <ShelfSection
          title="Ushobora gukunda"
          products={youMightLike}
          onSeeAll={() => navigate('/shakisha')}
        />
      )}

      {/* Verified Seller Storefronts Showcase */}
      {shops.length > 0 && (
        <section aria-labelledby="shops-heading">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 id="shops-heading" className="font-display text-lg font-bold text-[#1B1F23]">
                Amaduka yagenzuwe ku Isoko
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Sura iduka ry’umucuruzi urebe ibicuruzwa bye byose n’aho akorera
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {shops.slice(0, 3).map((shop) => (
              <a
                key={shop.id}
                href={`/i/${shop.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/i/${shop.slug}`);
                }}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-[#0B6E4F] hover:shadow-md"
              >
                <div className="relative h-24 w-full overflow-hidden bg-[#F1F6F3]">
                  {shop.cover_path ? (
                    <>
                      <img
                        src={shop.cover_path}
                        alt={shop.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"
                      />
                    </>
                  ) : (
                    <div className="imigongo-surface flex h-full w-full items-center justify-center">
                      <Store className="h-9 w-9 text-[#0B6E4F]" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="relative px-4 pb-4 pt-0">
                  <div className="-mt-6 flex items-end justify-between gap-3">
                    {shop.logo_path ? (
                      <img
                        src={shop.logo_path}
                        alt={shop.name}
                        className="h-12 w-12 rounded-xl border-2 border-white bg-white object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white bg-[#0B6E4F] text-white shadow-sm">
                        <Store className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B6E4F] bg-white/95 rounded-md px-2 py-0.5">
                      <IsokoVerifiedSeal className="h-3.5 w-3.5" />
                      <span>{RW.verified}</span>
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-base font-bold text-[#1B1F23] group-hover:text-[#0B6E4F]">
                    {shop.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600 tabular-nums">
                    <MapPin className="h-3.5 w-3.5 text-[#0B6E4F] shrink-0" aria-hidden="true" />
                    <span>
                      {shop.district_name}
                      {shop.sector_name ? `, ${shop.sector_name}` : ''}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{shop.active_product_count ?? 0} ibicuruzwa</span>
                  </p>
                  {shop.about && (
                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">{shop.about}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
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

      {/* A-04: Progressive 20-item catalog grid with seller interleaving & 'Reba byinshi' */}
      <section aria-labelledby="all-products-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="all-products-heading" className="font-display text-lg font-bold text-[#1B1F23]">
            Ibicuruzwa byose biriho
          </h2>
          <span className="text-xs text-slate-600 tabular-nums">
            {activeCatalog.length} bibonetse
          </span>
        </div>

        {activeCatalog.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-5">
            {activeCatalog.slice(0, visibleCount).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="imigongo-surface mt-4 rounded-2xl border border-slate-200 p-7 text-center sm:p-10">
            <Package className="mx-auto h-10 w-10 text-[#0B6E4F]" aria-hidden="true" />
            <h3 className="mt-3 font-display text-base font-bold text-[#1B1F23]">
              Nta bicuruzwa birashyirwaho.
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
              Isoko ntigaragaza ibicuruzwa by’igerageza. Abacuruzi bazashyiraho ibicuruzwa
              byabo n’amafoto babifitiye uburenganzira.
            </p>
            <button
              type="button"
              onClick={() => navigate('/abacuruzi')}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white hover:bg-[#08553D]"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              Fungura iduka ryawe
            </button>
          </div>
        )}

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
      <h2 className="font-display text-lg font-bold text-[#1B1F23]">{title}</h2>
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
